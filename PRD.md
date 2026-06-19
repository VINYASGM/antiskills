# Product Requirements Document — Veyra

**Version:** 4.0
**Author:** VEYRA-OS / ANTIGRAVITY
**Date:** 2026-06-16
**Status:** Active

---

## 1. Overview

Veyra is a **reusable AI-native engineering operating system repository framework**. It provides the directory structure, agent definitions, memory systems, workflows, and engineering constitutions required to run multi-agent software development swarms at production quality.

Veyra V4 transitions from the rigid waterfall-like coordination of V3 to an **AI-Native Flow State & Contract-Proven OS**. It addresses deep scalability and orchestration bottlenecks by introducing contract-proven verification, decoupled MCP graph memory, hybrid AST/semantic search, recursive explorer-architect prototyping loops, and state-machine bounded retry circuit breakers.

---

## 2. Target Audience

| Audience | How They Use Veyra |
|---|---|
| **Software engineers using AI coding agents** | Clone Veyra as their project's AI operating layer. Configure agents, rules, and workflows for their specific stack. |
| **Teams using Antigravity, Claude Code, Cursor, Copilot Workspace** | Use Veyra's agent definitions and coordination protocols to orchestrate multiple AI agents without conflicts. |
| **Engineering leads** | Define engineering standards, review checklists, and governance policies that agents enforce automatically. |

---

## 3. Problem Statement & V4 Solutions

AI coding agents suffer from nine systemic architectural failures at scale, which Veyra OS V4 completely resolves:

1. **The Worktree Rebase & Semantic Conflict Bottleneck:** Sequential rebasing of multiple agent worktrees stalls parallel execution and leads to logical/semantic integration failures.
   - *V4 Solution:* **Contract-Proven Verification Check.** Instead of sequential rebase lockups, agents merge atomically into an integration branch only after satisfying automated, formal verification checks and proof-carrying tests (e.g. Vitest semantic compliance).
2. **Memory Graph Scalability Collapse (beads.json / beads.db limits):** Single-file JSON or local filesystem SQLite cache limits lock concurrency and blow out context windows on large codebases.
   - *V4 Solution:* **Decoupled MCP Graph Memory.** Offload persistent memory to an external Model Context Protocol (MCP) server backed by an embeddable graph database (DuckDB + NetworkX) with recursive episodic compression to distill history.
3. **Dependency Weight & Binary Bloat (SQLite/better-sqlite3 Runtime Overhead):** Relying on heavy, platform-specific binaries like `better-sqlite3` causes compilation failures, node-gyp build issues, and hinders zero-dependency execution across varied developer environments.
   - *V4 Solution:* **Zero-Dependency Map Cache & Lockfile JSON Storage.** Replace SQLite database backends with standard JavaScript `Map` memory cache and file-backed JSON storage, protected by `proper-lockfile` to achieve clean, native node executions without C++ binary compilation.
4. **Bead Identity Collisions in Distributed Swarms:** Incremental integer bead IDs (`bd-0001`) create collision risks when multiple distributed subagents spawn beads concurrently in local worktrees.
   - *V4 Solution:* **UUIDv4 Bead ID Migration.** Transition all bead identifiers to globally unique UUIDv4 strings prefixed by `bd-`, preventing namespace conflicts during asynchronous agent operations.
5. **AST-Only Context Fragmentation:** Deterministic AST analysis fails to capture implicit relationships, side-effects, and non-imported business/styling dependencies.
   - *V4 Solution:* **Hybrid Context Control Plane.** Integrate deterministic import-graph parsing for local dependency blast radius with highly constrained semantic vector embedding RAG search for global codebase intelligence.
6. **Waterfall Phase-Gate Friction:** Rigid "Spec -> Plan -> Implement" workflow causes agents to design highly complex, un-implementable plans due to lack of environment loop feedback.
   - *V4 Solution:* **Recursive Prototyping Loops.** Establish a dual-agent loop: a fast "Explorer" agent rapidly prototypes in an isolated REPL to validate assumptions, and then an "Architect" agent formalizes the spec for the "Implementer" team.
7. **Infinite Ping-Pong Token Drain:** Lack of limits between Testing, Review, and Implementation agents leads to infinite loop refactoring cycles.
   - *V4 Solution:* **Bounded State-Machine Circuit Breaker.** Enforce strict transaction and retry bounds (e.g., 3-strikes limit) in the Universal Agent Control Plane, auto-escalating to the human operator with a clean failure diff when exceeded.
