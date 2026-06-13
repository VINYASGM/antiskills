# Roadmap — Veyra

**Last Updated:** 2026-06-07

---

## Completed Milestones (V2 Architecture Core)

### ✅ Milestone 1: Test Infrastructure & Integrity (Phase 1)
- [x] Configure Vitest with auto-injected globals (`vitest.config.js`).
- [x] Create comprehensive test suites under `tests/bin/` checking `db.js`, `context.js`, `intent.js`, `patch.js`, `router.js`, `worktree.js`, and `visual-review.js`.
- [x] Verify all 65/65 tests are green in PowerShell environment.

### ✅ Milestone 2: JIT SQLite Database Cache & Performance (Phase 2)
- [x] Implement database connection pooling and SQLite WAL mode enablement.
- [x] Implement dirty-flag tracking based on file modification timestamp (`mtime`) comparison.
- [x] Integrate lazy-synchronization to eliminate O(N) memory read/write bottlenecks.
- [x] Add high-concurrency safe transactional operations.

### ✅ Milestone 3: Relevance-Scored Token Budget Context (Phase 3)
- [x] Replace FIFO token insertion with relevance scoring.
- [x] Track keyword matches, AST import paths, and cross-file semantic tags.
- [x] Implement soft token budgets (8000-16000 tokens) with gracefully degraded lists.

### ✅ Milestone 4: VFS Patch Workspace Orchestration (Phase 5)
- [x] Build line-based unified diff parser and dry-run conflict checker (`bin/patch.js`).
- [x] Eliminate expensive and deadlock-prone Git worktrees in agent swarms.
- [x] Support atomic multi-file patching, collision recovery, and revert logs.

### ✅ Milestone 5: Dynamic Requirements Router (Phase 6)
- [x] Build multi-agent classification router mapping keywords to semantic agent requirements (`bin/router.js`).
- [x] Replace the static 9-agent rigid pipeline with dynamic 1-3 concurrent agent pools.
- [x] Wire task assignment commands into `veyra agent auto`.

### ✅ Milestone 6: Go Playwright Visual Verification Framework (Phase 4)
- [x] Initialize `go.mod` for Go visual review subsystem.
- [x] Write Go-based headless test cases representing mobile, tablet, and desktop viewport sizes.
- [x] Implement `snapshot.go` (Playwright layout capturing), `diff.go` (DOM structure diff rendering), and `audit.go` (accessibility scanner).
- [x] Compile Go visual CLI tool and integrate into `bin/visual-review.js`.
- [x] Run and verify visual verification tests pass.

---
## Completed V3 Swarm Milestones

### ✅ Milestone 7: Decoupled MCP Memory Graph (Phase 8)
- [x] Initialize Python MCP Server in `memory-mcp-server/`.
- [x] Implement DuckDB database tables for node metadata and NetworkX representation for semantic edges.
- [x] Develop episodic clustering and recursive compression algorithms to condense context sizes.

### ✅ Milestone 8: Contract-Proven Verification Check (Phase 9)
- [x] Build Zod-based programmatic contract validator in `bin/verify.js`.
- [x] Write integration-branch isolation hooks executing Typechecking, Linters, and Vitest test suites prior to commits.
- [x] Implement fallback clean recovery logic when contracts fail.

### ✅ Milestone 9: Hybrid Context Assembly (Phase 10)
- [x] Merge AST import-graph traversal logic with local vector database search client in `bin/context.js`.
- [x] Enable Ollama/HuggingFace embeddings for high-speed local relevance scoring of config, styled, and DB assets.

### ✅ Milestone 10: Dual Explorer-Architect Orchestration Loop (Phase 11)
- [x] Define Explorer REPL sandbox specs in `agents/explorer.md`.
- [x] Modify `bin/router.js` to route speculative requirements tasks through recursive Explorer -> Architect speculative contract sweeps.
- [x] Create Architect formal spec translation scripts.

### ✅ Milestone 11: Governance State-Machine Circuit Breaker (Phase 12)
- [x] Build `bin/governance.js` tracker with Zod attempt states.
- [x] Implement 3-strike execution limit.
- [x] Add automatic developer alert escalation showing detailed failure diagnostic diff bundles.

### ✅ Milestone 12: Architectural Zoom-Out Audit (Phase 13)
- [x] Map core node modules, caller functions, and system topologies.
- [x] Audit the 5 critical legacy bottlenecks (Rebase lock, JSON memory limits, AST explosion, Waterfall Spec, Rule scatter).
- [x] Build comprehensive responses matching V3 implementations and V4 evolutionary roadmap.

