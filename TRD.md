# Technical Requirements Document — Veyra

**Version:** 4.0
**Author:** VEYRA-OS / ANTIGRAVITY
**Date:** 2026-06-16
**Status:** Active

---

## 1. Technical Stack

Veyra uses plain-text Markdown, JSON, Map memory caches, and Python/Node graph adapters, making the core operating layer highly extensible and compatible without heavy native database dependencies.

| Technology | Role |
|---|---|
| **Git** | Standard atomic commits and integration-branch checkouts. |
| **Node.js 20+** | CLI engine runtime (Zod for contract validation, pure JS `Map` for in-memory cache, and lockfile-backed JSON for persistence). |
| **Vitest 4+** | High-speed testing framework with auto-injected global hooks for proof-carrying code verification. |
| **Python 3.10+ / DuckDB / NetworkX** | Background engines for MCP memory graph server, performing NetworkX clustering and DuckDB indexing. |
| **Vector Embeddings (Ollama/HuggingFace)** | Local, high-speed embedding generation for constrained semantic RAG searching. |
| **Markdown** | System specifications, governance checklist logs, and constitutional rules. |
| **JSON** | Broadcasted intents, proof-carrying contract files, and direct mail messages. |
| **Go + Playwright** | Headless browser execution, visual viewport capturing, and responsive DOM audits. |
| **Gemini VLM API** | Multimodal Layout Auditing (via `gemini-1.5-flash` model). |
| **Base64 Encoding** | Converts screenshots and Figma design mockups to base64 data URIs for vision model ingestion. |
| **JSON Reports** | Formats visual regression, coordinate, contrast, and layout alignment audit results into structured reports. |
| **Microsoft TypeScript API** | Programmatic AST traversal of TypeScript/JavaScript files to pinpoint syntax/logical error locations. |
| **Zlib Gzip Compression** | Compresses diagnostic telemetry and reports into gzipped JSON to reduce workspace footprint. |

---
## 2. State Persistence

Veyra V4 eliminates SQLite database files (`beads.db`) in favor of a zero-dependency, pure JSON storage model coupled with a memory `Map` cache. State data is stored across separate JSON files to avoid file locking contention:

### 2.1 JSON Storage Formats
1. **Bead Storage (`memory/beads/bd-<uuid>.json` or `memory/beads.json`):**
   Stores active task representations. Each bead file contains the metadata, status, claims, and dependencies.
   ```json
   {
     "id": "bd-88db054d-bfdf-4c3e-b83b-f6cf01844b20",
     "title": "Build User Profile View",
     "status": "claimed",
     "claimed_by": "frontend-engineer",
     "claimed_at": "2026-06-16T15:00:00.000Z",
     "dependencies": ["bd-12345678-abcd-ef01-2345-6789abcdef01"]
   }
   ```

2. **Crawl Cache (`memory/crawl_cache.json`):**
   Used to cache filesystem crawler outputs for incremental parser runs, avoiding rescanning unchanged files.
   ```json
   {
     "files": {
       "src/components/UserProfile.tsx": {
         "mtime": 1718550000000,
         "size": 5420,
         "symbols": ["UserProfile", "validateProfile"]
       }
     }
   }
   ```

3. **Event Bus (`memory/event_bus.json`):**
   An append-only array serving as the primary message bus for swarm-wide event dispatching.
   ```json
   [
     {
       "eventId": "evt-7712",
       "topic": "bead_status_changed",
       "payload": {
         "id": "bd-88db054d-bfdf-4c3e-b83b-f6cf01844b20",
         "oldStatus": "open",
         "newStatus": "claimed"
       },
       "timestamp": "2026-06-16T15:00:05.000Z"
     }
   ]
   ```

4. **Intents (`memory/intents.json`):**
   Stores temporary agent intents and their active declarations.
   ```json
   {
     "intents": [
       {
         "intentId": "it-0091",
         "agentId": "frontend-engineer",
         "targetFile": "src/components/UserProfile.tsx",
         "semanticHash": "f8a9...c9e8",
         "timestamp": "2026-06-16T15:01:00.000Z"
       }
     ]
   }
   ```

### 2.2 Lockfile Synchronization Mechanism
To guarantee transactional integrity and prevent concurrent agent write collisions, Veyra uses a filesystem locking mechanism powered by `proper-lockfile`.
- **Lock Acquisition:** Before editing any state file, the system obtains a lock using synchronous locking.
- **Spin Retries:** Uses a randomized backoff synchronous spin-retry wrapper:
  ```js
  lockfile.lockSync(filePath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } })
  ```
