
/**
 * WorktreeManager Tests
 * Tests concurrent merge safety check (file overlap detection).
 * Note: create/merge/cleanup require real Git — those are integration tests, deferred.
 */

describe('WorktreeManager — canMergeConcurrently', () => {
  // We test the logic by mocking getChangedFiles since it calls git diff
  let worktreeManager;

  test('returns true when branches touch disjoint files', () => {
    const wtPath = require.resolve('../../bin/worktree.js');
    delete require.cache[wtPath];
    worktreeManager = require('../../bin/worktree.js');

    // Mock getChangedFiles
    const original = worktreeManager.getChangedFiles;
    worktreeManager.getChangedFiles = (branch) => {
      if (branch === 'feat/a') return ['src/a.ts', 'src/a.test.ts'];
      if (branch === 'feat/b') return ['src/b.ts', 'src/b.test.ts'];
      return [];
    };

    expect(worktreeManager.canMergeConcurrently(['feat/a', 'feat/b'])).toBe(true);

    worktreeManager.getChangedFiles = original;
  });

  test('returns false when branches touch overlapping files', () => {
    const wtPath = require.resolve('../../bin/worktree.js');
    delete require.cache[wtPath];
    worktreeManager = require('../../bin/worktree.js');

    const original = worktreeManager.getChangedFiles;
    worktreeManager.getChangedFiles = (branch) => {
      if (branch === 'feat/a') return ['src/shared.ts', 'src/a.ts'];
      if (branch === 'feat/b') return ['src/shared.ts', 'src/b.ts'];
      return [];
    };

    expect(worktreeManager.canMergeConcurrently(['feat/a', 'feat/b'])).toBe(false);

    worktreeManager.getChangedFiles = original;
  });

  test('handles 3+ branches — any overlap fails all', () => {
    const wtPath = require.resolve('../../bin/worktree.js');
    delete require.cache[wtPath];
    worktreeManager = require('../../bin/worktree.js');

    const original = worktreeManager.getChangedFiles;
    worktreeManager.getChangedFiles = (branch) => {
      if (branch === 'feat/a') return ['src/a.ts'];
      if (branch === 'feat/b') return ['src/b.ts'];
      if (branch === 'feat/c') return ['src/b.ts']; // overlaps with feat/b
      return [];
    };

    expect(worktreeManager.canMergeConcurrently(['feat/a', 'feat/b', 'feat/c'])).toBe(false);

    worktreeManager.getChangedFiles = original;
  });
});