### ✅ Milestone 13: Task Queue & Claim Discipline (Phase B)
- [x] Added `claimed_by` and `claimed_at` runtime metadata to SQLite DB to prevent concurrent agent conflicts.
- [x] Implemented atomic lock-acquisition (`claim()`), release, start, complete, fail, and reopen methods.
- [x] Integrated JIT JSON database updates validated by strict Zod schema definition.
- [x] Implemented automatic stale-claim expiration (>30 mins) to auto-recover stalled tasks.
- [x] Verified full CLI integration (`bead claim/release/start/complete/fail/reopen`) and wrote 16 robust Vitest integration tests.

### ✅ Milestone 14: GitHub Actions CI Integration (Phase C)
- [x] Deployed `.github/workflows/ci.yml` CI flow to automate testing.
- [x] Configured Vitest test suite running on a standard Ubuntu-latest node runner for immediate feedback on branch integrations.

### ✅ Milestone 15: Schema Standardization & Headless CLI
- [x] Implemented strict Zod schema validation (`schema.js`) for all memory beads.
- [x] Standardized memory database (`db.js`) to store, read, and write Zod-validated JSON beads, and migrated legacy files JIT via `migrateLegacy()`.
- [x] Rebuilt the main entrypoint CLI (`bin/veyra.js`) from scratch as a headless Node.js tool using a zero-dependency argument parser.
- [x] Restructured Vitest test suite to cover Zod schemas, JSON persistence, and concurrency locks, increasing total tests to 112 assertions.

### ✅ Milestone 16: AST Code-as-a-Graph Transformations
- [x] Incorporate AST node manipulation pipelines (`addFunction`, `modifyFunction`, `updateVariableAssignment`, `updateObjectProperty`, `addMethod`, `addImport`).
- [x] Integrate AST patching in `bin/patch.js` with semantic conflict resolution (checking overlap of exact method, function, or property keys instead of lines).
- [x] Write Vitest test coverage for AST operations and conflict detection, pushing total assertions to 122.

---
## Completed Swarm Telemetry Milestones

### ✅ Milestone 19: Swarm Telemetry Dashboard (Phase D)
- [x] Analyze codebase tracking and database locking metrics.
- [x] Design data extraction functions in `bin/dashboard.js` retrieving SQLite locks, governance retry strike arrays, and patch channels.
- [x] Design visual styling interface mapping using `bin/ui.js` primitives.
- [x] Integrate CLI command `dashboard` / `ui dashboard` in `bin/veyra.js`.
- [x] Design Vitest test suite in `tests/bin/dashboard.test.js` validating layout assembly and calculations.

### ✅ Milestone 21: AST Expansion & Agent Integration
- [x] Extend `bin/ast_transform.js` to support classes, decorators, JSX/TSX elements, and interfaces/types.
- [x] Integrate new AST APIs in CLI (`bin/veyra.js`) and conflict detector (`bin/patch.js`).
- [x] Mandate AST-based patching in agent prompt markdown files under `agents/`.
- [x] Add comprehensive test coverage in `tests/bin/ast-transform.test.js` and `tests/bin/patch.test.js` and ensure all pass.

---
## Future V4 Strategic Milestones

### ⬜ Milestone 17: Multimodal VLM Layout Auditing
- [ ] Integrate Playwright snapshots with multimodal vision LLMs.
- [ ] Execute automated assertions validating responsive visual layouts against Figma assets.

### ⬜ Milestone 18: Pub/Sub Swarm Worker Loop
- [ ] Formulate a daemon microservice subscribing to an SQLite WAL event bus.
- [ ] Allocate subagent tasks asynchronously as event bus dependency flags update.

### ✅ Milestone 20: Graphify Enrichment Core (Security Ingest, Graph Topology, and HTML Visualizers)
- [x] Add JIT secrets, netrc, and key skipping patterns to `bin/context.js`.
- [x] Implement decompression ratio screening on zip/XML-based Office documents to prevent zip-bomb exploits in `bin/context.js`.
- [x] Implement shebang script parser for extensionless scripts in `bin/context.js`.
- [x] Extend import crawling to support multi-language fallbacks (Python, Rust, Go, Apex, SQL).
- [x] Update `memory-mcp-server/graph.py` to calculate degree centrality ("God Nodes") and Modular connections crossing communities / language barriers ("Surprising Connections").
- [x] Build interactive HTML outputs: a collapsible tree using D3.js (`context/tree.html`) and an architecture Mermaid callflow diagram (`context/graph.html`).


