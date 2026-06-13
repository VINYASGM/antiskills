# Architecture — Veyra

**Version:** 3.1
**Status:** Living Document
**Last Updated:** 2026-06-07

---

## 1. System Topology

The Veyra V3 architecture comprises a decentralized **AI-Native Flow State & Contract-Proven OS** operating layer. It resolves multi-agent coordination locks, infinite loops, and semantic conflicts through a decoupled control plane, external graph memory, and isolated integration verifications.

**Plain-text summary:** The Human Orchestrator defines requirements. The Veyra engine uses a **Dual Explorer-Architect Loop** to eliminate rigid waterfall planning. An *Explorer* agent rapidly prototypes in an isolated playground. The *Architect* agent translates these learnings into concrete programmatic and mathematical **Contracts** (`checklists/contract-XXXX.json`). The *Implementer* agent writes the logic in a unified single branch utilizing the **VFS Patch System** (`bin/patch.js`). The **Verify Engine** (`bin/verify.js`) checks patches against the contract using automated test suites before commits. All agents claim their tasks from a centralized SQLite-based **Task Queue & Concurrency Lock** (`bin/db.js`) to prevent dual-agent race conditions or overlapping writes. All agents publish active plans to the JIT SQLite intent registry to intercept styling or logic collisions. An external **MCP Graph Memory Server** backed by DuckDB + NetworkX stores episodic context, which is dynamically summarized (compressed) to stay under context limits. If a task fails verification repeatedly, the **Governance State-Machine Circuit Breaker** (`bin/governance.js`) trips at 3 failures, halting execution and auto-escalating to the human.
A central **Swarm Status Dashboard** (`bin/dashboard.js`) taps into the SQLite database, governance storage dir, and patches directory to render a live visual telemetry control plane of the entire system state back to the human developer.

```mermaid
graph TD
    subgraph ACE["Orchestration & Verification Boundary"]
        H["🧑 Human Orchestrator"]
        H --> SPEC["📋 Specifications: PRD, TRD, Architecture"]
        VERIFY["🧪 Verify Engine: Contract proofs & tests"] -->|Merges atomic patch| GIT_HEAD["🔀 Git Repository Main Branch"]
        GOV["🛡️ Governance Circuit Breaker: 3 strikes policy"] -->|Trips & Alerts| H
        DASHBOARD["📺 Swarm Dashboard CLI: status & locks"] -->|Render visual telemetry| H
    end

    subgraph AEE["Agent Execution Environment (VFS Flow State Workspace)"]
        EXPLORER["🔬 Explorer Agent: REPL Prototyping"] -->|Validate assumptions| ARCHITECT["📐 Architect Agent: Contract generation"]
        ARCHITECT -->|Checklist & Contracts| IMPLEMENTER["🔧 Implementer Agent: VFS Patch Generation"]
        IMPLEMENTER -->|Broadcast Intent| INTENT["📡 JIT SQLite WAL Intent Registry"]
        IMPLEMENTER -->|Generate patch| PATCH["🔧 VFS Patch Check & Apply"]
        PATCH -->|Dry-run validated patch| VERIFY
    end

    subgraph MEM["Decoupled High-Performance Graph Memory"]
        MCP_GRAPH["🔌 External MCP Graph Memory Server"] <-->|Nodes & semantic edges| DUCK_NX["DuckDB + NetworkX Graph Storage"]
        DUCK_NX -->|Episodic cluster summarization| CONTEXT["🧠 Hybrid Context Assembly: AST + vector embeddings"]
        CONTEXT -->|Relevance-ranked prompt injection| AEE
    end

    subgraph TQ["Concurrency Lock Boundary"]
        DB_QUEUE["🔒 SQLite Task Queue & Concurrency Lock"]
    end

    H --> DB_QUEUE
    DB_QUEUE -->|Exclusive task assignment| EXPLORER
    VERIFY -->|Failed attempts track| GOV
    DB_QUEUE -.->|Extract locks & stats| DASHBOARD
    GOV -.->|Extract retry strikes| DASHBOARD
    PATCH -.->|List active channels| DASHBOARD
```

