# Technical Requirements Document — Veyra

**Version:** 3.1
**Author:** VEYRA-OS / ANTIGRAVITY
**Date:** 2026-06-07
**Status:** Active

---

## 1. Technical Stack

Veyra uses plain-text Markdown, JSON, SQLite, and Python/Node graph adapters, making the core operating layer highly extensible and compatible.

| Technology | Role |
|---|---|
| **Git** | Standard atomic commits and integration-branch checkouts. |
| **Node.js 20+** | CLI engine runtime (`better-sqlite3` for query caching; `zod` for contract validation). |
| **Vitest 4+** | High-speed testing framework with auto-injected global hooks for proof-carrying code verification. |
| **Python 3.10+ / DuckDB / NetworkX** | Background engines for MCP memory graph server, performing NetworkX clustering and DuckDB indexing. |
| **Vector Embeddings (Ollama/HuggingFace)** | Local, high-speed embedding generation for constrained semantic RAG searching. |
| **Markdown** | System specifications, governance checklist logs, and constitutional rules. |
| **JSON** | Broadcasted intents, proof-carrying contract files, and direct mail messages. |
| **Go + Playwright** | Headless browser execution, visual viewport capturing, and responsive DOM audits. |

---

## 2. Core V3 Schemas & Data Formats

### 2.1 Contract Proof Definition Schema (`checklists/contract-XXXX.json`)
 प्रोग्रामेटिक validations that must be verified before patches are merged.
```json
{
  "contractId": "ct-0042",
  "taskId": "bd-0003",
  "targetFiles": ["src/components/UserProfile.tsx"],
  "rules": {
    "noConsoleLogs": true,
    "requireTypeScriptTypes": true,
    "maxFileSizeLines": 250,
    "requiredTests": ["tests/UserProfile.test.tsx"]
  },
  "formalProofs": [
    {
      "type": "typecheck",
      "command": "npm run typecheck"
    },
    {
      "type": "vitest",
      "command": "npx vitest run tests/UserProfile.test.tsx"
    }
  ]
}
```

### 2.2 MCP Graph Memory Node Protocol
Memory beads are stored as nodes with bidirectional semantic edges in the DuckDB + NetworkX broker.
```json
{
  "node": {
    "id": "bd-0002",
    "type": "architectural_decision",
    "title": "Decouple Memory to MCP Graph",
    "summary": "Shift persistent history from flat files to an embeddable NetworkX graph database to enable cluster compression.",
    "timestamp": "2026-05-26T16:00:00Z"
  },
  "edges": [
    {
      "targetId": "bd-0001",
      "relation": "supersedes",
      "weight": 1.0
    }
  ]
}
```

### 2.3 Circuit Breaker Governance Schema
State tracking schema representing agent retry status to prevent token exhaustion.
```json
{
  "transactionId": "tx-8891",
  "taskId": "bd-0003",
  "agents": ["frontend-engineer", "testing-engineer"],
  "failedAttemptsCount": 2,
  "maxThreshold": 3,
  "status": "active",
  "history": [
    {
      "attempt": 1,
      "failureReason": "Vitest: expected profile_picture to be defined, got undefined",
      "diffSnippet": "--- a/src/components/UserProfile.tsx\n..."
    }
  ]
}
```

### 2.4 Task Queue & Concurrency Schema
SQLite-level runtime locking properties for high-concurrency swarms. Ephemeral fields live inside the database, while core statuses sync back to Markdown frontmatter JIT.
```json
{
  "id": "bd-0003",
  "status": "claimed",
  "claimed_by": "frontend-engineer",
  "claimed_at": "2026-05-27T15:00:00.000Z"
}
```

### 2.5 Dashboard Telemetry Schema
A unified runtime schema mapping active database locks, governance transactions, task completion progress, and active patch channels.
```json
{
  "timestamp": "2026-06-07T12:00:00.000Z",
  "beadStats": {
    "total": 12,
    "open": 2,
    "claimed": 2,
    "in_progress": 1,
    "resolved": 6,
    "failed": 1,
    "completionRate": 50
  },
  "activeLocks": [
    {
      "id": "bd-0003",
      "title": "Build User Profile View",
      "status": "claimed",
      "claimed_by": "frontend-engineer",
      "claimed_at": "2026-05-27T15:00:00.000Z",
      "durationMs": 900000
    }
  ],
  "governanceTransactions": [
    {
      "transactionId": "tx-8891",
      "taskId": "bd-0003",
      "agents": ["frontend-engineer", "testing-engineer"],
      "failedAttemptsCount": 2,
      "maxThreshold": 3,
      "status": "active",
      "escalationReportExists": false
    }
  ],
  "patchChannels": ["channel_alpha", "channel_beta"]
}
```

---

## 3. Directory Structure

