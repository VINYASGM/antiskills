Sequential merge + rebase protocol:
1. Each agent works in isolated worktree on feature branch
2. When agent completes, code-reviewer reviews the branch
3. If approved: checkout main, merge feature/first
4. All remaining branches MUST rebase onto new main before merging
5. If rebase fails (semantic drift): spawn conflict-resolution agent or CRP
6. After all merges: run full test suite on main

Include mermaid sequence diagram.