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
| **Gemini VLM API** | Multimodal Layout Auditing (via `gemini-1.5-flash` model). |
| **Base64 Encoding** | Converts screenshots and Figma design mockups to base64 data URIs for vision model ingestion. |
| **JSON Reports** | Formats visual regression, coordinate, contrast, and layout alignment audit results into structured reports. |

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

### 2.6 Visual Review Audit Report Schema (`memory/evidence/visual/vlm_audit_report.json`)
Consolidates layout, responsive formatting, and contrast verification results across viewports using vision models or fallback local engines.
```json
{
  "timestamp": "2026-06-13T14:18:05.000Z",
  "targetUrl": "http://localhost:3000",
  "geminiApiActive": true,
  "viewports": {
    "desktop": {
      "viewport": "1440x900",
      "status": "PASS",
      "apiCallTimeMs": 2450,
      "violations": []
    },
    "tablet": {
      "viewport": "768x1024",
      "status": "PASS",
      "apiCallTimeMs": 1980,
      "violations": []
    },
    "mobile": {
      "viewport": "375x667",
      "status": "FAIL",
      "apiCallTimeMs": 2100,
      "violations": [
        {
          "id": "low-contrast-text",
          "selector": "div.hero > p.description",
          "description": "Text color contrast ratio is 2.4:1, which is below the WCAG AA minimum threshold of 4.5:1."
        }
      ]
    }
  },
  "summary": {
    "totalViolations": 1,
    "status": "FAILED"
  }
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
│   ├── dashboard.js         # Swarm Status telemetry and UI dashboard
│   └── visual-review.js     # Multimodal VLM responsive layout auditor

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
The Graphify Enrichment Core enhances static code indexing and context assembly with advanced JIT security, multi-language support, topological graph metrics, and interactive visualizations.

#### 4.6.1 JIT Security & Sensitive Path Screening (`bin/context.js`)
- **Blocklist & Exclusion Matching:** The JIT crawler filters out sensitive files and directories before tokenization or semantic vector scoring using a strict path-based blocklist:
  - Directory exclusions: `node_modules`, `.git`, `.ssh`, `.idea`, `.vscode`, `dist`, `build`.
  - File exclusions: `.env`, `*.pem`, `*.key`, `id_rsa`, `id_dsa`, `netrc`, `credentials`, `secrets.json`, `config.local.json`.
- **Sensitive Key Pattern Matching:** File contents are scanned with regexes targeting API keys, database connection strings, and authorization headers:
  - Generic token regex: `/(?:key|token|secret|password|passwd|auth)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/gi`
  - Private key block check: `/-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----/`
  Files triggering these matches are completely excluded from the index, and a warning is logged.

#### 4.6.2 Zip-Bomb and Resource Exhaustion Defense (`bin/context.js`)
- **Pre-flight Archive Auditing:** Before extracting or indexing compressed documents (e.g., zip-based `.xlsx`, `.docx`, or `.zip` files), the crawler reads the file header (central directory record) to determine the sum of uncompressed sizes without allocating memory for decompression.
- **Verification Rule:**
  - Let $S_{comp}$ be the compressed file size on disk.
  - Let $S_{uncomp}$ be the total size of all files inside the archive when decompressed.
  - The compression ratio $R = \frac{S_{uncomp}}{S_{comp}}$ must not exceed `200.0`.
  - The total uncompressed size $S_{uncomp}$ must not exceed `52,428,800` bytes (50 MB).
- **Enforcement:** If $R > 200.0$ or $S_{uncomp} > 50\text{ MB}$, the file is flagged as a potential Zip-bomb, decompression is aborted immediately, and the file is omitted from indexing.

#### 4.6.3 Extensionless Script Shebang Parsing (`bin/context.js`)
- **Interpreter Detection Flow:** When the crawler encounters a file lacking a standard extension, it reads the first 256 bytes to inspect the shebang line.
- **Parsing logic:**
  1. Extract the shebang string: Match `^#!(.+)$` on the first line.
  2. Normalize the path (e.g. `/usr/bin/env python3` -> `python3`, `/bin/bash` -> `bash`).
  3. Tokenize arguments (e.g., `env -S node --harmony` -> base interpreter: `node`, argument flags: `--harmony`).
- **Language mapping lookup:**
  - `python`, `python3` $\rightarrow$ Python (`.py`) parser.
  - `node`, `nodejs` $\rightarrow$ JavaScript (`.js`) parser.
  - `sh`, `bash`, `zsh` $\rightarrow$ Bash (`.sh`) parser.
  - `perl` $\rightarrow$ Perl (`.pl`) parser.
  - `ruby` $\rightarrow$ Ruby (`.rb`) parser.
  If no match is found, it defaults to a plain-text token fallback.

