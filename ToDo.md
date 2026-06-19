# Roadmap — Veyra

**Last Updated:** 2026-06-16

---

## Completed Milestones (V3 Architecture Core)

### ✅ Milestone 1: Test Infrastructure & Integrity (Phase 1)
- [x] Configure Vitest with auto-injected globals (`vitest.config.js`).
- [x] Create comprehensive test suites under `tests/bin/` checking `db.js`, `context.js`, `intent.js`, `patch.js`, `router.js`, and `visual-review.js`.
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
## Completed V4 Swarm Milestones

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
- [x] Build comprehensive responses matching V4 implementations and V5 evolutionary roadmap.

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

### ✅ Milestone 18: Pub/Sub Swarm Worker Loop
- [x] Formulate a daemon microservice subscribing to an SQLite WAL event bus.
- [x] Allocate subagent tasks asynchronously as event bus dependency flags update.

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

### ✅ Milestone 17: Multimodal VLM Layout Auditing
- [x] Auto-generation of placeholder PNG mockups in `memory/design/figma_desktop/tablet/mobile.png` if missing.
- [x] Responsive screenshot and mockup asset loading and base64 payload conversion.
- [x] Gemini API (`gemini-1.5-flash`) multimodal visual layout and contrast auditing.
- [x] Fallback coordinate and selector audit via `dom_structure.json` checking for low-contrast text element IDs or checking environment variable.
- [x] Generation of structured JSON reports (`vlm_audit_report.json` and viewport-specific files).
- [x] Automated assertions and exit codes integration in CI/CD pipeline.

### ✅ Milestone 22: Concurrency & File Locking (V4 Upgrades)
- [x] Integrate `proper-lockfile` locking around JSON write operations in `_writeToJSON` in `bin/db.js`.
- [x] Implement synchronous retry logic inside lockfile synchronization.
- [x] Add comprehensive concurrency and lock recovery test coverage in `tests/bin/db.test.js`.

### ✅ Milestone 24: Sandboxed Patch Verification (V4 Upgrades)
- [x] Implement path resolution and sandbox target paths in `verifyContract()` inside `bin/verify.js`.
- [x] Handle null/empty patches gracefully, validating the sandbox workspace directly.
- [x] Replicate speculative workspace recursively (with optimized exclusions) and mount `node_modules` via directory junction.
- [x] Safeguard clean rollback isolation and link unlinking in try-finally blocks inside `bin/patch.js`.
- [x] Add extensive sandbox verification test coverage in `tests/bin/verify.test.js` and `tests/bin/patch.test.js`.

### ✅ Milestone 5: Rollback Telemetry & File Watcher Connection
- [x] Wire circuit breaker trips in `bin/governance.js` to publish `governance_tripped` events JIT.
- [x] Connect Rust coordinator actor to beads.db and write file change/delete events to `agent_events`.
- [x] Implement JIT `processWatcherEvents()` cache invalidation in `bin/db.js` and integrate in `bin/context.js`.
- [x] Add unit tests verifying trip event publishing and file watcher invalidation.

### ✅ Milestone 6: ONNX Embeddings
- [x] Implement Rust-based ONNX text embedding generation using tokenizers and ort.
- [x] Implement Python-based ONNX semantic vector similarity search in `bin/vector_search.py` with TF-IDF fallback.
- [x] Add unit tests verifying both ONNX and TF-IDF search pathways.

---
## Active / In-Progress Milestones

None
## Future Strategic Milestones

None

### ✅ Milestone 20: Graphify Enrichment Core (Security Ingest, Graph Topology, and HTML Visualizers)
- [x] Add JIT secrets, netrc, and key skipping patterns to `bin/context.js`.
- [x] Implement decompression ratio screening on zip/XML-based Office documents to prevent zip-bomb exploits in `bin/context.js`.
- [x] Implement shebang script parser for extensionless scripts in `bin/context.js`.
- [x] Extend import crawling to support multi-language fallbacks (Python, Rust, Go, Apex, SQL).
- [x] Update `memory-mcp-server/graph.py` to calculate degree centrality ("God Nodes") and Modular connections crossing communities / language barriers ("Surprising Connections").
- [x] Build interactive HTML outputs: a collapsible tree using D3.js (`context/tree.html`) and an architecture Mermaid callflow diagram (`context/graph.html`).

