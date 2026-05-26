/**
 * 🛡️ Governance Circuit Breaker Module
 * Tracks active multi-agent transaction attempt states, enforces strict 3-strike limits,
 * and handles automated diagnostic bundle reports for human escalations.
 */

const fs = require('node:fs');
const path = require('node:path');

class GovernanceSystem {
  constructor(storageDir = null) {
    if (!storageDir) {
      storageDir = path.join(process.cwd(), '.agent', 'governance');
    }
    this.storageDir = storageDir;
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  _getTxPath(transactionId) {
    return path.join(this.storageDir, `tx-${transactionId}.json`);
  }

  /**
   * Initializes a transaction tracking session.
   */
  initTransaction(transactionId, taskId, agents = []) {
    const txPath = this._getTxPath(transactionId);
    const session = {
      transactionId,
      taskId,
      agents,
      failedAttemptsCount: 0,
      maxThreshold: 3,
      status: 'active',
      history: []
    };
    fs.writeFileSync(txPath, JSON.stringify(session, null, 2), 'utf8');
    return session;
  }

  /**
   * Retrieves active transaction state.
   */
  getTransaction(transactionId) {
    const txPath = this._getTxPath(transactionId);
    if (!fs.existsSync(txPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(txPath, 'utf8'));
  }

  /**
   * Records a failed verification verification run. Trips breaker at 3 failed runs.
   *
   * @param {string} transactionId - Unique context transaction reference ID.
   * @param {string} agentId - Actor ID making the attempt.
   * @param {string} errorMsg - Stdout or Vitest stacktrace log string.
   * @param {string} diffSnippet - Buffer string representing VFS patch diff.
   * @returns {object} Updated transaction state.
   */
  recordFailure(transactionId, agentId, errorMsg, diffSnippet = '') {
    let session = this.getTransaction(transactionId);
    if (!session) {
      session = this.initTransaction(transactionId, 'unknown', [agentId]);
    }

    if (session.status === 'tripped') {
      return session;
    }

    session.failedAttemptsCount += 1;
    session.history.push({
      attempt: session.failedAttemptsCount,
      agentId,
      timestamp: new Date().toISOString(),
      failureReason: errorMsg,
      diffSnippet
    });

    if (session.failedAttemptsCount >= session.maxThreshold) {
      session.status = 'tripped';
      this.generateEscalationReport(session);
    }

    fs.writeFileSync(this._getTxPath(transactionId), JSON.stringify(session, null, 2), 'utf8');
    return session;
  }

  /**
   * Generates a structural diagnostic markdown alert when circuit breaker is tripped.
   */
  generateEscalationReport(session) {
    const reportPath = path.join(this.storageDir, `escalation-${session.transactionId}.md`);
    const lastAttempt = session.history[session.history.length - 1];

    const reportContent = `# 🚨 GOVERNANCE ESCALATION REPORT — Breaker Tripped

**Transaction:** \`tx-${session.transactionId}\`  
**Associated Task:** \`${session.taskId}\`  
**Max Retry Limit:** \`${session.maxThreshold} Attempts Exceeded\`  
**Swarm Agents:** \`${session.agents.join(', ')}\`  
**Tripped Timestamp:** \`${new Date().toISOString()}\`

---

## ⚠ Swarm Execution Halted

The Multi-Agent execution swarm has been frozen. The circuit breaker tripped after **3 consecutive verification failures** to prevent token drain and infinite ping-pong logic loops.

---

## 🔍 Latest Failure Diagnostics (Attempt 3)

**Failing Agent:** \`${lastAttempt.agentId}\`  
**Failure Reason:**
\`\`\`
${lastAttempt.failureReason}
\`\`\`

### Proposed VFS Diff Snapshot:
\`\`\`diff
${lastAttempt.diffSnippet || 'No diff snapshot recorded.'}
\`\`\`

---

## 🛠 Required Human Intervention
Please review the verification logs above. Make surgical corrections to the target code, and resolve semantic dependencies manually before resetting the swarm.
`;

    fs.writeFileSync(reportPath, reportContent, 'utf8');
  }

  /**
   * Resets a tripped transaction to active and resets count.
   */
  resetTransaction(transactionId) {
    const session = this.getTransaction(transactionId);
    if (!session) return null;

    session.failedAttemptsCount = 0;
    session.status = 'active';
    session.history = [];
    
    // Clear escalation report if exists
    const reportPath = path.join(this.storageDir, `escalation-${transactionId}.md`);
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }

    fs.writeFileSync(this._getTxPath(transactionId), JSON.stringify(session, null, 2), 'utf8');
    return session;
  }
}

module.exports = GovernanceSystem;
