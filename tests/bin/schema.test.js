const { beadSchema } = require('../../bin/schema');

describe('Zod Memory Schema Validation', () => {
  test('passes on valid bead object with minimal fields', () => {
    const validMinimal = {
      id: 'bd-0123',
      type: 'decision',
      status: 'open',
      title: 'Valid Minimal Bead',
      author: 'agent-1',
      timestamp: '2026-05-25T10:00:00Z',
    };

    const parsed = beadSchema.parse(validMinimal);
    expect(parsed.id).toBe('bd-0123');
    expect(parsed.description).toBe('');
    expect(parsed.tags).toEqual([]);
    expect(parsed.dependencies).toEqual([]);
    expect(parsed.claimed_by).toBeNull();
    expect(parsed.claimed_at).toBeNull();
    expect(parsed.evidence).toBeNull();
  });

  test('passes on valid bead object with all fields', () => {
    const validFull = {
      id: 'bd-9999',
      type: 'task_state',
      status: 'in_progress',
      title: 'Full Featured Bead',
      description: 'A long description body.',
      author: 'system',
      timestamp: '2026-05-25T10:00:00.000Z',
      tags: ['bug', 'critical'],
      dependencies: ['bd-0001', 'bd-0002'],
      claimed_by: 'agent-99',
      claimed_at: '2026-05-25T10:05:00.000Z',
      evidence: 'some evidence here',
    };

    const parsed = beadSchema.parse(validFull);
    expect(parsed).toEqual(validFull);
  });

  test('fails on invalid bead ID format', () => {
    const invalidId = {
      id: 'bd-123', // should be 4 digits
      type: 'task_state',
      status: 'open',
      title: 'Invalid ID',
      author: 'human',
      timestamp: '2026-05-25T10:00:00Z',
    };

    const result = beadSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
  });

  test('fails on invalid status enum', () => {
    const invalidStatus = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'done', // not allowed (should be resolved)
      title: 'Invalid Status',
      author: 'human',
      timestamp: '2026-05-25T10:00:00Z',
    };

    const result = beadSchema.safeParse(invalidStatus);
    expect(result.success).toBe(false);
  });

  test('fails on empty title or author', () => {
    const emptyTitle = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: '', // empty
      author: 'human',
      timestamp: '2026-05-25T10:00:00Z',
    };

    const result = beadSchema.safeParse(emptyTitle);
    expect(result.success).toBe(false);
  });

  test('fails on malformed timestamps', () => {
    const malformedTimestamp = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Title',
      author: 'human',
      timestamp: 'not-a-date', // malformed date
    };

    const result = beadSchema.safeParse(malformedTimestamp);
    expect(result.success).toBe(false);
  });

  test('fails on invalid dependencies format', () => {
    const invalidDeps = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Title',
      author: 'human',
      timestamp: '2026-05-25T10:00:00Z',
      dependencies: ['not-a-bead-id'],
    };

    const result = beadSchema.safeParse(invalidDeps);
    expect(result.success).toBe(false);
  });
});
