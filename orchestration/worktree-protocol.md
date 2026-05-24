Git worktree management:
- Creating: `git worktree add ../worktree-<agent>-<task> -b agent/<agent>/<task>`
- Naming convention: ../worktree-backend-bd-3001
- Cleanup: `git worktree remove ../worktree-<name>` after merge
- Never leave orphaned worktrees
- Each worktree has independent staging index but shared object store