const path = require('node:path');
const fs = require('node:fs');
const lockfile = require('proper-lockfile');

// Monkeypatch lockfile.lockSync to support synchronous retries
const originalLockSync = lockfile.lockSync;
const monkeypatchedLockSync = function (file, options) {
  const opts = { ...options };
  const retriesConfig = opts.retries;
  delete opts.retries;

  let retries = 0;
  let maxRetries = 0;
  let minTimeout = 50;
  let maxTimeout = 100;

  if (typeof retriesConfig === 'number') {
    maxRetries = retriesConfig;
  } else if (retriesConfig && typeof retriesConfig.retries === 'number') {
    maxRetries = retriesConfig.retries;
    if (typeof retriesConfig.minTimeout === 'number') minTimeout = retriesConfig.minTimeout;
    if (typeof retriesConfig.maxTimeout === 'number') maxTimeout = retriesConfig.maxTimeout;
  }

  while (true) {
    try {
      return originalLockSync.call(lockfile, file, opts);
    } catch (err) {
      if ((err.code === 'ELOCKED' || err.code === 'EEXIST') && retries < maxRetries) {
        retries++;
        const delay = minTimeout + Math.random() * (maxTimeout - minTimeout);
        const start = Date.now();
        while (Date.now() - start < delay) {
          // Sync spin sleep
        }
        continue;
      }
      throw err;
    }
  }
};

/**
 * 📡 JIT SQLite Swarm Event Bus (Migrated to Lockfile-backed JSON)
 * Orchestrates multi-agent pipelines asynchronously via transactional pub/sub channels.
 * Replaces rigid orchestrator-to-subagent hierarchy with lightweight topic-based subscriptions.
 */
class AgentEventBus {
  constructor() {
    this.eventsPath = path.join(process.cwd(), 'memory', 'events.json');
    const dir = path.dirname(this.eventsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, '[]', 'utf8');
    }
  }

  _lockAndRead() {
    const dir = path.dirname(this.eventsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, '[]', 'utf8');
    }
    const release = monkeypatchedLockSync(this.eventsPath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } });
    let events = [];
    try {
      events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
    } catch (e) {
      events = [];
    }
    return { events, release };
  }

  publish(topic, sender, payload = {}) {
    const { events, release } = this._lockAndRead();
    let eventId;
    try {
      const maxId = events.reduce((max, ev) => (ev.id > max ? ev.id : max), 0);
      eventId = maxId + 1;
      
      const newEvent = {
        id: eventId,
        topic,
        sender,
        payload,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      events.push(newEvent);
      fs.writeFileSync(this.eventsPath, JSON.stringify(events, null, 2), 'utf8');
    } finally {
      release();
    }
    console.log(`✔ Event published to bus: [Topic: ${topic}] from ${sender} (Event ID: ${eventId})`);
    return eventId;
  }

  subscribe(topic, callback) {
    const { events, release } = this._lockAndRead();
    let processedCount = 0;
    const toProcess = [];

    try {
      for (const event of events) {
        if (event.topic === topic && event.status === 'pending') {
          event.status = 'processing';
          toProcess.push(event);
        }
      }
      if (toProcess.length > 0) {
        fs.writeFileSync(this.eventsPath, JSON.stringify(events, null, 2), 'utf8');
      }
    } finally {
      release();
    }

    for (const event of toProcess) {
      let success = false;
      try {
        console.log(`⚙ Processing event ID ${event.id} on topic '${topic}'...`);
        callback(event.payload, event.sender);
        success = true;
        processedCount++;
      } catch (err) {
        console.error(`❌ Callback failed for Event ID ${event.id}:`, err.message);
      }

      const lockRes = this._lockAndRead();
      try {
        const found = lockRes.events.find(ev => ev.id === event.id);
        if (found) {
          found.status = success ? 'completed' : 'failed';
          fs.writeFileSync(this.eventsPath, JSON.stringify(lockRes.events, null, 2), 'utf8');
        }
      } finally {
        lockRes.release();
      }
    }

    return processedCount;
  }

  listEvents(topic = null) {
    const { events, release } = this._lockAndRead();
    release();
    const sorted = [...events].sort((a, b) => b.id - a.id);
    if (topic) {
      return sorted.filter(e => e.topic === topic);
    }
    return sorted;
  }

  clearHistory() {
    const { events, release } = this._lockAndRead();
    let changes = 0;
    try {
      const remaining = events.filter(e => {
        if (e.status === 'completed' || e.status === 'failed') {
          changes++;
          return false;
        }
        return true;
      });
      fs.writeFileSync(this.eventsPath, JSON.stringify(remaining, null, 2), 'utf8');
    } finally {
      release();
    }
    console.log(`✔ Pruned ${changes} historical events from JSON bus.`);
    return changes;
  }
}

module.exports = new AgentEventBus();