- **Guaranteed Release:** Every write is enclosed in a `try/finally` block where `releaseSync()` is invoked to guarantee that lock cleanup occurs regardless of errors.

### 2.3 Other Core Schemas
For completeness, other core schemas used in the platform are:
- **Contract Proof Definition (`checklists/contract-XXXX.json`):** Wires rules and validation commands for patch merge criteria.
- **MCP Graph Memory Node Protocol:** Wires nodes and edges for episodic graph retrieval.
- **Circuit Breaker Governance:** Tracks failed validation attempts to trigger escalations.
- **Dashboard Telemetry:** Aggregates status counts, locks, and active patch channels.
- **Visual Review Audit Report:** Stores multi-viewport screenshot verification results.
- **Kernel Panic Report (`memory/evidence/kernel_panic_report.json.gz`):** Gzipped JSON capturing raw stderr, resolved file coordinates, and the deepest AST node details.

---

## 3. State Transitions

State transitions represent the lifecycle transformations of task beads as they progress through the swarm worker loop.

### 3.1 Lifecycle States
The valid lifecycle states of a bead are:
`open` $\rightarrow$ `claimed` $\rightarrow$ `in_progress` $\rightarrow$ `resolved` | `failed`

### 3.2 UUIDv4 Validation Regex
In V4, Bead IDs are migrated to standard UUIDv4 strings. To ensure backwards compatibility with legacy integer IDs (e.g. `bd-0042`) and enforce formatting rules for new IDs, the system applies the following case-insensitive regex pattern:
```regex
/^bd-(?:\d{4}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
```
This regex validates both the legacy 4-digit bead ID structure and standard RFC-compliant UUIDv4 strings prefixed with `bd-`.

### 3.3 JSON JIT File Writes
State transitions are completely decoupled from relational database transactions. All changes to memory Map caches trigger immediate, Just-In-Time (JIT) synchronous writes to the corresponding JSON persistence files (e.g. `beads.json`, `event_bus.json`). This ensures that:
1. Disk state is always matching in-memory execution status.
2. Independent concurrent subagents read valid current information directly from the files on disk under lock protection.
3. Disk read latency is minimized by combining Map cache checks with atomic writes.

---

## 4. Supply Chain Security Check

Veyra V4 introduces automated dependency checks querying the OSV.dev vulnerability database to safeguard the runtime from package vulnerabilities.

### 4.1 OSV.dev API Payload
Veyra parses `package.json` and `package-lock.json` runtime dependencies. It constructs a batch query payload in JSON format for the endpoint `https://api.osv.dev/v1/querybatch`:
```json
{
  "queries": [
    {
      "package": {
        "name": "better-sqlite3",
        "ecosystem": "npm"
      },
      "version": "9.4.0"
    }
  ]
}
```

### 4.2 HTTPS Requests Execution
Queries are dispatched via native Node.js HTTPS POST requests:
- **Endpoint:** `https://api.osv.dev/v1/querybatch`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Response Handling:** The response stream is buffered, parsed, and checked for the presence of the `vulns` key in each package result object. Any vulnerability match triggers a warning or process halt, depending on the severity threshold.

### 4.3 Offline Mock Fallbacks
If the developer or agent is running in an offline, air-gapped, or network-constrained environment (such as `CODE_ONLY` network mode), Veyra falls back to:
1. **Cached Offline DB:** Inspects local cache files of previous OSV queries.
2. **Local Mock Registry:** Uses an offline mock fallback registry in `memory/mock-osv-registry.json` containing static vulnerability lists to ensure that checks complete successfully without network access.

---

## 5. Audit Logging

To maintain total system observability, Veyra V4 includes an structured, append-only agent execution logfile.

### 5.1 Log Format (`agent-audit.jsonl`)
Audit records are written to `memory/agent-audit.jsonl` in JSON Lines format (newline-separated JSON objects). This enables high-performance append operations and streamlined parsing.

### 5.2 Logged Fields
Each log line contains the following structured fields:
- `timestamp`: UTC ISO-8601 string.
- `agentId`: Unique ID of the agent executing the operation (e.g., `implementer_1`).
- `action`: The specific operation performed (e.g., `tool_call`, `patch_apply`, `verification_run`, `task_claim`).
- `tool`: The name of the tool invoked, if applicable.
- `durationMs`: The duration of the operation in milliseconds.
- `status`: Execution outcome status (e.g., `success`, `failed`).
- `details`: A flexible dictionary object containing metadata relevant to the action.

