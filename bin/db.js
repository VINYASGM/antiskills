const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

/**
 * 💾 BeadsDB — Git-Native & SQLite-Cached Memory Graph
 * Resolves Git merge bottlenecks by using plain-text Markdown as authoritative storage
 * and a local SQLite cache JIT-synced for high-performance querying.
 */
class BeadsDB {
  /**
   * Initializes filesystem target folders, setups SQL client connections,
   * runs initial migrations, and JIT-triggers memory sync from Markdown files.
   */
  constructor() {
    const memoryDir = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    
    this.dbPath = path.join(memoryDir, 'beads.db');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Enable high-concurrency for parallel swarm agents
    this._fileMtimes = new Map(); // filename → mtime (ms) for dirty tracking
    this._syncStats = { filesScanned: 0, filesSkipped: 0 };
    this._lastSyncTime = null;
    this._syncTTLMs = 1000; // 1 second TTL before re-syncing
    this.init();
    this.migrateLegacy();
    this.sync(); // JIT Sync on initialize
  }

  /**
   * Installs database tables, dependencies relationships, and indices inside the SQLite cache JIT.
   * 
   * @returns {void}
   */
  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS beads (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        author TEXT,
        timestamp TEXT,
        evidence TEXT,
        superseded_by TEXT
      );
      CREATE TABLE IF NOT EXISTS tags (
        bead_id TEXT,
        tag TEXT,
        FOREIGN KEY(bead_id) REFERENCES beads(id) ON DELETE CASCADE,
        UNIQUE(bead_id, tag)
      );
      CREATE TABLE IF NOT EXISTS dependencies (
        bead_id TEXT,
        dependency_id TEXT,
        FOREIGN KEY(bead_id) REFERENCES beads(id) ON DELETE CASCADE,
        UNIQUE(bead_id, dependency_id)
      );
      CREATE TABLE IF NOT EXISTS intents (
        agent_id TEXT,
        task_id TEXT,
        timestamp TEXT,
        data TEXT,
        PRIMARY KEY(agent_id, task_id)
      );
      CREATE INDEX IF NOT EXISTS idx_status ON beads(status);
      CREATE INDEX IF NOT EXISTS idx_type ON beads(type);
    `);

    // Migration: add task queue columns (SQLite has no ADD COLUMN IF NOT EXISTS)
    try { this.db.exec(`ALTER TABLE beads ADD COLUMN claimed_by TEXT DEFAULT NULL`); } catch (e) {}
    try { this.db.exec(`ALTER TABLE beads ADD COLUMN claimed_at TEXT DEFAULT NULL`); } catch (e) {}
  }

  /**
   * Parses Markdown file contents to extract structured YAML frontmatter configurations and body blocks.
   * 
   * @param {string} content - Raw content of the Markdown file.
   * @returns {object|null} Structured bead object mapping parameters and description, or null if unparseable.
   * @example
   * const bead = beadsDB.parseFrontmatter(rawMarkdownString);
   */
  parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?/);
    if (!match) return null;
    
    const yamlBlock = match[1];
    const body = match[2] || '';
    
    const obj = {};
    const lines = yamlBlock.split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      
      if (val.startsWith('[') && val.endsWith(']')) {
        obj[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      } else {
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val === 'null') obj[key] = null;
        else if (val === 'undefined') obj[key] = undefined;
        else obj[key] = val;
      }
    }
    obj.description = body.trim();
    return obj;
  }

  /**
   * Compiles a structured bead object into a standard plain-text Markdown file with YAML frontmatter.
   * 
   * @param {object} bead - The structured bead object configuration.
   * @returns {string} Fully serialized Markdown plain-text ready for write procedures.
   * @example
   * const rawString = beadsDB.stringifyFrontmatter(beadObject);
   */
  stringifyFrontmatter(bead) {
    const tagsStr = bead.tags ? `[${bead.tags.join(', ')}]` : '[]';
    const depsStr = bead.dependencies ? `[${bead.dependencies.join(', ')}]` : '[]';
    
    return `---
id: ${bead.id}
type: ${bead.type || 'task_state'}
status: ${bead.status || 'open'}
title: "${(bead.title || '').replace(/"/g, '\\"')}"
author: ${bead.author || 'system'}
timestamp: ${bead.timestamp || new Date().toISOString()}
tags: ${tagsStr}
dependencies: ${depsStr}
evidence: "${(bead.evidence || '').replace(/"/g, '\\"')}"
superseded_by: ${bead.superseded_by ? `"${bead.superseded_by}"` : 'null'}
---

