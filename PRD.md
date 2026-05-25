# Product Requirements Document — Veyra

**Version:** 2.0
**Author:** VINYASGM / ANTIGRAVITY
**Date:** 2026-05-25
**Status:** Active

---

## 1. Overview

Veyra is a **reusable AI-native engineering operating system repository framework**. It provides the directory structure, agent definitions, memory systems, workflows, and engineering constitutions required to run multi-agent software development swarms at production quality.

Veyra is a **template repository** that software teams clone, customize for their tech stack, and run as the core operating layer for AI-assisted engineering.

---

## 2. Target Audience

| Audience | How They Use Veyra |
|---|---|
| **Software engineers using AI coding agents** | Clone Veyra as their project's AI operating layer. Configure agents, rules, and workflows for their specific stack. |
| **Teams using Antigravity, Claude Code, Cursor, Copilot Workspace** | Use Veyra's agent definitions and coordination protocols to orchestrate multiple AI agents without conflicts. |
| **Engineering leads** | Define engineering standards, review checklists, and governance policies that agents enforce automatically. |
| **Solo developers** | Use Veyra as a structured scaffold for AI-assisted development with persistent memory across sessions. |

---

## 3. Problem Statement

AI coding agents suffer from six systemic failures:

1. **Context Rot** — Agents lose context mid-task as chat history grows, drifting from specs.
2. **Multi-Agent Chaos** — Parallel agents overwrite each other's files, creating Git and binary merge conflicts.
3. **Waterfall Rigidness** — Locking agents into phase-gated execution limits LLM non-linear self-correction and TDD REPL speed.
4. **Ephemeral Memory & Lock Contention** — Storing graph state in single large files or binary databases causes locking and merge nightmares in Git worktrees.
5. **Decoupled Architecture Blindness** — Compiler-based AST trees fail to capture relationships between REST APIs, ORMs, and frontend styles, causing semantic conflicts.
6. **Visual Frontend Blindspots** — Text-based agents cannot review CSS, z-index overlaps, or responsive scaling, producing ugly layouts.

---

## 4. Goals

| Goal | Description |
|---|---|
| **Eliminate context rot** | Replace chat history dependency with persistent Beads memory and deterministic hybrid context injection. |
| **Prevent multi-agent chaos** | Enforce Git worktree isolation with continuous context broadcasting (intents) to flag semantic overlaps JIT. |
| **Enable REPL-driven development** | Adopt Test-Driven Development (TDD) loops allowing living specs to be amended interactively. |
| **Maintain architectural consistency** | Define directory-scoped rules loaded on-demand to keep prompts lightweight and relevant. |
| **Persist memory natively** | Store authoritative decisions as Git-native Markdown beads, using SQLite as an ephemeral local query cache. |
| **Visual verification CI** | Integrate visual review CI loops compiling screenshots for Vision-Language Model reviews. |
| **Distributed Choreography** | Move to Actor Model peer-to-peer messaging to prevent orchestrator context fragmentation. |

---

## 5. Success Criteria

| Criterion | Measurement |
|---|---|
| Zero Git merge conflicts | Authoritative memory stored in separate Markdown files; `.gitignore` SQLite binaries. |
| Pre-merge semantic safety | 100% of parallel merges run `intent check` to verify zero payload or schema mismatches. |
| Hybrid context accuracy | Context includes both AST imports and semantic REST/CSS/schema strings within token budget. |
| Visual verification | All UI component modifications pass headless screenshot audits across mobile, tablet, desktop viewports. |
| Distributed scalability | Agent swarm scales beyond 3+ concurrent actors without Orchestrator context overflow. |

---

## 6. Key Features

### 6.1 Agent-as-Code Definitions (`agents/`)
Deterministic agent specifications (markdown) detailing authority, tool permissions, specific scoped rules, and peer actor messaging schemas.

### 6.2 Git-Native Memory System (`memory/beads/bd-XXXX.md`)
Persistent, text-based beads written in Markdown with YAML frontmatter. Highly mergeable in Git with zero conflict collisions. Recompiled JIT to local `.gitignored` SQLite `beads.db` cache for lightning-fast queries.

### 6.3 Context Broadcasting (`bin/intent.js`)
An ephemeral intent publisher. Agents broadcast JIT intentions (files to edit, database columns to modify, REST API contracts to change) to a highly-concurrent SQLite WAL intent registry, scanning peer intents to detect conflicts.

### 6.4 Hybrid Code Intelligence Engine (`bin/context.js`)
Blends TypeScript AST module mapping with multi-file semantic regex indexing to link decoupled routes (`/api/`), styles, and schemas.

### 6.5 Actor Model Choreography (`orchestration/choreography-protocol.md`)
Standardized peer messaging loops using JIT local directories (`memory/inbox/`) bypassing Orchestrator bottle-necks.

### 6.6 VLM Responsive Visual CI Loop (`bin/visual-review.js`)
Headless browser harness generating layout captures across Mobile, Tablet, and Desktop breakpoints, consumed by a visual audit VLM reviewer.

---

## 7. Non-Functional Requirements
- **Git-native**: Versioned in plain text. Excludes compiled assets and local database caches.
- **Zero-dependency Core**: Node.js and TypeScript built-ins only.
- **Cross-platform**: Shell execution wrappers compatible with Windows Powershell and Unix Bash.

---

## 8. Out of Scope
- Hosting or providing LLM models or APIs.
- Replacing Git primitives (uses standard worktree features).
