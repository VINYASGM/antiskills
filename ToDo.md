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

---

## Active & Upcoming Milestones

### 🚧 Milestone 6: Go Playwright Visual Verification Framework (Phase 4)
- [ ] Initialize `go.mod` for Go visual review subsystem.
- [ ] Write Go-based headless test cases representing mobile, tablet, and desktop viewport sizes.
- [ ] Implement `snapshot.go` (Playwright layout capturing), `diff.go` (pixel-by-pixel diff rendering), and `audit.go` (VLM scoring).
- [ ] Compile Go visual CLI tool and integrate into `bin/visual-review.js`.
- [ ] Run and verify visual verification tests pass.

### 🚧 Milestone 7: Interactive Terminal Dashboard & Swarm Animations (Phase 7)
- [ ] Install Ink CLI styling suite (`ink`, `ink-spinner`, `ink-gradient`, `react`).
- [ ] Design terminal layout dashboard featuring real-time concurrent agent channels, dynamic intent broadcast streams, and VFS patching statuses.
- [ ] Integrate gorgeous CSS/terminal animations.

### 🚧 Milestone 8: Architectural Documentation Sync
- [x] Create central developer `context.md` entry point.
- [x] Update `State.md`, `ToDo.md`, `Architecture.md`, `TRD.md`, and `PRD.md` with V2 VFS architecture.
