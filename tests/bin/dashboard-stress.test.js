import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SwarmDashboard = require('../../bin/dashboard');
const beadsDB = require('../../bin/db');

describe('Swarm Telemetry Dashboard - Stress and Edge Cases', () => {
  const tempGovDir = path.join(process.cwd(), 'tests', 'temp_gov_stress_test');
  let dashboard;

  beforeEach(() => {
    if (!fs.existsSync(tempGovDir)) {
      fs.mkdirSync(tempGovDir, { recursive: true });
    }
    dashboard = new SwarmDashboard(tempGovDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempGovDir)) {
      fs.rmSync(tempGovDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  describe('Empty state / No data', () => {
    it('handles no transactions, locks, or patch channels gracefully without crashing', () => {
      vi.spyOn(beadsDB, 'sync').mockImplementation(() => {});
      vi.spyOn(beadsDB, 'getAll').mockReturnValue([]);
      vi.spyOn(dashboard, 'getPatchChannels').mockReturnValue([]);

      const output = dashboard.render();

      expect(output).toContain('No active database concurrency locks found.');
      expect(output).toContain('No active governance transaction sessions tracked.');
      expect(output).toContain('No active patch apply channels (worktrees) defined.');
    });
  });

  describe('Highly active locks and extreme inputs', () => {
    it('handles beads with invalid claimed_at or missing fields', () => {
      const mockBeads = [
        {
          id: 'bd-0001',
          title: 'Bead with null claimed_at',
          status: 'claimed',
          claimed_by: 'agent-1',
          claimed_at: null
        },
        {
          id: 'bd-0002',
          title: 'Bead with invalid claimed_at date',
          status: 'in_progress',
          claimed_by: 'agent-2',
          claimed_at: 'invalid-date-string'
        }
      ];

      const locks = dashboard.getActiveLocks(mockBeads);
      expect(locks).toHaveLength(2);
      expect(locks[0].durationMs).toBe(0);
      expect(locks[1].durationMs).toBeNaN();

      // Check formatDuration for NaN
      const formattedNaN = dashboard.formatDuration(locks[1].durationMs);
      expect(formattedNaN).toBe('0s'); // Updated: now handles invalid duration inputs gracefully by returning '0s'
    });

    it('renders tables with extremely long names causing alignment overflow', () => {
      vi.spyOn(beadsDB, 'sync').mockImplementation(() => {});
      vi.spyOn(beadsDB, 'getAll').mockReturnValue([
        {
          id: 'bd-0001-extremely-long-id-that-exceeds-ten-chars',
          status: 'claimed',
          claimed_by: 'agent-extremely-long-name-that-exceeds-eighteen-chars',
          claimed_at: new Date().toISOString()
        }
      ]);

      vi.spyOn(dashboard, 'getGovernanceTransactions').mockReturnValue([]);
      vi.spyOn(dashboard, 'getPatchChannels').mockReturnValue([]);

      const output = dashboard.render();
      expect(output).toContain('bd-0001...');
      expect(output).not.toContain('bd-0001-extremely-long-id-that-exceeds-ten-chars');
    });
  });

  describe('Corrupt governance files', () => {
    it('skips completely empty or corrupt JSON files', () => {
      fs.writeFileSync(path.join(tempGovDir, 'tx-empty.json'), '', 'utf8');
      fs.writeFileSync(path.join(tempGovDir, 'tx-corrupt.json'), 'invalid json string', 'utf8');

      const txs = dashboard.getGovernanceTransactions();
      expect(txs).toEqual([]);
    });

    it('handles valid JSON files but missing vital keys (undefined transactionId/taskId)', () => {
      const incompleteTx = {
        // missing transactionId and taskId
        agents: ['agent-a'],
        failedAttemptsCount: 2
      };
      fs.writeFileSync(path.join(tempGovDir, 'tx-incomplete.json'), JSON.stringify(incompleteTx), 'utf8');

      const txs = dashboard.getGovernanceTransactions();
      expect(txs).toHaveLength(1);
      expect(txs[0].transactionId).toBeUndefined();
      expect(txs[0].taskId).toBeUndefined();
      expect(txs[0].maxThreshold).toBe(3); // default fallback
      expect(txs[0].status).toBe('active'); // default fallback
    });

    it('checks behavior when agents is not an array (e.g. null, string, object)', () => {
      const badAgentsTx = {
        transactionId: '1005',
        taskId: 'bd-0005',
        agents: 'not-an-array-but-a-string', // invalid type
        failedAttemptsCount: 0,
        status: 'active'
      };
      fs.writeFileSync(path.join(tempGovDir, 'tx-bad-agents.json'), JSON.stringify(badAgentsTx), 'utf8');

      vi.spyOn(beadsDB, 'sync').mockImplementation(() => {});
      vi.spyOn(beadsDB, 'getAll').mockReturnValue([]);
      vi.spyOn(dashboard, 'getPatchChannels').mockReturnValue([]);

      // This should no longer throw "TypeError: t.agents.join is not a function" inside dashboard.render()
      // because getGovernanceTransactions normalizes the agents field.
      expect(() => dashboard.render()).not.toThrow();
      const output = dashboard.render();
      expect(output).toContain('not-an-array-but-a-st...');
    });
  });
});
