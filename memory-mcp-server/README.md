# Memory MCP Server

A local-first, blazing fast Memory Server for AI-native coding agents, built in Rust. It exposes Model Context Protocol (MCP) tools over STDIO, allowing AI agents to seamlessly search, index, and log their actions against a local codebase.

## Architecture

This server implements the **Tri-Layer Memory Stack**:
1. **Episodic Memory**: An append-only log of agent actions (stored in SQLite).
2. **Semantic Memory**: Context files (`CONTEXT.md`, `TASKS.md`) read directly from the `.agent/state` directory.
3. **Structural Memory**: A hybrid graph and vector index. It uses `tree-sitter-rust` to parse AST boundaries and `ort` (ONNX) to generate local embeddings for codebase chunks.

## Prerequisites

- **Rust** (and MSVC C++ Build Tools on Windows)
- **ONNX Model**: The server looks for `models/bge-small-en-v1.5.onnx` and `models/tokenizer.json` in the project root.

## Running the Server

```bash
cargo run --release
```

Because it uses the MCP protocol over STDIO, you can connect to it using any standard MCP client (like the `@modelcontextprotocol/sdk` in Node or Python).

## Exposed MCP Tools

- `record_event(action, result)`: Logs a timestamped event to the episodic memory timeline.
- `get_project_state()`: Retrieves the current working context from `.agent/state/`.
- `deep_query(intent, include_dependencies)`: Performs a hybrid vector search (cosine similarity) against the codebase. If `include_dependencies` is true, it performs a SQL JOIN to pull in AST structural relationships.
- `trigger_reindex(path)`: Forces the background worker pool to re-parse and embed a specific file.
