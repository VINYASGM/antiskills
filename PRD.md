# Product Requirements Document — Veyra

**Version:** 3.1
**Author:** VEYRA-OS / ANTIGRAVITY
**Date:** 2026-06-07
**Status:** Active

---

## 1. Overview

Veyra is a **reusable AI-native engineering operating system repository framework**. It provides the directory structure, agent definitions, memory systems, workflows, and engineering constitutions required to run multi-agent software development swarms at production quality.

Veyra V3 transitions from the rigid waterfall-like coordination of V2 to an **AI-Native Flow State & Contract-Proven OS**. It addresses deep scalability and orchestration bottlenecks by introducing contract-proven verification, decoupled MCP graph memory, hybrid AST/semantic search, recursive explorer-architect prototyping loops, and state-machine bounded retry circuit breakers.

---

## 2. Target Audience

| Audience | How They Use Veyra |
|---|---|
| **Software engineers using AI coding agents** | Clone Veyra as their project's AI operating layer. Configure agents, rules, and workflows for their specific stack. |
| **Teams using Antigravity, Claude Code, Cursor, Copilot Workspace** | Use Veyra's agent definitions and coordination protocols to orchestrate multiple AI agents without conflicts. |
| **Engineering leads** | Define engineering standards, review checklists, and governance policies that agents enforce automatically. |

---

## 3. Problem Statement & V3 Solutions

AI coding agents suffer from six systemic architectural failures at scale, which Veyra OS V3 completely resolves:

1. **The Worktree Rebase & Semantic Conflict Bottleneck:** Sequential rebasing of multiple agent worktrees stalls parallel execution and leads to logical/semantic integration failures.
   - *V3 Solution:* **Contract-Proven Verification Check.** Instead of sequential rebase lockups, agents merge atomically into an integration branch only after satisfying automated, formal verification checks and proof-carrying tests (e.g. Vitest semantic compliance).
2. **Memory Graph Scalability Collapse (beads.json / beads.db limits):** Single-file JSON or local filesystem SQLite cache limits lock concurrency and blow out context windows on large codebases.
   - *V3 Solution:* **Decoupled MCP Graph Memory.** Offload persistent memory to an external Model Context Protocol (MCP) server backed by an embeddable graph database (DuckDB + NetworkX) with recursive episodic compression to distill history.
3. **AST-Only Context Fragmentation:** Deterministic AST analysis fails to capture implicit relationships, side-effects, and non-imported business/styling dependencies.
   - *V3 Solution:* **Hybrid Context Control Plane.** Integrate deterministic import-graph parsing for local dependency blast radius with highly constrained semantic vector embedding RAG search for global codebase intelligence.
4. **Waterfall Phase-Gate Friction:** Rigid "Spec -> Plan -> Implement" workflow causes agents to design highly complex, un-implementable plans due to lack of environment loop feedback.
   - *V3 Solution:* **Recursive Prototyping Loops.** Establish a dual-agent loop: a fast "Explorer" agent rapidly prototypes in an isolated REPL to validate assumptions, and then an "Architect" agent formalizes the spec for the "Implementer" team.
5. **Infinite Ping-Pong Token Drain:** Lack of limits between Testing, Review, and Implementation agents leads to infinite loop refactoring cycles.
   - *V3 Solution:* **Bounded State-Machine Circuit Breaker.** Enforce strict transaction and retry bounds (e.g., 3-strikes limit) in the Universal Agent Control Plane, auto-escalating to the human operator with a clean failure diff when exceeded.
6. **Concurrent Task Processing & Dual-Agent Conflicts:** Lack of concurrency locking leads to multiple agents claiming, running, and writing overlapping files for the same task simultaneously.
   - *V3 Solution:* **Task Queue & Claim Discipline.** SQLite-based atomic row-level locks tracking task ownership via `claimed_by` and `claimed_at` fields, coupled with automatic stale-claim releases and synchronized Markdown status updates, ensuring absolute task exclusive-processing guarantees.
7. **Swarm Telemetry & System Observability Gaps:** Multi-agent swarms operate concurrently in the background, making it extremely difficult for developers or human operators to monitor database locks, retry strikes, patch channels, and overall progress in real-time.
   - *V3 Solution:* **Terminal Swarm Dashboard.** A unified, high-performance terminal UI dashboard displaying JIT database locks, active governance transaction attempts, tripped circuit breaker escalations, and active patch channels, providing total swarm telemetry and execution transparency.
8. **Static Code Indexing & Graph Intelligence Gaps:** Single-language AST parsing, lack of non-code knowledge capture (PDFs, docs), absence of graph topology metrics (God Nodes, Surprising Connections), lack of security filters (secrets leaking, zip-bombs), and raw text outputs restrict context richness and swarm safety.
   - *V4 Solution:* **Graphify Enrichment Core.** Porting Graphify-style capabilities including secrets/zip-bomb screening, multi-language parser fallbacks, NetworkX graph metrics, and interactive browser HTML trees/flowcharts to optimize swarm context and safety.

---

## 4. Key V3/V4 Features

### 4.1 Contract-Proven Integration Engine (`bin/patch.js` & `bin/verify.js`)
Validates that proposed VFS patches satisfy programmatic and mathematical contract proofs before merge. Runs atomic integration validations inside isolated memory spaces.

### 4.2 Decoupled MCP Memory Graph (`memory-mcp-server/`)
An isolated memory broker using DuckDB and NetworkX to represent memory beads as nodes and dependencies as edges. Provides automatic episodic clustering and recursive summaries to conserve token window budgets.

### 4.3 Hybrid Context Control Plane (`bin/context.js`)
Merges syntax-tree (AST) dependencies with a fast semantic vector RAG search backend, maintaining code spatial mapping alongside semantic meaning.

### 4.4 Dual Explorer-Architect Orchestrator (`bin/router.js`)
Coordinates recursive loops. Spawns ephemeral sandboxed explorers to test hypotheses before formalizing architectural constraints.

### 4.5 Bounded Universal Control Plane (`bin/governance.js`)
State-machine based circuit breaker tracking multi-agent interactions. Halts execution loops, generates failure diagnostics, and alerts human operators after 3 failed verification passes.

### 4.6 Task Queue & Concurrency Locking (`bin/db.js` & `bin/veyra.js`)
An atomic state machine and locking framework (`claim`, `release`, `start`, `complete`, `fail`, `reopen`) built inside SQLite WAL cache, synchronized JIT with physical Markdown bead documents to prevent dual-agent task assignment conflicts.

### 4.7 Terminal Swarm Dashboard (`bin/dashboard.js`)
A gorgeous terminal-based telemetry interface extracting SQLite concurrency locks, active governance transactions, circuit-breaker metrics, and patch directories to render real-time swarm operational states using double-bordered boxes, tables, and progress indicators.

### 4.8 Graphify Enrichment Core (`bin/context.js`, `memory-mcp-server/graph.py`)
Enhances Veyra's static code indexing and context assembly with secrets/sensitive path skipping, zip-bomb checks for documents, topological metrics (centrality and cross-community edges), extensionless shebang interpretation, and collapsible HTML visualizations (D3 hierarchy tree and Mermaid callflow report).

