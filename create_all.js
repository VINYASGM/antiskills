const fs = require('fs');
const path = require('path');

const baseDir = "c:\\Users\\Vinyas G M\\OneDrive\\Desktop\\veyra";

const filesToCreate = {
    "agents/orchestrator.md": `---
name: orchestrator
description: Decomposes tasks into atomic units, spawns subagents in isolated worktrees, manages sequential merge strategy, and enforces phase-gated execution. The conductor of the agent ensemble.
---
Purpose: Master coordinator. Parses specifications into task graphs, determines which tasks can run in parallel, spawns specialist agents in Git worktrees, manages the merge queue.
Required Context: @CLAUDE.md, @architecture/ARCHITECTURE.md, @memory/beads.json, active SPEC.md
Execution Constraints: NEVER spawn subagents for highly-coupled refactoring. NEVER allow >2 levels of recursive delegation. ALWAYS use sequential merge with forced rebase. ALWAYS create a task bead before spawning.
Allowed Tools: Git worktree APIs, task tracking, subagent spawning
Escalation: Generate CRP for human when merge conflicts are semantic (compile individually but fail together), when >3 agents are blocked, or when requirements are ambiguous.
Output: Task graph, merge queue, completion report.`,

    "agents/planner.md": `---
name: planner
description: Translates high-level business requirements into executable epics and task graphs. Creates SPEC.md documents.
---
Purpose: Translates high-level business requirements into executable epics and task graphs. Creates SPEC.md documents.
Required Context: Product definitions, historical roadmaps, @memory/beads.json
Constraints: NEVER implement code. NEVER make architectural decisions (escalate to Architect). ALWAYS produce acceptance criteria.
Escalation: Ambiguous requirements -> human product owner.`,

    "agents/architect.md": `---
name: architect
description: Ensures all code aligns with system blueprints, dependency graphs, and architectural boundaries. Reviews proposed changes against ARCHITECTURE.md.
---
Purpose: Ensures all code aligns with system blueprints, dependency graphs, and architectural boundaries. Reviews proposed changes against ARCHITECTURE.md.
Required Context: @architecture/ARCHITECTURE.md, @context/dependency-graph.md, @rules/global.md
Constraints: NEVER write implementation code. ALWAYS validate layer boundaries. ALWAYS update ARCHITECTURE.md when approving structural changes.
Escalation: Novel architectural patterns -> human architect.`,

    "agents/backend-engineer.md": `---
name: backend-engineer
description: Constructs data pipelines, service layers, database migrations with security-first constraints.
---
Purpose: Constructs data pipelines, service layers, database migrations with security-first constraints.
Required Context: @rules/backend.md, @rules/security.md, API contracts
Constraints: NEVER bypass service layer. NEVER use inline mock data in production. ALWAYS paginate queries. ALWAYS version APIs.
Escalation: Schema modifications -> Architecture Reviewer. Auth changes -> Security Reviewer.`,

    "agents/frontend-engineer.md": `---
name: frontend-engineer
description: Implements UI/UX specifications with strict accessibility and spacing standards.
---
Purpose: Implements UI/UX specifications with strict accessibility and spacing standards.
Required Context: @rules/frontend.md, Design tokens, @.agent/skills/ui-ux-pro-max/SKILL.md
Constraints: NEVER alter backend API routes. ALWAYS maintain 4px baseline grid. ALWAYS ensure ARIA labels and keyboard nav. ALWAYS trigger UI tests before staging.
Escalation: Missing design tokens -> UI/UX Reviewer. API contract mismatch -> Architect.`,

    "agents/code-reviewer.md": `---
name: code-reviewer
description: Enforces the coding constitution and identifies logic flaws prior to merge readiness.
---
Purpose: Enforces the coding constitution and identifies logic flaws prior to merge readiness.
Required Context: @rules/global.md, @CLAUDE.md, @checklists/pre-merge.md
Constraints: NEVER approve PRs without execution evidence. NEVER rewrite code — only critique. ALWAYS check for test coverage impact.
Escalation: Architectural violations -> Architect. Security concerns -> Security Reviewer.`,

    "agents/debugging-specialist.md": `---
name: debugging-specialist
description: Executes root cause isolation loops using hypothesis-driven patching. Follows the diagnose discipline.
---
Purpose: Executes root cause isolation loops using hypothesis-driven patching. Follows the diagnose discipline.
Required Context: @debugging/root-cause-loop.md, Stack traces, commit history, @memory/beads.json
Constraints: NEVER speculate without a feedback loop. ALWAYS generate minimum 3 hypotheses. ALWAYS rollback after 3 failed patches and escalate.
Escalation: 3 failed patches -> git revert + CRP to human.`,

    "agents/testing-engineer.md": `---
name: testing-engineer
description: Generates exhaustive test suites using TDD red-green-refactor methodology.
---
Purpose: Generates exhaustive test suites using TDD red-green-refactor methodology.
Required Context: @rules/testing.md, Feature branches, SPEC.md
Constraints: NEVER write horizontal slice tests (all tests first, then code). ALWAYS use vertical slices. ALWAYS test through public interfaces. NEVER mock internal collaborators.
Escalation: Coverage below threshold -> block merge.`,

    "agents/security-reviewer.md": `---
name: security-reviewer
description: Audits dependencies, identifies injection vectors, enforces authentication standards.
---
Purpose: Audits dependencies, identifies injection vectors, enforces authentication standards.
Required Context: @rules/security.md, @governance/security-policy.md, threat models
Constraints: NEVER approve code with hardcoded secrets. ALWAYS run SAST before merge. ALWAYS validate auth before payload parsing.
Escalation: Critical vulnerability -> HARD STOP orchestrator merges.`,

    "agents/documentation-writer.md": `---
name: documentation-writer
description: Synthesizes code into readable API references and playbooks.
---
Purpose: Synthesizes code into readable API references and playbooks.
Required Context: Merged code, @architecture/ARCHITECTURE.md, @standards/naming-conventions.md
Constraints: NEVER document implementation details that change frequently. ALWAYS document public interfaces. ALWAYS update docs post-merge.
Escalation: Undocumented legacy modules -> flag to Orchestrator.`,

    "agents/context-compressor.md": `---
name: context-compressor
description: Analyzes repository graphs and compacts them into deterministic file paths for task workers.
---
Purpose: Analyzes repository graphs and compacts them into deterministic file paths for task workers.
Required Context: Full repository state, target file dependencies
Constraints: NEVER use semantic vector search for code context. ALWAYS inject literal file paths and function signatures. ALWAYS respect token budget limits.
Escalation: Context exceeds token budget -> fail gracefully and narrow scope.`,

    "agents/memory-manager.md": `---
name: memory-manager
description: Controls persistence of long-horizon state via the Beads pattern.
---
Purpose: Controls persistence of long-horizon state via the Beads pattern.
Required Context: @memory/beads.json, @memory/README.md, active task states
Constraints: NEVER delete beads — only archive. ALWAYS merge duplicate memory nodes. ALWAYS link beads to their dependencies.
Escalation: Memory graph corruption -> snapshot + human review.`,

    "agents/README.md": `# Agent Directory
| Agent | File | Purpose | Escalation Target |
|-------|------|---------|-------------------|
| Orchestrator | orchestrator.md | Master coordinator | Human |
| Planner | planner.md | Epics and specs | Human |
| Architect | architect.md | System blueprints | Human Architect |
| Backend Engineer | backend-engineer.md | API & Data | Architect |
| Frontend Engineer | frontend-engineer.md | UI/UX | UI/UX Reviewer |
| Code Reviewer | code-reviewer.md | Enforces rules | Architect |
| Debugging Specialist | debugging-specialist.md | Fixes bugs | Human |
| Testing Engineer | testing-engineer.md | Generates tests | Orchestrator |
| Security Reviewer | security-reviewer.md | Security audits | Orchestrator |
| Documentation Writer | documentation-writer.md | Writes docs | Orchestrator |
| Context Compressor | context-compressor.md | Injects context | Orchestrator |
| Memory Manager | memory-manager.md | Bead management | Human |`,

    // RULES
    "rules/frontend.md": `Frontend-specific rules (loaded only when working in /frontend/):
- Spacing: strict 4px/8px baseline grid. No arbitrary padding/margins.
- Typography: font weights and line heights follow logarithmic scale. Body line-height: 1.5-1.6.
- Transitions: ALL hover/focus/active states MUST have CSS transitions (transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)). Immediate snapping = FAILURE.
- Loading states: skeleton screens matching exact dimensions of incoming data. No spinners for content areas.
- Destructive actions: high visual friction (distinct color + confirmation modal)
- Accessibility: ARIA labels, semantic HTML, keyboard navigability. HARD pre-requisite.
- Icons: SVG only (Heroicons, Lucide). NEVER emoji as UI icons.
- Responsive breakpoints: 375px, 768px, 1024px, 1440px
- Color: no generic red/blue/green. Use curated HSL palettes with dark mode support.
- Component isolation: each component owns its styles. No global CSS leaking.
- Performance: lazy load images, code-split routes, < 100KB initial JS bundle target`,

    "rules/backend.md": `Backend rules (loaded only when working in /backend/):
- All database queries paginated by default (cursor-based preferred)
- API versioning: explicit /v1/, /v2/ in URL paths
- URL format: kebab-case
- JSON payload format: camelCase
- Response envelope: { data: T, meta: { page, total }, errors: Error[] }
- Authentication before payload parsing (authenticate -> authorize -> validate -> process)
- Rate limiting on all public endpoints
- Request ID header on every response for tracing
- Database: use migrations, never manual schema changes
- N+1 query detection: use query analysis in development
- Background jobs: idempotent, retryable, with dead letter queue
- Logging: structured JSON logs with correlation IDs
- Health check endpoint required: GET /health returning { status: 'ok', version, uptime }`,

    "rules/security.md": `Security rules:
- Authenticate ALL requests before parsing payload data
- Never store secrets in code — use environment variables
- All dependencies verified against sanctioned registry
- Input validation at every boundary (Zod schemas preferred)
- SQL parameterized queries only — NEVER string concatenation
- CORS configured explicitly — no wildcard origins in production
- HTTPS enforced in production
- Session tokens: httpOnly, secure, sameSite=strict
- Password hashing: bcrypt with cost factor >= 12
- Rate limit authentication endpoints aggressively
- Log all authentication failures with IP and user agent
- CSP headers configured
- No eval(), no dynamic code execution from user input
- Dependency audit on every CI run`,

    "rules/testing.md": `Testing rules:
- Tests verify behavior through public interfaces, not implementation details
- TDD: red-green-refactor in vertical slices (one test -> one implementation -> repeat)
- Coverage threshold: 80% branch coverage minimum
- Never mock internal collaborators — mock at system boundaries only
- Test naming: \`should [expected behavior] when [condition]\`
- Each test file mirrors its source file: \`foo.ts\` -> \`foo.test.ts\`
- Integration tests > Unit tests > E2E tests (in terms of value)
- Tests must be deterministic — no time-dependent, network-dependent, or order-dependent tests
- Snapshot tests allowed only for serialized output (JSON, HTML) — not for logic
- Every bug fix requires a regression test first
- Test data factories over fixtures when possible`,

    "rules/git.md": `Git workflow rules:
- Branch naming: feature/, fix/, refactor/, docs/, test/ prefixes
- Commit messages: Conventional Commits (feat:, fix:, refactor:, docs:, test:, chore:)
- One logical change per commit
- Agent branches: agent/<agent-name>/<task-id>
- Worktree naming: ../worktree-<agent-name>-<task-id>
- Merge strategy: sequential merge with forced rebase onto main
- Never force-push to main or shared branches
- PR template required (see /templates/PR.md)
- Squash merges for feature branches
- Tag releases with semantic versioning`,

    // STANDARDS
    "standards/naming-conventions.md": `Comprehensive naming guide:
- Files: kebab-case (user-service.ts, auth-controller.ts)
- Directories: kebab-case (user-management/, api-routes/)
- TypeScript: PascalCase for types/interfaces/classes/enums, camelCase for functions/variables/methods
- Constants: SCREAMING_SNAKE_CASE
- Database: snake_case for tables and columns
- API routes: kebab-case (/api/v1/user-profiles)
- Git branches: kebab-case with prefix (feature/add-oauth-login)
- Environment variables: SCREAMING_SNAKE_CASE with prefix (VEYRA_DB_HOST)
- Beads: bd-{number} (bd-1001, bd-1042)`,

    "standards/code-style.md": `Formatting and style:
- Indentation: 2 spaces (no tabs)
- Line length: 100 characters max
- Semicolons: always in TypeScript
- Quotes: single quotes for strings, double for JSX attributes
- Trailing commas: always in multi-line
- Object destructuring: prefer over multiple property access
- Arrow functions: prefer for callbacks, named functions for top-level
- Imports: sorted by category (see rules/global.md), one blank line between categories
- File structure: imports -> types -> constants -> main logic -> exports
- No default exports (except pages in Next.js)
- Prefer readonly/const assertions
- Explicit return types on all exported functions`,

    // CONTEXT SYSTEM
    "context/README.md": `How deterministic context injection works:
- Why not RAG: Embedding search retrieves semantically similar but structurally irrelevant functions. Code is deterministic — lossy summarization forces hallucinated imports.
- Deterministic State Injection: Parse AST, dump raw file paths, explicit function signatures, and hard dependency graphs into the agent's system prompt.
- Context Assembly Pipeline:
  1. Identify target files for the task
  2. Parse dependency graph (imports, exports, references)
  3. Extract function signatures of upstream consumers and downstream providers
  4. Chunk along semantically meaningful boundaries (single class, logical block)
  5. Check against token budget
  6. Inject into agent system prompt as literal code paths
- Context Budget Rules: Max ~150 instructions per agent. If context exceeds budget, narrow scope before proceeding.
- Include a mermaid diagram of the pipeline`,

    "context/repo-map.md": `Generated repository structure map. Create a comprehensive tree showing:
- Every directory and its purpose
- Key files in each directory
- File sizes where relevant
- Status (active/template/generated)`,

    "context/dependency-graph.md": `Template for module dependency tracking:
- Purpose: Maps which modules depend on which
- Format: Table with Module | Depends On | Depended By | Blast Radius
- Instructions for agents to update this when making changes
- Include a mermaid diagram showing example dependency DAG`,

    "context/glossary.md": `Project terminology dictionary:
- Bead: Atomic, trackable unit of work in the memory system
- ACE: Agent Command Environment (human oversight layer)
- AEE: Agent Execution Environment (agent execution layer)
- CRP: Consultation Request Pack (agent-to-human escalation document)
- SPEC: Feature specification document driving implementation
- Worktree: Isolated Git working directory for parallel agent work
- Context Rot: Progressive degradation of agent comprehension in long sessions
- Semantic Drift: Gradual deviation from original intent during autonomous coding
- Comprehension Debt: Human loss of mental model as codebase grows autonomously
- Phase Gate: Mandatory checkpoint requiring verification before proceeding
- Blast Radius: Set of files/modules affected by a proposed change
- Deep Module: Module with simple interface hiding complex implementation (high leverage)
- Shallow Module: Module where interface is nearly as complex as implementation (low leverage)`,

    // PROMPTS
    "prompts/README.md": `How the prompt system works:
- Prompt Inheritance: base -> role -> task
- Dynamic Context: @import syntax pulls in only needed files
- Context Budget: instructions count against token window even with imports
- Negative Prompting: explicit constraints ("Do NOT...") over positive affirmations`,

    "prompts/base/system.md": `Universal operating mechanics for all agents:
- Output in strictly formatted markdown unless JSON is requested
- Always state assumptions before implementing
- Reference file paths using relative notation
- Every code change must include execution evidence
- Use explicit negative constraints over general positive guidance`,

    "prompts/base/critique.md": `Review/critique template:
- Do NOT rewrite the entire file — target only lines surrounding the identified issue
- Do NOT improve adjacent code unless it directly relates to the identified issue
- Do NOT refactor things that aren't broken
- Provide specific line numbers and exact replacement code
- Explain the WHY behind each critique`,

    "prompts/roles/backend-task.md": `Role prompt for backend tasks:
- Load @rules/backend.md and @rules/security.md
- Load API contract document
- Load relevant beads
- Implement using service layer pattern
- Include health check endpoint
- Write integration tests for every endpoint`,

    "prompts/roles/frontend-task.md": `Role prompt for frontend tasks:
- Load @rules/frontend.md
- Load design tokens
- Load @.agent/skills/ui-ux-pro-max/SKILL.md
- Implement using component-first approach
- Ensure ARIA compliance and keyboard navigation
- Test responsive breakpoints`,

    "prompts/roles/review-task.md": `Role prompt for code review:
- Load @rules/global.md and @CLAUDE.md
- Load @checklists/pre-merge.md
- Check for execution evidence
- Validate test coverage impact
- Check for architectural boundary violations`,

    // TEMPLATES
    "templates/SPEC.md": `# Feature Specification: [Title]

## Bead Reference
- Task Bead: bd-XXXX
- Parent Epic: bd-YYYY

## Business Intent
[Why this feature exists — what user problem does it solve?]

## Architectural Boundaries
- **Frontend**: [What UI changes are needed]
- **Backend**: [What API/service changes are needed]
- **Database**: [What schema changes are needed]

## Acceptance Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Non-Functional Requirements
- Performance: [specific targets]
- Security: [specific requirements]
- Accessibility: [specific requirements]

## Out of Scope
[Explicitly list what this feature does NOT include]

## Dependencies
[Other features or systems this depends on]`,

    "templates/PR.md": `## Summary
[One-paragraph description of what this PR does]

## Bead Reference
- Task: bd-XXXX
- Spec: [link to SPEC.md]

## Changes
- [File 1]: [What changed and why]
- [File 2]: [What changed and why]

## Blast Radius
[List modules affected by this change]

## Execution Evidence
\`\`\`
[Paste test output here]
\`\`\`

## Checklist
- [ ] Tests passing
- [ ] Lint clean
- [ ] Type check passing
- [ ] Coverage not decreased
- [ ] Documentation updated
- [ ] Bead status updated`,

    "templates/CRP.md": `# Consultation Request Pack

## Agent
[Agent name and role]

## Context
[What task was being executed]

## Issue
[What went wrong or what decision cannot be made autonomously]

## What Was Tried
1. [Attempt 1 and result]
2. [Attempt 2 and result]
3. [Attempt 3 and result]

## Options Identified
| Option | Pros | Cons | Risk |
|--------|------|------|------|
| A | ... | ... | ... |
| B | ... | ... | ... |

## Recommendation
[Agent's recommended option with reasoning]

## Blocking
[What is blocked until this is resolved]

## Urgency
[Low / Medium / High / Critical]`,

    // CHECKLISTS
    "checklists/pre-commit.md": `Before committing:
- [ ] \`pnpm lint\` passes with zero errors
- [ ] \`pnpm tsc --noEmit\` passes
- [ ] No secrets, API keys, or .env values in staged files
- [ ] Test coverage not decreased (run \`pnpm vitest run --coverage\`)
- [ ] All new functions have JSDoc comments
- [ ] No TODO comments without associated bead ID (TODO(bd-XXXX))
- [ ] Import ordering follows convention
- [ ] No console.log() in production code
- [ ] File length under 300 lines
- [ ] Function length under 40 lines`,

    "checklists/pre-merge.md": `Before merging to main:
- [ ] Code review approved by code-reviewer agent or human
- [ ] All CI checks passing (lint, types, tests)
- [ ] Execution evidence attached to PR
- [ ] Bead status updated (in_progress -> resolved)
- [ ] No unresolved CRPs blocking this change
- [ ] Documentation updated if public API changed
- [ ] Rebased onto latest main (no merge commits)
- [ ] Blast radius reviewed — no unintended side effects
- [ ] Security reviewer approved (if auth/data changes)
- [ ] Test coverage maintained or increased`,

    "checklists/ui-delivery.md": `Before delivering UI code:
Visual Quality:
- [ ] No emojis as icons (SVG only)
- [ ] All icons from consistent set (Heroicons/Lucide)
- [ ] Hover states don't cause layout shift
- [ ] 4px/8px baseline grid followed

Interaction:
- [ ] All clickable elements have cursor: pointer
- [ ] Transitions smooth (150-300ms, cubic-bezier)
- [ ] Focus states visible for keyboard navigation
- [ ] Loading states use skeleton screens

Accessibility:
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] prefers-reduced-motion respected
- [ ] ARIA labels on interactive elements
- [ ] Tab order is logical

Responsive:
- [ ] Works at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets >= 44px`,

    // DOCS
    "docs/getting-started.md": `How to use this repository:
1. Clone the repository
2. Read CLAUDE.md — understand the agent constitution
3. Review agents/ — understand available agent roles
4. Initialize memory: beads.json already has root bead
5. For a new project: copy this repo, update CLAUDE.md with your stack, configure rules/
6. For feature development: create SPEC.md using templates/SPEC.md, then trigger feature-development workflow
7. For bug fixing: create incident bead in memory/, then trigger bug-fixing workflow`,

    "docs/agent-guide.md": `How to work with agents:
- Understanding agent roles: quick reference table of all agents
- Triggering workflows: how to initiate each workflow type
- Reading CRPs: how to respond to agent escalations
- Reviewing beads: how to audit agent decisions
- Override patterns: when and how humans override agent decisions
- Common failure modes: context rot, semantic drift, comprehension debt`,

    "docs/architecture-overview.md": `High-level system overview:
- Dual-modality workbench concept (ACE + AEE)
- Agent interaction topology (mermaid diagram)
- Memory system architecture (mermaid diagram)
- Context assembly pipeline (mermaid diagram)
- Merge strategy visualization (mermaid diagram)
- Anti-patterns to avoid (with explanations)`,

    // ORCHESTRATION
    "orchestration/spawn-rules.md": `When to spawn subagents:
- Tasks MUST meet strict independence criteria
- Tasks must be spec-scoped (bounded by a SPEC.md)
- NEVER spawn for highly-coupled refactoring
- Recursive delegation capped at 2 levels: Orchestrator -> Specialist -> Micro-agent
- Each subagent gets isolated Git worktree
- Subagent naming: agent-<role>-<task-bead-id>

When NOT to spawn:
- State-dependent operations
- Tasks sharing same files (creates merge conflicts)
- Tasks where context sync overhead > parallel benefit`,

    "orchestration/merge-strategy.md": `Sequential merge + rebase protocol:
1. Each agent works in isolated worktree on feature branch
2. When agent completes, code-reviewer reviews the branch
3. If approved: checkout main, merge feature/first
4. All remaining branches MUST rebase onto new main before merging
5. If rebase fails (semantic drift): spawn conflict-resolution agent or CRP
6. After all merges: run full test suite on main

Include mermaid sequence diagram.`,

    "orchestration/worktree-protocol.md": `Git worktree management:
- Creating: \`git worktree add ../worktree-<agent>-<task> -b agent/<agent>/<task>\`
- Naming convention: ../worktree-backend-bd-3001
- Cleanup: \`git worktree remove ../worktree-<name>\` after merge
- Never leave orphaned worktrees
- Each worktree has independent staging index but shared object store`,

    // GOVERNANCE
    "governance/security-policy.md": `Security governance:
- All external dependencies must be audited before inclusion
- No dependencies from unsanctioned registries
- Secret scanning enabled in CI (detect API keys, tokens, passwords)
- Credential rotation schedule
- Incident response: detection -> containment -> eradication -> recovery -> lessons learned
- Agent permissions: agents cannot access production secrets, only test/dev credentials
- MCP tool sandboxing: terminal commands restricted to allowlist`,

    "governance/data-retention.md": `Data lifecycle:
- Beads: never deleted, archived after 90 days of resolved status
- Logs: rotated weekly, retained for 30 days
- Worktrees: cleaned up within 24 hours of merge
- Agent session data: not persisted (stateless by design, state lives in beads)
- Context dumps: regenerated on demand, not cached long-term
- Incident reports: retained permanently`,

    // MEMORY
    "memory/beads.json": `[
  {
    "id": "bd-0001",
    "type": "project_initialization",
    "status": "resolved",
    "title": "Initialize Veyra AI-Native Engineering OS",
    "description": "Created the repository structure for the AI-native engineering operating system. Established agent definitions, rules, memory system, workflows, and orchestration protocols.",
    "dependencies": [],
    "author": "Human-Orchestrator",
    "timestamp": "2026-05-24T18:00:00Z",
    "tags": ["infrastructure", "initialization"],
    "evidence": "Repository structure created with all directories and configuration files."
  }
]`,
    "memory/README.md": `Comprehensive guide to the Beads memory system:
- What is a Bead: An atomic, trackable unit of work stored as a JSON object in Git
- Why Beads: Agents suffer progressive dementia in long tasks. Beads provide instant state recovery.
- Bead Schema: id, type, status, title, description, dependencies, author, timestamp, tags, evidence
- Bead Types: architectural_decision, bug_discovery, task_state, incident, consensus, requirement
- Bead Statuses: open, in_progress, resolved, blocked, archived
- How to Use:
  - Creating: Add a new object to beads.json with a unique bd-XXXX id
  - Querying: Search beads.json for specific IDs or filter by type/status
  - Linking: Set dependencies array to reference parent beads
  - Recovering: When agent session crashes, new agent reads beads.json to recover full state
- Rules: NEVER delete beads. NEVER modify resolved beads. ALWAYS link to parent beads. ALWAYS include evidence.`,
    
    "memory/templates/bead-template.json": `{
  "id": "bd-XXXX",
  "type": "[architectural_decision|bug_discovery|task_state|incident|consensus|requirement]",
  "status": "[open|in_progress|resolved|blocked|archived]",
  "title": "[Concise title of the decision/task/incident]",
  "description": "[Detailed description with context and rationale]",
  "dependencies": ["bd-YYYY"],
  "author": "[Agent-Name or Human-Orchestrator]",
  "timestamp": "[ISO 8601 timestamp]",
  "tags": ["[relevant", "tags]"],
  "evidence": "[Test output, log references, or verification proof]"
}`,
    "memory/templates/decision-bead.json": `{
  "id": "bd-1042",
  "type": "architectural_decision",
  "status": "resolved",
  "title": "Adopt Sequential Merge for Multi-Agent Branching",
  "description": "Parallel agents writing to shared Git refs caused lock contention and silent overwrites. Decision: implement isolated git worktrees per agent with sequential merge + forced rebase strategy.",
  "dependencies": ["bd-1020"],
  "author": "Agent-Orchestrator",
  "timestamp": "2026-05-24T17:34:00Z",
  "tags": ["git", "orchestration", "multi-agent"],
  "evidence": "Tested with 3 concurrent agents — zero merge conflicts when using worktree isolation."
}`,
    "memory/templates/incident-bead.json": `{
  "id": "bd-2001",
  "type": "incident",
  "status": "resolved",
  "title": "Auth Service Null Pointer on Unvalidated OAuth Callback",
  "description": "Stack trace showed NullReferenceError in auth-service.ts:142. Root cause: OAuth provider returns null for email field when user has private email settings. Fix: add null coalescing with fallback to provider username.",
  "dependencies": ["bd-1055"],
  "author": "Agent-Debugging-Specialist",
  "timestamp": "2026-05-24T15:22:00Z",
  "tags": ["bug", "auth", "oauth", "null-pointer"],
  "evidence": "Regression test added: auth-service.test.ts:89 — covers null email callback scenario. CI passing."
}`,
    "memory/templates/task-bead.json": `{
  "id": "bd-3001",
  "type": "task_state",
  "status": "in_progress",
  "title": "Implement OAuth Google Login Flow",
  "description": "Frontend: AuthButton component using design tokens. Backend: /api/v1/auth/google/callback endpoint. Database: User schema update with oauth_provider and oauth_id fields.",
  "dependencies": ["bd-1042", "bd-0500"],
  "author": "Agent-Orchestrator",
  "timestamp": "2026-05-24T16:00:00Z",
  "tags": ["feature", "oauth", "authentication"],
  "evidence": "Spec approved. Backend worktree created. Frontend worktree created."
}`

};

for (const [relPath, content] of Object.entries(filesToCreate)) {
    const fullPath = path.join(baseDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
}

console.log('Successfully created all missing files.');
