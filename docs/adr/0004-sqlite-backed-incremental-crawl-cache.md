# ADR 0004: SQLite-Backed Incremental Crawl Cache

* **Status:** Accepted
* **Date:** 2026-06-14

## Context
Re-scanning and parsing the entire codebase on every run slows down context assembly.

## Decision
Store file imports and semantic keys in a `crawl_cache` table in `beads.db` and skip parsing if file modification time (`mtime`) is unchanged.

## Consequences
Massive speedup (up to 10x), reduced file I/O.