8. **Concurrent Task Processing & Dual-Agent Conflicts:** Lack of concurrency locking leads to multiple agents claiming, running, and writing overlapping files for the same task simultaneously.
   - *V4 Solution:* **Task Queue & Claim Discipline.** Lockfile-protected pure JSON storage and memory Map cache tracking task ownership via `claimed_by` and `claimed_at` fields, coupled with automatic stale-claim releases and synchronized Markdown status updates, ensuring absolute task exclusive-processing guarantees.
9. **Swarm Telemetry & System Observability Gaps:** Multi-agent swarms operate concurrently in the background, making it extremely difficult for developers or human operators to monitor database locks, retry strikes, patch channels, and overall progress in real-time.
   - *V4 Solution:* **Dynamic OS status & Terminal Swarm Dashboard.** A unified, high-performance terminal UI dashboard and a dynamic CLI command (`veyra status`), displaying active JSON file locks, active governance transaction attempts, tripped circuit breaker escalations, and active patch channels, providing total swarm telemetry and execution transparency.
10. **Static Code Indexing & Graph Intelligence Gaps:** Single-language AST parsing, lack of non-code knowledge capture (PDFs, docs), absence of graph topology metrics (God Nodes, Surprising Connections), lack of security filters (secrets leaking, zip-bombs), and raw text outputs restrict context richness and swarm safety.
    - *V4 Solution:* **Graphify Enrichment Core.** Porting Graphify-style capabilities including secrets/zip-bomb screening, multi-language parser fallbacks, NetworkX graph metrics, and interactive browser HTML trees/flowcharts to optimize swarm context and safety.
11. **Supply Chain Vulnerabilities:** Integration of unvetted third-party npm packages can introduce critical security risks to the runtime environment.
    - *V4 Solution:* **OSV.dev Supply Chain Security Checks.** Integrates automatic queries to the OSV.dev vulnerability database via HTTPS to scan runtime dependencies and lockfiles, halting execution on detected threats with offline mock fallbacks.

---

## 4. Key V4 Features

### 4.1 Contract-Proven Integration Engine (`bin/patch.js` & `bin/verify.js`)
Validates that proposed VFS patches satisfy programmatic and mathematical contract proofs before merge. Runs atomic integration validations inside isolated temporary sandbox environments (via system temp directory and directory junctions for `node_modules`) to prevent dirtying workspace files and ensure concurrency isolation.

### 4.2 Decoupled MCP Memory Graph (`memory-mcp-server/`)
An isolated memory broker using DuckDB and NetworkX to represent memory beads as nodes and dependencies as edges. Provides automatic episodic clustering and recursive summaries to conserve token window budgets.

### 4.3 Hybrid Context Control Plane (`bin/context.js`)
Merges syntax-tree (AST) dependencies with a fast semantic vector RAG search backend, maintaining code spatial mapping alongside semantic meaning.

### 4.4 Dual Explorer-Architect Orchestrator (`bin/router.js`)
Coordinates recursive loops. Spawns ephemeral sandboxed explorers to test hypotheses before formalizing architectural constraints.

### 4.5 Bounded Universal Control Plane (`bin/governance.js`)
State-machine based circuit breaker tracking multi-agent interactions. Halts execution loops, generates failure diagnostics, and alerts human operators after 3 failed verification passes.

### 4.6 Task Queue & Concurrency Locking (`bin/db.js` & `bin/veyra.js`)
An atomic state machine and locking framework (`claim`, `release`, `start`, `complete`, `fail`, `reopen`) built using a `Map` memory cache and lockfile-backed JSON storage, synchronized JIT with physical Markdown bead documents to prevent dual-agent task assignment conflicts.

### 4.7 Terminal Swarm Dashboard (`bin/dashboard.js`)
A gorgeous terminal-based telemetry interface extracting JSON lockfile states, active governance transactions, circuit-breaker metrics, and patch directories to render real-time swarm operational states using double-bordered boxes, tables, and progress indicators.

### 4.8 Graphify Enrichment Core (`bin/context.js`, `memory-mcp-server/graph.py`)
Enhances Veyra's static code indexing and context assembly with secrets/sensitive path skipping, zip-bomb checks for documents, topological metrics, extensionless shebang interpretation, and collapsible HTML visualizations.

