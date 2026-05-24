# Veyra — Agent Operating System

## Identity & Core
AI-native engineering OS. Spec-driven, phase-gated execution. No code without a plan and evidence.
Stack: Node.js 20+, pnpm, Vitest, ESLint, TypeScript 5+ (No `any`).

## 🟢 Session Start Ritual (ALWAYS execute first)
1. Read `memory/current-task.json` to immediately orient yourself.
2. Read the active bead and its listed context beads.
3. Review `State.md` and the active `task.md` checklist.
4. Check for unstaged/uncommitted files using `git status`.
5. Run `veyra lint` to ensure workspace integrity.
6. State your understanding of the context and your immediate next action.

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
- Max Context: Do not dump all rules into a single prompt.
- Architecture Decisions: Read and write to decentralized beads (`memory/beads/`).

## Agent Coordination & Execution
- One agent, one branch. Work in isolated Git worktrees.
- No merge without test output evidence and a clean `veyra lint` pass.
- Sequential rebases only. Never merge with parallel conflict resolutions.
- 3+ failed patches on a bug? Revert and escalate via Consultation Request Pack (CRP).

## Critical CLI Commands
- CLI Framework: Run `./veyra` (bash) or `./veyra.ps1` (PS) for native commands.
- `veyra bead create` / `list` / `show`
- `veyra lint` (Runs constitutional constraints checker)
- `veyra context assemble <task>` (Deterministic prompt assembly)
- `veyra worktree create` / `merge` / `cleanup`
