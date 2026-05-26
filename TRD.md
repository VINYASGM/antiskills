# Technical Requirements Document — Veyra

**Version:** 2.1
**Author:** VINYASGM / ANTIGRAVITY
**Date:** 2026-05-26
**Status:** Active

---

## 1. Technical Stack

Veyra uses plain-text Markdown, JSON, and JavaScript schemas, making the core operating layer compatible with any language stack.

| Technology | Role |
|---|---|
| **Git** | Standard single-branch atomic commits and version history. |
| **Node.js 20+** | CLI engine runtime (`better-sqlite3` for query caching and concurrent WAL intent registry). |
| **Vitest 4+** | High-speed testing framework with auto-injected global hooks. |
| **Markdown** | Authoritative beads, agent specs, constitutional rules, design checklists. |
| **JSON** | Broadcasted intents and Actor Model asynchronous peer messages. |
| **Go + Playwright** | Headless browser execution and visual viewport layout diffing. |

---

## 2. Core V2 Schemas & Data Formats

### 2.1 Git-Native Markdown Memory Bead (`memory/beads/bd-XXXX.md`)
Each bead is stored as an individual Markdown file containing YAML frontmatter and a plain text description.
```markdown
---
id: bd-0002
type: architectural_decision | bug_discovery | task_state | incident | consensus | requirement
status: open | in_progress | resolved | blocked | archived
title: "Adopt Decentralized Beads"
author: human-orchestrator
timestamp: 2026-05-26T14:00:00.000Z
tags: [beads, architecture]
dependencies: [bd-0001]
evidence: "Visual captures logged"
superseded_by: null
---

Adopted decentralized beads in memory/beads/*.md files to eliminate git merge conflicts. Now upgraded to Markdown beads JIT cached by SQLite with dirty-flag timestamp checking.
```

### 2.2 Broadcasted Intent Schema (SQLite `intents` table)
Active intents broadcasted to prevent semantic conflict collisions. Stored in SQLite WAL mode for high concurrency.
```json
{
  "agentId": "frontend-engineer",
  "taskId": "bd-0003",
  "timestamp": "2026-05-26T15:00:00Z",
  "files": ["src/components/UserProfile.tsx"],
  "databaseColumns": ["users.profile_picture"],
  "routes": ["/api/v1/users"],
  "styles": ["profile-card"]
}
```

### 2.3 Virtual Filesystem Patch Schema (`bin/patch.js` output)
Line-based unified diff format used to check for workspace collisions before physical file writes.
```
--- a/bin/db.js
+++ b/bin/db.js
@@ -10,3 +10,3 @@
-function syncBeads() {
+function syncBeadsWithDirtyFlags() {
```

---

## 3. Directory Structure

```
veyra/
├── bin/                     # Veyra Core Engine CLI
│   ├── veyra.js             # CLI Entrypoint (JIT database sync)
│   ├── db.js                # JIT Markdown bead synchronization with dirty-flags
│   ├── context.js           # Hybrid Relevance-Scored Token context assembler
│   ├── intent.js            # Ephemeral intent publisher & semantic checker
│   ├── patch.js             # Line-based unified patch VFS applier & conflict checker
│   ├── router.js            # Keyword-based requirements task router
│   ├── visual-review.js     # Responsive mock capture runner
│   └── worktree.js          # Deprecated Git worktree broker (kept for legacy support)
├── agents/                  # Agent-as-Code definitions
│   ├── orchestrator.md      # Registry broker
│   ├── frontend-engineer.md # Direct peer actor
│   ├── testing-engineer.md  # Continuous TDD actor
│   └── ...
├── memory/                  # Ephemeral state & Git-tracked memory
│   ├── beads/               # Git-tracked Markdown memory files (*.md)
│   ├── inbox/               # Actor Model direct asynchronous mailboxes
│   └── beads.db             # LOCAL CACHE (Strictly .gitignored, powers intent registry & JIT queries)
├── tests/                   # Extensive Vitest suite
│   ├── bin/                 # Component-level tests
│   └── ...
├── context.md               # Central developer cheat sheet
├── PRD.md                   # Product Requirements Document
├── TRD.md                   # Technical Requirements Document (this file)
├── Architecture.md          # System Architecture Topology
├── State.md                 # Active Project State
└── ToDo.md                  # System Roadmap
```

---

## 4. V2 Integration & Algorithms

### 4.1 Relevance-Scored Context Assembly
Deterministic context parsing uses:
1. **AST Crawling**: Traverses explicit imports to map a dependency tree.
2. **Semantic Proximity**: Scores files based on shared REST routes, database column strings, and styling tokens.
3. **Relevance Ranking**: Ranks target files in descending order of relevance. Discards lower-ranked entries gracefully when the context budget (~8000 tokens) is exceeded to prevent OOM errors.

### 4.2 Virtual Filesystem (VFS) Dry-Runs
Instead of generating costly physical Git branches and worktrees:
- Code edits are buffered into unified line diffs.
- `patch.js` scans the target workspace files for line-matching, ensuring no adjacent edits clash with other active agent operations.
- The patch is atomically applied or rejected, emitting detailed conflict logs when failures occur.