Example log entry:
```json
{"timestamp":"2026-06-16T15:22:38.102Z","agentId":"implementer_1","action":"tool_call","tool":"replace_file_content","durationMs":45,"status":"success","details":{"file":"src/index.js","linesChanged":12}}
```

---

## 6. Directory Structure

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

## 7. Coordination Algorithms

### 7.1 Hybrid Context Assembly
Deterministic parsing combined with vector similarity:
1. **AST Blast Radius**: Crawls imports up to 2 levels to catch direct caller dependencies.
2. **Semantic Vector Search**: Generates a local embedding of the task spec, running similarity matching over the codebase to yield indirect config or business logic touchpoints.
3. **ONNX Embeddings (V4 Upgrades)**: Uses `bge-small-en-v1.5.onnx` and `tokenizer.json` to generate 384-dimensional query and chunk embeddings. Embeddings are cached in OnceLocks in Rust, and computed via cosine similarity in Python `vector_search.py` using numpy. Fallback to local TF-IDF search occurs if dependencies are missing.
4. **Watcher JIT Cache Invalidation**: Rust file watcher actor detects changes/deletions, inserting events into `agent_events`. On graph builds, `processWatcherEvents()` JIT processes pending events, clears the `crawl_cache` rows, and invalidates the in-memory `_fileMtimes` cache for beads.
5. **Budget Ranking**: Concatenates and limits injection to a hard token threshold, ensuring optimal coverage without exceeding contexts.

### 7.2 Explorer-Architect Loop
1. **Explore**: Dynamic router deploys the *Explorer* agent to an isolated playground. The Explorer edits files, fires the local compiler/REPL, and logs outputs.
2. **Synthesize**: The *Architect* reads the explorer's logs, updates `Architecture.md` / `TRD.md` / contracts, and outputs a concrete implementation checklist.
3. **Execute**: The *Implementer* and *Testing* agents execute changes against the checklist under strict contract validation.

### 7.3 State-Machine Circuit Breaker
1. **Observe**: Every failed verification cycle increments `failedAttemptsCount` in `governance.js`.
2. **Halt**: On the 3rd consecutive validation failure, the state machine switches from `active` to `tripped`.
3. **Escalate**: The worktree patch is buffered, all agent tasks are frozen, and a highly granular failure report (containing the stack trace, last applied diff, and agent discussion logs) is rendered directly to the human orchestrator.

### 7.4 Task Queue Concurrency Locking
1. **Atomic Locking (`claim`)**: Agents claim a bead by obtaining a `proper-lockfile` lock on the bead's JSON file or the central `beads.json` file, updating the `claimed_by` and `claimed_at` fields if they are currently null.
2. **State Transitions**: The system transitions through `open -> claimed -> in_progress -> resolved | failed`. Transition triggers (`claim()`, `release()`, `start()`, `complete()`, `fail()`, `reopen()`) write directly to the JIT-synchronized JSON file on disk.
3. **Stale Claim Expiry**: Sweeps run dynamically during `claim()` calls to auto-release tasks stuck in a `claimed` state for more than 30 minutes back to `open`, preventing deadlocks from crashed agent processes.

### 7.5 Swarm Dashboard Telemetry rendering
1. **Data Aggregation**: Pulls JIT statistics from `BeadsDB`, scans `.agent/governance/tx-*.json` (alongside `escalation-*.md` checks), and reads the directories inside `patches/`.
2. **Visual Layout Primitives**: Utilizes `bin/ui.js` modules:
   - `progressBar` for task queue percentage completion.
   - `drawBox` for task queue statistics block.
   - `drawTable` for the concurrency lock registry and governance transaction tracker, using bright coloring rules for status transitions (`tripped` breaker colored bright red, `active` locks colored magenta).
3. **CLI Invocation**: Integrated directly as a top-level command `dashboard` or `ui dashboard` in `bin/veyra.js`.

### 7.6 Graphify Enrichment Core
The Graphify Enrichment Core enhances static code indexing and context assembly with advanced JIT security, multi-language support, topological graph metrics, and interactive visualizations.

#### 7.6.1 JIT Security & Sensitive Path Screening (`bin/context.js`)
- **Blocklist & Exclusion Matching:** The JIT crawler filters out sensitive files and directories before tokenization or semantic vector scoring using a strict path-based blocklist:
  - Directory exclusions: `node_modules`, `.git`, `.ssh`, `.idea`, `.vscode`, `dist`, `build`.
  - File exclusions: `.env`, `*.pem`, `*.key`, `id_rsa`, `id_dsa`, `netrc`, `credentials`, `secrets.json`, `config.local.json`.
