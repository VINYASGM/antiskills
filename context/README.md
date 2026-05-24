How deterministic context injection works:
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
- Include a mermaid diagram of the pipeline