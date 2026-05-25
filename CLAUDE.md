# Veyra — Agent Operating System

## Identity & Core
AI-native engineering OS. Spec-driven, phase-gated execution. No code without a plan and evidence.
Stack: Read `STACK.md` for the project runtime, framework, and toolchain.

## 🟢 Session Start Protocol (ALWAYS execute first)
1. Read `State.md` — determine current phase, blocking issues, and next actions.
2. Read `memory/current-task.json` — orient to the active bead and context beads.
3. Load `rules/global.md` (always) + the scoped rule file matching the working directory (`rules/frontend.md`, `rules/backend.md`, etc.).
4. Read the active bead file and its listed context beads.
5. List all open beads via `veyra bead list --status=open`.
6. Check for unstaged/uncommitted files using `git status`.
7. Confirm current phase and active worktree — state discrepancies if any.
8. State your understanding of the context and your immediate next action.

## 🔴 Session End Ritual (ALWAYS execute before exiting)
1. Run tests and generate execution evidence for your changes.
2. Commit your work in your isolated Git worktree.
3. Create/update the active bead in `memory/beads/` with evidence and status.
4. Update `memory/current-task.json` to point to the correct active task.
5. Update `State.md` and `task.md` to reflect completed progress.
6. Leave a clear handoff summary for the next session.

## Rules & Context
- Directory-scoped rules: Load `@rules/global.md` always. 
  Load `@rules/frontend.md` or `@rules/backend.md` depending on scope.
- Memory Worker: See `docs/subsystems/claude-mem-worker.md` — load only when building the worker service.
- Max Context: Do not dump all rules into a single prompt.
- Architecture Decisions: Read and write to decentralized beads (`memory/beads/`).

## Agent Coordination & Execution
- One agent, one branch. Work in isolated Git worktrees.
- No merge without test output evidence and a clean `veyra lint` pass.
- Sequential rebases only. Never merge with parallel conflict resolutions.
- 3+ failed patches on a bug? Revert and escalate via Consultation Request Pack (CRP).

## Critical CLI Commands
- CLI Framework: Run `./veyra` (bash) or `./veyra.ps1` (PS) for native commands.
- `veyra bead list` / `create` (SQLite backed memory graph)
- `veyra context assemble <task>` (Deterministic TS AST context parsing)
- `veyra worktree merge <branch...>` (Optimistic concurrent integration)
- `veyra agent spawn <role> <task>` (Generates Antigravity subagent prompt)

## Antigravity Vibecoding Integrations
- ALWAYS use `/grill-me` or the `grill-with-docs` skill during the Spec phase to solidify requirements.
- NEVER guess on bugs. ALWAYS invoke the `diagnose` skill for reproduction loops.
- Use the `prototype` skill in `scratch/` before committing structural UI changes.
- Use `/goal` for overnight refactoring inside isolated Git worktrees.
