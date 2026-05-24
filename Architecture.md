# Architecture — Veyra

**Version:** 1.0
**Status:** Living Document
**Last Updated:** 2025-05-24

---

## 1. System Topology

The system has two operating modes: the **Agent Command Environment (ACE)** where humans define specs and review results, and the **Agent Execution Environment (AEE)** where agents write code in isolated worktrees.

```mermaid
graph TD
    subgraph ACE["Agent Command Environment"]
        H["🧑 Human Orchestrator"]
        H --> SPEC["📋 Specs: PRD, TRD, Architecture"]
        H --> REVIEW["🔍 Review & Approve"]
    end

    subgraph CORE["Orchestration Layer"]
        O["🎯 Orchestrator Agent"]
        O --> ROUTE["Task Router"]
        O --> MERGE["Merge Coordinator"]
        O --> ESC["Escalation Handler"]
    end

    subgraph AEE["Agent Execution Environment"]
        P["📋 Planner"]
        A["🏗️ Architect"]
        BE["⚙️ Backend Engineer"]
        FE["🎨 Frontend Engineer"]
        CR["🔍 Code Reviewer"]
        DS["🐛 Debugging Specialist"]
        TE["🧪 Testing Engineer"]
        SR["🔒 Security Reviewer"]
        DW["📝 Documentation Writer"]
    end

    subgraph GIT["Git Layer"]
        WT_A["🌿 Worktree A"]
        WT_B["🌿 Worktree B"]
        WT_C["🌿 Worktree C"]
        MAIN["🔀 Main Branch"]
    end

    H --> O
    ROUTE --> P
    ROUTE --> A
    ROUTE --> BE
    ROUTE --> FE
    ROUTE --> CR
    ROUTE --> DS
    ROUTE --> TE
    ROUTE --> SR
    ROUTE --> DW

    BE --> WT_A
    FE --> WT_B
    TE --> WT_C

    WT_A -->|"rebase + merge"| MAIN
    WT_B -->|"rebase + merge"| MAIN
    WT_C -->|"rebase + merge"| MAIN

    CR --> REVIEW
    SR --> REVIEW
    ESC --> H
```

---

## 2. Agent Interaction Model

Agents do not communicate directly with each other. All coordination flows through the **Orchestrator**. Agents produce artifacts; the Orchestrator routes those artifacts to the next agent in the workflow.

```mermaid
graph TD
    O["🎯 Orchestrator"]

    P["📋 Planner"]
    A["🏗️ Architect"]
    BE["⚙️ Backend Engineer"]
    FE["🎨 Frontend Engineer"]
    TE["🧪 Testing Engineer"]
    CR["🔍 Code Reviewer"]
    SR["🔒 Security Reviewer"]
    DS["🐛 Debugging Specialist"]
    DW["📝 Documentation Writer"]

    O -->|"task assignment"| P
    O -->|"design review"| A
    O -->|"implementation"| BE
    O -->|"implementation"| FE
    O -->|"test execution"| TE
    O -->|"code review"| CR
    O -->|"security audit"| SR
    O -->|"bug diagnosis"| DS
    O -->|"docs generation"| DW

    P -->|"spec artifacts"| O
    A -->|"design artifacts"| O
    BE -->|"code + evidence"| O
    FE -->|"code + evidence"| O
    TE -->|"test results"| O
    CR -->|"review report"| O
    SR -->|"security report"| O
    DS -->|"diagnosis report"| O
    DW -->|"documentation"| O

    CR -->|"blocking issue"| DS
    SR -->|"vulnerability"| DS
    TE -->|"test failure"| DS
    DS -->|"CRP escalation"| O
```

**Escalation paths:**
- Code Reviewer → Debugging Specialist (when review finds bugs)
- Security Reviewer → Debugging Specialist (when audit finds vulnerabilities)
- Testing Engineer → Debugging Specialist (when tests fail)
- Debugging Specialist → Orchestrator (when 3+ patches fail — CRP escalation to human)

---

## 3. Memory Flow

The Beads memory system forms a directed graph. Every task, decision, and bug is a node stored as a standalone JSON file in `memory/beads/*.json`. Edges represent relationships (dependencies, supersedes). The Veyra CLI Engine dynamically compiles these decentralized nodes into a unified, queryable in-memory graph to assemble task contexts for agents.

```mermaid
graph LR
    subgraph TRIGGER["Trigger"]
        T["📥 Task Assignment"]
    end
 
    subgraph MEMORY["Memory System"]
        BC["🔵 Bead Creation (standalone file)"]
        BG["🔗 Engine Compiles Bead Graph"]
        BQ["🔍 Bead Query (CLI)"]
    end
 
    subgraph CONTEXT["Context Assembly"]
        CI["📄 Context Injection"]
        TB["📏 Token Budget Check"]
    end
 
    subgraph AGENT["Agent Execution"]
        AP["🤖 Agent Prompt"]
        EX["⚡ Execution"]
        EV["📋 Evidence Capture"]
    end
 
    T --> BC
    BC --> BG
    BG --> BQ
    BQ --> CI
    CI --> TB
    TB --> AP
    AP --> EX
    EX --> EV
    EV -->|"CLI updates bead file"| BG
```
 