#### 4.8.1 JIT Security & Sensitive Path Screening
- **Exclusion Lists:** The crawler must automatically skip sensitive paths and files during JIT indexing, including `.git`, `.ssh`, `credentials`, `secrets`, `.env`, netrc, and private/public key files (`*.pem`, `id_rsa`, etc.) to prevent secret leaks to agent context.
- **Sensitive Key/Pattern Masking:** Scan and redact potential API keys or token strings found within indexed files matching high-entropy formats.

#### 4.8.2 Zip-Bomb and Resource Exhaustion Defense
- **Size and Decompression Limits:** Ensure that prior to reading or parsing any zip-based or XML-based Office documents (like `.xlsx`, `.docx`), a pre-flight decompression ratio check is run.
- **Trigger threshold:** Cap the maximum decompression ratio at 200:1. If any archive exceeds this ratio or expands beyond a configured absolute limit (e.g., 50MB), the crawler must immediately skip it and log a security warning, shielding the swarm from resource exhaustion.

#### 4.8.3 Extensionless Script Shebang Parsing
- **Shebang Detection:** Interprets the correct language and syntax parser for files lacking standard extensions (e.g., `bin/run`) by reading their first line.
- **Parser Mapping:** Match shebang lines like `#!/usr/bin/env python3` to Python, `#!/bin/bash` or `#!/bin/sh` to Shell/Bash, and `#!/usr/bin/env node` to JavaScript.

#### 4.8.4 Multi-Language Crawler & Regex Parsers
- **Language Coverage:** Extend symbol crawling beyond JS/TS to Apex (`.cls`, `.trigger`), Python (`.py`), Go (`.go`), Rust (`.rs`), and SQL (`.sql`).
- **Regex Extraction:** Use optimized regex-based parsers to resolve dependencies, imports, and calls for non-JS/TS codebases (e.g., mapping `import x`, `from y import z` in Python; `import (...)` in Go; and `use x::y` in Rust).

#### 4.8.5 Topological Graph Metrics & NetworkX Analytics
- **Centrality Mapping ("God Nodes"):** Compute degree centrality and PageRank values for all nodes in the codebase dependency graph. Rank and identify highly coupled modules ("God Nodes") that represent structural risk.
- **Cross-Community Analysis ("Surprising Connections"):** Group modules into communities using Louvain/Leiden clustering. Highlight dependencies that bridge distinct communities or language boundaries (e.g., a Rust binding invoked directly by Python logic) to identify critical inter-module couplings.

#### 4.8.6 Collapsible HTML Visualizations
- **Interactive File-to-Symbol Tree (`context/tree.html`):** Generate a browser-viewable, collapsible hierarchical filesystem tree using D3.js. Clicking nodes expands/collapses directories and shows local symbols.
- **Architecture Callflow Map (`context/graph.html`):** Generate a self-contained visual flowchart using Mermaid or D3.js showing module relationships, grouped visually by their Louvain-detected communities, allowing developers and agents to trace dependency flows interactively.


### 4.9 AST Expansion & Agent Integration (Milestone 21)
Extends the AST transformation engine (`bin/ast_transform.js`) to support programmatic operations for classes, decorators, JSX/TSX elements, and interface/type declarations. Wires AST manipulations into CLI commands, semantic conflict detectors, and agent swarm prompt instructions.

### 4.10 Multimodal VLM Layout Auditing (Milestone 22)
Provides automated visual regression and responsive layout verification using vision-language models (VLMs) and headless browsers. Key aspects:
- **Placeholder PNG Mockups Auto-Generation:** Automatically generates default design mockup images under `memory/design/figma_desktop.png`, `memory/design/figma_tablet.png`, and `memory/design/figma_mobile.png` if they are missing, ensuring stable comparison baselines.
- **Base64 Responsive Payload Encoding:** Loads current runtime screenshots (`viewport_desktop.png`, `viewport_tablet.png`, `viewport_mobile.png`) alongside their corresponding Figma design mockups, converting both sets into base64 data URIs for vision model ingestion.
- **Gemini VLM Layout Auditing:** Submits responsive screenshots and Figma mockups side-by-side to the Gemini API (`gemini-1.5-flash`) for comprehensive structural, alignment, typographic, and contrast audits, provided `GEMINI_API_KEY` is configured in the environment.
- **Deterministic Coordinate and Failover Audits:** Executes a fallback local check against `dom_structure.json` if the VLM is unreachable or disabled, checking coordinates, inspecting elements for forbidden IDs (such as `'low-contrast-text'`), and checking the `MOCK_VLM_FAIL=true` override flag.
- **Comprehensive Visual Report Output:** Generates structured execution reports inside `memory/evidence/visual/vlm_audit_report.json`, along with separate viewport-specific breakdown report files.
- **Automated CI Assertions:** Implements strict automated verification; returns exit code 1 if layout violations or contrast issues are detected, and logs success details and returns exit code 0 if the visual audit passes.