---

## 2. Agent Interaction & Choreography Protocol

Veyra V3 implements **Actor-based Choreography** combined with strict safety and prototyping loops.

### Dual Explorer-Architect Loop
1. **Hypothesis Validation:** Instead of writing complex specs blind, the *Explorer* agent works directly in a sandboxed REPL to investigate tools, APIs, and file structures.
2. **Contract Synthesis:** The *Architect* reviews these REPL outputs and defines a `contract-XXXX.json` containing programmatic constraints, ensuring the team works against validated constraints.

### Universal Governance Circuit Breaker
Every cross-agent transaction is monitored by `bin/governance.js`. If the *Implementer* and *Testing* agents trigger repeated compiler, styling, or unit-test failures:
- The cycle counter is incremented.
- At **3 failed attempts**, the circuit breaker trips.
- The VFS patch state is preserved, and a detailed diagnostic bundle (diffs, stack traces, and communication histories) is dispatched directly to the human developer, preventing infinite token spend loops.

### Task Queue & Claim Locking
Before performing any task (bead) operations, agents must atomically lease-lock the bead in the centralized SQLite queue to guarantee exclusive worker processing:
- **Optimistic Locking:** Claim requests use atomic SQLite queries enforcing `claimed_by IS NULL` to prevent overlapping assignments.
- **JIT JSON Sync:** Lock transitions write to the SQLite database and immediately update the JSON memory bead file, which is validated JIT using a strict Zod schema.
- **Stale Cleanups:** A 30-minute stale-lease sweeping algorithm executes on subsequent claim requests to automatically recover from crashed or stalled worker processes.

---

## 3. Decoupled Memory & Hybrid Context Assembly

To scale memory to extremely large codebases without blowing out token budgets:
- **MCP memory server:** Operates an isolated Model Context Protocol service.
- **Graph Clustering (NetworkX):** Identifies closely related historical decisions, requirements, and tasks as graph clusters.
- **Episodic Compression:** Merges and summarizes older, closed clusters into single semantic nodes, delivering lightweight dense historical contexts to active agents.
- **Hybrid Context assembly:** Merges syntax-tree (AST) crawler paths for immediate caller-callee scopes with a fast vector embedding database (RAG) search for global configurations and styled elements.

---

## 4. Contract-Proven VFS Patches

- **Intent Registry:** Agents broadcast planned files, styling tokens, database columns, and endpoints to SQLite WAL cache.
- **Formal Verification:** Proposed unified patch files (`patch.js`) are checked by the `verify.js` engine, running precise linters, TypeScript compilations, and Vitest test suites.
- **Atomic Commits:** Patch is applied to the physical directory *only* after satisfying all contract proofs, keeping the main branch consistently green.

---

## 5. Swarm Telemetry & Observability Layer

To monitor parallel executions and manage circuit breakers:
- **Telemetry Aggregator (`bin/dashboard.js`):** Extends visual primitives from `bin/ui.js` to compile database states, active concurrency locks, governance strikes, and directory-based patch channels.
- **Visual Primitives Mapping:**
  - Database status summaries and progress are wrapped inside cyan double-bordered `drawBox` modules.
  - Active concurrency locks are formatted inside a blue table (`drawTable`), demonstrating agent ownership, claim status, and holds duration.
  - Governance transaction streams display current strike counts against thresholds (`X/3`), coloring `tripped` breakers in bright red ANSI style.
  - Channels are parsed straight from the filesystem `patches/` folder and listed as active workspaces.

---

## 6. Graphify Enrichment Core & Security

The Graphify Enrichment Core integrates security, multi-language intelligence, graph theory metrics, and rich browser visualizers.

### Component Interaction Flow

