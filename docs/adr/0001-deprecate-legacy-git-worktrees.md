# ADR 0001: Deprecate Legacy Git Worktrees in Favor of VFS Patching

* **Status:** Accepted
* **Date:** 2026-06-14

## Context
Sequential rebasing of Git worktrees stalls parallel execution and leads to merge chaos in agent swarms.

## Decision
Remove `bin/worktree.js` and `tests/bin/worktree.test.js`, transitioning fully to the line and AST-based VFS patch engine (`patch.js`).

## Consequences
Faster operations, no Git locks, and isolated in-memory updates.
