import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const SwarmDashboard = require('../../bin/dashboard');
const beadsDB = require('../../bin/db');

describe('Swarm Telemetry Dashboard', () => {
  const tempGovDir = path.join(process.cwd(), 'tests', 'temp_gov_dash_test');
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

  describe('getBeadStats()', () => {
    it('correctly aggregates beads by status and computes completion rate', () => {
      const mockBeads = [
        { id: 'bd-0001', status: 'resolved' },
        { id: 'bd-0002', status: 'resolved' },
        { id: 'bd-0003', status: 'in_progress' },
        { id: 'bd-0004', status: 'open' },
        { id: 'bd-0005', status: 'failed' },
        { id: 'bd-0006', status: 'claimed' }
      ];

      const stats = dashboard.getBeadStats(mockBeads);

      expect(stats.total).toBe(6);
      expect(stats.resolved).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.open).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.claimed).toBe(1);
      expect(stats.completionRate).toBe(33); // 2/6 = 33.33%
    });

    it('returns 0 completion rate if total is 0', () => {
      const stats = dashboard.getBeadStats([]);
      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
    });
  });

  describe('getActiveLocks()', () => {
    it('filters claimed/in_progress beads and calculates durations', () => {
      const now = Date.now();
      const claimedAt = new Date(now - 1000 * 60 * 15).toISOString(); // 15 mins ago
      const mockBeads = [
        { id: 'bd-0001', status: 'resolved', claimed_by: 'agent-a', claimed_at: claimedAt },
        { id: 'bd-0002', status: 'claimed', claimed_by: 'agent-b', claimed_at: claimedAt },
        { id: 'bd-0003', status: 'in_progress', claimed_by: 'agent-c', claimed_at: claimedAt }
      ];

      const locks = dashboard.getActiveLocks(mockBeads);

      expect(locks).toHaveLength(2);
      expect(locks[0].id).toBe('bd-0002');
      expect(locks[0].claimed_by).toBe('agent-b');
      expect(locks[0].durationMs).toBeGreaterThanOrEqual(1000 * 60 * 14.9);
      expect(locks[1].id).toBe('bd-0003');
      expect(locks[1].claimed_by).toBe('agent-c');
    });
  });

  describe('getGovernanceTransactions()', () => {
    it('returns empty array if gov folder is empty', () => {
      const txs = dashboard.getGovernanceTransactions();
      expect(txs).toEqual([]);
    });

    it('reads and parses active and tripped transaction files', () => {
      const txActive = {
        transactionId: '1001',
        taskId: 'bd-0001',
        agents: ['agent-a', 'agent-b'],
        failedAttemptsCount: 1,
        maxThreshold: 3,
        status: 'active'
      };

      const txTripped = {
        transactionId: '1002',
        taskId: 'bd-0002',
        agents: ['agent-c'],
        failedAttemptsCount: 3,
        maxThreshold: 3,
        status: 'tripped'
      };

      fs.writeFileSync(path.join(tempGovDir, 'tx-1001.json'), JSON.stringify(txActive), 'utf8');
      fs.writeFileSync(path.join(tempGovDir, 'tx-1002.json'), JSON.stringify(txTripped), 'utf8');
      fs.writeFileSync(path.join(tempGovDir, 'escalation-1002.md'), 'Escalation Alert content', 'utf8');

      const txs = dashboard.getGovernanceTransactions();

      expect(txs).toHaveLength(2);
      
      const activeData = txs.find(t => t.transactionId === '1001');
      expect(activeData.status).toBe('active');
      expect(activeData.failedAttemptsCount).toBe(1);
      expect(activeData.escalationReportExists).toBe(false);

      const trippedData = txs.find(t => t.transactionId === '1002');
      expect(trippedData.status).toBe('tripped');
      expect(trippedData.failedAttemptsCount).toBe(3);
      expect(trippedData.escalationReportExists).toBe(true);
    });

    it('correctly normalizes agents field when it is a string or missing', () => {
      const txWithStringAgent = {
        transactionId: '1003',
        taskId: 'bd-0003',
        agents: 'single-agent',
        status: 'active'
      };

      const txWithMissingAgents = {
        transactionId: '1004',
        taskId: 'bd-0004',
        status: 'active'
      };

      fs.writeFileSync(path.join(tempGovDir, 'tx-1003.json'), JSON.stringify(txWithStringAgent), 'utf8');
      fs.writeFileSync(path.join(tempGovDir, 'tx-1004.json'), JSON.stringify(txWithMissingAgents), 'utf8');

      const txs = dashboard.getGovernanceTransactions();
      const stringAgentTx = txs.find(t => t.transactionId === '1003');
      expect(stringAgentTx.agents).toEqual(['single-agent']);

      const missingAgentsTx = txs.find(t => t.transactionId === '1004');
      expect(missingAgentsTx.agents).toEqual([]);
    });
  });

  describe('getPatchChannels()', () => {
    it('returns empty array if patches dir does not exist', () => {
      const spy = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const channels = dashboard.getPatchChannels();
      expect(channels).toEqual([]);
    });

    it('returns list of directories inside patches folder', () => {
      const mockDirents = [
        { isDirectory: () => true, name: 'chan-a' },
        { isDirectory: () => false, name: 'file.patch' },
        { isDirectory: () => true, name: 'chan-b' }
      ];
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockReturnValue(mockDirents);

      const channels = dashboard.getPatchChannels();
      expect(channels).toEqual(['chan-a', 'chan-b']);
    });
  });

  describe('formatDuration()', () => {
    it('formats milliseconds to human-readable seconds and minutes', () => {
      expect(dashboard.formatDuration(500)).toBe('0s');
      expect(dashboard.formatDuration(1500)).toBe('1s');
      expect(dashboard.formatDuration(62000)).toBe('1m 2s');
    });

    it('returns 0s for invalid duration inputs', () => {
      expect(dashboard.formatDuration(undefined)).toBe('0s');
      expect(dashboard.formatDuration(null)).toBe('0s');
      expect(dashboard.formatDuration('1000')).toBe('0s');
      expect(dashboard.formatDuration(NaN)).toBe('0s');
      expect(dashboard.formatDuration(-500)).toBe('0s');
    });
  });

  describe('render()', () => {
    it('renders dashboard with stats, locks, and governance transactions', () => {
      // Mock BeadsDB and file reading
      vi.spyOn(beadsDB, 'sync').mockImplementation(() => {});
      vi.spyOn(beadsDB, 'getAll').mockReturnValue([
        { id: 'bd-0001', status: 'resolved', claimed_by: null, claimed_at: null }
      ]);
      
      vi.spyOn(dashboard, 'getGovernanceTransactions').mockReturnValue([
        {
          transactionId: '1234',
          taskId: 'bd-0001',
          agents: ['agent-a'],
          failedAttemptsCount: 0,
          maxThreshold: 3,
          status: 'active',
          escalationReportExists: false
        }
      ]);

      vi.spyOn(dashboard, 'getPatchChannels').mockReturnValue(['patch-worktree-alpha']);

      const output = dashboard.render();

      expect(output).toContain('VEYRA SWARM TELEMETRY DASHBOARD');
      expect(output).toContain('TASK QUEUE STATISTICS');
      expect(output).toContain('DATABASE CONCURRENCY LOCKS');
      expect(output).toContain('GOVERNANCE CIRCUIT BREAKERS');
      expect(output).toContain('PATCH APPLY CHANNELS');
      expect(output).toContain('patch-worktree-alpha');
      expect(output).toContain('1234');
    });
  });
});
