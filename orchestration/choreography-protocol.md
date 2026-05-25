# Actor Model Choreography Protocol — Veyra OS

This protocol replaces the monolithic Hub-and-Spoke coordination bottleneck (where the Orchestrator micro-manages all subagent states) with a decentralized **Actor Model Choreography**. 

Agents operate as autonomous actors, communicating directly via structured message payloads deposited in asynchronous local inboxes.

---

## 1. Inbox Architecture

Each agent has an assigned, virtual mailbox directory located in the shared project environment:
```
memory/inbox/
├── msg-{recipient_id}-{sender_id}-{timestamp}.json
```
Writing a JSON file to this directory sends a message to the target agent. The Veyra CLI registers these queues and notifies agents during their execution step.

---

## 2. Standardized Message Schemas

Agents communicate using strict JSON payloads to request services, share designs, or check statuses.

### 2.1 API Contract Request
*Sent by: Frontend Engineer* → *Received by: Backend Engineer*
Used to JIT-negotiate data structures before writing UI code.
```json
{
  "type": "api_contract_request",
  "sender": "frontend-engineer",
  "recipient": "backend-engineer",
  "timestamp": "2026-05-25T20:10:00Z",
  "payload": {
    "route": "/api/v1/users",
    "method": "POST",
    "requiredFields": ["username", "email"],
    "notes": "Need user creation payload structure and response schema."
  }
}
```

### 2.2 API Contract Response
*Sent by: Backend Engineer* → *Received by: Frontend Engineer*
```json
{
  "type": "api_contract_response",
  "sender": "backend-engineer",
  "recipient": "frontend-engineer",
  "timestamp": "2026-05-25T20:11:00Z",
  "payload": {
    "route": "/api/v1/users",
    "schema": {
      "request": {
        "username": "string",
        "email": "string",
        "role": "string (optional)"
      },
      "response": {
        "id": "string (uuid)",
        "username": "string",
        "email": "string",
        "createdAt": "string (ISO)"
      }
    }
  }
}
```

### 2.3 Test Execution Request
*Sent by: Developer Agent* → *Received by: Testing Engineer*
Directly triggers JIT test generation and execution for targeted files.
```json
{
  "type": "test_execution_request",
  "sender": "backend-engineer",
  "recipient": "testing-engineer",
  "timestamp": "2026-05-25T20:15:00Z",
  "payload": {
    "targetFiles": ["src/services/user-service.ts"],
    "testPath": "tests/user-service.test.ts",
    "mode": "TDD_REPL"
  }
}
```

### 2.4 Visual Layout Audit Request
*Sent by: Frontend Engineer* → *Received by: VLM UI Reviewer*
```json
{
  "type": "visual_audit_request",
  "sender": "frontend-engineer",
  "recipient": "vlm-ui-reviewer",
  "timestamp": "2026-05-25T20:20:00Z",
  "payload": {
    "component": "UserProfileCard",
    "screenshotPath": "memory/evidence/visual/user_profile_desktop.png",
    "viewports": ["mobile", "desktop"],
    "specFile": "docs/design/profile-spec.md"
  }
}
```

---

## 3. High-Frequency TDD REPL Loop

Instead of phase-gated waterfalls, agents run a tight **Red-Green-Refactor loop**:
1. **Red**: Generate a failing test first. If a frontend endpoint is requested, write a mock or failing unit test simulating the endpoint call.
2. **Green**: Write the minimal code needed to make the test pass.
3. **Refactor**: Clean up implementation without altering tests.
4. **Negotiation Protocol**: If an agent uncovers a library blocker or schema issue during the implementation step, they do NOT fail the pipeline. They immediately write a plan-amendment message to their peer (e.g. Architect or Backend) and update their JIT plan in `implementation-plan.md` recursively.

---

## 4. Time-To-Live (TTL) & Dead-Letter Queue (DLQ)
*(Added in Phase 6)*

To prevent multi-agent hallucination deadlocks (e.g., two agents endlessly messaging each other without merging code):
- **TTL Constraint**: An agent is strictly bound to a 3-message loop TTL per task without resolving a merge conflict. 
- **Circuit Breaker**: If the TTL is exceeded, the agent must automatically **Halt Execution** and move the message/state to the **Dead-Letter Queue (DLQ)**.
- **Escalation**: DLQ events are surfaced immediately to the Human Orchestrator for manual intervention.
