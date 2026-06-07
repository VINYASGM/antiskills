const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

/**
 * 💾 BeadsDB — Git-Native & SQLite-Cached Memory Graph
 * Resolves Git merge bottlenecks by using plain-text JSON as authoritative storage
 * and a local SQLite cache JIT-synced for high-performance querying.
 */
class BeadsDB {
  /**
   * Initializes filesystem target folders, setups SQL client connections,
   * runs initial migrations, and JIT-triggers memory sync from JSON files.
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

    global.__veyraActiveDBs = global.__veyraActiveDBs || [];
    global.__veyraActiveDBs.push(this.db);

    if (!global.__veyraExitHandlerRegistered) {
      global.__veyraExitHandlerRegistered = true;
      process.on('exit', () => {
        if (global.__veyraActiveDBs) {
          for (const db of global.__veyraActiveDBs) {
            try {
              if (db && db.open) {
                db.close();
              }
            } catch (e) {}
          }
        }
      });
    }
  }

  /**
   * Installs database tables, dependencies relationships, and indices inside the SQLite cache JIT.
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
        superseded_by TEXT,
        claimed_by TEXT,
        claimed_at TEXT
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

    // Backwards-compatibility migrations if columns are missing
    try { this.db.exec(`ALTER TABLE beads ADD COLUMN claimed_by TEXT DEFAULT NULL`); } catch (e) {}
    try { this.db.exec(`ALTER TABLE beads ADD COLUMN claimed_at TEXT DEFAULT NULL`); } catch (e) {}
  }

  /**
   * Parses Markdown file contents to extract structured YAML frontmatter configurations and body blocks.
   * Kept for JIT migration of legacy .md files.
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
   * Kept for compatibility.
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
   * Scans memory folder paths, reads plain-text JSON beads,
   * parses them, and synchronizes them transactionally to the SQLite cache database.
   */
  sync() {
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    
    const { beadSchema } = require('./schema');
    const files = fs.readdirSync(beadsDir).filter(f => f.startsWith('bd-') && f.endsWith('.json'));
    
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
      INSERT INTO beads (id, type, status, title, description, author, timestamp, evidence, claimed_by, claimed_at)
      VALUES (@id, @type, @status, @title, @description, @author, @timestamp, @evidence, @claimed_by, @claimed_at)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        status=excluded.status,
        title=excluded.title,
        description=excluded.description,
        author=excluded.author,
        timestamp=excluded.timestamp,
        evidence=excluded.evidence,
        claimed_by=excluded.claimed_by,
        claimed_at=excluded.claimed_at
    `);
    
    const deleteTags = this.db.prepare(`DELETE FROM tags WHERE bead_id = ?`);
    const insertTag = this.db.prepare(`INSERT OR IGNORE INTO tags (bead_id, tag) VALUES (?, ?)`);
    const deleteDeps = this.db.prepare(`DELETE FROM dependencies WHERE bead_id = ?`);
    const insertDep = this.db.prepare(`INSERT OR IGNORE INTO dependencies (bead_id, dependency_id) VALUES (?, ?)`);
    
    this.db.transaction(() => {
      for (const { file, filePath } of filesToSync) {
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const beadData = JSON.parse(raw);
          const parsedResult = beadSchema.safeParse(beadData);
          if (!parsedResult.success) {
            console.error(`✘ Schema validation failed for bead ${file}:`, parsedResult.error.format());
            continue;
          }
          const bead = parsedResult.data;
          
          stmt.run({
            id: bead.id,
            type: bead.type,
            status: bead.status,
            title: bead.title,
            description: bead.description,
            author: bead.author,
            timestamp: bead.timestamp,
            evidence: bead.evidence,
            claimed_by: bead.claimed_by,
            claimed_at: bead.claimed_at
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
   * Implement a JIT legacy migration method migrateLegacy() in the BeadsDB constructor
   * that reads memory/beads/ and converts any existing Markdown beads (bd-*.md) and legacy
   * migrated files (bd-*.json.migrated) to Zod-validated .json beads, then unlinks the legacy files.
   */
  migrateLegacy() {
    const dir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(dir)) return;

    const { beadSchema } = require('./schema');

    // Helper to validate, format, and write JSON
    const saveAsZodJSON = (bead) => {
      let status = bead.status;
      if (status === 'done') status = 'resolved';
      if (!['open', 'claimed', 'in_progress', 'resolved', 'failed'].includes(status)) {
        status = 'open';
      }

      let timestamp = bead.timestamp;
      try {
        if (timestamp) {
          timestamp = new Date(timestamp).toISOString();
        } else {
          timestamp = new Date().toISOString();
        }
      } catch (e) {
        timestamp = new Date().toISOString();
      }

      let claimed_at = bead.claimed_at || null;
      if (claimed_at) {
        try {
          claimed_at = new Date(claimed_at).toISOString();
        } catch (e) {
          claimed_at = null;
        }
      }

      const cleaned = {
        id: bead.id,
        type: bead.type || 'task_state',
        status: status,
        title: bead.title || 'Untitled',
        description: bead.description || '',
        author: bead.author || 'system',
        timestamp: timestamp,
        tags: Array.isArray(bead.tags) ? bead.tags : [],
        dependencies: Array.isArray(bead.dependencies) ? bead.dependencies.filter(d => /^bd-\d{4}$/.test(d)) : [],
        claimed_by: bead.claimed_by || null,
        claimed_at: claimed_at,
        evidence: bead.evidence || null
      };

      const parsed = beadSchema.parse(cleaned);
      const destPath = path.join(dir, `${parsed.id}.json`);
      fs.writeFileSync(destPath, JSON.stringify(parsed, null, 2), 'utf8');
    };

    // 1. Migrate bd-*.md files
    const mdFiles = fs.readdirSync(dir).filter(f => f.startsWith('bd-') && f.endsWith('.md'));
    for (const file of mdFiles) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const bead = this.parseFrontmatter(raw);
        if (bead && bead.id) {
          saveAsZodJSON(bead);
        }
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to migrate legacy MD file ${file}:`, err);
      }
    }

    // 2. Migrate bd-*.json.migrated files
    const migratedJsonFiles = fs.readdirSync(dir).filter(f => f.startsWith('bd-') && f.endsWith('.json.migrated'));
    for (const file of migratedJsonFiles) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const bead = JSON.parse(raw);
        if (bead && bead.id) {
          saveAsZodJSON(bead);
        }
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to migrate legacy JSON.migrated file ${file}:`, err);
      }
    }

    // 3. Migrate root legacy beads.json or beads.json.migrated if they exist
    const rootFiles = [
      path.join(process.cwd(), 'memory', 'beads.json'),
      path.join(process.cwd(), 'memory', 'beads.json.migrated')
    ];
    for (const rootPath of rootFiles) {
      if (fs.existsSync(rootPath)) {
        try {
          const beads = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
          const beadsArray = Array.isArray(beads) ? beads : [beads];
          for (const b of beadsArray) {
            if (b && b.id) {
              saveAsZodJSON(b);
            }
          }
          fs.unlinkSync(rootPath);
        } catch (err) {
          console.error(`Failed to migrate legacy root file ${rootPath}:`, err);
        }
      }
    }
  }

  /**
   * Helper _writeToJSON(beadId, updates) that merges updates, validates via beadSchema.parse(),
   * writes the JSON file, and invalidates the mtime cache map.
   */
  _writeToJSON(beadId, updates) {
    const { beadSchema } = require('./schema');
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    const jsonPath = path.join(beadsDir, `${beadId}.json`);

    let current = {};
    if (fs.existsSync(jsonPath)) {
      try {
        current = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        // Fallback
      }
    }

    const merged = { ...current, ...updates };

    if (!merged.id) merged.id = beadId;
    if (merged.type === undefined) merged.type = 'task_state';
    if (merged.status === undefined) merged.status = 'open';
    if (merged.status === 'done') merged.status = 'resolved';
    if (merged.title === undefined) merged.title = 'Untitled';
    if (merged.author === undefined) merged.author = 'system';
    if (merged.tags === undefined) merged.tags = [];
    if (merged.dependencies === undefined) merged.dependencies = [];
    if (merged.description === undefined) merged.description = '';
    if (merged.claimed_by === undefined) merged.claimed_by = null;
    if (merged.claimed_at === undefined) merged.claimed_at = null;
    if (merged.evidence === undefined) merged.evidence = null;
    if (merged.timestamp === undefined) merged.timestamp = new Date().toISOString();

    if (merged.timestamp instanceof Date) merged.timestamp = merged.timestamp.toISOString();
    if (merged.claimed_at instanceof Date) merged.claimed_at = merged.claimed_at.toISOString();

    const validated = beadSchema.parse(merged);

    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(validated, null, 2), 'utf8');

    // Update the mtime cache map immediately
    try {
      const stat = fs.statSync(jsonPath);
      this._fileMtimes.set(`${beadId}.json`, stat.mtimeMs);
    } catch (e) {
      this._fileMtimes.delete(`${beadId}.json`);
    }

    // Direct SQLite update so SQLite is always in sync with what was just written
    const stmt = this.db.prepare(`
      INSERT INTO beads (id, type, status, title, description, author, timestamp, evidence, claimed_by, claimed_at)
      VALUES (@id, @type, @status, @title, @description, @author, @timestamp, @evidence, @claimed_by, @claimed_at)
      ON CONFLICT(id) DO UPDATE SET
        type=excluded.type,
        status=excluded.status,
        title=excluded.title,
        description=excluded.description,
        author=excluded.author,
        timestamp=excluded.timestamp,
        evidence=excluded.evidence,
        claimed_by=excluded.claimed_by,
        claimed_at=excluded.claimed_at
    `);
    
    const deleteTags = this.db.prepare(`DELETE FROM tags WHERE bead_id = ?`);
    const insertTag = this.db.prepare(`INSERT OR IGNORE INTO tags (bead_id, tag) VALUES (?, ?)`);
    const deleteDeps = this.db.prepare(`DELETE FROM dependencies WHERE bead_id = ?`);
    const insertDep = this.db.prepare(`INSERT OR IGNORE INTO dependencies (bead_id, dependency_id) VALUES (?, ?)`);

    this.db.transaction(() => {
      stmt.run({
        id: validated.id,
        type: validated.type,
        status: validated.status,
        title: validated.title,
        description: validated.description,
        author: validated.author,
        timestamp: validated.timestamp,
        evidence: validated.evidence,
        claimed_by: validated.claimed_by,
        claimed_at: validated.claimed_at
      });

      deleteTags.run(validated.id);
      if (validated.tags && Array.isArray(validated.tags)) {
        for (const tag of validated.tags) {
          insertTag.run(validated.id, tag.trim());
        }
      }

      deleteDeps.run(validated.id);
      if (validated.dependencies && Array.isArray(validated.dependencies)) {
        for (const dep of validated.dependencies) {
          insertDep.run(validated.id, dep.trim());
        }
      }
    })();
  }

  /**
   * Generates a new Git-native JSON memory bead file and syncs it JIT to the SQLite query cache.
   */
  create(bead) {
    const beadId = bead.id || this.getNextId();
    bead.id = beadId;
    
    this._writeToJSON(beadId, bead);
    this.sync();
    return beadId;
  }

  /**
   * Synchronizes and retrieves all beads in the memory cache database.
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
   * Atomically claim a bead for an agent.
   */
  claim(beadId, agentId) {
    this._expireStaleClaims();
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      UPDATE beads SET claimed_by = ?, claimed_at = ?, status = 'claimed'
      WHERE id = ? AND (claimed_by IS NULL OR claimed_by = ?) AND status IN ('open', 'failed')
    `).run(agentId, now, beadId, agentId);
    if (result.changes > 0) {
      this._writeToJSON(beadId, { claimed_by: agentId, claimed_at: now, status: 'claimed' });
      return true;
    }
    return false;
  }

  /**
   * Release a claim. Only owning agent can release unless force=true.
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
      this._writeToJSON(beadId, { claimed_by: null, claimed_at: null, status: 'open' });
      return true;
    }
    return false;
  }

  /**
   * Transition claimed → in_progress. Only claiming agent can start.
   */
  start(beadId, agentId) {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'in_progress'
      WHERE id = ? AND claimed_by = ? AND status = 'claimed'
    `).run(beadId, agentId);
    if (result.changes > 0) {
      this._writeToJSON(beadId, { status: 'in_progress' });
      return true;
    }
    return false;
  }

  /**
   * Transition in_progress → resolved. Clears claim.
   */
  complete(beadId, agentId, evidence = '') {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'resolved', claimed_by = NULL, claimed_at = NULL, evidence = ?
      WHERE id = ? AND claimed_by = ? AND status = 'in_progress'
    `).run(evidence, beadId, agentId);
    if (result.changes > 0) {
      this._writeToJSON(beadId, { status: 'resolved', claimed_by: null, claimed_at: null, evidence: evidence || null });
      return true;
    }
    return false;
  }

  /**
   * Transition in_progress → failed. Clears claim.
   */
  fail(beadId, agentId, reason = '') {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'failed', claimed_by = NULL, claimed_at = NULL, evidence = ?
      WHERE id = ? AND claimed_by = ? AND status IN ('claimed', 'in_progress')
    `).run(reason, beadId, agentId);
    if (result.changes > 0) {
      this._writeToJSON(beadId, { status: 'failed', claimed_by: null, claimed_at: null, evidence: reason || null });
      return true;
    }
    return false;
  }

  /**
   * Reopen a resolved or failed bead. Clears any claim.
   */
  reopen(beadId) {
    const result = this.db.prepare(`
      UPDATE beads SET status = 'open', claimed_by = NULL, claimed_at = NULL
      WHERE id = ? AND status IN ('resolved', 'failed')
    `).run(beadId);
    if (result.changes > 0) {
      this._writeToJSON(beadId, { status: 'open', claimed_by: null, claimed_at: null });
      return true;
    }
    return false;
  }

  /**
   * Release claims older than maxAgeMs. Called lazily inside claim().
   */
  _expireStaleClaims(maxAgeMs = 1800000) {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const staleBeads = this.db.prepare(`
      SELECT id FROM beads WHERE claimed_by IS NOT NULL AND claimed_at < ? AND status IN ('claimed')
    `).all(cutoff);

    if (staleBeads.length === 0) return 0;

    const result = this.db.prepare(`
      UPDATE beads SET claimed_by = NULL, claimed_at = NULL, status = 'open'
      WHERE claimed_by IS NOT NULL AND claimed_at < ? AND status IN ('claimed')
    `).run(cutoff);

    for (const bead of staleBeads) {
      this._writeToJSON(bead.id, { claimed_by: null, claimed_at: null, status: 'open' });
    }

    return result.changes;
  }

  /**
   * Keep for backwards-compatibility.
   */
  _writeStatusToMarkdown(beadId, newStatus, extraFields = {}) {
    this._writeToJSON(beadId, { status: newStatus, ...extraFields });
  }

  // ─── ID Generation ──────────────────────────────────────────

  /**
   * Analyzes active bead items inside the synced SQLite database to determine the next incremental bd-XXXX ID.
   */
  getNextId() {
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
