# Vibecoding Playbook: Veyra + Antigravity

Veyra is designed to be the ultimate structural backbone for **vibecoding** inside Antigravity. By combining Antigravity's powerful native skills, subagents, and slash commands with Veyra's deterministic memory and worktree isolation, you can scale your development velocity infinitely without losing context or corrupting your codebase.

---

## The Vibecoding Loop

### 1. The Spec Phase (Solidifying the Vibe)
Before writing code, you need to turn the "vibe" into a strict specification that agents can follow without hallucinating.

**Antigravity Tools to Use:**
- **`/grill-me`**: Type `/grill-me on the new Auth flow` to have the agent interrogate your vague ideas until a concrete spec is formed.
- **`to-prd` Skill**: Once the chat has converged on the design, ask the agent to use the `to-prd` skill to write it down.
- **Veyra Action**: Create a Memory Bead for the decision.
  ```bash
  veyra bead create "Finalized OAuth Flow Architecture"
  ```

### 2. The Prototype Phase (Testing the Vibe)
If the architectural path is ambiguous, do not commit to it in the main branch.

**Antigravity Tools to Use:**
- **`prototype` Skill**: Ask the agent to use the `prototype` skill to build a throwaway React UI or state machine. 
- **Veyra Action**: You do not need to create a Veyra worktree for throwaway prototypes. Let the agent work in `scratch/`.

### 3. The Implementation Phase (Scaling the Work)
When it's time to build, you don't write the code. You orchestrate.

**Veyra Action:**
Assemble the perfect context for the task using the AST analyzer:
```bash
veyra context assemble bd-0004
```
Create an isolated Git worktree so the agent doesn't touch your `main` branch:
```bash
veyra worktree create frontend-engineer bd-0004
```

**Antigravity Tools to Use:**
- **`invoke_subagent`**: Delegate the task to a subagent. Give the subagent the context compiled by Veyra and tell it to work *strictly* inside the `veyra-worktree-frontend-engineer-bd-0004` directory.
- **`/goal`**: If it's a massive refactor, use the `/goal` slash command so the agent runs continuously overnight until the test suite passes.

### 4. The Debugging Phase (Fixing the Vibe)
If the subagent fails or the `veyra lint` catches a constitutional violation, don't guess the problem.

**Antigravity Tools to Use:**
- **`diagnose` Skill**: Instruct the agent to use the `diagnose` skill. It will enter a disciplined reproduction-minimization-patch loop.
- **`tdd` Skill**: If the bug is tricky, ask the agent to use the `tdd` skill to write a failing test first.

### 5. The Integration Phase (Merging the Work)
Once the subagent confirms the tests pass in its isolated worktree.

**Veyra Action:**
Run the optimistic concurrent merge. Veyra will analyze the AST blast radius.
```bash
veyra worktree merge agent/frontend-engineer/bd-0004 agent/backend-engineer/bd-0005
```
If they don't overlap, Veyra merges them in parallel. Clean up the worktree, and the loop is complete.
