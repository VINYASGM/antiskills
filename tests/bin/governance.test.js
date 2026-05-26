import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import GovernanceSystem from '../../bin/governance';

describe('Governance System — Attempt State & Escalation Breaker', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_gov_test');
  let gov;

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    gov = new GovernanceSystem(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Clean up any generated escalation reports in the main workspace directory
    const files = fs.readdirSync(process.cwd());
    for (const f of files) {
      if (f.startsWith('escalation-') && f.endsWith('.md')) {
        fs.unlinkSync(path.join(process.cwd(), f));
      }
    }
  });

  it('initTransaction() creates a valid active session', () => {
    const session = gov.initTransaction('1111', 'bd-0001', ['agent-a']);
    expect(session.transactionId).toBe('1111');
    expect(session.failedAttemptsCount).toBe(0);
    expect(session.status).toBe('active');
  });

  it('recordFailure() increments attempt and registers details', () => {
    gov.initTransaction('2222', 'bd-0002', ['agent-a']);
    const state = gov.recordFailure('2222', 'agent-a', 'Vitest syntax error', 'const x = 5;');
    
    expect(state.failedAttemptsCount).toBe(1);
    expect(state.status).toBe('active');
    expect(state.history[0].failureReason).toBe('Vitest syntax error');
    expect(state.history[0].diffSnippet).toBe('const x = 5;');
  });

  it('trips the circuit breaker at exactly 3 strikes and writes escalation report', () => {
    gov.initTransaction('3333', 'bd-0003', ['agent-a', 'agent-b']);
    
    gov.recordFailure('3333', 'agent-a', 'First linter warning');
    gov.recordFailure('3333', 'agent-b', 'Second compiler error');
    const state = gov.recordFailure('3333', 'agent-a', 'Third Vitest failed test spec', '--- a/src/index.js\n+++ b/src/index.js');
    
    expect(state.failedAttemptsCount).toBe(3);
    expect(state.status).toBe('tripped');
    
    // Check escalation report is generated
    const reportPath = path.join(tempDir, 'escalation-3333.md');
    expect(fs.existsSync(reportPath)).toBe(true);
    const content = fs.readFileSync(reportPath, 'utf8');
    expect(content.includes('First linter warning')).toBe(false); // Only displays latest failure logs
    expect(content.includes('Third Vitest failed test spec')).toBe(true);
    expect(content.includes('agent-a, agent-b')).toBe(true);
    
    // Clean up report
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  });

  it('resetTransaction() resets count and restores active status', () => {
    gov.initTransaction('4444', 'bd-0004', ['agent-a']);
    gov.recordFailure('4444', 'agent-a', 'Failed attempt 1');
    
    const state = gov.resetTransaction('4444');
    expect(state.failedAttemptsCount).toBe(0);
    expect(state.status).toBe('active');
    expect(state.history.length).toBe(0);
  });
});
