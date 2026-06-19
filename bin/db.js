const path = require('node:path');
const fs = require('node:fs');
const lockfile = require('proper-lockfile');
const crypto = require('node:crypto');

// Monkeypatch lockfile.lockSync to support synchronous retries
if (!lockfile.lockSync.__isVeyraMonkeypatched) {
  const originalLockSync = lockfile.lockSync;
  lockfile.lockSync = function (file, options) {
    const opts = { ...options };
    const retriesConfig = opts.retries;
    delete opts.retries; // Prevent proper-lockfile from throwing "Cannot use retries with the sync api"

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
  lockfile.lockSync.__isVeyraMonkeypatched = true;
  lockfile.lockSync.original = originalLockSync;
}

function logAudit(agent_id, bead_id, action_type, content = null) {
  const timestamp = new Date().toISOString();
  let input_hash = null;
  let token_count = 0;
  
  if (content && typeof content === 'string') {
    input_hash = crypto.createHash('sha256').update(content).digest('hex');
    token_count = Math.round(content.length / 4);
  }
  
  const logEntry = {
    timestamp,
    agent_id,
    bead_id,
    action_type,
    input_hash,
    token_count
  };
  
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const logPath = path.join(logsDir, 'agent-audit.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
}

/**
 * 💾 BeadsDB — Git-Native & Map-Cached Memory Graph
 * Resolves Git merge bottlenecks by using plain-text JSON as authoritative storage
 * and a local Map cache JIT-synced for high-performance querying.
 */
class BeadsDB {
  constructor() {
    const memoryDir = path.join(process.cwd(), 'memory');
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    
    this.beads = new Map();
    this._fileMtimes = new Map(); // filename → mtime (ms) for dirty tracking
    this._syncStats = { filesScanned: 0, filesSkipped: 0 };
    this._lastSyncTime = null;
    this._syncTTLMs = 1000; // 1 second TTL before re-syncing
    
    this.migrateLegacy();
    this.sync(); // JIT Sync on initialize
  }

  init() {
    // Left for backwards-compatibility API contracts
  }

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

      const beadIdRegex = /^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
      const cleaned = {
        id: bead.id,
        type: bead.type || 'task_state',
        status: status,
        title: bead.title || 'Untitled',
        description: bead.description || '',
        author: bead.author || 'system',
        timestamp: timestamp,
        tags: Array.isArray(bead.tags) ? bead.tags : [],
        dependencies: Array.isArray(bead.dependencies) ? bead.dependencies.filter(d => beadIdRegex.test(d)) : [],
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

  processWatcherEvents() {
    try {
      const eventsDir = path.join(process.cwd(), 'memory', 'events');
      if (!fs.existsSync(eventsDir)) return;

      const files = fs.readdirSync(eventsDir).filter(f => f.startsWith('watcher-') && f.endsWith('.json'));
      if (files.length === 0) return;

      const filePathsToDelete = [];
      const filesToUnlink = [];

      for (const file of files) {
        const filePath = path.join(eventsDir, file);
        try {
          const contentStr = fs.readFileSync(filePath, 'utf8');
          const event = JSON.parse(contentStr);
          
          let targetPath = null;
          if (event.path) {
            targetPath = event.path;
          } else if (event.payload) {
            if (typeof event.payload === 'string') {
              try {
                targetPath = JSON.parse(event.payload).path;
              } catch (e) {}
            } else if (event.payload.path) {
              targetPath = event.payload.path;
            }
          }

          if (targetPath) {
            const nativePath = path.resolve(targetPath);
            const forwardSlashPath = nativePath.replace(/\\/g, '/');
            filePathsToDelete.push(nativePath, forwardSlashPath);

            const filename = path.basename(nativePath);
            const isBeadFile = /^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.json$/i.test(filename);
            if (isBeadFile) {
              this._fileMtimes.delete(filename);
              const beadId = filename.replace(/\.json$/i, '');
              this.beads.delete(beadId);
            }
          }
        } catch (err) {
          // Ignore
        }
        filesToUnlink.push(filePath);
      }

      if (filePathsToDelete.length > 0) {
        this.deleteCrawlCache(filePathsToDelete);
      }

      for (const fp of filesToUnlink) {
        try { fs.unlinkSync(fp); } catch (e) {}
      }
    } catch (e) {
      // Ignore
    }
  }

  sync() {
    this.processWatcherEvents();
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    
    const { beadSchema } = require('./schema');
    const beadIdRegex = /^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
    const files = fs.readdirSync(beadsDir).filter(f => f.startsWith('bd-') && f.endsWith('.json') && beadIdRegex.test(f.replace(/\.json$/i, '')));
    
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
        // File disappeared
      }
    }

    const filesSet = new Set(files);
    for (const key of this.beads.keys()) {
      const filename = `${key}.json`;
      if (!filesSet.has(filename)) {
        this.beads.delete(key);
        this._fileMtimes.delete(filename);
      }
    }
    
    this._syncStats = { filesScanned: scanned, filesSkipped: skipped };
    this._lastSyncTime = Date.now();
    
    if (filesToSync.length === 0) return;
    
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
        this.beads.set(bead.id, bead);
      } catch (err) {
        console.error(`✘ Failed to JIT sync bead ${file}:`, err);
      }
    }
  }

  _lockAndGet(beadId) {
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    const jsonPath = path.join(beadsDir, `${beadId}.json`);
    if (!fs.existsSync(beadsDir)) fs.mkdirSync(beadsDir, { recursive: true });
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, '{}', 'utf8');
    }
    const release = lockfile.lockSync(jsonPath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } });
    let bead = null;
    try {
      bead = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {}
    return { bead, release, jsonPath };
  }

  _writeToJSONWithExistingLock(beadId, updates, current) {
    const { beadSchema } = require('./schema');
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    const jsonPath = path.join(beadsDir, `${beadId}.json`);

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

    const beadIdRegex = /^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
    if (merged.dependencies && Array.isArray(merged.dependencies)) {
      merged.dependencies = merged.dependencies.filter(d => beadIdRegex.test(d));
    }

    const validated = beadSchema.parse(merged);
    fs.writeFileSync(jsonPath, JSON.stringify(validated, null, 2), 'utf8');

    try {
      const stat = fs.statSync(jsonPath);
      this._fileMtimes.set(`${beadId}.json`, stat.mtimeMs);
    } catch (e) {
      this._fileMtimes.delete(`${beadId}.json`);
    }

    this.beads.set(beadId, validated);
  }

  _writeToJSON(beadId, updates) {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      this._writeToJSONWithExistingLock(beadId, updates, bead);
    } finally {
      release();
    }
  }

  create(bead) {
    const beadId = bead.id || this.getNextId();
    bead.id = beadId;
    
    this._writeToJSON(beadId, bead);
    this.sync();

    const eventBus = require('./event_bus.js');
    eventBus.publish('bead_created', bead.author || 'system', { beadId, bead });
    logAudit(bead.author || 'system', beadId, 'create', bead.description || bead.title);

    return beadId;
  }

  getAll() {
    this._lazySyncIfStale();
    return Array.from(this.beads.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  _lazySyncIfStale() {
    if (this._lastSyncTime && (Date.now() - this._lastSyncTime) < this._syncTTLMs) return;
    this.sync();
  }

  get(id) {
    this._lazySyncIfStale();
    return this.beads.get(id) || null;
  }

  claim(beadId, agentId) {
    this._expireStaleClaims();
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead || !['open', 'failed'].includes(bead.status) || (bead.claimed_by && bead.claimed_by !== agentId)) {
        return false;
      }
      const oldStatus = bead.status;
      const now = new Date().toISOString();
      const updates = { claimed_by: agentId, claimed_at: now, status: 'claimed' };
      
      this._writeToJSONWithExistingLock(beadId, updates, bead);
      
      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', agentId, { beadId, oldStatus, newStatus: 'claimed' });
      logAudit(agentId, beadId, 'claim');
      return true;
    } finally {
      release();
    }
  }

  release(beadId, agentId, force = false) {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead) return false;
      if (!force && bead.claimed_by !== agentId) {
        return false;
      }
      if (bead.claimed_by === null && !force) {
        return false;
      }
      
      const oldStatus = bead.status;
      const updates = { claimed_by: null, claimed_at: null, status: 'open' };
      this._writeToJSONWithExistingLock(beadId, updates, bead);

      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', agentId || 'system', { beadId, oldStatus, newStatus: 'open' });
      logAudit(agentId || 'system', beadId, 'release');
      return true;
    } finally {
      release();
    }
  }

  start(beadId, agentId) {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead || bead.claimed_by !== agentId || bead.status !== 'claimed') {
        return false;
      }
      const oldStatus = bead.status;
      const updates = { status: 'in_progress' };
      this._writeToJSONWithExistingLock(beadId, updates, bead);

      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', agentId, { beadId, oldStatus, newStatus: 'in_progress' });
      logAudit(agentId, beadId, 'start');
      return true;
    } finally {
      release();
    }
  }

  complete(beadId, agentId, evidence = '') {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead || bead.claimed_by !== agentId || bead.status !== 'in_progress') {
        return false;
      }
      const oldStatus = bead.status;
      const updates = { status: 'resolved', claimed_by: null, claimed_at: null, evidence: evidence || null };
      this._writeToJSONWithExistingLock(beadId, updates, bead);

      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', agentId, { beadId, oldStatus, newStatus: 'resolved' });
      eventBus.publish('bead_resolved', agentId, { beadId, evidence });
      logAudit(agentId, beadId, 'complete', evidence);
      return true;
    } finally {
      release();
    }
  }

  fail(beadId, agentId, reason = '') {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead || bead.claimed_by !== agentId || !['claimed', 'in_progress'].includes(bead.status)) {
        return false;
      }
      const oldStatus = bead.status;
      const updates = { status: 'failed', claimed_by: null, claimed_at: null, evidence: reason || null };
      this._writeToJSONWithExistingLock(beadId, updates, bead);

      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', agentId, { beadId, oldStatus, newStatus: 'failed' });
      eventBus.publish('bead_failed', agentId, { beadId, reason });
      logAudit(agentId, beadId, 'fail', reason);
      return true;
    } finally {
      release();
    }
  }

  reopen(beadId) {
    const { bead, release } = this._lockAndGet(beadId);
    try {
      if (!bead || !['resolved', 'failed'].includes(bead.status)) {
        return false;
      }
      const oldStatus = bead.status;
      const updates = { status: 'open', claimed_by: null, claimed_at: null };
      this._writeToJSONWithExistingLock(beadId, updates, bead);

      const eventBus = require('./event_bus.js');
      eventBus.publish('bead_status_changed', 'system', { beadId, oldStatus, newStatus: 'open' });
      logAudit('system', beadId, 'reopen');
      return true;
    } finally {
      release();
    }
  }

  _expireStaleClaims(maxAgeMs = 1800000) {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    let changes = 0;
    for (const bead of this.beads.values()) {
      if (bead.claimed_by && bead.claimed_at && bead.claimed_at < cutoff && bead.status === 'claimed') {
        this._writeToJSON(bead.id, { claimed_by: null, claimed_at: null, status: 'open' });
        changes++;
      }
    }
    return changes;
  }

  _writeStatusToMarkdown(beadId, newStatus, extraFields = {}) {
    this._writeToJSON(beadId, { status: newStatus, ...extraFields });
  }

  getNextId() {
    return 'bd-' + crypto.randomUUID();
  }

  // ─── Crawl Cache Helpers ─────────────────────────────────────

  getCachedCrawl(filePath, mtime) {
    const cachePath = path.join(process.cwd(), 'memory', 'crawl_cache.json');
    if (!fs.existsSync(cachePath)) return null;

    const mtimeMs = Math.round((mtime instanceof Date) ? mtime.getTime() : Number(mtime));
    
    let release;
    try {
      release = lockfile.lockSync(cachePath, { retries: { retries: 5, minTimeout: 20, maxTimeout: 50 } });
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const row = cache[filePath];
      if (row && Math.round(Number(row.mtime)) === mtimeMs) {
        return {
          imports: row.imports,
          semanticKeys: row.semantic_keys
        };
      }
    } catch (e) {
      // Ignore
    } finally {
      if (release) release();
    }
    return null;
  }

  saveCachedCrawl(filePath, mtime, imports, semanticKeys) {
    const cachePath = path.join(process.cwd(), 'memory', 'crawl_cache.json');
    const memoryDir = path.dirname(cachePath);
    if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
    if (!fs.existsSync(cachePath)) fs.writeFileSync(cachePath, '{}', 'utf8');

    const mtimeMs = Math.round((mtime instanceof Date) ? mtime.getTime() : Number(mtime));
    
    let release;
    try {
      release = lockfile.lockSync(cachePath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } });
      let cache = {};
      try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      } catch (e) {}
      cache[filePath] = {
        mtime: mtimeMs,
        imports,
        semantic_keys: semanticKeys
      };
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save crawl cache:', e);
    } finally {
      if (release) release();
    }
  }

  deleteCrawlCache(filePaths) {
    const cachePath = path.join(process.cwd(), 'memory', 'crawl_cache.json');
    if (!fs.existsSync(cachePath)) return;

    let release;
    try {
      release = lockfile.lockSync(cachePath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } });
      let cache = {};
      try {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      } catch (e) {}
      let changed = false;
      for (const fp of filePaths) {
        if (cache[fp]) {
          delete cache[fp];
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
      }
    } catch (e) {
      // Ignore
    } finally {
      if (release) release();
    }
  }
}

module.exports = new BeadsDB();
