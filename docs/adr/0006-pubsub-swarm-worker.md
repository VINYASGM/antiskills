# ADR 0006: Pub/Sub Swarm Worker Loop
 
* **Status:** Accepted
* **Date:** 2026-06-14
 
## Context
Multi-agent swarms require an asynchronous worker daemon to coordinate tasks based on dependency resolution and event triggers, avoiding rigid orchestrator bottlenecks.
 
## Decision
Implement a background daemon microservice (`bin/daemon.js`) executing a 500ms polling loop that process-subscribes to `agent_events`. It coordinates tasks by tracking parent dependencies and cascading failures to downstream tasks (using standard database claims to guarantee safe transitions). If a task's dependencies are resolved, the daemon routes and claims it for the primary role using `bin/router.js` and publishes a `task_allocated` event. The CLI is updated with `daemon start [--background]`, `daemon stop`, `daemon status`, and `daemon run` commands.
 
## Consequences
Enables lightweight, decoupled topic-based task allocation, robust dependency cascading, automated startup recovery of stale tasks, and background execution telemetry on Windows.