### ✅ Milestone 25: V4 Zero-Dependency Refactoring
- [x] SQLite Removal: Decommission SQLite databases and pool handlers, replacing them with in-memory `Map` caches and file-backed JSON persistence files (`beads.json`, `crawl_cache.json`, `event_bus.json`, `intents.json`).
- [x] UUIDv4 Migration: Transition bead identities to UUIDv4 format, enforcing validation using regex matching `/^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i` for both legacy and new structures.
- [x] CLI Status Command: Build a dynamic status utility (`node bin/veyra.js status [--json]`) querying system status under lockfile and rendering plain text or JSON telemetry.
- [x] OSV.dev Checks: Integrate automated queries to OSV.dev API (`https://api.osv.dev/v1/querybatch`) via native Node HTTPS module, checking lockfile vulnerabilities with offline fallback mock registries.
- [x] Structured Logging: Implement structured, append-only `agent-audit.jsonl` audit logging detailing timestamps, actions, agents, durations, and outcomes.
- [x] Test Adaptations: Refactor Vitest test suites to mock HTTPS network calls and utilize lockfile-protected JSON file systems instead of database connections.

### ✅ Milestone 26: AI-Native Debugging Bridge
- [x] Integrate kernel panic monitoring hook within failed verification commands catch blocks in `bin/verify.js`.
- [x] Create a dedicated `bin/kernel_panic.js` module to parse stderr lines and resolve error file locations (file path, line, column).
- [x] Traversed the TypeScript AST to pinpoint and format the deepest AST node at the coordinates of the compiler error.
- [x] Generated gzipped JSON reports at `memory/evidence/kernel_panic_report.json.gz` using node's native `zlib.gzipSync`.
- [x] Wrote Vitest unit tests triggering verification command errors and checking compressed JSON mapping outputs.

### ✅ Milestone 27: Core Model Context Protocol (MCP) Server Integration
- [x] Create native Node.js-based MCP server in `bin/veyra-mcp.js` using standard stdio JSON-RPC 2.0.
- [x] Expose `get_status`, `create_bead`, `list_beads`, and `update_bead` as standard MCP tools.
- [x] Integrate command `mcp` into Veyra CLI in `bin/veyra.js` to start the MCP server.
- [x] Write comprehensive Vitest test suite in `tests/bin/mcp.test.js` covering handshake, tools list, and tool calls.

### ✅ Milestone 28: Deterministic Accessibility Engine (Axe-core Playwright Integration)
- [x] Implement Axe-core script injection with local rules checker fallback in Go Playwright `RunAccessibilityAudit`.
- [x] Catch missing alt attribute, tabindex role, low-contrast-text, and form label/aria omissions.
- [x] Update Node review runner (`bin/visual-review.js`) to log violations and exit with appropriate status code (1 for violations, 0 for passing).
- [x] Add comprehensive Vitest assertions checking process exit codes in `tests/bin/visual-review.test.js`.

### ✅ Milestone 29: Geometric Layout Assertions & Visual Auditing Remediation
- [x] Capture DOM structures (including padding styles paddingTop, paddingRight, paddingBottom, paddingLeft) for all viewports, saving mobile, tablet, desktop, and backward compatible JSON files.
- [x] Create reference spec `checklists/figma-layout.json` defining bounding boxes for key elements (`header`, `sidebar`, `main-content`, `submit-btn`).
- [x] Implement 4 geometric assertions (bounding box tolerance check, overlap/collision detection, touch target sizing, grid alignment validation).
- [x] Unify accessibility standard audits and layout/VLM reviews, removing early exits.
- [x] Repair fragile Go accessibility tests to support both standard CDN axe-core and fallback schemas.
- [x] Add Node unit tests in `tests/bin/visual-review.test.js` validating assertions.

---
## Architectural Decision Records (ADRs)
- [x] **[ADR 0001](docs/adr/0001-deprecate-legacy-git-worktrees.md)**: Deprecate Legacy Git Worktrees in Favor of VFS Patching
- [x] **[ADR 0002](docs/adr/0002-prevent-concurrency-collision-via-proper-lockfile.md)**: Prevent JSON Database Concurrency Collisions Using proper-lockfile
- [x] **[ADR 0003](docs/adr/0003-isolated-sandboxed-patch-verification.md)**: Isolated Sandboxed Patch Verification
- [x] **[ADR 0004](docs/adr/0004-sqlite-backed-incremental-crawl-cache.md)**: SQLite-Backed Incremental Crawl Cache
- [x] **[ADR 0005](docs/adr/0005-file-watcher-events-and-onnx-semantic-search.md)**: Rust File Watcher Events & ONNX Semantic Search Integration
- [x] **[ADR 0006](docs/adr/0006-pubsub-swarm-worker.md)**: Pub/Sub Swarm Worker Loop

All V4 upgrades are fully complete, documented, and verified.



