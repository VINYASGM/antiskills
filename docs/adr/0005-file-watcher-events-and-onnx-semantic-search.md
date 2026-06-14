# ADR 0005: Rust File Watcher Events & ONNX Semantic Search Integration

* **Status:** Accepted
* **Date:** 2026-06-14

## Context
Caches can grow stale without JIT cache invalidation, and lexical search (TF-IDF) misses semantic query relationships.

## Decision
Rust file watcher emits change/delete events to `agent_events` in `beads.db`. Python `vector_search.py` queries pre-computed ONNX embeddings from `.agent/memory.sqlite` and calculates cosine similarity.

## Consequences
Instant cache invalidation on file modifications, high semantic relevance, and robust TF-IDF fallback if ONNX fails.