#### 4.6.4 Multi-Language Crawler & Regex Parsers (`bin/context.js`)
To crawl non-JS/TS codebases without requiring heavy language server binaries, the indexing crawler executes fast regex-based AST extraction pipelines:
- **Python Imports (`.py`):**
  - Pattern 1 (from imports): `/^\s*from\s+([\w.]+)\s+import\s+([\w\s,*(]+)/gm`
  - Pattern 2 (direct imports): `/^\s*import\s+([\w\s,.]+)/gm`
- **Go Imports (`.go`):**
  - Single-line and multi-line block import matcher: `/import\s+(?:(?:"[^"]+")|\((?:\s*(?:"[^"]+")\s*)*\))/g`
- **Rust Imports (`.rs`):**
  - Pattern: `/^\s*(?:pub\s+)?use\s+([^;]+);/gm`
- **Apex (`.cls` / `.trigger`):**
  - Extracted using class definition and trigger references: `/(?:extends|implements)\s+(\w+)/gi` and `/trigger\s+\w+\s+on\s+(\w+)/gi`
- **SQL (`.sql`):**
  - Dynamic table dependencies parser: `/\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi`

#### 4.6.5 Topological Graph Metrics & NetworkX Analytics (`memory-mcp-server/graph.py`)
Topological metrics are computed inside the Python memory-mcp-server using NetworkX to identify structural risks and cross-module couplings:
- **Degree Centrality:** Runs `nx.degree_centrality(G)` to measure the direct connections of each module. High-degree modules (above the 90th percentile) are flagged as **God Nodes**.
- **PageRank Centrality:** Runs `nx.pagerank(G, alpha=0.85)` to detect modules that are recursively referenced by other important modules.
- **Community Detection (Louvain):** Partitions the graph using Louvain modularity (`nx.community.louvain_communities(G)`).
- **Surprising Connections (Bridge Edges):**
  - Let $C(u)$ be the community ID of node $u$, and $C(v)$ be the community ID of node $v$.
  - An edge $(u, v)$ is flagged as a **Surprising Connection** (or Bridge Edge) if:
    1. $C(u) \neq C(v)$ (crosses community boundaries).
    2. The language properties of $u$ and $v$ differ (cross-language boundary, e.g., a `.py` file invoking a compiled `.go` or `.rs` binary interface).
  These bridge edges are scored with higher weights to prioritize integration check verification.

#### 4.6.6 Collapsible HTML Visualizer Outputs (`bin/context.js`)
- **D3.js Collapsible File-to-Symbol Tree (`context/tree.html`):**
  - Generates a fully self-contained HTML/JS page containing an embedded hierarchical JSON payload representing the repository tree structure.
  - Utilizes D3.js v7 library loaded via local or cached CDN path (with fallback).
  - Uses `d3.hierarchy` and `d3.tree` layouts to render a horizontal node-link diagram.
  - Clicking on a folder node triggers a dynamic toggle of the `.children` array and triggers a smooth transition re-render.
  - File nodes display details such as lines of code (LOC), file size, and detected syntax symbols (classes, functions, interfaces).
- **Mermaid/D3.js Architecture Callflow Map (`context/graph.html`):**
  - Generates an HTML page that compiles the dependency matrix into a visual Mermaid callflow diagram.
  - Nodes are styled and color-coded based on their Louvain community ID.
  - Hovering over a node displays a tooltip showing PageRank centrality, degree metrics, and language tags.
  - Bridges/Surprising Connections are styled with thicker, dashed red lines, indicating integration-sensitive boundaries.


### 4.7 Programmatic AST Transformation APIs (Milestone 21)
1. **Classes & Decorators (`bin/ast_transform.js`)**:
   - `addClass(sourceText, className, isExported)`: Injects class structure using `ts.factory.createClassDeclaration`.
   - `addClassDecorator(sourceText, className, decoratorName, decoratorArgs)`: Inserts a decorator into the class's modifiers.
   - `addClassMethod(sourceText, className, methodName, parameters, methodBodyText, decorators, modifiers)`: Adds/replaces methods.
   - `addClassProperty(sourceText, className, propertyName, propertyType, initializerText, decorators, modifiers)`: Injects properties with decorators/modifiers.
2. **JSX/TSX Elements (`bin/ast_transform.js`)**:
   - `addJsxElement(sourceText, targetSelector, jsxString)`: Appends JSX element inside target container or converts self-closing JSX elements.
   - `updateJsxAttribute(sourceText, targetSelector, attrName, attrValueExpression)`: Safely updates attributes on JSX opening elements.
3. **Interfaces & Types (`bin/ast_transform.js`)**:
   - `addInterface(sourceText, interfaceName, extendsNames)`: Declares exportable interfaces.
   - `addInterfaceProperty(sourceText, interfaceName, propertyName, propertyType, isOptional)`: Injects or updates properties in interfaces.
   - `addTypeAlias(sourceText, typeName, typeValueText)`: Deploys type declarations representing complex union/intersection structures.
