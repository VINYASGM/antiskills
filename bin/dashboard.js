/**
 * 📺 Swarm Telemetry Dashboard
 * Extracts data from BeadsDB task queue, Governance circuit breakers, and Patch apply channels,
 * formatting them using visual terminal primitives.
 */

const fs = require('node:fs');
const path = require('node:path');
const beadsDB = require('./db.js');
const ui = require('./ui.js');

class SwarmDashboard {
  constructor(storageDir = null) {
    if (!storageDir) {
      storageDir = path.join(process.cwd(), '.agent', 'governance');
    }
    this.govStorageDir = storageDir;
  }

  /**
   * Aggregates task stats (totals, completions, progress bars).
   */
  getBeadStats(beads) {
    const total = beads.length;
    const stats = {
      total,
      open: 0,
      claimed: 0,
      in_progress: 0,
      resolved: 0,
      failed: 0,
      completionRate: 0
    };

    for (const b of beads) {
      if (stats[b.status] !== undefined) {
        stats[b.status]++;
      }
    }

    if (total > 0) {
      stats.completionRate = Math.round((stats.resolved / total) * 100);
    }

    return stats;
  }

  /**
   * Retrieves active concurrency locks.
   */
  getActiveLocks(beads) {
    const activeLocks = [];
    const now = Date.now();

    for (const b of beads) {
      if (b.claimed_by && (b.status === 'claimed' || b.status === 'in_progress')) {
        let durationMs = 0;
        if (b.claimed_at) {
          durationMs = now - new Date(b.claimed_at).getTime();
        }
        activeLocks.push({
          id: b.id,
          title: b.title,
          status: b.status,
          claimed_by: b.claimed_by,
          claimed_at: b.claimed_at,
          durationMs
        });
      }
    }

    return activeLocks;
  }

  /**
   * Retrieves governance transaction and circuit breaker status.
   */
  getGovernanceTransactions() {
    const transactions = [];
    if (!fs.existsSync(this.govStorageDir)) {
      return transactions;
    }

    try {
      const files = fs.readdirSync(this.govStorageDir)
        .filter(f => f.startsWith('tx-') && f.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(this.govStorageDir, file);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const tx = JSON.parse(raw);
          const escalationFile = `escalation-${tx.transactionId}.md`;
          const escalationPath = path.join(this.govStorageDir, escalationFile);
          
          transactions.push({
            transactionId: tx.transactionId,
            taskId: tx.taskId,
            agents: Array.isArray(tx.agents) ? tx.agents : (typeof tx.agents === 'string' ? [tx.agents] : []),
            failedAttemptsCount: tx.failedAttemptsCount || 0,
            maxThreshold: tx.maxThreshold || 3,
            status: tx.status || 'active',
            escalationReportExists: fs.existsSync(escalationPath)
          });
        } catch (e) {
          // Skip corrupt JSON files
        }
      }
    } catch (err) {
      // Return empty array if reading fails
    }

    return transactions;
  }

  /**
   * Retrieves active patch apply channels.
   */
  getPatchChannels() {
    const patchDir = path.join(process.cwd(), 'patches');
    if (!fs.existsSync(patchDir)) {
      return [];
    }

    try {
      return fs.readdirSync(patchDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    } catch (err) {
      return [];
    }
  }

  /**
   * Helper to format duration in human-readable form.
   */
  formatDuration(ms) {
    if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) return '0s';
    if (ms < 1000) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  }

  /**
   * Renders the full dashboard as a string.
   */
  render() {
    // 1. Gather all data JIT
    beadsDB.sync();
    const beads = beadsDB.getAll();
    const stats = this.getBeadStats(beads);
    const locks = this.getActiveLocks(beads);
    const txs = this.getGovernanceTransactions();
    const channels = this.getPatchChannels();

    const c = ui.colors;
    let output = '';

    // HEADER
    const titleBar = `${c.bright}${c.cyan}VEYRA SWARM TELEMETRY DASHBOARD${c.reset}`;
    const timestampStr = `${c.dim}Local Time: ${new Date().toISOString()}${c.reset}`;
    output += `\n ${titleBar}\n ${timestampStr}\n\n`;

    // SECTION 1: TASK QUEUE STATISTICS
    const progressText = ui.progressBar(stats.completionRate, 30);
    const statsLines = [
      `Progress: ${progressText}`,
      `Total Tasks: ${stats.total.toString().padEnd(6)} | Open: ${c.yellow}${stats.open.toString().padEnd(6)}${c.reset} | Claimed: ${c.blue}${stats.claimed.toString().padEnd(6)}${c.reset}`,
      `In Progress: ${c.magenta}${stats.in_progress.toString().padEnd(4)}${c.reset} | Resolved: ${c.green}${stats.resolved.toString().padEnd(4)}${c.reset} | Failed: ${c.red}${stats.failed.toString().padEnd(4)}${c.reset}`
    ];
    output += ui.drawBox('TASK QUEUE STATISTICS', statsLines, 70, 'cyan') + '\n\n';

    // SECTION 2: CONCURRENCY LOCK REGISTRY
    output += `${c.bright}${c.blue} 🔑 DATABASE CONCURRENCY LOCKS${c.reset}\n`;
    if (locks.length === 0) {
      output += `  ${c.dim}No active database concurrency locks found.${c.reset}\n\n`;
    } else {
      const lockHeaders = ['Bead ID', 'Claimed By', 'Status', 'Duration'];
      const lockRows = locks.map(l => [
        l.id,
        l.claimed_by,
        l.status === 'in_progress' ? `${c.magenta}in_progress${c.reset}` : `${c.blue}claimed${c.reset}`,
        this.formatDuration(l.durationMs)
      ]);
      output += ui.drawTable(lockHeaders, lockRows, [10, 18, 12, 10], 'blue') + '\n\n';
    }

    // SECTION 3: SWARM GOVERNANCE & CIRCUIT BREAKERS
    output += `${c.bright}${c.magenta} 🛡️ GOVERNANCE CIRCUIT BREAKERS${c.reset}\n`;
    if (txs.length === 0) {
      output += `  ${c.dim}No active governance transaction sessions tracked.${c.reset}\n\n`;
    } else {
      const govHeaders = ['Tx ID', 'Task ID', 'Swarm Agents', 'Strikes', 'Status'];
      const govRows = txs.map(t => {
        let statusStr = '';
        if (t.status === 'tripped') {
          statusStr = `${c.bright}${c.red}🚨 TRIPPED${c.reset}`;
        } else if (t.failedAttemptsCount > 0) {
          statusStr = `${c.yellow}WARNING${c.reset}`;
        } else {
          statusStr = `${c.green}ACTIVE${c.reset}`;
        }

        const strikesStr = `${t.failedAttemptsCount}/${t.maxThreshold}`;

        return [
          t.transactionId,
          t.taskId,
          t.agents.join(', '),
          strikesStr,
          statusStr
        ];
      });
      output += ui.drawTable(govHeaders, govRows, [10, 10, 24, 8, 12], 'magenta') + '\n\n';
    }

    // SECTION 4: PATCH APPLY CHANNELS
    output += `${c.bright}${c.green} 🔀 PATCH APPLY CHANNELS${c.reset}\n`;
    if (channels.length === 0) {
      output += `  ${c.dim}No active patch apply channels (worktrees) defined.${c.reset}\n\n`;
    } else {
      const channelsList = channels.map(chan => `  • ${c.green}${chan}${c.reset}`).join('\n');
      output += channelsList + '\n\n';
    }

    return output;
  }
}

module.exports = SwarmDashboard;
