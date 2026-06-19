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
 * 📡 IntentManager — Continuous Context Broadcasting
 * Enables parallel agents to broadcast their intentions (e.g., schemas, API routes, files)
 * and analyze overlaps JIT to prevent semantic conflicts before the commit phase.
 * 
 * *Upgraded in Phase 6 to use SQLite WAL pub-sub instead of JSON file writes.*
 * *Re-implemented in V4 to use pure JSON lockfile concurrency.*
 */
class IntentManager {
  constructor() {
    this.intentsPath = path.join(process.cwd(), 'memory', 'intents.json');
  }

  _lockAndRead() {
    const dir = path.dirname(this.intentsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.intentsPath)) {
      fs.writeFileSync(this.intentsPath, '[]', 'utf8');
    }
    const release = monkeypatchedLockSync(this.intentsPath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } });
    let intents = [];
    try {
      intents = JSON.parse(fs.readFileSync(this.intentsPath, 'utf8'));
    } catch (e) {
      intents = [];
    }
    return { intents, release };
  }

  publish(agentId, taskId, data = {}) {
    const { intents, release } = this._lockAndRead();
    const intent = {
      agentId,
      taskId,
      timestamp: new Date().toISOString(),
      files: data.files || [],
      databaseColumns: data.databaseColumns || [],
      routes: data.routes || [],
      styles: data.styles || []
    };

    try {
      const index = intents.findIndex(i => i.agentId === agentId && i.taskId === taskId);
      if (index > -1) {
        intents[index] = intent;
      } else {
        intents.push(intent);
      }
      fs.writeFileSync(this.intentsPath, JSON.stringify(intents, null, 2), 'utf8');
    } finally {
      release();
    }

    console.log(`✔ Intent broadcasted via JSON: ${agentId} on ${taskId}`);
    return intent;
  }

  list() {
    const { intents, release } = this._lockAndRead();
    release();
    return intents;
  }

  checkConflicts(currentAgentId, currentTaskId, myData = {}) {
    const active = this.list().filter(i => !(i.agentId === currentAgentId && i.taskId === currentTaskId));
    const conflicts = [];

    const myFiles = new Set(myData.files || []);
    const myCols = new Set(myData.databaseColumns || []);
    const myRoutes = new Set(myData.routes || []);
    const myStyles = new Set(myData.styles || []);

    for (const peer of active) {
      const fileOverlaps = (peer.files || []).filter(f => myFiles.has(f));
      if (fileOverlaps.length > 0) {
        conflicts.push({
          type: 'textual_file_overlap',
          severity: 'HIGH',
          peer: peer.agentId,
          task: peer.taskId,
          details: `Both you and ${peer.agentId} are modifying: ${fileOverlaps.join(', ')}. This will cause a Git merge conflict.`
        });
      }

      const colOverlaps = (peer.databaseColumns || []).filter(c => myCols.has(c));
      if (colOverlaps.length > 0) {
        conflicts.push({
          type: 'database_schema_drift',
          severity: 'CRITICAL',
          peer: peer.agentId,
          task: peer.taskId,
          details: `Schema conflict detected! Both you and ${peer.agentId} are modifying database column/table: ${colOverlaps.join(', ')}.`
        });
      }

      const routeOverlaps = (peer.routes || []).filter(r => myRoutes.has(r));
      if (routeOverlaps.length > 0) {
        conflicts.push({
          type: 'api_contract_drift',
          severity: 'HIGH',
          peer: peer.agentId,
          task: peer.taskId,
          details: `API Contract conflict! Both you and ${peer.agentId} are changing the payload or behaviour of route: ${routeOverlaps.join(', ')}.`
        });
      }

      const styleOverlaps = (peer.styles || []).filter(s => myStyles.has(s));
      if (styleOverlaps.length > 0) {
        conflicts.push({
          type: 'css_style_collision',
          severity: 'MEDIUM',
          peer: peer.agentId,
          task: peer.taskId,
          details: `CSS class conflict! Both you and ${peer.agentId} are editing class/style name: ${styleOverlaps.join(', ')}.`
        });
      }
    }

    return conflicts;
  }

  clear(agentId, taskId) {
    const { intents, release } = this._lockAndRead();
    try {
      const filtered = intents.filter(i => !(i.agentId === agentId && i.taskId === taskId));
      fs.writeFileSync(this.intentsPath, JSON.stringify(filtered, null, 2), 'utf8');
    } finally {
      release();
    }
    
    // Cleanup legacy file if exists
    const intentsDir = path.join(process.cwd(), 'memory', 'intents');
    const filePath = path.join(intentsDir, `in-${agentId}-${taskId}.json`);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    console.log(`✔ Intent cleared via JSON: ${agentId} on ${taskId}`);
  }
}

module.exports = new IntentManager();
