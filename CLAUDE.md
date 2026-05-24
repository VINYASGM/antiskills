# Veyra — Agent Operating System

## Identity

This repository is an AI-native engineering operating system. Agents operate under strict
phase-gated execution with spec-driven development. Every change requires a spec, a plan,
execution evidence, and review. No exceptions.

## Stack

- Runtime: Node.js 20+ / TypeScript 5+
- Package Manager: pnpm
- Testing: Vitest
- Linting: ESLint + Prettier
- Database: PostgreSQL (when applicable)
- Framework: Next.js (when applicable)

## Critical Commands

- Build: `pnpm build`
- Test: `pnpm vitest run`
- Lint: `pnpm eslint . --ext .ts,.tsx`
- Type Check: `pnpm tsc --noEmit`
- Format: `pnpm prettier --write .`

## Hard Rules (NEVER violate)

- NEVER commit .env files or hardcoded secrets
- NEVER use `any` type in TypeScript — use `unknown` and narrow
- NEVER bypass the service layer to query the database directly from route handlers
- NEVER modify files outside your assigned task scope
- NEVER merge without execution evidence (test output logs)
- NEVER allow multiple agents to work on the same Git branch
- ALWAYS validate data at service layer boundaries
- ALWAYS use explicit error types — no error swallowing
- ALWAYS paginate database queries by default
- ALWAYS version APIs explicitly (/v1/, /v2/) in URL paths

## Code Style

- Prefer explicit loops over clever metaprogramming
- Prefer composition over deep inheritance
- Use kebab-case for URLs, camelCase for JSON payloads
- Maximum function length: 40 lines (excluding tests)
- Maximum file length: 300 lines (split if larger)
- Use named exports over default exports
- Group imports: external → internal → types
- One component per file in frontend code

## Context Budget

- Agents can reliably follow ~150 instructions simultaneously
- Rules are loaded on-demand by directory scope (see /rules/)
- Do NOT dump all rules into a single prompt
- Prefer many small rule files over few large ones

## Directory-Scoped Rules

- Working in /frontend/ → load @rules/frontend.md
- Working in /backend/ → load @rules/backend.md
- Working in /security/ → load @rules/security.md
- Working in /testing/ → load @rules/testing.md
- Always load @rules/global.md regardless of scope

## Agent Coordination

- Each agent works in an isolated Git worktree
- Merges are sequential — rebase onto main before integrating
- No two agents share a branch, ever
- Escalate to human via Consultation Request Pack (CRP) when:
  - Multi-branch merge conflicts occur
  - Architectural boundary violations are detected
  - 3+ patch attempts fail on the same bug
  - Requirements are ambiguous or contradictory

## Memory System

- All decisions, bugs, and task states are tracked as Beads (see /memory/)
- Query beads for context — do NOT rely on chat history
- Create a new bead for every architectural decision
- Beads are append-only — never delete, only supersede
- Reference beads by ID in commit messages

## Verification

- Every code change requires execution evidence
- Test coverage must not decrease
- All PRs require: tests passing, lint clean, type check passing
- Include terminal output in verification evidence
- "It compiles" is not sufficient — run the tests

## Phase Gates

1. **Spec** → PRD/TRD approved by human
2. **Plan** → Implementation plan with file-level scope
3. **Implement** → Code written in isolated worktree
4. **Test** → All tests pass with execution evidence
5. **Review** → Code reviewer agent + security reviewer
6. **Merge** → Sequential rebase onto main

## Escalation Protocol

If blocked for >2 attempts on the same issue, create a CRP:
- What was attempted (with evidence)
- What failed (with error output)
- What options remain
- Recommended action
- Send CRP to orchestrator for human routing
