# Roadmap — Veyra

**Last Updated:** 2026-05-25

---

## Milestones

### ✅ Milestone 1: Repository Structure
> Create all directories and root configuration files.
- [x] Create root files: `.gitignore`, `README.md`, `CLAUDE.md`
- [x] Create spec files: `PRD.md`, `TRD.md`, `Architecture.md`
- [x] Create state files: `State.md`, `ToDo.md`
- [x] Create all subdirectories: `agents/`, `rules/`, `memory/`, `context/`, `workflows/`, `prompts/`, `templates/`, `debugging/`, `checklists/`, `docs/`, `orchestration/`, `governance/`, `standards/`
- [x] Initialize `memory/beads/` with Git-native Markdown root bead
- [x] Create `.gitkeep` files in empty directories

---

### ✅ Milestone 2: Memory System & JIT Cache
- [x] Create decentralized Markdown beads (`memory/beads/*.md`)
- [x] Build frontmatter parser for plain-text Markdown memory tracking
- [x] Synchronize JIT memory states into a `.gitignored` local SQLite cache (`beads.db`)
- [x] Exclude SQLite binaries and locking/temporary files from Git in `.gitignore`
- [x] Validate bead query performance with local JIT SQLite sync

---

### ✅ Milestone 3: Continuous Context Broadcasting (Intents)
- [x] Design ephemeral Intent schema matching files, routes, DB columns, and CSS styles
- [x] Implement JIT intent publisher and checker in `bin/intent.js`
- [x] Integrate `intent publish`, `intent list`, and `intent check` commands into Veyra CLI
- [x] Perform semantic conflict checks comparing parallel agent intentions JIT

---

### ✅ Milestone 4: Hybrid Code Intelligence Engine
- [x] Integrate TS AST traversal mapping explicit imports
- [x] Implement multi-file regex scanning for decoupled semantic bindings (REST routes, styles, DB columns)
- [x] Build decoupled link resolution to pull implicit dependencies into agent context
- [x] Implement ranked file token budget assembly in `bin/context.js`

---

### ✅ Milestone 5: Distributed Actor Choreography & TDD
- [x] Define peer message payloads in `orchestration/choreography-protocol.md`
- [x] Pivot Orchestrator from central supervisor to asynchronous actor registry broker
- [x] Instruct Frontend, Testing, and Code Review agents to use peer-to-peer JSON inboxes
- [x] Implement high-frequency, interactive TDD self-correction loop instructions

---

### 🟡 Milestone 6: Responsive Visual CI Loop
- [x] Build `bin/visual-review.js` executing Puppeteer/Playwright capturing Mobile, Tablet, and Desktop breakpoints
- [x] Define visual reviewer agent (`agents/vlm-ui-reviewer.md`)
- [x] Write visual grid, spacing, z-index, typography checklist (`checklists/visual-audit.md`)
- [ ] Test vision-based visual review loop against responsive frontend mockups

---

### 🟡 Milestone 7: Swarm Orchestration & Validation
- [ ] Run concurrent multi-agent simulation using isolated Git worktrees
- [ ] Verify intent conflicts are triggered JIT during parallel executions
- [ ] Execute fast-forward rebase and merges under actor choreography
- [ ] Generate execution evidence and close out tasks

---

## Progress Summary

| Milestone | Status | Progress |
|---|---|---|
| 1. Repository Structure | ✅ Complete | 6/6 tasks |
| 2. Memory System & JIT Cache | ✅ Complete | 5/5 tasks |
| 3. Continuous Broadcasting (Intents) | ✅ Complete | 4/4 tasks |
| 4. Hybrid Code Intelligence | ✅ Complete | 4/4 tasks |
| 5. Distributed Actor Choreography | ✅ Complete | 4/4 tasks |
| 6. Responsive Visual CI Loop | 🟡 In Progress | 3/4 tasks |
| 7. Swarm Validation | ⬜ Not Started | 0/4 tasks |
