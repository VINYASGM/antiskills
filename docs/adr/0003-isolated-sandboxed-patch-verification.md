# ADR 0003: Isolated Sandboxed Patch Verification

* **Status:** Accepted
* **Date:** 2026-06-14

## Context
In-place verification checks pollute the active repository and cause conflicts for concurrent test sweeps.

## Decision
Copy workspace to system temp directories, linking `node_modules` via Windows directory junctions, and run verification proofs in isolation.

## Consequences
Clean workspaces, concurrent agent test sweeps, safe rollback prevention.
