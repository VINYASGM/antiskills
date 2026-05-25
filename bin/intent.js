const path = require('node:path');
const fs = require('node:fs');
const beadsDB = require('./db.js');

/**
 * 📡 IntentManager — Continuous Context Broadcasting
 * Enables parallel agents to broadcast their intentions (e.g., schemas, API routes, files)
 * and analyze overlaps JIT to prevent semantic conflicts before the commit phase.
 * 
 * *Upgraded in Phase 6 to use SQLite WAL pub-sub instead of JSON file writes.*
 */
class IntentManager {
  /**
   * Cleans up legacy ephemeral intent JSON folders if they exist.
   */
  constructor() {
    this.intentsDir = path.join(process.cwd(), 'memory', 'intents');
  }

  /**
   * Broadcasts an agent's architectural intents to the shared intents bus.
   * 
   * @param {string} agentId - Identifier of the active agent (e.g. 'frontend-engineer').
   * @param {string} taskId - Bead ID of the task (e.g. 'bd-0004').
   * @param {object} data - Object containing file paths, DB columns, REST routes, and CSS style bindings.
   * @returns {object} Struct mapping the published intent attributes.
   * @throws {Error} If writing to the shared intents directory encounters filesystem access locks.
   * @example
   * intentManager.publish('backend-engineer', 'bd-0003', { files: ['src/db.ts'], databaseColumns: ['users.role'] });
   */
  publish(agentId, taskId, data = {}) {
    const intent = {
      agentId,
      taskId,
      timestamp: new Date().toISOString(),
      files: data.files || [],
      databaseColumns: data.databaseColumns || [],
      routes: data.routes || [],
      styles: data.styles || []
    };

    beadsDB.db.prepare(`
      INSERT INTO intents (agent_id, task_id, timestamp, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(agent_id, task_id) DO UPDATE SET 
        timestamp=excluded.timestamp, 
        data=excluded.data
    `).run(agentId, taskId, intent.timestamp, JSON.stringify(intent));

    console.log(`✔ Intent broadcasted via SQLite WAL: ${agentId} on ${taskId}`);
    return intent;
  }

  /**
   * Retrieves all active ephemeral intents published across all agent worktrees.
   * 
   * @returns {object[]} Ranked array of active intent records.
   */
  list() {
    const rows = beadsDB.db.prepare(`SELECT data FROM intents`).all();
    const intents = [];
    for (const row of rows) {
      try {
        intents.push(JSON.parse(row.data));
      } catch (e) {}
    }
    return intents;
  }

  /**
   * Scans for semantic and structural overlaps against active peer intents published inside workspace directories.
   * 
   * @param {string} currentAgentId - Identifier of the scanning agent.
   * @param {string} currentTaskId - Active bead task ID.
   * @param {object} myData - Attributes matching files, columns, routes, and styles that the current agent plans to modify.
   * @returns {Array<{type: string, severity: string, peer: string, task: string, details: string}>} Collection of detected semantic or file overlap conflicts.
   * @example
   * const conflicts = intentManager.checkConflicts('frontend-engineer', 'bd-0004', { routes: ['/api/users'] });
   */
  checkConflicts(currentAgentId, currentTaskId, myData = {}) {
    const active = this.list().filter(i => !(i.agentId === currentAgentId && i.taskId === currentTaskId));
    const conflicts = [];

    const myFiles = new Set(myData.files || []);
    const myCols = new Set(myData.databaseColumns || []);
    const myRoutes = new Set(myData.routes || []);
    const myStyles = new Set(myData.styles || []);

    for (const peer of active) {
      // 1. Textual / File Conflict Scan
      const fileOverlaps = peer.files.filter(f => myFiles.has(f));
      if (fileOverlaps.length > 0) {
        conflicts.push({
          type: 'textual_file_overlap',
          severity: 'HIGH',
          peer: peer.agentId,
          task: peer.taskId,
          details: `Both you and ${peer.agentId} are modifying: ${fileOverlaps.join(', ')}. This will cause a Git merge conflict.`
        });
      }

      // 2. Database Schema Semantic Scan
      const colOverlaps = peer.databaseColumns.filter(c => myCols.has(c));
      if (colOverlaps.length > 0) {
        conflicts.push({
          type: 'database_schema_drift',
          severity: 'CRITICAL',
          peer: peer.agentId,
          task: peer.taskId,
          details: `Schema conflict detected! Both you and ${peer.agentId} are modifying database column/table: ${colOverlaps.join(', ')}.`
        });
      }

      // 3. API Contract Semantic Scan
      const routeOverlaps = peer.routes.filter(r => myRoutes.has(r));
      if (routeOverlaps.length > 0) {
        conflicts.push({
          type: 'api_contract_drift',
          severity: 'HIGH',
          peer: peer.agentId,
          task: peer.taskId,
          details: `API Contract conflict! Both you and ${peer.agentId} are changing the payload or behaviour of route: ${routeOverlaps.join(', ')}.`
        });
      }

      // 4. Style Namespace Scan
      const styleOverlaps = peer.styles.filter(s => myStyles.has(s));
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

  /**
   * Deletes and clears intent declarations when an agent task branch is merged/closed.
   * 
   * @param {string} agentId - Target agent.
   * @param {string} taskId - Target task ID.
   * @returns {void}
   */
  clear(agentId, taskId) {
    beadsDB.db.prepare(`DELETE FROM intents WHERE agent_id = ? AND task_id = ?`).run(agentId, taskId);
    
    // Cleanup legacy file if exists
    const filePath = path.join(this.intentsDir, `in-${agentId}-${taskId}.json`);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    console.log(`✔ Intent cleared via SQLite: ${agentId} on ${taskId}`);
  }
}

module.exports = new IntentManager();
