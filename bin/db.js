const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

class BeadsDB {
  constructor() {
    const memoryDir = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    
    this.dbPath = path.join(memoryDir, 'beads.db');
    this.db = new Database(this.dbPath);
    this.init();
    this.migrateLegacy();
  }

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
      CREATE INDEX IF NOT EXISTS idx_status ON beads(status);
      CREATE INDEX IF NOT EXISTS idx_type ON beads(type);
    `);
  }

  migrateLegacy() {
    // If flat files exist, migrate them to DB
    const dir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir).filter(f => f.startsWith('bd-') && f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const bead = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!this.get(bead.id)) {
          this.create(bead);
        }
        // Rename migrated file to avoid re-parsing
        fs.renameSync(filePath, filePath + '.migrated');
      } catch (err) {}
    }
    // Also check root memory/beads.json which was the original root bead
    const rootBeadFile = path.join(process.cwd(), 'memory', 'beads.json');
    if (fs.existsSync(rootBeadFile)) {
      try {
         const beads = JSON.parse(fs.readFileSync(rootBeadFile, 'utf8'));
         for (const bead of beads) {
           if (!this.get(bead.id)) this.create(bead);
         }
         fs.renameSync(rootBeadFile, rootBeadFile + '.migrated');
      } catch (err) {}
    }
  }

  create(bead) {
    const stmt = this.db.prepare(`
      INSERT INTO beads (id, type, status, title, description, author, timestamp, evidence, superseded_by)
      VALUES (@id, @type, @status, @title, @description, @author, @timestamp, @evidence, @superseded_by)
    `);
    
    this.db.transaction(() => {
      stmt.run({
        id: bead.id,
        type: bead.type || 'task_state',
        status: bead.status || 'open',
        title: bead.title,
        description: bead.description || '',
        author: bead.author || 'system',
        timestamp: bead.timestamp || new Date().toISOString(),
        evidence: bead.evidence || '',
        superseded_by: bead.superseded_by || null
      });

      if (bead.tags && Array.isArray(bead.tags)) {
        const tagStmt = this.db.prepare(`INSERT OR IGNORE INTO tags (bead_id, tag) VALUES (?, ?)`);
        for (const tag of bead.tags) {
          tagStmt.run(bead.id, tag.trim());
        }
      }

      if (bead.dependencies && Array.isArray(bead.dependencies)) {
        const depStmt = this.db.prepare(`INSERT OR IGNORE INTO dependencies (bead_id, dependency_id) VALUES (?, ?)`);
        for (const dep of bead.dependencies) {
          depStmt.run(bead.id, dep.trim());
        }
      }
    })();
  }

  getAll() {
    const beads = this.db.prepare(`SELECT * FROM beads ORDER BY id ASC`).all();
    return beads;
  }

  get(id) {
    const bead = this.db.prepare(`SELECT * FROM beads WHERE id = ?`).get(id);
    if (!bead) return null;
    
    const tags = this.db.prepare(`SELECT tag FROM tags WHERE bead_id = ?`).all(id).map(r => r.tag);
    const deps = this.db.prepare(`SELECT dependency_id FROM dependencies WHERE bead_id = ?`).all(id).map(r => r.dependency_id);
    
    bead.tags = tags;
    bead.dependencies = deps;
    return bead;
  }

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
