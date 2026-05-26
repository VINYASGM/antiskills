# Product Requirements Document — Veyra

**Version:** 3.0
**Author:** VINYASGM / ANTIGRAVITY
**Date:** 2026-05-26
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

AI coding agents suffer from five systemic architectural failures at scale, which Veyra OS V3 completely resolves:

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

---

## 4. Key V3 Features

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