```
veyra/
├── bin/                     # Veyra Core Engine CLI
│   ├── veyra.js             # CLI Entrypoint (JIT engine bootloader)
│   ├── db.js                # Local JIT memory cache with timestamp checks
│   ├── context.js           # Hybrid Context Assembly (AST import crawler + Semantic Vector search)
│   ├── intent.js            # Ephemeral intent publisher & semantic checker
│   ├── patch.js             # VFS patch applicator and collision scanner
│   ├── verify.js            # Contract-proven compiler & Vitest validation run
│   ├── governance.js        # State-machine circuit breaker & automatic escalations
│   ├── router.js            # Dual Explorer-Architect loop allocator
│   ├── ui.js                # Procedural terminal styling primitives
│   └── dashboard.js         # Swarm Status telemetry and UI dashboard
├── memory-mcp-server/       # MCP Graph Server Core
│   ├── server.py            # Python MCP entrypoint
│   ├── graph.py             # NetworkX + DuckDB graph database orchestrator
│   └── compress.py          # Episodic memory cluster summarizer
├── agents/                  # Agent-as-Code definitions
│   ├── orchestrator.md
│   ├── explorer.md          # Fast REPL prototyping agent
│   ├── architect.md         # Design/spec formalization agent
│   ├── implementer.md       # Target code generator
│   └── testing-engineer.md
├── checklists/              # Formal code contracts (*.json)
├── memory/                  # Direct message mailboxes (`memory/inbox/`)
├── tests/                   # Strict TDD Vitest suites
│   └── bin/
│       └── dashboard.test.js # Vitest test coverage for the dashboard
├── context.md               # Central developer cheat sheet
├── PRD.md                   # Product Requirements Document
├── TRD.md                   # Technical Requirements Document (this file)
├── Architecture.md          # System Architecture Topology
├── State.md                 # Active Project State
└── ToDo.md                  # System Roadmap
```

---

## 4. V3 Coordination Algorithms

### 4.1 Hybrid Context Assembly
Deterministic parsing combined with vector similarity:
1. **AST Blast Radius**: Crawls imports up to 2 levels to catch direct caller dependencies.
2. **Semantic Vector Search**: Generates a local embedding of the task spec, running similarity matching over the codebase to yield indirect config or business logic touchpoints.
3. **Budget Ranking**: Concatenates and limits injection to a hard token threshold, ensuring optimal coverage without exceeding contexts.

### 4.2 Explorer-Architect Loop
1. **Explore**: Dynamic router deploys the *Explorer* agent to an isolated playground. The Explorer edits files, fires the local compiler/REPL, and logs outputs.
2. **Synthesize**: The *Architect* reads the explorer's logs, updates `Architecture.md` / `TRD.md` / contracts, and outputs a concrete implementation checklist.
3. **Execute**: The *Implementer* and *Testing* agents execute changes against the checklist under strict contract validation.

### 4.3 State-Machine Circuit Breaker
1. **Observe**: Every failed verification cycle increments `failedAttemptsCount` in `governance.js`.
2. **Halt**: On the 3rd consecutive validation failure, the state machine switches from `active` to `tripped`.
3. **Escalate**: The worktree patch is buffered, all agent tasks are frozen, and a highly granular failure report (containing the stack trace, last applied diff, and agent discussion logs) is rendered directly to the human orchestrator.

### 4.4 Task Queue Concurrency Locking
1. **Atomic Locking (`claim`)**: Agents claim a bead by executing:
   `UPDATE beads SET claimed_by = ?, claimed_at = ? WHERE id = ? AND claimed_by IS NULL AND status IN ('open', 'failed')`
   If the rows affected is `0`, the task has already been claimed by another worker (concurrency lock).
2. **State Transitions**: The system transitions through `open -> claimed -> in_progress -> resolved | failed`. Transition triggers (`claim()`, `release()`, `start()`, `complete()`, `fail()`, `reopen()`) write to SQLite and JIT-synchronize `status` to the bead's physical JSON file.
3. **Stale Claim Expiry**: Sweeps run dynamically during `claim()` calls to auto-release tasks stuck in a `claimed` state for more than 30 minutes back to `open`, preventing deadlocks from crashed agent processes.

### 4.5 Swarm Dashboard Telemetry rendering
1. **Data Aggregation**: Pulls JIT statistics from `BeadsDB`, scans `.agent/governance/tx-*.json` (alongside `escalation-*.md` checks), and reads the directories inside `patches/`.
2. **Visual Layout Primitives**: Utilizes `bin/ui.js` modules:
   - `progressBar` for task queue percentage completion.
   - `drawBox` for task queue statistics block.
   - `drawTable` for the concurrency lock registry and governance transaction tracker, using bright coloring rules for status transitions (`tripped` breaker colored bright red, `active` locks colored magenta).
3. **CLI Invocation**: Integrated directly as a top-level command `dashboard` or `ui dashboard` in `bin/veyra.js`.

### 4.6 Graphify Enrichment Core
1. **Security & Sensitive Paths Screening (`bin/context.js`)**:
   - Screen files and folder segments JIT before AST parsing or vector scoring.
   - Exclude paths containing sensitive patterns (e.g. `.git`, `.ssh`, `credentials`, `secrets`, `.env`, private keys).
   - Integrate decompressed ratio checks (cap at 200:1) on zip/XML-based Office documents to prevent zip-bomb exploits.
2. **Multi-Language AST Parsing Fallback (`bin/context.js`)**:
   - Extend `resolveImports()` and file discovery to scan non-JS/TS codebases.
   - Use regex-based symbol and import parsers for Apex (`.cls`/`.trigger`), Python (`.py`), Go (`.go`), Rust (`.rs`), and SQL (`.sql`).
   - Parse extensionless scripts by inspecting shebang lines (e.g., tokenizing `env -S python3 -u` SYNOPIS).
3. **Topological Graph Metrics (`memory-mcp-server/graph.py`)**:
   - Run NetworkX Degree Centrality and PageRank on memory graphs (filtering out stubs, builtins, and mocks) to compute "God Nodes".
   - Compute "Surprising Connections" between nodes by checking cross-community modularity (Louvain/Leiden) and cross-language boundaries.
4. **Interactive HTML Rendering (`bin/context.js`)**:
   - Generate `context/tree.html` presenting a D3.js collapsible hierarchical file-to-symbol tree.
   - Generate `context/graph.html` presenting a self-contained Mermaid-based callflow architecture report with cross-community edge mapping.

