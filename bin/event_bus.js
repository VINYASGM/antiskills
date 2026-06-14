/**
 * 📡 JIT SQLite Swarm Event Bus
 * Orchestrates multi-agent pipelines asynchronously via transactional pub/sub channels.
 * Replaces rigid orchestrator-to-subagent hierarchy with lightweight topic-based subscriptions.
 */
class AgentEventBus {
  get db() {
    const activeDb = require('./db.js').db;
    if (this._lastDb !== activeDb) {
      this._lastDb = activeDb;
      this._initTable(activeDb);
    }
    return activeDb;
  }

  constructor() {
    // Lazy getter initializes the database table
  }

  /**
   * Initializes the event logging table inside the JIT SQLite memory database.
   */
  _initTable(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS agent_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        sender TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_event_topic ON agent_events(topic);
      CREATE INDEX IF NOT EXISTS idx_event_status ON agent_events(status);
    `);
  }

  /**
   * Publishes an event to the swarm event bus.
   *
   * @param {string} topic - Event topic name (e.g., 'needs_endpoint', 'endpoint_ready').
   * @param {string} sender - Identifier of the publishing agent (e.g., 'frontend-engineer').
   * @param {object} payload - Structured JSON payload mapping event data.
   * @returns {number} The auto-incremented ID of the created event.
   */
  publish(topic, sender, payload = {}) {
    const timestamp = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    let eventId;
    this.db.transaction(() => {
      const stmt = this.db.prepare(`
        INSERT INTO agent_events (topic, sender, payload, timestamp)
        VALUES (?, ?, ?, ?)
      `);
      const info = stmt.run(topic, sender, payloadStr, timestamp);
      eventId = info.lastInsertRowid;
    })();

    console.log(`✔ Event published to bus: [Topic: ${topic}] from ${sender} (Event ID: ${eventId})`);
    return eventId;
  }

  /**
   * Polls and processes pending events for a specific topic.
   * Marks events as 'completed' or 'failed' based on callback execution status.
   *
   * @param {string} topic - Topic to subscribe to.
   * @param {function} callback - Asynchronous or synchronous handler. Takes (payload, sender) and returns boolean/undefined.
   * @returns {number} The count of successfully processed events.
   */
  subscribe(topic, callback) {
    const events = this.db.prepare(`
      SELECT * FROM agent_events
      WHERE topic = ? AND status = 'pending'
      ORDER BY id ASC
    `).all(topic);

    let processedCount = 0;

    for (const event of events) {
      // Transition state atomically to processing to prevent parallel worker collisions
      const updateToProcessing = this.db.prepare(`
        UPDATE agent_events SET status = 'processing' WHERE id = ? AND status = 'pending'
      `);

      const result = updateToProcessing.run(event.id);
      if (result.changes === 0) continue; // Concurrently acquired by another agent worker thread

      let payload = {};
      try {
        payload = JSON.parse(event.payload);
      } catch (err) {
        this.db.prepare(`UPDATE agent_events SET status = 'failed' WHERE id = ?`).run(event.id);
        continue;
      }

      try {
        console.log(`⚙ Processing event ID ${event.id} on topic '${topic}'...`);
        callback(payload, event.sender);
        
        // Success
        this.db.prepare(`UPDATE agent_events SET status = 'completed' WHERE id = ?`).run(event.id);
        processedCount++;
      } catch (err) {
        console.error(`❌ Callback failed for Event ID ${event.id}:`, err.message);
        this.db.prepare(`UPDATE agent_events SET status = 'failed' WHERE id = ?`).run(event.id);
      }
    }

    return processedCount;
  }

  /**
   * Lists event records matching topic filters.
   *
   * @param {string} [topic] - Optional topic filter.
   * @returns {object[]} Event record rows.
   */
  listEvents(topic = null) {
    if (topic) {
      return this.db.prepare(`SELECT * FROM agent_events WHERE topic = ? ORDER BY id DESC`).all(topic).map(r => ({
        ...r,
        payload: JSON.parse(r.payload)
      }));
    }
    return this.db.prepare(`SELECT * FROM agent_events ORDER BY id DESC`).all().map(r => ({
      ...r,
      payload: JSON.parse(r.payload)
    }));
  }

  /**
   * Prunes completed and failed event histories to maintain SQL WAL compactness.
   */
  clearHistory() {
    const stmt = this.db.prepare(`DELETE FROM agent_events WHERE status IN ('completed', 'failed')`);
    const info = stmt.run();
    console.log(`✔ Pruned ${info.changes} historical events from SQLite bus.`);
    return info.changes;
  }
}

module.exports = new AgentEventBus();