### 4.11 Concurrency & File Locking (Milestone 23)
Integrates file-level locking (`proper-lockfile`) in the memory database module (`bin/db.js`) to secure JSON file-per-bead write transactions against concurrent agent write race conditions, using synchronous retry loops and robust try/finally cleanup semantics.

### 4.12 Pub/Sub Swarm Worker Loop (Milestone 18)
Coordinates multi-agent task allocations asynchronously. A background daemon service (`bin/daemon.js`) polls every 500ms, subscribing to events in the lockfile-backed JSON event bus to process tasks. It manages:
- **Dependency resolution**: routes tasks only when parent dependencies are resolved.
- **Cascading failures**: automatically propagates failures down to downstream dependent tasks.
- **Asynchronous allocation**: claims and routes tasks to primary agent roles using `bin/router.js` and publishes `task_allocated` events.
- **Startup recovery**: force-releases stale tasks and does a startup recovery sweep.
Provides CLI daemon commands (`start`, `stop`, `status`, `run`) to manage background execution.

### 4.13 Dynamic OS CLI Status (`veyra status`)
A command-line status utility (`node bin/veyra.js status [--json]`) that queries the live system state from the memory cache and JSON files, outputting a dynamic status breakdown of beads, active events, task queues, and system health in plain text or structured JSON.

### 4.14 OSV.dev Supply Chain Security Checks
Automated supply chain security queries targeting the OSV.dev API. Scans project npm runtime packages and lockfiles for known security vulnerabilities via HTTPS, with a resilient offline mock fallback if the remote service is unavailable.

### 4.15 Agent Audit Observability Logging
A structured, append-only JSON Lines logging system (`agent-audit.jsonl`) that records fine-grained agent action details, including timestamps, agent IDs, tool calls, status codes, and execution duration.

---

## 5. Architectural Decision Records (ADRs)

To ensure the integrity, scalability, and performance of the Veyra OS V4 framework, the following Architectural Decision Records have been accepted and implemented:

- **[ADR 0001: Deprecate Legacy Git Worktrees in Favor of VFS Patching](docs/adr/0001-deprecate-legacy-git-worktrees.md)**: Transitions fully to AST/line-based VFS patch engine (`patch.js`) to avoid sequential rebase locks and merge chaos in agent swarms.
- **[ADR 0002: Prevent JSON Database Concurrency Collisions Using proper-lockfile](docs/adr/0002-prevent-concurrency-collision-via-proper-lockfile.md)**: Implements file locking using `proper-lockfile` and retry spin-locks to synchronize JSON writes and guarantee transactional integrity.
- **[ADR 0003: Isolated Sandboxed Patch Verification](docs/adr/0003-isolated-sandboxed-patch-verification.md)**: Runs contract verification proofs in isolated system temp directories with directory junctions for `node_modules` to prevent workspace pollution.
- **[ADR 0004: SQLite-Backed Incremental Crawl Cache](docs/adr/0004-sqlite-backed-incremental-crawl-cache.md)**: Employs a `crawl_cache` table in `beads.db` to skip parsing files whose modification times (`mtime`) have not changed, yielding up to a 10x speedup.
- **[ADR 0005: Rust File Watcher Events & ONNX Semantic Search Integration](docs/adr/0005-file-watcher-events-and-onnx-semantic-search.md)**: Emits JIT file watcher invalidation events from Rust and integrates Python ONNX-based semantic search to bypass lexical search shortcomings.
- **[ADR 0006: Pub/Sub Swarm Worker Loop](docs/adr/0006-pubsub-swarm-worker.md)**: Implements a background worker daemon polling the WAL event bus, routing/allocating beads, and cascading failures across dependencies.

With these ADRs implemented, all V4 upgrades are fully complete, robust, and verified.


