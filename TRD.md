# Technical Requirements Document — Veyra

**Version:** 2.0
**Author:** VINYASGM / ANTIGRAVITY
**Date:** 2026-05-25
**Status:** Active

---

## 1. Technical Stack

Veyra uses plain-text Markdown, JSON, and JavaScript schemas, making the core operating layer compatible with any language stack.

| Technology | Role |
|---|---|
| **Git** | Isolated branch environments (worktrees) and concurrent merge queues. |
| **Node.js 20+** | CLI engine runtime (`better-sqlite3` for query caching). |
| **TypeScript 5+** | AST parsing and code analysis. |
| **Markdown** | Authoritative beads, agent specs, constitutional rules, design checklists. |
| **JSON** | Broadcasted intents and Actor Model asynchronous peer messages. |
| **Playwright/Puppeteer** | Headless browser execution for visual responsive viewport reviews. |

---

## 2. Core Schemas

### 2.1 Git-Native Markdown Memory Bead (`memory/beads/bd-XXXX.md`)
Each bead is stored as an individual Markdown file containing YAML frontmatter and a plain text description.

```markdown
---
id: bd-0002
type: architectural_decision | bug_discovery | task_state | incident | consensus | requirement
status: open | in_progress | resolved | blocked | archived
title: "Adopt Decentralized Beads"
author: human-orchestrator
timestamp: 2026-05-25T14:04:28.175Z
tags: [beads, architecture]
dependencies: [bd-0001]
evidence: "Visual captures logged"
superseded_by: null
---

Adopted decentralized beads in memory/beads/*.json files to eliminate git merge conflicts. Now upgraded to Markdown beads JIT cached by SQLite.
```

### 2.2 Broadcasted Intent Schema (SQLite `intents` table)
Active intents broadcasted to prevent semantic conflict collisions. Stored in SQLite WAL mode for high concurrency.
```json
{
  "agentId": "frontend-engineer",
  "taskId": "bd-0003",
  "timestamp": "2026-05-25T20:10:00Z",
  "files": ["src/components/UserProfile.tsx"],
  "databaseColumns": ["users.profile_picture"],
  "routes": ["/api/v1/users"],
  "styles": ["profile-card"]
}
```

### 2.3 Peer-to-Peer Actor Message Schema (`memory/inbox/*.json`)
```json
{
  "type": "api_contract_request | api_contract_response | test_execution_request | visual_audit_request | review_feedback",
  "sender": "sender-agent-id",
  "recipient": "recipient-agent-id",
  "timestamp": "2026-05-25T20:12:00Z",
  "payload": {}
}
```

---

## 3. Directory Structure

```
veyra/
├── bin/                     # Veyra Core Engine CLI
│   ├── veyra.js             # CLI Entrypoint (JIT database sync)
│   ├── db.js                # JIT Markdown bead synchronization and caching
│   ├── context.js           # Hybrid AST + Semantic code intelligence
│   ├── intent.js            # Ephemeral intent publisher & semantic checker
│   ├── visual-review.js     # Responsive Puppeteer/Playwright capture harness
│   └── worktree.js          # Git worktree broker
├── agents/                  # Agent-as-Code definitions
│   ├── orchestrator.md      # Registry broker
│   ├── frontend-engineer.md # Direct peer actor
│   ├── testing-engineer.md  # Continuous TDD actor
│   ├── vlm-ui-reviewer.md   # Visual reviewer (VLM)
│   └── ...
├── memory/                  # Ephemeral state & Git-tracked memory
│   ├── beads/               # Git-tracked Markdown memory files (*.md)
│   ├── inbox/               # Actor Model direct asynchronous mailboxes
│   └── beads.db             # LOCAL CACHE (Strictly .gitignored, powers intent registry & JIT queries)
├── checklists/              # Review & layout checklists
│   ├── visual-audit.md      # Grid, responsive, z-index, typography checklist
│   └── ...
├── orchestration/           # Coordination protocols
│   ├── choreography-protocol.md # Actor Model direct exchange guidelines
│   └── ...
├── CLAUDE.md                # OS Constitution
├── PRD.md                   # Product Requirements Document
├── TRD.md                   # Technical Requirements Document (this file)
├── Architecture.md          # System Architecture Topology
├── State.md                 # Active Project State
└── ToDo.md                  # System Roadmap
```

---

## 4. Integration Points

### 4.1 Hybrid Context Assembly
Deterministic context parsing uses:
1. **TypeScript AST Traversal**: Maps compiler imports and exports with strict depth limit (`depth > 5`) to prevent OOM.
2. **Semantic Regex Scanning**: Maps matching string keys across JS/TS/CSS/HTML (REST endpoints, styled classNames, SQL tables).
3. **Decoupled Link Extraction**: Pulls matching semantic dependencies directly into the agent's token budget (capped at 500-1000 files).

```
[Target Task]
      │
      ├─► AST Traversal ──► Strict Import Graph
      │                                       │
      └─► Regex Scanning ─► Semantic Keys ────┼─► Combined Context
                                              │
      ┌─► Global Scan ────► Decoupled Files ──┘
```

### 4.2 Playwright Responsive CI Loop
Running `veyra visual-review` compiles the app and captures viewport layouts.
- **Mobile Viewport**: `375px` width. Checks vertical stacking, tappable targets, no horizontal overflows.
- **Tablet Viewport**: `768px` width. Audits grid collapse, navigation menu compressions.
- **Desktop Viewport**: `1440px` width. Validates 12-column baseline alignment.
Screenshots are committed to `memory/evidence/visual/` and audited JIT by `vlm-ui-reviewer`.
