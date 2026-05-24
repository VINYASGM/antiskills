When to spawn subagents:
- Tasks MUST meet strict independence criteria
- Tasks must be spec-scoped (bounded by a SPEC.md)
- NEVER spawn for highly-coupled refactoring
- Recursive delegation capped at 2 levels: Orchestrator -> Specialist -> Micro-agent
- Each subagent gets isolated Git worktree
- Subagent naming: agent-<role>-<task-bead-id>

When NOT to spawn:
- State-dependent operations
- Tasks sharing same files (creates merge conflicts)
- Tasks where context sync overhead > parallel benefit