- **Sensitive Key Pattern Matching:** File contents are scanned with regexes targeting API keys, database connection strings, and authorization headers:
  - Generic token regex: `/(?:key|token|secret|password|passwd|auth)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}["']/gi`
  - Private key block check: `/-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----/`
  Files triggering these matches are completely excluded from the index, and a warning is logged.

#### 7.6.2 Zip-Bomb and Resource Exhaustion Defense (`bin/context.js`)
- **Pre-flight Archive Auditing:** Before extracting or indexing compressed documents (e.g., zip-based `.xlsx`, `.docx`, or `.zip` files), the crawler reads the file header (central directory record) to determine the sum of uncompressed sizes without allocating memory for decompression.
- **Verification Rule:**
  - Let $S_{comp}$ be the compressed file size on disk.
  - Let $S_{uncomp}$ be the total size of all files inside the archive when decompressed.
  - The compression ratio $R = \frac{S_{uncomp}}{S_{comp}}$ must not exceed `200.0`.
  - The total uncompressed size $S_{uncomp}$ must not exceed `52,428,800` bytes (50 MB).
- **Enforcement:** If $R > 200.0$ or $S_{uncomp} > 50\text{ MB}$, the file is flagged as a potential Zip-bomb, decompression is aborted immediately, and the file is omitted from indexing.

#### 7.6.3 Extensionless Script Shebang Parsing (`bin/context.js`)
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

#### 7.6.4 Multi-Language Crawler & Regex Parsers (`bin/context.js`)
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

#### 7.6.5 Topological Graph Metrics & NetworkX Analytics (`memory-mcp-server/graph.py`)
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

#### 7.6.6 Collapsible HTML Visualizer Outputs (`bin/context.js`)
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


### 7.7 Programmatic AST Transformation APIs (Milestone 21)
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

### 7.8 Concurrency & JSON File Locking (Milestone 23)
To prevent write race conditions when multiple agent workers or parallel processes update the decentralized bead storage, `bin/db.js` wraps JSON file modifications inside a strict file-level locking mechanism:
- **Locking Library:** Powered by `proper-lockfile` using synchronous `lockSync` semantics.
- **Pre-flight Existence Check:** Because `proper-lockfile` requires an existing file path to lock, the parent directory and the file itself (initializing with an empty `{}` object if missing) are verified and created before locking.
- **Lock Retries:** Sync locking is called with retry limits: `lockfile.lockSync(jsonPath, { retries: { retries: 10, minTimeout: 50, maxTimeout: 100 } })`. Since `proper-lockfile`'s native synchronous API throws an error on non-zero retries, a custom synchronous retry wrapper is monkeypatched onto `lockfile.lockSync` at boot time, executing a synchronous spin loop with randomized backoff.
- **Lock Release Guarantee:** File read, merge, validate, and write operations are executed inside a `try/finally` block to guarantee that the acquired lock is released via `release()` callback even if schema validation or write operations fail.

### 7.9 Sandboxed Patch Verification (Milestone 24)
Provides safe, concurrent verification of patches in an isolated environment before committing modifications to the main workspace.
- **Active Task Detection:** Reads `memory/current-task.json` to identify the active `taskId`.
- **Contract Resolution:** Finds matching JSON verification contracts (`checklists/contract-${taskId}.json`) in the checklists directory.
- **Sandbox Directory Provisioning:** Creates a temporary directory `sandboxDir` using `fs.mkdtempSync` in the system temp directory.
- **Workspace Copy & Directory Junction:** Copies all workspace files recursively to `sandboxDir` (excluding `node_modules`, `.git`, `.agents`, `patches`, `scratch`, `target`, `__pycache__`, `.pytest_cache`). Mounts `node_modules` inside the sandbox as a directory junction using Windows directory symlinking (`fs.symlinkSync(..., 'junction')`).
- **Speculative Writes & Verification:** Writes memory-modified files from the virtual cache into `sandboxDir`, and calls `verifyContract(contractPath, null, sandboxDir)` to evaluate rules and run proofs.
- **Safe Cleanup:** Unlinks the `node_modules` junction and deletes all copied files inside a `try-finally` block to protect the main project's node dependencies.
- **Commit & Rollback Isolation:** Blocks writing to the main workspace on verification failure and ensures no rollback is attempted on the main workspace files.

