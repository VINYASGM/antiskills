# Product Requirements Document — Veyra

**Version:** 1.0
**Author:** VINYASGM
**Date:** 2025-05-24
**Status:** Active

---

## 1. Overview

Veyra is a **reusable AI-native engineering operating system repository framework**. It provides the directory structure, agent definitions, memory system, workflow library, and engineering constitution required to run multi-agent software development at production quality.

Veyra is not an application — it is a **template repository** that teams clone, customize for their stack, and use as the operating system for AI-assisted engineering.

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

AI coding agents suffer from five systemic failures:

1. **Context Rot** — Agents lose context mid-task as chat history grows. They forget constraints, repeat mistakes, and drift from specs.
2. **Multi-Agent Chaos** — Parallel agents overwrite each other's files, create merge conflicts, and make contradictory architectural decisions.
3. **Spec-Less Development** — Agents jump straight to code without structured requirements, producing fragile, inconsistent implementations.
4. **Ephemeral Memory** — Decisions made in one session are lost in the next. Agents re-discover the same bugs, re-debate the same tradeoffs.
5. **Probabilistic Context** — RAG-based context retrieval is lossy. Agents get "similar" files instead of the exact files they need.

---

## 4. Goals

| Goal | Description |
|---|---|
| **Eliminate context rot** | Replace chat-history dependence with persistent Beads memory and deterministic context injection |
| **Prevent multi-agent chaos** | Enforce Git worktree isolation — one agent, one branch, sequential merges |
| **Enable spec-driven development** | Require PRD → TRD → Architecture → Plan before any code is written |
| **Maintain architectural consistency** | Define agent-enforced rules scoped by directory, loaded on-demand |
| **Persist decisions across sessions** | Use the Beads memory pattern — append-only JSON graph of decisions, bugs, and task states |

---

## 5. Success Criteria

| Criterion | Measurement |
|---|---|
| Agents operate in parallel without file conflicts | Zero merge conflicts from concurrent agent work |
| Memory persists across sessions | Beads created in session N are queryable in session N+1 |
| All code changes have execution evidence | 100% of PRs include test output logs |
| Context is deterministic, not probabilistic | Agents receive explicit file paths, not RAG search results |
| New projects onboard in <30 minutes | Clone Veyra, customize CLAUDE.md, start first task |
| Agent escalations are structured | All escalations use Consultation Request Pack (CRP) format |

---

## 6. Key Features

### 6.1 Agent-as-Code Definitions (`agents/`)
Each agent is defined in a markdown file specifying: identity, capabilities, tool access, constraints, escalation triggers, and output format. Agents are deterministic — the same definition produces the same behavior.

### 6.2 Decentralized Beads Memory System (`memory/beads/`)
A persistent, append-only JSON graph where each node (bead) is stored in its own separate file (e.g., `memory/beads/bd-XXXX.json`) to completely eliminate Git merge conflicts between parallel agents. The unified graph is dynamically compiled by the Veyra engine.

### 6.3 Veyra CLI Engine (`bin/veyra.js`)
A native, zero-dependency Node.js CLI that serves as the runtime execution layer for the operating system. It provides programmatic APIs and shell shortcuts (`./veyra`) for bead management, git worktree isolation, deterministic context assembly, and automated rule linting.

### 6.4 Workflow Library (`workflows/`)
YAML workflow definitions for common development patterns: feature development, bug fixes, refactors, security patches, dependency updates. Each workflow defines phases, entry/exit criteria, and agent assignments.

### 6.5 Engineering Constitution (`CLAUDE.md`)
A single-file agent operating system that defines: stack, commands, hard rules, code style, context budget, coordination protocols, and escalation triggers. Kept under 120 lines to fit within agent context budgets.

### 6.6 Deterministic Context Injection (`context/`)
AST maps, dependency graphs, and file-path manifests compiled by the Veyra engine to tell agents exactly which files to read. No probabilistic retrieval. No "find similar" — just "read these files."

### 6.7 Directory-Scoped Rules (`rules/`)
Engineering rules loaded on-demand based on the directory an agent is working in. Frontend rules for frontend work, backend rules for backend work. Keeps agent context lean and relevant.

---

## 7. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Stack-agnostic** | Works with any tech stack. The framework is markdown + JSON + YAML + Git. |
| **Git-native** | All coordination uses Git primitives (worktrees, branches, rebases). No external orchestration service. |
| **Zero external dependencies** | Core framework requires only Git and a text editor. No npm install for the framework itself. |
| **Cross-platform** | Windows, macOS, Linux. No OS-specific scripts in the core framework. |
| **Agent-agnostic** | Works with any AI coding agent that reads markdown files (Antigravity, Claude Code, Cursor, Copilot, etc.) |
| **Offline-capable** | The entire framework works offline. No API calls required for framework operation. |

---

## 8. Out of Scope

- Veyra does **not** include application code — it is a framework, not a starter kit
- Veyra does **not** provide an AI agent runtime — it defines how agents should behave
- Veyra does **not** replace Git — it enhances Git workflows with agent-aware protocols
- Veyra does **not** require a specific IDE — it works with any tool that reads files

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Agents ignore CLAUDE.md rules | Hard rules are tested via code review agent before merge |
| Beads memory grows unbounded | Implement bead archival for completed tasks |
| Teams over-customize and break conventions | Provide a validation script that checks framework integrity |
| New agents are poorly defined | Provide agent definition templates with required fields |