**Bead lifecycle:**
1. Task is assigned → CLI creates decentralized `task` bead file under `memory/beads/bd-XXXX.json` with `status: open`.
2. Agent runs CLI query to search related beads for context (prior decisions, related bugs).
3. Context is assembled from parsed bead dependencies + file manifests.
4. Agent executes and produces evidence.
5. CLI updates the bead file: `status: resolved`, `evidence: <link>`.
6. If a decision changes, CLI marks the old bead file with `superseded_by: <new-bead-id>`.

---

## 4. Merge Strategy

All agents work in isolated Git worktrees. Merges into main are **strictly sequential** — no parallel merges, no merge commits. Every integration is a fast-forward after rebase.

```mermaid
gitGraph
    commit id: "init"
    commit id: "setup"

    branch feature/auth
    commit id: "auth-service"
    commit id: "auth-tests"

    checkout main
    merge feature/auth id: "merge-auth" type: NORMAL

    branch feature/dashboard
    commit id: "dashboard-ui"
    commit id: "dashboard-tests"

    checkout main
    merge feature/dashboard id: "merge-dashboard" type: NORMAL

    branch fix/login-bug
    commit id: "fix-validation"
    commit id: "fix-tests"

    checkout main
    merge fix/login-bug id: "merge-fix" type: NORMAL
```

**Merge protocol:**
1. Agent completes work in worktree
2. Tests pass in worktree (execution evidence captured)
3. Code reviewer + security reviewer approve
4. `git rebase main` in worktree branch
5. `git checkout main && git merge <branch>` (fast-forward)
6. `git worktree remove <path>`
7. Update beads: task → resolved

**Conflict resolution:**
- If rebase produces conflicts, the agent attempts resolution (up to 2 tries)
- On 3rd failure, a CRP is created and escalated to the human orchestrator
- The human resolves conflicts and the agent continues from the resolved state

---

## 5. Context Assembly Pipeline

Agents receive **deterministic context** — not RAG search results. The pipeline assembles exactly the files an agent needs based on the task scope.

```mermaid
graph TD
    subgraph INPUT["Inputs"]
        TASK["📥 Task Scope"]
        RULES["📏 Rule Files"]
        BEADS["🔗 Relevant Beads"]
    end

    subgraph PARSE["Analysis"]
        AST["🌳 AST Parse"]
        DEP["🔗 Dependency Graph"]
        MAN["📄 File Manifest"]
    end

    subgraph BUDGET["Budget"]
        TOK["📏 Token Count"]
        PRIO["⚖️ Priority Ranking"]
        TRIM["✂️ Context Trimming"]
    end

    subgraph OUTPUT["Output"]
        SYS["🤖 System Prompt"]
        CTX["📄 Injected File Contents"]
        CONST["📋 Constitution Rules"]
    end

    TASK --> AST
    TASK --> MAN
    AST --> DEP
    DEP --> MAN
    MAN --> TOK

    RULES --> CONST
    BEADS --> CTX

    TOK --> PRIO
    PRIO --> TRIM
    TRIM --> SYS
    CTX --> SYS
    CONST --> SYS
```

**Pipeline steps:**

| Step | Input | Output | Purpose |
|---|---|---|---|
| **AST Parse** | Source files in task scope | Syntax tree with function/class boundaries | Understand code structure without reading every line |
| **Dependency Graph** | AST output | Module import/export map | Know which files are connected to the task |
| **File Manifest** | Dependency graph + task scope | Ordered list of file paths | Exact files the agent needs to read |
| **Token Count** | File manifest + file contents | Total token count | Verify context fits within agent limits |
| **Priority Ranking** | Token count + task relevance | Ranked file list | Most relevant files first |
| **Context Trimming** | Ranked files + token budget | Trimmed file list | Drop least relevant files if over budget |
| **System Prompt** | Trimmed files + rules + beads | Final agent prompt | Everything the agent needs, nothing it doesn't |

---

## 6. Layer Architecture

```mermaid
graph TD
    subgraph L1["Layer 1: Human Interface"]
        PRD["PRD"]
        TRD["TRD"]
        STATE["State.md"]
        TODO["ToDo.md"]
    end

    subgraph L2["Layer 2: Orchestration"]
        CLAUDE["CLAUDE.md"]
        ORCH["Orchestrator"]
        WORKFLOWS["Workflows"]
    end

    subgraph L3["Layer 3: Agent Execution"]
        AGENTS["Agent Definitions"]
        RULES["Scoped Rules"]
        PROMPTS["Prompt Templates"]
    end

    subgraph L4["Layer 4: Memory & Context"]
        BEADS["Beads Graph"]
        CTXMAPS["Context Maps"]
        AST2["AST Snapshots"]
    end

    subgraph L5["Layer 5: Git Infrastructure"]
        WORKTREES["Worktrees"]
        BRANCHES["Branches"]
        MAIN2["Main Branch"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
```

**Layer responsibilities:**
- **Layer 1 (Human):** Define what to build. Review results. Approve merges.
- **Layer 2 (Orchestration):** Route tasks. Coordinate agents. Manage merge sequence.
- **Layer 3 (Execution):** Write code. Run tests. Review code. Fix bugs.
- **Layer 4 (Memory):** Persist decisions. Assemble context. Track state.
- **Layer 5 (Git):** Isolate work. Version code. Integrate changes.