${bead.description || ''}`;
  }

  /**
   * Scans memory folder paths, reads plain-text Markdown beads,
   * parses them, and synchronizes them transactionally to the SQLite cache database.
   * 
   * @returns {void}
   * @throws {Error} If disk reading or SQLite writing encounters failures.
   */
  sync() {
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    
    const files = fs.readdirSync(beadsDir).filter(f => f.startsWith('bd-') && f.endsWith('.md'));
    
    // Dirty tracking: check mtimes, skip unchanged files
    let scanned = 0;
    let skipped = 0;
    const filesToSync = [];
    
    for (const file of files) {
      scanned++;
      const filePath = path.join(beadsDir, file);
      try {
        const stat = fs.statSync(filePath);
        const mtime = stat.mtimeMs;
        const cachedMtime = this._fileMtimes.get(file);
        
        if (cachedMtime !== undefined && cachedMtime === mtime) {
          skipped++;
          continue; // File unchanged — skip re-parse
        }
        
        this._fileMtimes.set(file, mtime);
        filesToSync.push({ file, filePath });
      } catch (err) {
        // File disappeared between readdir and stat — skip
      }
    }
    
    this._syncStats = { filesScanned: scanned, filesSkipped: skipped };
    this._lastSyncTime = Date.now();
    
    // Only run transaction if there are dirty files
    if (filesToSync.length === 0) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO beads (id, type, status, title, description, author, timestamp, evidence, superseded_by)
      VALUES (@id, @type, @status, @title, @description, @author, @timestamp, @evidence, @superseded_by)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        status=excluded.status,
        title=excluded.title,
        description=excluded.description,
        author=excluded.author,
        timestamp=excluded.timestamp,
        evidence=excluded.evidence,
        superseded_by=excluded.superseded_by
    `);
    
    const deleteTags = this.db.prepare(`DELETE FROM tags WHERE bead_id = ?`);
    const insertTag = this.db.prepare(`INSERT OR IGNORE INTO tags (bead_id, tag) VALUES (?, ?)`);
    const deleteDeps = this.db.prepare(`DELETE FROM dependencies WHERE bead_id = ?`);
    const insertDep = this.db.prepare(`INSERT OR IGNORE INTO dependencies (bead_id, dependency_id) VALUES (?, ?)`);
    
    this.db.transaction(() => {
      for (const { file, filePath } of filesToSync) {
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const bead = this.parseFrontmatter(raw);
          if (!bead || !bead.id) continue;
          
          stmt.run({
            id: bead.id,
            type: bead.type || 'task_state',
            status: bead.status || 'open',
            title: bead.title || 'Untitled',
            description: bead.description || '',
            author: bead.author || 'system',
            timestamp: bead.timestamp || new Date().toISOString(),
            evidence: bead.evidence || '',
            superseded_by: bead.superseded_by || null
          });
          
          deleteTags.run(bead.id);
          if (bead.tags && Array.isArray(bead.tags)) {
            for (const tag of bead.tags) {
              insertTag.run(bead.id, tag.trim());
            }
          }
          
          deleteDeps.run(bead.id);
          if (bead.dependencies && Array.isArray(bead.dependencies)) {
            for (const dep of bead.dependencies) {
              insertDep.run(bead.id, dep.trim());
            }
          }
        } catch (err) {
          console.error(`✘ Failed to JIT sync bead ${file}:`, err);
        }
      }
    })();
  }

  /**
   * Scans and migrates deprecated legacy flat JSON beads to Markdown files.
   * Renames migrated files to avoid repeat executions.
   * 
   * @returns {void}
   */
  migrateLegacy() {
    const dir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(dir)) return;
    
    // Migrate individual legacy JSON beads
    const files = fs.readdirSync(dir).filter(f => f.startsWith('bd-') && f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const bead = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.create(bead);
        fs.renameSync(filePath, filePath + '.migrated');
      } catch (err) {}
    }
    
    // Migrate root legacy beads.json list
    const rootBeadFile = path.join(process.cwd(), 'memory', 'beads.json');
    if (fs.existsSync(rootBeadFile)) {
      try {
        const beads = JSON.parse(fs.readFileSync(rootBeadFile, 'utf8'));
        for (const bead of beads) {
          this.create(bead);
        }
        fs.renameSync(rootBeadFile, rootBeadFile + '.migrated');
      } catch (err) {}
    }
  }

  /**
   * Generates a new Git-native Markdown memory bead file and syncs it JIT to the SQLite query cache.
   * 
   * @param {object} bead - Properties of the bead (type, title, tags, description, dependencies, etc.).
   * @returns {string} The unique assigned bd-XXXX string ID of the created bead.
   * @throws {Error} If filesystem writes encounter lock or access issues.
   * @example
   * const beadId = beadsDB.create({ type: 'task_state', title: 'New Form UI' });
   */
  create(bead) {
    const beadId = bead.id || this.getNextId();
    bead.id = beadId;
    
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    
    const mdPath = path.join(beadsDir, `${beadId}.md`);
    const content = this.stringifyFrontmatter(bead);
    fs.writeFileSync(mdPath, content, 'utf8');
    
    this.sync();
    return beadId;
  }

  /**
   * Synchronizes and retrieves all beads in the memory cache database.
   * 
   * @returns {object[]} Ranked array of bead configurations with arrays for tags and dependencies.
   */
  getAll() {
    this._lazySyncIfStale();
    const beads = this.db.prepare(`SELECT * FROM beads ORDER BY id ASC`).all();
    for (const b of beads) {
      b.tags = this.db.prepare(`SELECT tag FROM tags WHERE bead_id = ?`).all(b.id).map(r => r.tag);
      b.dependencies = this.db.prepare(`SELECT dependency_id FROM dependencies WHERE bead_id = ?`).all(b.id).map(r => r.dependency_id);
    }
    return beads;
  }

  /**
   * Triggers sync only if TTL has expired since last sync.
   */
  _lazySyncIfStale() {
    if (this._lastSyncTime && (Date.now() - this._lastSyncTime) < this._syncTTLMs) return;
    this.sync();
  }

  /**
   * Retrieves a single JIT-synced bead configuration by its unique ID.
   * 
   * @param {string} id - The unique bd-XXXX identifier string.
   * @returns {object|null} Structured bead object mapping parameters, or null if not found.
   * @example
   * const bead = beadsDB.get('bd-0001');
   */
  get(id) {
    this._lazySyncIfStale();
    const bead = this.db.prepare(`SELECT * FROM beads WHERE id = ?`).get(id);
    if (!bead) return null;
    
    bead.tags = this.db.prepare(`SELECT tag FROM tags WHERE bead_id = ?`).all(id).map(r => r.tag);
    bead.dependencies = this.db.prepare(`SELECT dependency_id FROM dependencies WHERE bead_id = ?`).all(id).map(r => r.dependency_id);
    return bead;
  }

  // ─── Task Queue Discipline ───────────────────────────────────

  /**
   * Atomically claim a bead for an agent. Uses optimistic locking via
   * UPDATE ... WHERE to ensure only one agent owns it.
   *
   * @param {string} beadId - Bead ID to claim.
   * @param {string} agentId - Agent claiming ownership.
   * @returns {boolean} true if claimed, false if already owned by another agent.
   */
  claim(beadId, agentId) {
    this._expireStaleClaims();
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      UPDATE beads SET claimed_by = ?, claimed_at = ?, status = 'claimed'
      WHERE id = ? AND (claimed_by IS NULL OR claimed_by = ?) AND status IN ('open', 'failed')
    `).run(agentId, now, beadId, agentId);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'claimed');
      return true;
    }
    return false;
  }

  /**
   * Release a claim. Only owning agent can release unless force=true.
   * Sets status back to 'open', clears claim fields.
   *
   * @param {string} beadId - Bead ID.
   * @param {string} agentId - Agent releasing.
   * @param {boolean} [force=false] - Force release regardless of owner.
   * @returns {boolean} true if released.
   */
  release(beadId, agentId, force = false) {
    let sql, params;
    if (force) {
      sql = `UPDATE beads SET claimed_by = NULL, claimed_at = NULL, status = 'open' WHERE id = ? AND claimed_by IS NOT NULL`;
      params = [beadId];
    } else {
      sql = `UPDATE beads SET claimed_by = NULL, claimed_at = NULL, status = 'open' WHERE id = ? AND claimed_by = ?`;
      params = [beadId, agentId];
    }
    const result = this.db.prepare(sql).run(...params);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'open');
      return true;
    }
    return false;
  }

  /**
   * Transition claimed → in_progress. Only claiming agent can start.
   *
   * @param {string} beadId - Bead ID.
   * @param {string} agentId - Agent that owns the claim.
   * @returns {boolean} true if transitioned.
   */
  start(beadId, agentId) {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'in_progress'
      WHERE id = ? AND claimed_by = ? AND status = 'claimed'
    `).run(beadId, agentId);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'in_progress');
      return true;
    }
    return false;
  }

  /**
   * Transition in_progress → resolved. Clears claim. Writes Markdown.
   *
   * @param {string} beadId - Bead ID.
   * @param {string} agentId - Agent completing the work.
   * @param {string} [evidence=''] - Evidence of completion.
   * @returns {boolean} true if completed.
   */
  complete(beadId, agentId, evidence = '') {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'resolved', claimed_by = NULL, claimed_at = NULL, evidence = ?
      WHERE id = ? AND claimed_by = ? AND status = 'in_progress'
    `).run(evidence, beadId, agentId);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'resolved', { evidence });
      return true;
    }
    return false;
  }

  /**
   * Transition in_progress → failed. Clears claim. Writes Markdown.
   *
   * @param {string} beadId - Bead ID.
   * @param {string} agentId - Agent reporting failure.
   * @param {string} [reason=''] - Failure reason.
   * @returns {boolean} true if failed.
   */
  fail(beadId, agentId, reason = '') {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'failed', claimed_by = NULL, claimed_at = NULL, evidence = ?
      WHERE id = ? AND claimed_by = ? AND status IN ('claimed', 'in_progress')
    `).run(reason, beadId, agentId);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'failed', { evidence: reason });
      return true;
    }
    return false;
  }

  /**
   * Reopen a resolved or failed bead. Clears any claim.
   *
   * @param {string} beadId - Bead ID.
   * @returns {boolean} true if reopened.
   */
  reopen(beadId) {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'open', claimed_by = NULL, claimed_at = NULL
      WHERE id = ? AND status IN ('resolved', 'failed')
    `).run(beadId);
    if (result.changes > 0) {
      this._writeStatusToMarkdown(beadId, 'open');
      return true;
    }
    return false;
  }

  /**
   * Release claims older than maxAgeMs. Called lazily inside claim().
   *
   * @param {number} [maxAgeMs=1800000] - Max claim age (default 30 min).
   * @returns {number} Number of expired claims released.
   */
  _expireStaleClaims(maxAgeMs = 1800000) {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const result = this.db.prepare(`
      UPDATE beads SET claimed_by = NULL, claimed_at = NULL, status = 'open'
      WHERE claimed_by IS NOT NULL AND claimed_at < ? AND status IN ('claimed')
    `).run(cutoff);
    return result.changes;
  }

  /**
   * Write status change to Markdown bead file on disk.
   * Reads → parses → updates status → writes back. Preserves body/tags.
   *
   * @param {string} beadId - Bead ID.
   * @param {string} newStatus - New status value.
   * @param {object} [extraFields={}] - Extra fields to update (e.g. evidence).
   */
  _writeStatusToMarkdown(beadId, newStatus, extraFields = {}) {
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    const mdPath = path.join(beadsDir, `${beadId}.md`);
    if (!fs.existsSync(mdPath)) return;

    const raw = fs.readFileSync(mdPath, 'utf8');
    const bead = this.parseFrontmatter(raw);
    if (!bead) return;

    bead.status = newStatus;
    if (extraFields.evidence !== undefined) bead.evidence = extraFields.evidence;
    const content = this.stringifyFrontmatter(bead);
    fs.writeFileSync(mdPath, content, 'utf8');
    // Invalidate mtime cache so next sync picks up the change
    this._fileMtimes.delete(`${beadId}.md`);
  }

  // ─── ID Generation ──────────────────────────────────────────

  /**
   * Analyzes active bead items inside the synced SQLite database to determine the next incremental bd-XXXX ID.
   * 
   * @returns {string} The next available bd-XXXX string.
   */
  getNextId() {
    // Query SQLite directly — no sync needed, IDs only increase
    const row = this.db.prepare(`SELECT id FROM beads ORDER BY id DESC LIMIT 1`).get();
    if (!row) return 'bd-0001';
    const match = row.id.match(/bd-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `bd-${String(nextNum).padStart(4, '0')}`;
    }
    return 'bd-0001';
  }
}

module.exports = new BeadsDB();
