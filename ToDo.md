# Roadmap — Veyra

**Last Updated:** 2026-05-24

---

## Milestones

### ✅ Milestone 1: Repository Structure
> Create all directories and root configuration files.

- [x] Create root files: `.gitignore`, `README.md`, `CLAUDE.md`
- [x] Create spec files: `PRD.md`, `TRD.md`, `Architecture.md`
- [x] Create state files: `State.md`, `ToDo.md`
- [x] Create all subdirectories: `agents/`, `rules/`, `memory/`, `context/`, `workflows/`, `prompts/`, `templates/`, `debugging/`, `checklists/`, `docs/`, `orchestration/`, `governance/`, `standards/`
- [x] Initialize `memory/beads.json` with root bead
- [x] Create `.gitkeep` files in empty directories

---

### ⬜ Milestone 2: First Project Onboarding
> Clone Veyra for a real project. Configure stack and customize CLAUDE.md.

- [ ] Clone Veyra into a new project directory
- [ ] Customize `CLAUDE.md` for project-specific stack
- [ ] Write project-specific PRD and TRD
- [ ] Define project architecture in `Architecture.md`
- [ ] Create initial beads for project decisions
- [ ] Verify agent constitution loads correctly

---

### ✅ Milestone 3: Agent Integration
> Write agent definitions and test them with Antigravity subagents.

- [x] Write `agents/orchestrator.md`
- [x] Write `agents/planner.md`
- [x] Write `agents/architect.md`
- [x] Write `agents/backend-engineer.md`
- [x] Write `agents/frontend-engineer.md`
- [x] Write `agents/code-reviewer.md`
- [x] Write `agents/debugging-specialist.md`
- [x] Write `agents/testing-engineer.md`
- [x] Write `agents/security-reviewer.md`
- [x] Write `agents/documentation-writer.md`
- [ ] Test agent definitions with Antigravity subagent invocations
- [ ] Validate agents load correct scoped rules

---

### 🟡 Milestone 4: Memory System
> Validate the Beads pattern works across sessions.

- [x] Create beads templates
- [x] Verify beads persist across agent sessions
- [ ] Test bead querying for context injection
- [ ] Validate `superseded_by` chain for changed decisions
- [ ] Implement bead archival for completed tasks
- [ ] Test memory graph with 50+ beads for performance

---

### 🟡 Milestone 5: Workflow Execution
> Run a complete feature development workflow end-to-end.

- [x] Write `workflows/feature-development.yaml`
- [x] Write `workflows/bug-fix.yaml`
- [x] Write `workflows/refactor.yaml`
- [x] Write `workflows/security-patch.yaml`
- [ ] Execute feature-development workflow for a real feature
- [ ] Verify all phase gates are enforced
- [ ] Capture execution evidence for every phase
- [ ] Validate beads are created at each workflow step

---

### ⬜ Milestone 6: Multi-Agent Orchestration
> Test parallel agents with Git worktree isolation.

- [ ] Create 3 simultaneous worktrees for parallel agent work
- [ ] Run 3 agents in parallel on separate tasks
- [ ] Verify zero file conflicts between agents
- [ ] Execute sequential merge protocol (rebase + fast-forward)
- [ ] Test CRP escalation when merge conflicts occur
- [ ] Validate merge order is deterministic
- [ ] Clean up worktrees after merge

---

## Progress Summary

| Milestone | Status | Progress |
|---|---|---|
| 1. Repository Structure | ✅ Complete | 10/10 tasks |
| 2. First Project Onboarding | ⬜ Not Started | 0/6 tasks |
| 3. Agent Integration | 🟡 In Progress | 10/12 tasks |
| 4. Memory System | 🟡 In Progress | 2/6 tasks |
| 5. Workflow Execution | 🟡 In Progress | 4/8 tasks |
| 6. Multi-Agent Orchestration | ⬜ Not Started | 0/7 tasks |
