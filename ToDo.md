# Roadmap — Veyra

**Last Updated:** 2026-05-26

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
- [x] Modify `bin/router.js` to route speculative requirements tasks through recursive Explorer -> Architect loops.
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
- [x] Integrated auto-sync state updates to Markdown frontmatter (`status` tracking).
- [x] Implemented automatic stale-claim expiration (>30 mins) to auto-recover stalled tasks.
- [x] Verified full CLI integration (`bead claim/release/start/complete/fail/reopen`) and wrote 16 robust Vitest integration tests.

### ✅ Milestone 14: GitHub Actions CI Integration (Phase C)
- [x] Deployed `.github/workflows/ci.yml` CI flow to automate testing.
- [x] Configured Vitest test suite running on a standard Ubuntu-latest node runner for immediate feedback on branch integrations.

---
## Future V4 Strategic Milestones

### ⬜ Milestone 15: AST Code-as-a-Graph Transformations
- [ ] Incorporate AST node manipulation pipelines (`add_node`, `modify_function`).
- [ ] Eliminate raw line-based patch diff writes entirely to guarantee syntactic correctness.

### ⬜ Milestone 16: Multimodal VLM Layout Auditing
- [ ] Integrate Playwright snapshots with multimodal vision LLMs.
- [ ] Execute automated assertions validating responsive visual layouts against Figma assets.

### ⬜ Milestone 17: Pub/Sub Swarm Worker Loop
- [ ] Formulate a daemon microservice subscribing to an SQLite WAL event bus.
- [ ] Allocate subagent tasks asynchronously as event bus dependency flags update.
