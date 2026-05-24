Data lifecycle:
- Beads: never deleted, archived after 90 days of resolved status
- Logs: rotated weekly, retained for 30 days
- Worktrees: cleaned up within 24 hours of merge
- Agent session data: not persisted (stateless by design, state lives in beads)
- Context dumps: regenerated on demand, not cached long-term
- Incident reports: retained permanently