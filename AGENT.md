# Veyra — Agent Operating System

## Identity & Core
AI-native engineering OS. Spec-driven, decentralized actor choreography. No code without a plan and evidence.
Stack: Read `STACK.md` for project runtime, framework, and toolchain.

## 🟢 Session Start Protocol (ALWAYS execute first)
1. Read `State.md` — determine active phase, resolved beads, and next actions.
2. Read active plain-text Markdown beads in `memory/beads/*.md` to Orient yourself JIT.
3. Load `rules/global.md` always + matching scoped rules (e.g. `rules/frontend.md`).
4. Check Git status for unstaged changes or active worktree flags using `git status`.
5. Run `node bin/veyra.js intent check <agentId> <taskId>` to verify zero active schema, route, or file conflicts.
6. Publish your active intents using `node bin/veyra.js intent publish <agentId> <taskId> <files> <dbCols> <routes> <styles>`.
7. State your understanding of the task and your next granular action.

## 🔴 Session End Ritual (ALWAYS execute before exiting)
1. Execute continuous test suites and capture pass/fail logs.
2. If working on frontend, compile and run `node bin/veyra.js visual-review` to capture responsive screens.
3. Commit changes to your isolated Git worktree branch.
4. Create/update the task bead file under `memory/beads/bd-XXXX.md` with evidence and state.
5. Update `State.md` and `task.md` to reflect completed items.
6. Leave a clear handoff inbox message inside `memory/inbox/` for peer actors.

## Rules & Coordination
- Directory-scoped rules: Load `@rules/global.md` always. Scoped rules loaded JIT on entry.
- Direct Choreography: Subagents communicate directly via `memory/inbox/msg-*.json` JSON packets.
- No merge without test output evidence, clean `veyra lint` pass, and passing VLM responsive audits.
- AST + Semantic Intel: Context assembly parses both compiler dependencies and shared string literal mappings.

## Critical CLI Commands
> **Note:** Running any Veyra CLI command automatically triggers a JIT synchronization of all Markdown beads into the local `.gitignored` SQLite cache.

- `node bin/veyra.js bead list`                  List JIT synchronized memory beads
- `node bin/veyra.js bead create <title>`        Create a new Markdown memory bead
- `node bin/veyra.js context assemble <task>`    Assemble hybrid AST and Semantic context
- `node bin/veyra.js context index`              Generate dynamic codebase repo map and dependency DAG
- `node bin/veyra.js intent publish <ag> <tsk>`  Broadcast files, DB columns, REST routes, styles
- `node bin/veyra.js intent check <ag> <tsk>`    Check active peer conflicts JIT
- `node bin/veyra.js intent list`                List all active agent broadcasts
- `node bin/veyra.js worktree merge <branch...>` Optimistic concurrent integration
- `node bin/veyra.js agent spawn <role> <task>`  Spawn an agent under supervisor tree
- `node bin/veyra.js workflow list`              List all awesome-skills workflows
- `node bin/veyra.js workflow run <id>`          Execute a workflow and spawn agents step-by-step
- `node bin/veyra.js skill search <query>`       Search global Awesome Skills registry
- `node bin/veyra.js skill install <id>`         Download and mount a skill to .agent/skills/
- `node bin/veyra.js visual-review`              Execute automated Playwright responsive visual audit
- `node bin/veyra.js lint`                       Run code linter static audits