```mermaid
flowchart TD
    FS[Workspace Filesystem] -->|1. JIT Crawl Scan| SEC{JIT Security Ingest}
    
    subgraph JIT_Sec["JIT Security Screening (bin/context.js)"]
        SEC -->|Exclusion Check| ENV[".env / .git / SSH / Keys / netrc blocklist"]
        SEC -->|Content Regex| SEC_KEY["Secrets & API Keys Matcher"]
        SEC -->|Pre-flight Audit| ZB["Zip-Bomb Ratio Check (200:1 / 50MB limit)"]
    end
    
    SEC_KEY -->|Pass Safety Checks| PARSER{Parser Selector}
    ENV -->|Skip File| SKIP[File Excluded]
    ZB -->|Ratio Exceeded / Aborted| SKIP
    
    subgraph Multi_Lang["Multi-Language Parsing & Crawling (bin/context.js)"]
        PARSER -->|Standard Extension| EXT["JS/TS, PY, GO, RS, SQL, APEX Parser"]
        PARSER -->|Extensionless Script| SB["Shebang Parser (Tokenize interpreter)"]
        EXT & SB -->|Regex-based AST Crawl| IMP["Imports & Call Graph Extraction"]
    end
    
    IMP -->|2. Raw Dependency Map| MCP["memory-mcp-server/graph.py"]
    
    subgraph Analytics["Graph Topology Analytics (DuckDB + NetworkX)"]
        MCP -->|Degree & PageRank Centrality| GOD["God Nodes Identification"]
        MCP -->|Louvain Modularity| COMM["Community Clustering"]
        MCP -->|Cross-boundary edges| SURP["Surprising Connections Mapping"]
    end
    
    GOD & COMM & SURP -->|3. Rich Context Metrics| DATA[Context Data Bundle]
    DATA -->|4. Generate Visual Maps| HTML["HTML Visualizer Generation"]
    
    subgraph Viz["Interactive Visualizers (context/)"]
        HTML -->|Collapsible File-to-Symbol Tree| TREE["context/tree.html (D3.js Tree)"]
        HTML -->|Louvain Clustered Callflow| GRAPH["context/graph.html (Mermaid/D3.js Graph)"]
    end
```

### Component Details
- **JIT Input Security Screening:** The hybrid context plane (`bin/context.js`) filters all files through an `isSensitive` block to skip credential repositories, NETRC files, and private keys. Compressed zip/XML archives are audited pre-decompression to block zip-bombs exceeding a 200:1 ratio.
- **Multi-Language Parsing & shebang Handling:** Handles JS/TS, Python, Go, Rust, SQL, and Apex. Extensionless scripts are evaluated by reading the shebang line to identify the underlying engine runtime (Python, Node, Bash).
- **Modularity Modifiers & NetworkX Analytics:** The memory graph (`memory-mcp-server/graph.py`) calculates NetworkX degree centrality to isolate "God Nodes", and maps "Surprising Connections" by looking for edges that cross Louvain community boundaries or language family limits (e.g., Python connecting to Rust via binary bindings).
- **Interactive Browser Maps:** Dynamically outputs interactive visualizations:
  - `context/tree.html`: A collapsible hierarchical D3.js visualization presenting files and their symbols.
  - `context/graph.html`: A self-contained Mermaid.js architecture flow visualization showing community-grouped module interactions.


## 7. AST Code-as-a-Graph Expansion (Milestone 21)
The system enforces semantic integrity by replacing line-based text transformations with AST node manipulations.
- **Synthesized AST Nodes:** When code modification is requested, `bin/ast_transform.js` parses the target file as `ts.ScriptKind.TSX`, traverses it using TypeScript Compiler API visitors, constructs or updates target syntax nodes (classes, decorators, methods, JSX elements, interfaces, types), strips positions via recursive coordinate removal, and prints the result.
- **Semantic Conflict Detection:** `bin/patch.js` computes semantic keys (e.g., `class:ClassName`, `jsx-element:Tag:Attr`) for active patches, which are checked for overlap against concurrently executing tasks to prevent conflict merges before verification.
