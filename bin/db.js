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
      for (const file of files) {
        const filePath = path.join(beadsDir, file);
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
    this.sync(); // JIT refresh
    const beads = this.db.prepare(`SELECT * FROM beads ORDER BY id ASC`).all();
    for (const b of beads) {
      b.tags = this.db.prepare(`SELECT tag FROM tags WHERE bead_id = ?`).all(b.id).map(r => r.tag);
      b.dependencies = this.db.prepare(`SELECT dependency_id FROM dependencies WHERE bead_id = ?`).all(b.id).map(r => r.dependency_id);
    }
    return beads;
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
    this.sync(); // JIT refresh
    const bead = this.db.prepare(`SELECT * FROM beads WHERE id = ?`).get(id);
    if (!bead) return null;
    
    bead.tags = this.db.prepare(`SELECT tag FROM tags WHERE bead_id = ?`).all(id).map(r => r.tag);
    bead.dependencies = this.db.prepare(`SELECT dependency_id FROM dependencies WHERE bead_id = ?`).all(id).map(r => r.dependency_id);
    return bead;
  }

  /**
   * Analyzes active bead items inside the synced SQLite database to determine the next incremental bd-XXXX ID.
   * 
   * @returns {string} The next available bd-XXXX string.
   */
  getNextId() {
    this.sync(); // JIT refresh
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
