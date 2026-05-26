# Product Requirements Document — Veyra

**Version:** 2.1
**Author:** VINYASGM / ANTIGRAVITY
**Date:** 2026-05-26
**Status:** Active

---

## 1. Overview

Veyra is a **reusable AI-native engineering operating system repository framework**. It provides the directory structure, agent definitions, memory systems, workflows, and engineering constitutions required to run multi-agent software development swarms at production quality.

Veyra V2 overhauls the core coordination layer, switching from high-overhead Git worktrees to a highly concurrent **Virtual Filesystem (VFS) Patch Workspace** with dynamic routing and relevance-ranked token context injection, enabling massive speed and scaling improvements.

---

## 2. Target Audience

| Audience | How They Use Veyra |
|---|---|
| **Software engineers using AI coding agents** | Clone Veyra as their project's AI operating layer. Configure agents, rules, and workflows for their specific stack. |
| **Teams using Antigravity, Claude Code, Cursor, Copilot Workspace** | Use Veyra's agent definitions and coordination protocols to orchestrate multiple AI agents without conflicts. |
| **Engineering leads** | Define engineering standards, review checklists, and governance policies that agents enforce automatically. |

---

## 3. Problem Statement & V2 Solutions

AI coding agents suffer from six systemic failures, which Veyra OS V2 completely resolves:

1. **Multi-Agent Git Bottleneck:** isolated Git worktrees and strict sequential rebase strategies stall parallel agent execution.
   - *V2 Solution:* **Virtual Filesystem (VFS) Patch Workspace** (`patch.js`) allows parallel dry-runs and conflict checks on a unified single branch.
2. **Database & Memory Lock Contention:** Storing graph state in single large files or binary databases causes locking and merge nightmares in Git.
   - *V2 Solution:* Plain-text Markdown beads are synchronised JIT into a local `.gitignored` SQLite WAL cache with lazy sync and file `mtime` modification checks.
3. **Context Rot & OOMs:** FIFO token insertion overflows compiler limits and causes hallucinations.
   - *V2 Solution:* **Relevance-Scored Context Assembly** (`context.js`) ranks files based on imports, keyword proximity, and semantic keys, gracefully pruning below token caps.
4. **Rigid waterfall execution:** locking agents into static phase-gated steps stalls development.
   - *V2 Solution:* A **Dynamic task router** (`router.js`) automatically assigns tasks to a group of 1-3 agents based on semantic keywords.
5. **Decoupled Architecture Blindness:** Compiler-based AST trees fail to capture relationships between REST APIs, ORMs, and frontend styles.
   - *V2 Solution:* Ephemeral intent broadcasting maps files, REST routes, SQL columns, and CSS styles.
6. **Visual Frontend Blindspots:** Text-based agents cannot verify layout rendering.
   - *V2 Solution:* Go-based Playwright visual screenshot capturing.

---

## 4. Key V2 Features

### 4.1 VFS Patch Workspace (`bin/patch.js`)
Line-based unified patch generator and dry-run collision scanner. Enables multiple agents to propose changes to the shared workspace without Git locks or worktree creations.

### 4.2 SQLite Memory Caching JIT (`bin/db.js`)
A highly concurrent cache. Evaluates filesystem file modification times to JIT compile Markdown memory beads (`memory/beads/`) instantly.

### 4.3 Relevance Rank Context Assembly (`bin/context.js`)
Ranks context files based on AST crawling, keyword overlap, and styling/DB tags, capping budgets smoothly.

### 4.4 Dynamic Router (`bin/router.js`)
Keyword requirements router mapping tasks dynamically to optimal 1-3 agent pools.

### 4.5 Responsive Visual Auditing (`bin/visual-review.js`)
Generates headless viewport mock screenshot captures across Mobile, Tablet, and Desktop break-points.