### 7.11 Model Context Protocol (MCP) Server CLI Integration
To expose Veyra's database and state queries to external LLMs and client workflows, a native Model Context Protocol (MCP) server is implemented in `bin/veyra-mcp.js`:
- **Protocol & Transport:** Runs over standard input/output (stdio) using line-delimited JSON-RPC 2.0 messages.
- **Handshake Protocol:** Responds to the `initialize` method with protocol version `"2024-11-05"` and server info.
- **Notification Support:** Handles JSON-RPC notifications (requests without an `id` field) silently.
- **Tools Registry:** Publishes a standard MCP tool schema via the `tools/list` request:
  - `get_status`: Returns current beads status summary formatted as a CLI table or structured JSON.
  - `create_bead`: Creates a new bead task state.
  - `list_beads`: Lists all beads currently registered in the database.
  - `update_bead`: Dynamically updates specific fields on a bead by ID.
- **Tool Execution:** Executes tool requests via the `tools/call` method by querying/writing to the `bin/db.js` instance, returning standardized `content` results.
- **CLI Bootstrapping:** Binds to the command `node bin/veyra.js mcp` to start the server in the foreground.

### 7.4 Visual Review & Layout Assertion Engine
The visual testing pipeline comprises a Playwright-based capture tool and a deterministic layout validator:
1. **Responsive Viewport Capture (`visual-testing/snapshot.go`):** Executes in a Go runner using Playwright. Navigates to the target page and captures screenshots for `mobile` (375x667), `tablet` (768x1024), and `desktop` (1440x900) viewports. For each viewport, a JavaScript script is evaluated to extract all visible elements in the DOM along with their bounding box (`x`, `y`, `width`, `height`) and computed padding styles (`paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`), serializing them to `dom_structure_<viewport>.json`.
2. **Geometric Assertion Engine (`bin/visual-review.js`):** Loads the layout specification (`checklists/figma-layout.json`) and performs four geometric checks:
   - **Bounding-box tolerance checks:** Compares key elements (`header`, `sidebar`, `main-content`, `submit-btn`) coordinates and dimensions to figma spec, raising violations if differences exceed the configured tolerance.
   - **Overlap/collision detection:** Checks all non-nested elements for spatial intersections. Nested elements (parent-child) are excluded by testing coordinate containment.
   - **Touch target sizing check:** Enforces minimum 44x44px dimensions for interactive elements on the mobile viewport.
   - **Baseline grid alignment check:** Enforces that coordinates and paddings are multiples of 4px.
3. **Unified Report Aggregator:** Combines accessibility violations (reported by the Go standard Axe-core audit engine) with geometric layout violations. Generates the master report `vlm_audit_report.json` and exits with code 1 if critical or high violations are found.

---

## 8. Architectural Decision Records (ADRs)

The following Architectural Decision Records have been accepted and implemented to support Veyra V4 operations:

- **[ADR 0001: Deprecate Legacy Git Worktrees in Favor of VFS Patching](docs/adr/0001-deprecate-legacy-git-worktrees.md)**: Remove `bin/worktree.js` and `tests/bin/worktree.test.js` to transition fully to the line and AST-based VFS patch engine (`patch.js`).
- **[ADR 0002: Prevent JSON Database Concurrency Collisions Using proper-lockfile](docs/adr/0002-prevent-concurrency-collision-via-proper-lockfile.md)**: Use `proper-lockfile` with a retry spin-lock mechanism to synchronize json writes.
- **[ADR 0003: Isolated Sandboxed Patch Verification](docs/adr/0003-isolated-sandboxed-patch-verification.md)**: Copy speculative workspace to system temp, mounting `node_modules` via directory junction, running proofs in isolation.
- **[ADR 0004: SQLite-Backed Incremental Crawl Cache](docs/adr/0004-sqlite-backed-incremental-crawl-cache.md)**: Store imports and semantic keys in `crawl_cache` table inside `beads.db` and skip parsing when file modification time (`mtime`) is unchanged.
- **[ADR 0005: Rust File Watcher Events & ONNX Semantic Search Integration](docs/adr/0005-file-watcher-events-and-onnx-semantic-search.md)**: Capture Rust file watcher events to `agent_events` in `beads.db` and utilize Python ONNX similarity search with TF-IDF fallback.
- **[ADR 0006: Pub/Sub Swarm Worker Loop](docs/adr/0006-pubsub-swarm-worker.md)**: Implements background worker daemon polling SQLite WAL event bus, managing async routing/allocation and failure propagation.

With these ADRs implemented, all V4 upgrades are fully complete, robust, and verified.
