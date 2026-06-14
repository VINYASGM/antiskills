# ADR 0002: Prevent JSON Database Concurrency Collisions Using proper-lockfile

* **Status:** Accepted
* **Date:** 2026-06-14

## Context
Concurrent agents writing to JSON beads (e.g. `_writeToJSON()` in `bin/db.js`) can cause racy writes and data loss.

## Decision
Implement file locking using `proper-lockfile` with a retry spin-lock mechanism to synchronize json writes.

## Consequences
High transactional integrity, safe parallel agent writes, small spin delay.
