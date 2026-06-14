# Repository Structure Map — Veyra OS

This is the dynamically generated repository tree of Veyra OS. It is automatically indexed to assist AI agents in swift navigation.

## Directory Topology
```
├── .agent
│   ├── governance
│   ├── memory_graph.duckdb
│   ├── memory_graph.duckdb.wal
│   └── skills
│       ├── agenttrace-session-audit
│       │   └── SKILL.md
│       ├── api-patterns
│       │   └── SKILL.md
│       ├── auth-implementation-patterns
│       │   └── SKILL.md
│       ├── backend-dev-guidelines
│       │   └── SKILL.md
│       ├── brainstorming
│       │   └── SKILL.md
│       ├── browser-automation
│       │   └── SKILL.md
│       ├── caveman
│       │   └── SKILL.md
│       ├── concise-planning
│       │   └── SKILL.md
│       ├── database-design
│       │   └── SKILL.md
│       ├── deployment-procedures
│       │   └── SKILL.md
│       ├── diagnose
│       │   ├── scripts
│       │   │   └── hitl-loop.template.sh
│       │   └── SKILL.md
│       ├── frontend-design
│       │   └── SKILL.md
│       ├── frontend-developer
│       │   └── SKILL.md
│       ├── go-playwright
│       │   └── SKILL.md
│       ├── grill-me
│       │   └── SKILL.md
│       ├── grill-with-docs
│       │   ├── ADR-FORMAT.md
│       │   ├── CONTEXT-FORMAT.md
│       │   └── SKILL.md
│       ├── hallmark-aesthetic
│       │   └── SKILL.md
│       ├── improve-codebase-architecture
│       │   ├── DEEPENING.md
│       │   ├── INTERFACE-DESIGN.md
│       │   ├── LANGUAGE.md
│       │   └── SKILL.md
│       ├── observability-engineer
│       │   └── SKILL.md
│       ├── postmortem-writing
│       │   └── SKILL.md
│       ├── prototype
│       │   ├── LOGIC.md
│       │   ├── SKILL.md
│       │   └── UI.md
│       ├── react-patterns
│       │   └── SKILL.md
│       ├── setup-matt-pocock-skills
│       │   ├── domain.md
│       │   ├── issue-tracker-github.md
│       │   ├── issue-tracker-gitlab.md
│       │   ├── issue-tracker-local.md
│       │   ├── SKILL.md
│       │   └── triage-labels.md
│       ├── systematic-debugging
│       │   └── SKILL.md
│       ├── tdd
│       │   ├── deep-modules.md
│       │   ├── interface-design.md
│       │   ├── mocking.md
│       │   ├── refactoring.md
│       │   ├── SKILL.md
│       │   └── tests.md
│       ├── test-driven-development
│       │   └── SKILL.md
│       ├── to-issues
│       │   └── SKILL.md
│       ├── to-prd
│       │   └── SKILL.md
│       ├── triage
│       │   ├── AGENT-BRIEF.md
│       │   ├── OUT-OF-SCOPE.md
│       │   └── SKILL.md
│       ├── ui-ux-pro-max
│       │   ├── data
│       │   │   ├── charts.csv
│       │   │   ├── colors.csv
│       │   │   ├── icons.csv
│       │   │   ├── landing.csv
│       │   │   ├── products.csv
│       │   │   ├── react-performance.csv
│       │   │   ├── stacks
│       │   │   │   ├── astro.csv
│       │   │   │   ├── flutter.csv
│       │   │   │   ├── html-tailwind.csv
│       │   │   │   ├── jetpack-compose.csv
│       │   │   │   ├── nextjs.csv
│       │   │   │   ├── nuxt-ui.csv
│       │   │   │   ├── nuxtjs.csv
│       │   │   │   ├── react-native.csv
│       │   │   │   ├── react.csv
│       │   │   │   ├── shadcn.csv
│       │   │   │   ├── svelte.csv
│       │   │   │   ├── swiftui.csv
│       │   │   │   └── vue.csv
│       │   │   ├── styles.csv
│       │   │   ├── typography.csv
│       │   │   ├── ui-reasoning.csv
│       │   │   ├── ux-guidelines.csv
│       │   │   └── web-interface.csv
│       │   ├── scripts
│       │   │   ├── __pycache__
│       │   │   │   ├── core.cpython-314.pyc
│       │   │   │   ├── design_system.cpython-314.pyc
│       │   │   │   └── search.cpython-314.pyc
│       │   │   ├── core.py
│       │   │   ├── design_system.py
│       │   │   └── search.py
│       │   └── SKILL.md
│       ├── write-a-skill
│       │   └── SKILL.md
│       ├── writing-plans
│       │   └── SKILL.md
│       └── zoom-out
│           └── SKILL.md
├── .agents
│   ├── auditor_1_cli_schema
│   │   ├── audit.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── auditor_dashboard_1
│   │   ├── BRIEFING.md
│   │   ├── challenge_report.md
│   │   ├── forensic_audit_report.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── auditor_visual_review
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── auditor_visual_review_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── challenger_1
│   │   ├── BRIEFING.md
│   │   ├── challenge_report.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── challenger_visual_review_1
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── challenger_visual_review_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── explorer_1
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── explorer_ast_exploration
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── explorer_m17_1
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   └── ORIGINAL_REQUEST.md
│   ├── explorer_v3_upgrades
│   │   ├── Architecture.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── PRD.md
│   │   ├── progress.md
│   │   ├── State.md
│   │   ├── ToDo.md
│   │   └── TRD.md
│   ├── orchestrator
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── plan.md
│   │   ├── progress.md
│   │   └── PROJECT.md
│   ├── orchestrator_ast
│   │   ├── BRIEFING.md
│   │   ├── original_prompt.md
│   │   ├── plan.md
│   │   └── progress.md
│   ├── orchestrator_dashboard
│   │   ├── .gitkeep
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   └── PROJECT.md
│   ├── orchestrator_m17
│   │   └── README.md
│   ├── orchestrator_visual_review
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── plan.md
│   │   ├── progress.md
│   │   ├── README.md
│   │   └── SCOPE.md
│   ├── original_prompt.md
│   ├── ORIGINAL_REQUEST.md
│   ├── qa_test_runner
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── reviewer_1
│   │   ├── BRIEFING.md
│   │   ├── challenge.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   └── review.md
│   ├── reviewer_1_cli_schema
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   └── review_1.md
│   ├── reviewer_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── reviewer_2_cli_schema
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   └── review_2.md
│   ├── reviewer_ast_1
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── reviewer_ast_2
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── reviewer_remediated
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── reviewer_visual_review_1
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── reviewer_visual_review_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── sentinel
│   │   ├── BRIEFING.md
│   │   └── handoff.md
│   ├── teamwork_preview_auditor_m20
│   │   ├── audit.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── teamwork_preview_challenger_m20_1
│   │   ├── BRIEFING.md
│   │   ├── challenge.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── teamwork_preview_challenger_m20_2
│   │   ├── BRIEFING.md
│   │   ├── challenge.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── teamwork_preview_explorer_dashboard_1
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   ├── proposed_Architecture.md
│   │   ├── proposed_context.md
│   │   ├── proposed_dashboard.js
│   │   ├── proposed_dashboard.test.js
│   │   ├── proposed_PRD.md
│   │   ├── proposed_State.md
│   │   ├── proposed_ToDo.md
│   │   ├── proposed_TRD.md
│   │   └── proposed_veyra.js.patch
│   ├── teamwork_preview_explorer_m20_1
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   ├── proposed_Architecture_updates.md
│   │   ├── proposed_PRD_updates.md
│   │   ├── proposed_State_updates.md
│   │   ├── proposed_ToDo_updates.md
│   │   └── proposed_TRD_updates.md
│   ├── teamwork_preview_explorer_m20_2
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── teamwork_preview_explorer_m20_3
│   │   ├── analysis.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── teamwork_preview_orchestrator_v3_upgrades
│   │   ├── BRIEFING.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── plan.md
│   │   ├── progress.md
│   │   └── PROJECT.md
│   ├── teamwork_preview_reviewer_m20_1
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── review.md
│   ├── teamwork_preview_reviewer_m20_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── review.md
│   ├── victory_auditor
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── victory_auditor_dashboard
│   │   ├── .gitkeep
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── progress.md
│   │   └── victory_audit_report.md
│   ├── victory_auditor_visual_review
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── worker_ast_implementation
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── worker_ast_remediation
│   │   ├── BRIEFING.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── worker_cli_schema_1
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── worker_dashboard_1
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── worker_dashboard_fix_1
│   │   ├── Architecture.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── PRD.md
│   │   ├── progress.md
│   │   ├── State.md
│   │   ├── ToDo.md
│   │   └── TRD.md
│   ├── worker_docs_1
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── worker_docs_visual_review
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── progress.md
│   │   └── README.md
│   ├── worker_fixes
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── worker_implementation
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   └── progress.md
│   ├── worker_m17_1
│   ├── worker_remediation
│   │   ├── Architecture.md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── ORIGINAL_REQUEST.md
│   │   ├── PRD.md
│   │   ├── progress.md
│   │   ├── README.md
│   │   ├── State.md
│   │   ├── ToDo.md
│   │   └── TRD.md
│   ├── worker_update_project_md
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   ├── worker_update_project_md_2
│   │   ├── BRIEFING.md
│   │   ├── handoff.md
│   │   ├── original_prompt.md
│   │   └── progress.md
│   └── worker_visual_impl
│       ├── BRIEFING.md
│       ├── handoff.md
│       ├── ORIGINAL_REQUEST.md
│       ├── progress.md
│       └── README.md
├── .github
│   └── workflows
│       └── ci.yml
├── .gitignore
├── .pytest_cache
│   ├── .gitignore
│   ├── CACHEDIR.TAG
│   ├── README.md
│   └── v
│       └── cache
│           └── nodeids
├── AGENT.md
├── agents
│   ├── architect.md
│   ├── backend-engineer.md
│   ├── code-reviewer.md
│   ├── context-compressor.md
│   ├── debugging-specialist.md
│   ├── documentation-writer.md
│   ├── explorer.md
│   ├── frontend-engineer.md
│   ├── memory-manager.md
│   ├── orchestrator.md
│   ├── planner.md
│   ├── README.md
│   ├── security-reviewer.md
│   ├── testing-engineer.md
│   └── vlm-ui-reviewer.md
├── Architecture.md
├── bin
│   ├── ast_transform.js
│   ├── context.js
│   ├── dashboard.js
│   ├── db.js
│   ├── event_bus.js
│   ├── governance.js
│   ├── intent.js
│   ├── linter.js
│   ├── patch.js
│   ├── router.js
│   ├── schema.js
│   ├── skills.js
│   ├── supervisor.js
│   ├── ui.js
│   ├── vector_search.py
│   ├── verify.js
│   ├── veyra.js
│   ├── visual-review.js
│   └── workflow.js
├── checklists
│   ├── pre-commit.md
│   ├── pre-merge.md
│   ├── ui-delivery.md
│   └── visual-audit.md
├── context
│   ├── dependency-graph.md
│   ├── file-manifests
│   │   └── bd-0002.json
│   ├── glossary.md
│   ├── graph.html
│   ├── README.md
│   ├── repo-map.md
│   └── tree.html
├── context.md
├── debugging
│   ├── incident-template.md
│   ├── README.md
│   └── root-cause-loop.md
├── demo-ast-patching.js
├── docs
│   ├── agent-guide.md
│   ├── architecture-overview.md
│   ├── getting-started.md
│   ├── subsystems
│   └── vibecoding-playbook.md
├── governance
│   ├── data-retention.md
│   └── security-policy.md
├── memory-mcp-server
│   ├── __pycache__
│   │   ├── compress.cpython-313.pyc
│   │   ├── graph.cpython-313.pyc
│   │   ├── test_agent.cpython-313-pytest-9.0.2.pyc
│   │   ├── test_graph_adversarial.cpython-313-pytest-9.0.2.pyc
│   │   ├── test_graph_stress.cpython-313-pytest-9.0.2.pyc
│   │   ├── test_metrics_adversarial.cpython-313-pytest-9.0.2.pyc
│   │   └── test_metrics.cpython-313-pytest-9.0.2.pyc
│   ├── .gitignore
│   ├── .pytest_cache
│   │   ├── .gitignore
│   │   ├── CACHEDIR.TAG
│   │   ├── README.md
│   │   └── v
│   │       └── cache
│   │           ├── lastfailed
│   │           └── nodeids
│   ├── Cargo.lock
│   ├── Cargo.toml
│   ├── compress.py
│   ├── graph.py
│   ├── models
│   │   ├── bge-small-en-v1.5.onnx
│   │   └── tokenizer.json
│   ├── README.md
│   ├── server.py
│   ├── src
│   │   ├── actors
│   │   │   ├── coordinator.rs
│   │   │   ├── mod.rs
│   │   │   └── watcher.rs
│   │   ├── db
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs
│   │   │   └── writer.rs
│   │   ├── main.rs
│   │   ├── mcp
│   │   │   ├── mod.rs
│   │   │   └── server.rs
│   │   └── pipeline
│   │       ├── mod.rs
│   │       └── worker.rs
│   ├── target
│   │   ├── .rustc_info.json
│   │   ├── CACHEDIR.TAG
│   │   ├── debug
│   │   │   ├── .cargo-lock
│   │   │   ├── .fingerprint
│   │   │   │   ├── ahash-112b80cdca4d4795
│   │   │   │   ├── ahash-550ab32e6f0130c7
│   │   │   │   ├── ahash-621d650c1d05aaaf
│   │   │   │   ├── ahash-bb7db493b4530ca5
│   │   │   │   ├── aho-corasick-4437a5d6426f90e9
│   │   │   │   ├── aho-corasick-667d957dbc5ff89d
│   │   │   │   ├── aho-corasick-e4d240c16779177d
│   │   │   │   ├── anyhow-33d34861694f1b23
│   │   │   │   ├── anyhow-76277cedf12be110
│   │   │   │   ├── anyhow-95ac62169051eebc
│   │   │   │   ├── anyhow-c587b330edd42253
│   │   │   │   ├── autocfg-bf86a7c9e7784a2f
│   │   │   │   │   ├── dep-lib-autocfg
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-autocfg
│   │   │   │   │   └── lib-autocfg.json
│   │   │   │   ├── base64-29e6036a2f6c82cf
│   │   │   │   ├── base64-3ce8c6d3f7a88eeb
│   │   │   │   ├── base64-bde893ec79ef29f1
│   │   │   │   ├── base64ct-dffaece1ca0ad7ca
│   │   │   │   ├── bitflags-16e4802d75075e59
│   │   │   │   ├── bitflags-810630805d470c4d
│   │   │   │   ├── byteorder-e689aeced596cff8
│   │   │   │   ├── bytes-047af3d8c0f71d02
│   │   │   │   ├── bytes-76765b86e79b9d72
│   │   │   │   │   ├── dep-lib-bytes
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-bytes
│   │   │   │   │   └── lib-bytes.json
│   │   │   │   ├── bytes-8a6eb0491cb50e23
│   │   │   │   │   ├── dep-lib-bytes
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-bytes
│   │   │   │   │   └── lib-bytes.json
│   │   │   │   ├── cc-c8feb4c9d782e7c7
│   │   │   │   │   ├── dep-lib-cc
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-cc
│   │   │   │   │   └── lib-cc.json
│   │   │   │   ├── cfg-if-59068db8513376d0
│   │   │   │   │   ├── dep-lib-cfg_if
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-cfg_if
│   │   │   │   │   └── lib-cfg_if.json
│   │   │   │   ├── cfg-if-c2b69e76c7ce3a8e
│   │   │   │   │   ├── dep-lib-cfg_if
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-cfg_if
│   │   │   │   │   └── lib-cfg_if.json
│   │   │   │   ├── chacha20-62dedfa8ce097e9f
│   │   │   │   ├── chacha20-b1fd2908be0fc452
│   │   │   │   ├── console-7440d576bd52abe7
│   │   │   │   ├── console-ef2335b01dfda741
│   │   │   │   ├── cpufeatures-13c3ea7229e88751
│   │   │   │   ├── cpufeatures-e4248beeb3aac2e8
│   │   │   │   ├── crossbeam-channel-33abd80231095bc5
│   │   │   │   ├── crossbeam-channel-6af215627a6d3b19
│   │   │   │   ├── crossbeam-deque-4a4b3f938e40d272
│   │   │   │   ├── crossbeam-deque-8f6e4ff6017d09f7
│   │   │   │   ├── crossbeam-epoch-4930b4541c48175a
│   │   │   │   ├── crossbeam-epoch-8ce5420f735660b3
│   │   │   │   ├── crossbeam-utils-42432b70e646151d
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── crossbeam-utils-544f8f99b115e314
│   │   │   │   ├── crossbeam-utils-865a02ad4258a230
│   │   │   │   ├── crossbeam-utils-dac2b101df1d5f9f
│   │   │   │   ├── darling_core-47e14991ea92bd5b
│   │   │   │   ├── darling_macro-017aadff8ff426e2
│   │   │   │   ├── darling-bc9cd8f4f9d923dc
│   │   │   │   ├── der-528158f98e56ea11
│   │   │   │   ├── derive_builder_core-2b1223344e1035b4
│   │   │   │   ├── derive_builder_macro-5aaad3b9ead7175b
│   │   │   │   ├── derive_builder-a2cdab25cf49452f
│   │   │   │   ├── derive_builder-c7b9af9d5d628a0e
│   │   │   │   ├── either-2b998b402556180e
│   │   │   │   ├── either-7f9687fbfd7a7f12
│   │   │   │   ├── either-cfdbd94854e18a5a
│   │   │   │   ├── encode_unicode-5b330cc2d3385219
│   │   │   │   ├── encode_unicode-ba12d911711d9d06
│   │   │   │   ├── esaxx-rs-74aade11c52306cd
│   │   │   │   ├── esaxx-rs-a7e55d59d72b7885
│   │   │   │   ├── esaxx-rs-adf306fe56bc4a6b
│   │   │   │   ├── esaxx-rs-b716c8095ffae832
│   │   │   │   ├── fallible-iterator-2dad37ad7b0aec86
│   │   │   │   ├── fallible-iterator-c3d4765314261dc1
│   │   │   │   ├── fallible-streaming-iterator-4828b59f605dc2f6
│   │   │   │   ├── fallible-streaming-iterator-d321f7e0a595a855
│   │   │   │   ├── filetime-9a6652c6781aeb83
│   │   │   │   ├── filetime-acbb92f193fb8d02
│   │   │   │   ├── find-msvc-tools-08707f1fddde7e9d
│   │   │   │   │   ├── dep-lib-find_msvc_tools
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-find_msvc_tools
│   │   │   │   │   └── lib-find_msvc_tools.json
│   │   │   │   ├── fnv-ee15dc5557a5d578
│   │   │   │   │   ├── dep-lib-fnv
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-fnv
│   │   │   │   │   └── lib-fnv.json
│   │   │   │   ├── getrandom-0f59ed22098dc98a
│   │   │   │   ├── getrandom-4b0bba6878a1e9f2
│   │   │   │   ├── getrandom-57b50d7c122837e3
│   │   │   │   ├── getrandom-5f3b4b0377c13f20
│   │   │   │   ├── getrandom-b98b4e0adf72b062
│   │   │   │   ├── getrandom-cbcfaba878006d65
│   │   │   │   ├── hashbrown-78c65fbfef37a131
│   │   │   │   ├── hashbrown-c557a5118c6b2ab1
│   │   │   │   ├── hashlink-4dce620581f7a61e
│   │   │   │   ├── hashlink-f69653acea263f37
│   │   │   │   ├── hmac-sha256-7416d58a4bc0a775
│   │   │   │   ├── http-7caba7f59609ae22
│   │   │   │   ├── http-c5251363f836e554
│   │   │   │   ├── httparse-24b581bfaaa9264c
│   │   │   │   ├── httparse-55023d1ea42200c9
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── httparse-dfce2cbb47bdc99f
│   │   │   │   ├── ident_case-73258c4b040b070d
│   │   │   │   │   ├── dep-lib-ident_case
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-ident_case
│   │   │   │   │   └── lib-ident_case.json
│   │   │   │   ├── indicatif-f7fd934a01b1092e
│   │   │   │   ├── indicatif-fc88a2522dd035f7
│   │   │   │   ├── itertools-093a4bf69eb7d0ae
│   │   │   │   ├── itertools-6033efc63b9e792f
│   │   │   │   ├── itertools-94fd4f8518da303d
│   │   │   │   ├── itertools-b26b5071ab051da9
│   │   │   │   ├── itoa-6fb89abca1fe31f7
│   │   │   │   │   ├── dep-lib-itoa
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-itoa
│   │   │   │   │   └── lib-itoa.json
│   │   │   │   ├── itoa-92d8b1e9c0939eb2
│   │   │   │   │   ├── dep-lib-itoa
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-itoa
│   │   │   │   │   └── lib-itoa.json
│   │   │   │   ├── itoa-ff1b3e95b028d27a
│   │   │   │   ├── lazy_static-358fe1d06221ba05
│   │   │   │   ├── lazy_static-d841885ec245de5a
│   │   │   │   ├── libc-1b5eb052a8059af5
│   │   │   │   ├── libc-876224e63920cce2
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── libc-8a48ea3a9667de03
│   │   │   │   ├── libc-dc6abad8c9cb7820
│   │   │   │   ├── libsqlite3-sys-39c5a963989f7159
│   │   │   │   ├── libsqlite3-sys-47c0d773587ea450
│   │   │   │   ├── libsqlite3-sys-8a70a3fed1b308dd
│   │   │   │   ├── libsqlite3-sys-8a8579375e8f42db
│   │   │   │   ├── lock_api-61a0a97d147249f9
│   │   │   │   ├── lock_api-de85b07b75c8942a
│   │   │   │   ├── log-425c51f77dbf60f4
│   │   │   │   ├── log-494bff57f545eb0c
│   │   │   │   ├── log-6f14f6c01cdc1f41
│   │   │   │   ├── lzma-rust2-282a9b1b98e62f4d
│   │   │   │   ├── macro_rules_attribute-37a6e05aa965f6c6
│   │   │   │   ├── macro_rules_attribute-6de2c52593fccb6c
│   │   │   │   ├── macro_rules_attribute-proc_macro-6732cd4671396540
│   │   │   │   ├── matchers-81dbf8d3062e08d7
│   │   │   │   ├── matchers-94992a5baa4cbe5d
│   │   │   │   ├── matchers-ad2e65f83c55e37e
│   │   │   │   ├── matrixmultiply-4923ee11a66ec6a8
│   │   │   │   ├── matrixmultiply-cf26ffdd1016e0c9
│   │   │   │   ├── matrixmultiply-d49a21e60b862bfa
│   │   │   │   ├── matrixmultiply-d50c4c9640ad316e
│   │   │   │   ├── memchr-120c0f92d28ec8a9
│   │   │   │   │   ├── dep-lib-memchr
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-memchr
│   │   │   │   │   └── lib-memchr.json
│   │   │   │   ├── memchr-25e193189ac65f13
│   │   │   │   │   ├── dep-lib-memchr
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-memchr
│   │   │   │   │   └── lib-memchr.json
│   │   │   │   ├── memory-mcp-server-44f0356ea4b9fb0f
│   │   │   │   ├── memory-mcp-server-b1eabe39e18828d9
│   │   │   │   ├── memory-mcp-server-fd01b7ff65c5df16
│   │   │   │   ├── minimal-lexical-014fbd6150c8bae9
│   │   │   │   ├── minimal-lexical-502063777d245869
│   │   │   │   ├── mio-0580fd8b5f433234
│   │   │   │   ├── mio-7688daa219e37913
│   │   │   │   ├── monostate-59e93961de8ea0b8
│   │   │   │   ├── monostate-e34d899df6336eec
│   │   │   │   ├── monostate-impl-3769dd470eb91c27
│   │   │   │   ├── native-tls-3112f106f0d333a5
│   │   │   │   ├── native-tls-4ecfb794afeb498b
│   │   │   │   ├── native-tls-66e2089d8425ba4c
│   │   │   │   ├── native-tls-d56b96e46d641aa6
│   │   │   │   │   └── invoked.timestamp
│   │   │   │   ├── ndarray-260041991ca20aa0
│   │   │   │   ├── ndarray-2dd48cf369e40799
│   │   │   │   ├── nom-696e4cfaa2205bb4
│   │   │   │   ├── nom-a24195c16abe7872
│   │   │   │   ├── notify-1a45315d34aa66bd
│   │   │   │   ├── notify-aaa5fcdb9fd13744
│   │   │   │   ├── nu-ansi-term-a89a0112c7295476
│   │   │   │   ├── nu-ansi-term-fbbfa8089def361b
│   │   │   │   ├── num-complex-036729caad061b99
│   │   │   │   ├── num-complex-b6c348444a692339
│   │   │   │   ├── num-integer-1d651c52e64e0362
│   │   │   │   ├── num-integer-4a771d9eed05c458
│   │   │   │   ├── num-traits-0c738a3d9e3a9836
│   │   │   │   ├── num-traits-21fedd87797232d4
│   │   │   │   ├── num-traits-367adf8c9eaeab7d
│   │   │   │   ├── num-traits-5736536b1e93bbe7
│   │   │   │   ├── number_prefix-3e1174433a785c25
│   │   │   │   ├── number_prefix-fad2a5e03649ad1d
│   │   │   │   ├── once_cell-01a5ec62eb147d5f
│   │   │   │   │   ├── dep-lib-once_cell
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-once_cell
│   │   │   │   │   └── lib-once_cell.json
│   │   │   │   ├── once_cell-ef5f2e0f6d10641f
│   │   │   │   │   ├── dep-lib-once_cell
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-once_cell
│   │   │   │   │   └── lib-once_cell.json
│   │   │   │   ├── onig_sys-32441991e5436d57
│   │   │   │   ├── onig_sys-4a2c4c45d63ce41d
│   │   │   │   ├── onig_sys-a1b4a7c000bc88ec
│   │   │   │   ├── onig_sys-fbee08905d0a7da3
│   │   │   │   ├── onig-89501bb7f631399a
│   │   │   │   ├── onig-adb535adc76fab02
│   │   │   │   ├── ort-8ee330c2d2fbc3aa
│   │   │   │   ├── ort-924c556da4ffe2f9
│   │   │   │   ├── ort-sys-01b48fa42408aa20
│   │   │   │   ├── ort-sys-2f2e27ad70ead42f
│   │   │   │   ├── ort-sys-7444fdbd7efa0dc4
│   │   │   │   ├── ort-sys-9249b3b1b680ab54
│   │   │   │   ├── ort-sys-9ec31609368fd923
│   │   │   │   ├── ort-sys-daaf64f1ceb4dad8
│   │   │   │   ├── parking_lot_core-0f9575b8cb61f8af
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── parking_lot_core-588292848a28df73
│   │   │   │   ├── parking_lot_core-ae7b9910c0c80335
│   │   │   │   ├── parking_lot_core-f10db2a69644242b
│   │   │   │   ├── parking_lot-100d931b491a1d59
│   │   │   │   ├── parking_lot-5aae059e3b0d3f12
│   │   │   │   ├── paste-73ea5008b16bf6f2
│   │   │   │   ├── paste-ef7218349294ce80
│   │   │   │   ├── paste-f09290cce392f093
│   │   │   │   ├── pem-rfc7468-873c78dee3050f02
│   │   │   │   ├── percent-encoding-764d19be0b28f3dc
│   │   │   │   ├── pin-project-lite-0e767b5bef4d40ae
│   │   │   │   ├── pin-project-lite-e197a1fc64da9eb7
│   │   │   │   ├── pkg-config-c3ddb4d8fcde3917
│   │   │   │   │   ├── dep-lib-pkg_config
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-pkg_config
│   │   │   │   │   └── lib-pkg_config.json
│   │   │   │   ├── portable-atomic-0ce8efa97546dd39
│   │   │   │   ├── portable-atomic-34141a32eebd5151
│   │   │   │   ├── portable-atomic-56ea870e277db08d
│   │   │   │   ├── portable-atomic-f258cb5ee4536e6d
│   │   │   │   ├── ppv-lite86-65840c023b811863
│   │   │   │   ├── ppv-lite86-cfdd26639ce0ec31
│   │   │   │   ├── proc-macro2-10a7c9e2c3da988e
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── proc-macro2-98fabed31e67323e
│   │   │   │   ├── proc-macro2-b454574685f2d7fd
│   │   │   │   ├── quote-1955c02359f3435a
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── quote-6fee11d8ab3728e9
│   │   │   │   ├── quote-8b22841bf5ce26c2
│   │   │   │   ├── r2d2_sqlite-41ecec7fad49a8e2
│   │   │   │   ├── r2d2_sqlite-5767e78f7b30a956
│   │   │   │   ├── r2d2-4afcef5c791f0c18
│   │   │   │   ├── r2d2-a6472ab579c8826a
│   │   │   │   ├── rand_chacha-42815f7416695155
│   │   │   │   ├── rand_chacha-b6b4d28f1abd3402
│   │   │   │   ├── rand_core-430571a493eace91
│   │   │   │   ├── rand_core-db03dd196b489a1a
│   │   │   │   ├── rand_core-dbdf680b0d332020
│   │   │   │   ├── rand_core-dd5b5de8ec4cbded
│   │   │   │   ├── rand-2d6e35dbab696cb9
│   │   │   │   ├── rand-620cd0190c0b5994
│   │   │   │   ├── rand-7c6223d6ce6a38c1
│   │   │   │   ├── rand-b5e29cb84498d0d3
│   │   │   │   ├── rawpointer-24c84ebb47984188
│   │   │   │   ├── rawpointer-8980953dbe7fd0b9
│   │   │   │   ├── rayon-0195fd5e1494925a
│   │   │   │   ├── rayon-432f69146e423cac
│   │   │   │   ├── rayon-7e552900908c502a
│   │   │   │   ├── rayon-cond-1b4bcf033ed48c4e
│   │   │   │   ├── rayon-cond-ed47a3a925801f45
│   │   │   │   ├── rayon-core-306c8d0ed05b66da
│   │   │   │   ├── rayon-core-7334b6869c2746b4
│   │   │   │   ├── rayon-core-bbf6712e6f6f40d5
│   │   │   │   ├── rayon-core-d7efe9bf3be046de
│   │   │   │   ├── regex-0b8708cb266de13b
│   │   │   │   ├── regex-145816cf4a6c145b
│   │   │   │   ├── regex-automata-63d918970e6588dd
│   │   │   │   ├── regex-automata-81338a0789c98264
│   │   │   │   ├── regex-automata-d83dc0fc92d934c6
│   │   │   │   ├── regex-ccf7cf428496cb8f
│   │   │   │   ├── regex-syntax-280792f168c30571
│   │   │   │   ├── regex-syntax-4fa10c42a51002ab
│   │   │   │   ├── rusqlite-1d9d8de1ea28a916
│   │   │   │   ├── rusqlite-a5bad08f1b31c100
│   │   │   │   ├── rustls-pki-types-1157b2f1ed514d06
│   │   │   │   ├── same-file-05410c40ff5cc25e
│   │   │   │   ├── same-file-ca843abbfe8c8027
│   │   │   │   ├── schannel-9caf2e6b70957eeb
│   │   │   │   ├── schannel-b8120e951a5afeb1
│   │   │   │   ├── scheduled-thread-pool-9cd1d777eda9e84b
│   │   │   │   ├── scheduled-thread-pool-a70b76187240c1e9
│   │   │   │   ├── scopeguard-5fdeabdf4f6bf574
│   │   │   │   ├── scopeguard-ff96c909ded4fda5
│   │   │   │   ├── serde_core-30b81be079ba16dd
│   │   │   │   ├── serde_core-8e650f168ee0310d
│   │   │   │   ├── serde_core-a82e9052872013e6
│   │   │   │   ├── serde_core-f95b864b058cf2e3
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── serde_derive-cdc87888b93a8c62
│   │   │   │   ├── serde_json-04af0b73e960cacb
│   │   │   │   ├── serde_json-389323f0405de837
│   │   │   │   ├── serde_json-808d403d238e6d78
│   │   │   │   ├── serde_json-bacf2ddc8e91f05f
│   │   │   │   ├── serde-226b1c3826c13038
│   │   │   │   ├── serde-49ed553e01a407b0
│   │   │   │   ├── serde-a8da8f0875afcebc
│   │   │   │   ├── serde-c73bf94709ed1273
│   │   │   │   ├── sharded-slab-00c94f2b754575d0
│   │   │   │   ├── sharded-slab-53388061c15d8bfb
│   │   │   │   ├── shlex-b9805c329debb77b
│   │   │   │   │   ├── dep-lib-shlex
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-shlex
│   │   │   │   │   └── lib-shlex.json
│   │   │   │   ├── smallvec-0bc754f1667b1370
│   │   │   │   │   ├── dep-lib-smallvec
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-smallvec
│   │   │   │   │   └── lib-smallvec.json
│   │   │   │   ├── smallvec-6cdffd41099ffc2d
│   │   │   │   │   ├── dep-lib-smallvec
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-smallvec
│   │   │   │   │   └── lib-smallvec.json
│   │   │   │   ├── socket2-0ed6d2dda90406f7
│   │   │   │   ├── socket2-667538cca9e7d28b
│   │   │   │   ├── socks-224ac2de8f5a3e95
│   │   │   │   ├── spm_precompiled-04fc2bc92b05f8dd
│   │   │   │   ├── spm_precompiled-e2772d8706ae2ac8
│   │   │   │   ├── strsim-a9e5f57c3c594ff6
│   │   │   │   ├── syn-e196cad5c5f21bbd
│   │   │   │   ├── thiserror-1b596e34b81eabf9
│   │   │   │   ├── thiserror-6636807358cdee76
│   │   │   │   ├── thiserror-ba0f98ba7800b8d7
│   │   │   │   ├── thiserror-bc0bfe698dc31d7d
│   │   │   │   ├── thiserror-impl-96797363dd215e91
│   │   │   │   ├── thread_local-15b7a2c5ea200037
│   │   │   │   ├── thread_local-66aedbfcb4ef3b71
│   │   │   │   ├── tokenizers-06120ab16dcff240
│   │   │   │   ├── tokenizers-9930c435ff90a4c5
│   │   │   │   ├── tokio-11d01925cc029adb
│   │   │   │   ├── tokio-ed8ce5969ce04827
│   │   │   │   ├── tokio-macros-8f702b6e825a7cc2
│   │   │   │   ├── tracing-00cae92bfddde102
│   │   │   │   ├── tracing-3bd3421738eb40c7
│   │   │   │   ├── tracing-attributes-54d38fe3a09427c1
│   │   │   │   ├── tracing-core-145f7cef1c477dea
│   │   │   │   ├── tracing-core-2082e7949f804ea6
│   │   │   │   ├── tracing-log-0eee3b55b2fc379b
│   │   │   │   ├── tracing-log-12557c6bbc6fa6dc
│   │   │   │   ├── tracing-subscriber-2741e996db52dad0
│   │   │   │   ├── tracing-subscriber-6ee2aa63ee8942fb
│   │   │   │   ├── tracing-subscriber-e24ea8bf0be61933
│   │   │   │   ├── tree-sitter-418c57ea9ee12c02
│   │   │   │   ├── tree-sitter-540b76cdd35d9b6b
│   │   │   │   ├── tree-sitter-999d539ccb4eb881
│   │   │   │   ├── tree-sitter-aea208e17f4996c2
│   │   │   │   ├── tree-sitter-cab72d28343d8bae
│   │   │   │   ├── tree-sitter-rust-0c610b34be1026e2
│   │   │   │   ├── tree-sitter-rust-30ea94eeee609140
│   │   │   │   ├── tree-sitter-rust-32a3b97a5ba2cce7
│   │   │   │   ├── tree-sitter-rust-7237226ff1125d89
│   │   │   │   ├── unicode_categories-4467a14114ccafb6
│   │   │   │   ├── unicode_categories-63e4ef9a9dbc342b
│   │   │   │   ├── unicode-ident-c19b7d19e98e00c5
│   │   │   │   │   ├── dep-lib-unicode_ident
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-unicode_ident
│   │   │   │   │   └── lib-unicode_ident.json
│   │   │   │   ├── unicode-normalization-alignments-9fee27dbd05e5a30
│   │   │   │   ├── unicode-normalization-alignments-c3e4b7f62b70caa4
│   │   │   │   ├── unicode-segmentation-1680285599af9fc8
│   │   │   │   ├── unicode-segmentation-3f66837b8e3cea07
│   │   │   │   ├── unicode-width-293107a69ec8ad71
│   │   │   │   ├── unicode-width-d75ea0a976ec83f9
│   │   │   │   ├── ureq-2d21044dd9ee4b3f
│   │   │   │   ├── ureq-4df262e4ee9864a2
│   │   │   │   ├── ureq-proto-4c65421e27c93e2e
│   │   │   │   ├── ureq-proto-afa8dd7a685ef787
│   │   │   │   ├── utf8-zero-561cb0cc9847db8e
│   │   │   │   ├── uuid-1fc0b89ca703ddae
│   │   │   │   ├── uuid-be2f801839828f62
│   │   │   │   ├── vcpkg-cfede6aa8c5599cb
│   │   │   │   ├── version_check-cb5c9d34d558413d
│   │   │   │   │   ├── dep-lib-version_check
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-version_check
│   │   │   │   │   └── lib-version_check.json
│   │   │   │   ├── walkdir-4653403e0e46700c
│   │   │   │   ├── walkdir-ee6f007a6d7083d5
│   │   │   │   ├── webpki-root-certs-290ffdd0d78aa2af
│   │   │   │   ├── winapi-4539467e386a0160
│   │   │   │   ├── winapi-7a04b8806c50d3a5
│   │   │   │   ├── winapi-fc7f2477d2d62f24
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── winapi-util-cd01e91a0cb1145e
│   │   │   │   ├── winapi-util-f99d09b6beb67cc8
│   │   │   │   ├── windows_x86_64_msvc-02930314deb7e4c2
│   │   │   │   ├── windows_x86_64_msvc-0efb6d2aed666b81
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── windows_x86_64_msvc-3378ed7e828e9860
│   │   │   │   ├── windows_x86_64_msvc-6a298888f1a7cb64
│   │   │   │   ├── windows_x86_64_msvc-a1c906d899b4a4f7
│   │   │   │   ├── windows_x86_64_msvc-e6badc4be1c7b0e8
│   │   │   │   ├── windows_x86_64_msvc-fbe082120e27b6ae
│   │   │   │   ├── windows_x86_64_msvc-ffc777d573fa34f7
│   │   │   │   ├── windows-link-0ce570982ccb1c2e
│   │   │   │   │   ├── dep-lib-windows_link
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-windows_link
│   │   │   │   │   └── lib-windows_link.json
│   │   │   │   ├── windows-link-4912c44494a09911
│   │   │   │   │   ├── dep-lib-windows_link
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-windows_link
│   │   │   │   │   └── lib-windows_link.json
│   │   │   │   ├── windows-link-57fe558fbc78bd39
│   │   │   │   │   ├── dep-lib-windows_link
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-windows_link
│   │   │   │   │   └── lib-windows_link.json
│   │   │   │   ├── windows-sys-0475b418bdbd8de7
│   │   │   │   ├── windows-sys-293bc5d86578848d
│   │   │   │   │   ├── dep-lib-windows_sys
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-windows_sys
│   │   │   │   │   └── lib-windows_sys.json
│   │   │   │   ├── windows-sys-3b2a1ec8648dcf7c
│   │   │   │   ├── windows-sys-4d39483d409e0d26
│   │   │   │   ├── windows-sys-b6909b5e22872040
│   │   │   │   ├── windows-sys-ba221085bd34d400
│   │   │   │   ├── windows-sys-f39f9284d20376d8
│   │   │   │   ├── windows-sys-f55d9c771b15c4b1
│   │   │   │   │   ├── dep-lib-windows_sys
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-windows_sys
│   │   │   │   │   └── lib-windows_sys.json
│   │   │   │   ├── windows-targets-a6463aa4945fa662
│   │   │   │   ├── windows-targets-d97ed811d9fe28ef
│   │   │   │   ├── windows-targets-e179bb463291d9ca
│   │   │   │   ├── windows-targets-e89433938f6dfd93
│   │   │   │   ├── zerocopy-b3af1cc636c68b33
│   │   │   │   ├── zerocopy-d450b3bbe2bd25fa
│   │   │   │   ├── zerocopy-f39847fa4ad7347a
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   └── output-build-script-build-script-build
│   │   │   │   ├── zerocopy-f7cde724e46f52fd
│   │   │   │   ├── zeroize-95f4582d11160583
│   │   │   │   │   ├── dep-lib-zeroize
│   │   │   │   │   ├── invoked.timestamp
│   │   │   │   │   ├── lib-zeroize
│   │   │   │   │   └── lib-zeroize.json
│   │   │   │   ├── zmij-4af8959139dacb54
│   │   │   │   ├── zmij-8ab589d2e5f8b1c4
│   │   │   │   ├── zmij-8cf862dc85352143
│   │   │   │   └── zmij-9dc4ec678a558b55
│   │   │   ├── deps
│   │   │   │   ├── autocfg-bf86a7c9e7784a2f.d
│   │   │   │   ├── bytes-76765b86e79b9d72.d
│   │   │   │   ├── bytes-8a6eb0491cb50e23.d
│   │   │   │   ├── cc-c8feb4c9d782e7c7.d
│   │   │   │   ├── cfg_if-59068db8513376d0.d
│   │   │   │   ├── cfg_if-c2b69e76c7ce3a8e.d
│   │   │   │   ├── find_msvc_tools-08707f1fddde7e9d.d
│   │   │   │   ├── fnv-ee15dc5557a5d578.d
│   │   │   │   ├── ident_case-73258c4b040b070d.d
│   │   │   │   ├── itoa-6fb89abca1fe31f7.d
│   │   │   │   ├── itoa-92d8b1e9c0939eb2.d
│   │   │   │   ├── libautocfg-bf86a7c9e7784a2f.rlib
│   │   │   │   ├── libautocfg-bf86a7c9e7784a2f.rmeta
│   │   │   │   ├── libbytes-76765b86e79b9d72.rlib
│   │   │   │   ├── libbytes-76765b86e79b9d72.rmeta
│   │   │   │   ├── libbytes-8a6eb0491cb50e23.rlib
│   │   │   │   ├── libbytes-8a6eb0491cb50e23.rmeta
│   │   │   │   ├── libcc-c8feb4c9d782e7c7.rlib
│   │   │   │   ├── libcc-c8feb4c9d782e7c7.rmeta
│   │   │   │   ├── libcfg_if-59068db8513376d0.rlib
│   │   │   │   ├── libcfg_if-59068db8513376d0.rmeta
│   │   │   │   ├── libcfg_if-c2b69e76c7ce3a8e.rmeta
│   │   │   │   ├── libfind_msvc_tools-08707f1fddde7e9d.rlib
│   │   │   │   ├── libfind_msvc_tools-08707f1fddde7e9d.rmeta
│   │   │   │   ├── libfnv-ee15dc5557a5d578.rlib
│   │   │   │   ├── libfnv-ee15dc5557a5d578.rmeta
│   │   │   │   ├── libident_case-73258c4b040b070d.rlib
│   │   │   │   ├── libident_case-73258c4b040b070d.rmeta
│   │   │   │   ├── libitoa-6fb89abca1fe31f7.rlib
│   │   │   │   ├── libitoa-6fb89abca1fe31f7.rmeta
│   │   │   │   ├── libitoa-92d8b1e9c0939eb2.rlib
│   │   │   │   ├── libitoa-92d8b1e9c0939eb2.rmeta
│   │   │   │   ├── libmemchr-120c0f92d28ec8a9.rmeta
│   │   │   │   ├── libmemchr-25e193189ac65f13.rlib
│   │   │   │   ├── libmemchr-25e193189ac65f13.rmeta
│   │   │   │   ├── libonce_cell-01a5ec62eb147d5f.rlib
│   │   │   │   ├── libonce_cell-01a5ec62eb147d5f.rmeta
│   │   │   │   ├── libonce_cell-ef5f2e0f6d10641f.rmeta
│   │   │   │   ├── libpkg_config-c3ddb4d8fcde3917.rlib
│   │   │   │   ├── libpkg_config-c3ddb4d8fcde3917.rmeta
│   │   │   │   ├── libshlex-b9805c329debb77b.rlib
│   │   │   │   ├── libshlex-b9805c329debb77b.rmeta
│   │   │   │   ├── libsmallvec-0bc754f1667b1370.rlib
│   │   │   │   ├── libsmallvec-0bc754f1667b1370.rmeta
│   │   │   │   ├── libsmallvec-6cdffd41099ffc2d.rmeta
│   │   │   │   ├── libunicode_ident-c19b7d19e98e00c5.rlib
│   │   │   │   ├── libunicode_ident-c19b7d19e98e00c5.rmeta
│   │   │   │   ├── libversion_check-cb5c9d34d558413d.rlib
│   │   │   │   ├── libversion_check-cb5c9d34d558413d.rmeta
│   │   │   │   ├── libwindows_link-0ce570982ccb1c2e.rmeta
│   │   │   │   ├── libwindows_link-4912c44494a09911.rlib
│   │   │   │   ├── libwindows_link-4912c44494a09911.rmeta
│   │   │   │   ├── libwindows_link-57fe558fbc78bd39.rlib
│   │   │   │   ├── libwindows_link-57fe558fbc78bd39.rmeta
│   │   │   │   ├── libwindows_sys-293bc5d86578848d.rmeta
│   │   │   │   ├── libwindows_sys-f55d9c771b15c4b1.rlib
│   │   │   │   ├── libwindows_sys-f55d9c771b15c4b1.rmeta
│   │   │   │   ├── libzeroize-95f4582d11160583.rlib
│   │   │   │   ├── libzeroize-95f4582d11160583.rmeta
│   │   │   │   ├── memchr-120c0f92d28ec8a9.d
│   │   │   │   ├── memchr-25e193189ac65f13.d
│   │   │   │   ├── once_cell-01a5ec62eb147d5f.d
│   │   │   │   ├── once_cell-ef5f2e0f6d10641f.d
│   │   │   │   ├── pkg_config-c3ddb4d8fcde3917.d
│   │   │   │   ├── shlex-b9805c329debb77b.d
│   │   │   │   ├── smallvec-0bc754f1667b1370.d
│   │   │   │   ├── smallvec-6cdffd41099ffc2d.d
│   │   │   │   ├── unicode_ident-c19b7d19e98e00c5.d
│   │   │   │   ├── version_check-cb5c9d34d558413d.d
│   │   │   │   ├── windows_link-0ce570982ccb1c2e.d
│   │   │   │   ├── windows_link-4912c44494a09911.d
│   │   │   │   ├── windows_link-57fe558fbc78bd39.d
│   │   │   │   ├── windows_sys-293bc5d86578848d.d
│   │   │   │   ├── windows_sys-f55d9c771b15c4b1.d
│   │   │   │   └── zeroize-95f4582d11160583.d
│   │   │   ├── examples
│   │   │   └── incremental
│   │   └── release
│   │       ├── .cargo-lock
│   │       ├── .fingerprint
│   │       │   ├── ahash-58fb2d53b95c4702
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── ahash-c8d5a17b37b21e06
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── ahash-e078b8640013dc0e
│   │       │   │   ├── dep-lib-ahash
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ahash
│   │       │   │   └── lib-ahash.json
│   │       │   ├── aho-corasick-4b644fddaefa6291
│   │       │   │   ├── dep-lib-aho_corasick
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-aho_corasick
│   │       │   │   └── lib-aho_corasick.json
│   │       │   ├── anyhow-64f5acc7b5d2d8d9
│   │       │   │   ├── dep-lib-anyhow
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-anyhow
│   │       │   │   └── lib-anyhow.json
│   │       │   ├── anyhow-a8c3f84afaa47125
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── anyhow-c13d4f8698a4cc35
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── autocfg-595dc2db0709cc81
│   │       │   │   ├── dep-lib-autocfg
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-autocfg
│   │       │   │   └── lib-autocfg.json
│   │       │   ├── base64-79fb3efb36e1397d
│   │       │   │   ├── dep-lib-base64
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-base64
│   │       │   │   └── lib-base64.json
│   │       │   ├── base64-9c341375b507ed1a
│   │       │   │   ├── dep-lib-base64
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-base64
│   │       │   │   └── lib-base64.json
│   │       │   ├── base64ct-1cb288e07540095b
│   │       │   │   ├── dep-lib-base64ct
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-base64ct
│   │       │   │   └── lib-base64ct.json
│   │       │   ├── bitflags-dc3c5d8a0eba103e
│   │       │   │   ├── dep-lib-bitflags
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-bitflags
│   │       │   │   └── lib-bitflags.json
│   │       │   ├── byteorder-a8c4c8b749b3bc0c
│   │       │   │   ├── dep-lib-byteorder
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-byteorder
│   │       │   │   └── lib-byteorder.json
│   │       │   ├── bytes-61d7a7f94307a605
│   │       │   │   ├── dep-lib-bytes
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-bytes
│   │       │   │   └── lib-bytes.json
│   │       │   ├── bytes-a5d656192c74833c
│   │       │   │   ├── dep-lib-bytes
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-bytes
│   │       │   │   └── lib-bytes.json
│   │       │   ├── cc-8d60e041c6a204f7
│   │       │   │   ├── dep-lib-cc
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-cc
│   │       │   │   └── lib-cc.json
│   │       │   ├── cfg-if-0aed049cbaf004b2
│   │       │   │   ├── dep-lib-cfg_if
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-cfg_if
│   │       │   │   └── lib-cfg_if.json
│   │       │   ├── chacha20-2f314f9348d578ac
│   │       │   │   ├── dep-lib-chacha20
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-chacha20
│   │       │   │   └── lib-chacha20.json
│   │       │   ├── console-df809cbbc8be0953
│   │       │   │   ├── dep-lib-console
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-console
│   │       │   │   └── lib-console.json
│   │       │   ├── cpufeatures-fc82f5b8224a0a10
│   │       │   │   ├── dep-lib-cpufeatures
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-cpufeatures
│   │       │   │   └── lib-cpufeatures.json
│   │       │   ├── crossbeam-channel-1fecbd56e8f1952a
│   │       │   │   ├── dep-lib-crossbeam_channel
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-crossbeam_channel
│   │       │   │   └── lib-crossbeam_channel.json
│   │       │   ├── crossbeam-deque-f85d0f280cf86621
│   │       │   │   ├── dep-lib-crossbeam_deque
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-crossbeam_deque
│   │       │   │   └── lib-crossbeam_deque.json
│   │       │   ├── crossbeam-epoch-3eedff14eb1ca204
│   │       │   │   ├── dep-lib-crossbeam_epoch
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-crossbeam_epoch
│   │       │   │   └── lib-crossbeam_epoch.json
│   │       │   ├── crossbeam-utils-1225b4718ea82f49
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── crossbeam-utils-41e6bae266576bd2
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── crossbeam-utils-5536d32ba88b51e4
│   │       │   │   ├── dep-lib-crossbeam_utils
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-crossbeam_utils
│   │       │   │   └── lib-crossbeam_utils.json
│   │       │   ├── darling_core-c3b9d1015a0edcc4
│   │       │   │   ├── dep-lib-darling_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-darling_core
│   │       │   │   └── lib-darling_core.json
│   │       │   ├── darling_macro-5f36e70272d4d330
│   │       │   │   ├── dep-lib-darling_macro
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-darling_macro
│   │       │   │   └── lib-darling_macro.json
│   │       │   ├── darling-3a2fb4401119d1b7
│   │       │   │   ├── dep-lib-darling
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-darling
│   │       │   │   └── lib-darling.json
│   │       │   ├── der-46d25d622808855a
│   │       │   │   ├── dep-lib-der
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-der
│   │       │   │   └── lib-der.json
│   │       │   ├── derive_builder_core-14516cffd851dfd6
│   │       │   │   ├── dep-lib-derive_builder_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-derive_builder_core
│   │       │   │   └── lib-derive_builder_core.json
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4
│   │       │   │   ├── dep-lib-derive_builder_macro
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-derive_builder_macro
│   │       │   │   └── lib-derive_builder_macro.json
│   │       │   ├── derive_builder-615eafbacbd90123
│   │       │   │   ├── dep-lib-derive_builder
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-derive_builder
│   │       │   │   └── lib-derive_builder.json
│   │       │   ├── either-6d90bd5e756b030a
│   │       │   │   ├── dep-lib-either
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-either
│   │       │   │   └── lib-either.json
│   │       │   ├── encode_unicode-cd0fba09d238d29d
│   │       │   │   ├── dep-lib-encode_unicode
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-encode_unicode
│   │       │   │   └── lib-encode_unicode.json
│   │       │   ├── esaxx-rs-22b7936cb3401cac
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── esaxx-rs-61374720b79d80b3
│   │       │   │   ├── dep-lib-esaxx_rs
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-esaxx_rs
│   │       │   │   └── lib-esaxx_rs.json
│   │       │   ├── esaxx-rs-752682f83359bbc6
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── fallible-iterator-0d1201373a4cd062
│   │       │   │   ├── dep-lib-fallible_iterator
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-fallible_iterator
│   │       │   │   └── lib-fallible_iterator.json
│   │       │   ├── fallible-streaming-iterator-bf98164feb09bd31
│   │       │   │   ├── dep-lib-fallible_streaming_iterator
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-fallible_streaming_iterator
│   │       │   │   └── lib-fallible_streaming_iterator.json
│   │       │   ├── filetime-b0ebded795f04324
│   │       │   │   ├── dep-lib-filetime
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-filetime
│   │       │   │   └── lib-filetime.json
│   │       │   ├── find-msvc-tools-16e37ad165d2bd6c
│   │       │   │   ├── dep-lib-find_msvc_tools
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-find_msvc_tools
│   │       │   │   └── lib-find_msvc_tools.json
│   │       │   ├── fnv-cc8a3207b85855dc
│   │       │   │   ├── dep-lib-fnv
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-fnv
│   │       │   │   └── lib-fnv.json
│   │       │   ├── getrandom-7d60d37719726cab
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── getrandom-a5b4a0530237b683
│   │       │   │   ├── dep-lib-getrandom
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-getrandom
│   │       │   │   └── lib-getrandom.json
│   │       │   ├── getrandom-dbc54eed1c5a6cdf
│   │       │   │   ├── dep-lib-getrandom
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-getrandom
│   │       │   │   └── lib-getrandom.json
│   │       │   ├── getrandom-f4181a4670d61ac9
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── hashbrown-be841ecae76c1beb
│   │       │   │   ├── dep-lib-hashbrown
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-hashbrown
│   │       │   │   └── lib-hashbrown.json
│   │       │   ├── hashlink-27b65c26e9ecebee
│   │       │   │   ├── dep-lib-hashlink
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-hashlink
│   │       │   │   └── lib-hashlink.json
│   │       │   ├── hmac-sha256-11874b94547bcdf6
│   │       │   │   ├── dep-lib-hmac_sha256
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-hmac_sha256
│   │       │   │   └── lib-hmac_sha256.json
│   │       │   ├── http-30d085a8843d9106
│   │       │   │   ├── dep-lib-http
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-http
│   │       │   │   └── lib-http.json
│   │       │   ├── httparse-336b810ae26bb98f
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── httparse-7de591706e3f6dc7
│   │       │   │   ├── dep-lib-httparse
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-httparse
│   │       │   │   └── lib-httparse.json
│   │       │   ├── httparse-e77459743879b6bb
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── ident_case-52faa40932e9375b
│   │       │   │   ├── dep-lib-ident_case
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ident_case
│   │       │   │   └── lib-ident_case.json
│   │       │   ├── indicatif-7f4b31b2eddc0dd7
│   │       │   │   ├── dep-lib-indicatif
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-indicatif
│   │       │   │   └── lib-indicatif.json
│   │       │   ├── itertools-6fad28849e7771d9
│   │       │   │   ├── dep-lib-itertools
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-itertools
│   │       │   │   └── lib-itertools.json
│   │       │   ├── itertools-939652d0c2c5eac0
│   │       │   │   ├── dep-lib-itertools
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-itertools
│   │       │   │   └── lib-itertools.json
│   │       │   ├── itoa-1e1ff46248f290fe
│   │       │   │   ├── dep-lib-itoa
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-itoa
│   │       │   │   └── lib-itoa.json
│   │       │   ├── itoa-75667997c59a2b0c
│   │       │   │   ├── dep-lib-itoa
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-itoa
│   │       │   │   └── lib-itoa.json
│   │       │   ├── lazy_static-c3d7d6d760728976
│   │       │   │   ├── dep-lib-lazy_static
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-lazy_static
│   │       │   │   └── lib-lazy_static.json
│   │       │   ├── libc-00562241ed754e7b
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── libc-7ee64b3e8f453467
│   │       │   │   ├── dep-lib-libc
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-libc
│   │       │   │   └── lib-libc.json
│   │       │   ├── libc-cf6f6a838a733c62
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── libsqlite3-sys-2e31ed58d3358bde
│   │       │   │   ├── dep-lib-libsqlite3_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-libsqlite3_sys
│   │       │   │   └── lib-libsqlite3_sys.json
│   │       │   ├── libsqlite3-sys-db750d59a9fd8a74
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── libsqlite3-sys-e35db5463156885a
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── lock_api-3810751b30e36416
│   │       │   │   ├── dep-lib-lock_api
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-lock_api
│   │       │   │   └── lib-lock_api.json
│   │       │   ├── log-36c89f4e07310697
│   │       │   │   ├── dep-lib-log
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-log
│   │       │   │   └── lib-log.json
│   │       │   ├── log-cbc67f7b9c610127
│   │       │   │   ├── dep-lib-log
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-log
│   │       │   │   └── lib-log.json
│   │       │   ├── lzma-rust2-70af5624b22a06b3
│   │       │   │   ├── dep-lib-lzma_rust2
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-lzma_rust2
│   │       │   │   └── lib-lzma_rust2.json
│   │       │   ├── macro_rules_attribute-203fc92873cd5baa
│   │       │   │   ├── dep-lib-macro_rules_attribute
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-macro_rules_attribute
│   │       │   │   └── lib-macro_rules_attribute.json
│   │       │   ├── macro_rules_attribute-proc_macro-48b009b34581b4ea
│   │       │   │   ├── dep-lib-macro_rules_attribute_proc_macro
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-macro_rules_attribute_proc_macro
│   │       │   │   └── lib-macro_rules_attribute_proc_macro.json
│   │       │   ├── matchers-1476cb98497ecb7c
│   │       │   │   ├── dep-lib-matchers
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-matchers
│   │       │   │   └── lib-matchers.json
│   │       │   ├── matrixmultiply-5f6d85401fffd081
│   │       │   │   ├── dep-lib-matrixmultiply
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-matrixmultiply
│   │       │   │   └── lib-matrixmultiply.json
│   │       │   ├── matrixmultiply-b30ec5a4d6d6a426
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── matrixmultiply-ba41a7fdfa9ed432
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── memchr-65a9950815c7e8a6
│   │       │   │   ├── dep-lib-memchr
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-memchr
│   │       │   │   └── lib-memchr.json
│   │       │   ├── memory-mcp-server-0e177a10d82c7ece
│   │       │   │   ├── bin-memory-mcp-server
│   │       │   │   ├── bin-memory-mcp-server.json
│   │       │   │   ├── dep-bin-memory-mcp-server
│   │       │   │   ├── invoked.timestamp
│   │       │   │   └── output-bin-memory-mcp-server
│   │       │   ├── minimal-lexical-38d376f6535c0345
│   │       │   │   ├── dep-lib-minimal_lexical
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-minimal_lexical
│   │       │   │   └── lib-minimal_lexical.json
│   │       │   ├── mio-1e693d47a940ec17
│   │       │   │   ├── dep-lib-mio
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-mio
│   │       │   │   └── lib-mio.json
│   │       │   ├── monostate-18d9fae476a8f9c1
│   │       │   │   ├── dep-lib-monostate
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-monostate
│   │       │   │   └── lib-monostate.json
│   │       │   ├── monostate-impl-caa758a6ef115fe6
│   │       │   │   ├── dep-lib-monostate_impl
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-monostate_impl
│   │       │   │   └── lib-monostate_impl.json
│   │       │   ├── native-tls-1afcc3a9316c45d9
│   │       │   │   ├── dep-lib-native_tls
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-native_tls
│   │       │   │   └── lib-native_tls.json
│   │       │   ├── native-tls-7182af987e36ac19
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── native-tls-939b80bd1d93a0fc
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── ndarray-df1177512d20d972
│   │       │   │   ├── dep-lib-ndarray
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ndarray
│   │       │   │   └── lib-ndarray.json
│   │       │   ├── nom-7f820d7b6e98ebb5
│   │       │   │   ├── dep-lib-nom
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-nom
│   │       │   │   └── lib-nom.json
│   │       │   ├── notify-cda32c2761460238
│   │       │   │   ├── dep-lib-notify
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-notify
│   │       │   │   └── lib-notify.json
│   │       │   ├── nu-ansi-term-287e5bdfe08df06e
│   │       │   │   ├── dep-lib-nu_ansi_term
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-nu_ansi_term
│   │       │   │   └── lib-nu_ansi_term.json
│   │       │   ├── num-complex-5835564acb1101a2
│   │       │   │   ├── dep-lib-num_complex
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-num_complex
│   │       │   │   └── lib-num_complex.json
│   │       │   ├── num-integer-5e8c70ceade3461c
│   │       │   │   ├── dep-lib-num_integer
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-num_integer
│   │       │   │   └── lib-num_integer.json
│   │       │   ├── num-traits-5e6d8f681d06f8c3
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── num-traits-974b68336b617133
│   │       │   │   ├── dep-lib-num_traits
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-num_traits
│   │       │   │   └── lib-num_traits.json
│   │       │   ├── num-traits-dca20ef2168a7c46
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── number_prefix-135aa3b30e1339b6
│   │       │   │   ├── dep-lib-number_prefix
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-number_prefix
│   │       │   │   └── lib-number_prefix.json
│   │       │   ├── once_cell-d8b46783864b2991
│   │       │   │   ├── dep-lib-once_cell
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-once_cell
│   │       │   │   └── lib-once_cell.json
│   │       │   ├── onig_sys-2c14a8628634c2d6
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── onig_sys-9b1afab84af8e8eb
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── onig_sys-ca8d08f10586fa3a
│   │       │   │   ├── dep-lib-onig_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-onig_sys
│   │       │   │   └── lib-onig_sys.json
│   │       │   ├── onig-873405d40a39fb3e
│   │       │   │   ├── dep-lib-onig
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-onig
│   │       │   │   └── lib-onig.json
│   │       │   ├── ort-1776a8ae68fad826
│   │       │   │   ├── dep-lib-ort
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ort
│   │       │   │   └── lib-ort.json
│   │       │   ├── ort-sys-0c61de1d46dadbf3
│   │       │   │   ├── dep-lib-ort_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ort_sys
│   │       │   │   └── lib-ort_sys.json
│   │       │   ├── ort-sys-7522d000edc52d57
│   │       │   │   ├── run-build-script-build-script-main
│   │       │   │   └── run-build-script-build-script-main.json
│   │       │   ├── ort-sys-971d6397ca96c660
│   │       │   │   ├── build-script-build-script-main
│   │       │   │   ├── build-script-build-script-main.json
│   │       │   │   ├── dep-build-script-build-script-main
│   │       │   │   └── invoked.timestamp
│   │       │   ├── parking_lot_core-53a98cbc336c84a2
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── parking_lot_core-776cedd0768071c4
│   │       │   │   ├── dep-lib-parking_lot_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-parking_lot_core
│   │       │   │   └── lib-parking_lot_core.json
│   │       │   ├── parking_lot_core-d6c9f6207e76c318
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── parking_lot-e0b706e4e0046169
│   │       │   │   ├── dep-lib-parking_lot
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-parking_lot
│   │       │   │   └── lib-parking_lot.json
│   │       │   ├── paste-6a5a20a0e7b5bb16
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── paste-cb4dfa892a5b298d
│   │       │   │   ├── dep-lib-paste
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-paste
│   │       │   │   └── lib-paste.json
│   │       │   ├── paste-e1798289f80f0f42
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── pem-rfc7468-72bd6df5b9aa80f2
│   │       │   │   ├── dep-lib-pem_rfc7468
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-pem_rfc7468
│   │       │   │   └── lib-pem_rfc7468.json
│   │       │   ├── percent-encoding-96165d9d37997cd3
│   │       │   │   ├── dep-lib-percent_encoding
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-percent_encoding
│   │       │   │   └── lib-percent_encoding.json
│   │       │   ├── pin-project-lite-9b2c1669d6a9d645
│   │       │   │   ├── dep-lib-pin_project_lite
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-pin_project_lite
│   │       │   │   └── lib-pin_project_lite.json
│   │       │   ├── pkg-config-654ad8e1161e1b44
│   │       │   │   ├── dep-lib-pkg_config
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-pkg_config
│   │       │   │   └── lib-pkg_config.json
│   │       │   ├── portable-atomic-0ab16fc3c394d875
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── portable-atomic-7799eb0436a822e8
│   │       │   │   ├── dep-lib-portable_atomic
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-portable_atomic
│   │       │   │   └── lib-portable_atomic.json
│   │       │   ├── portable-atomic-dac564d4c171f597
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── ppv-lite86-2612821a05af2bbb
│   │       │   │   ├── dep-lib-ppv_lite86
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ppv_lite86
│   │       │   │   └── lib-ppv_lite86.json
│   │       │   ├── proc-macro2-1979cae25ebfccda
│   │       │   │   ├── dep-lib-proc_macro2
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-proc_macro2
│   │       │   │   └── lib-proc_macro2.json
│   │       │   ├── proc-macro2-20fbb3a01ff4291d
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── proc-macro2-5dd9de4d96e98f85
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── quote-3fc774c1ad54a937
│   │       │   │   ├── dep-lib-quote
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-quote
│   │       │   │   └── lib-quote.json
│   │       │   ├── quote-5135c804588e285f
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── quote-b38881a41ec21b9d
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── r2d2_sqlite-98f5118d40ae8c1b
│   │       │   │   ├── dep-lib-r2d2_sqlite
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-r2d2_sqlite
│   │       │   │   └── lib-r2d2_sqlite.json
│   │       │   ├── r2d2-4a9070c2fafdb7f3
│   │       │   │   ├── dep-lib-r2d2
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-r2d2
│   │       │   │   └── lib-r2d2.json
│   │       │   ├── rand_chacha-e1e28301610d9765
│   │       │   │   ├── dep-lib-rand_chacha
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rand_chacha
│   │       │   │   └── lib-rand_chacha.json
│   │       │   ├── rand_core-3127b9fb0b565568
│   │       │   │   ├── dep-lib-rand_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rand_core
│   │       │   │   └── lib-rand_core.json
│   │       │   ├── rand_core-c098f0a0f6c5e892
│   │       │   │   ├── dep-lib-rand_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rand_core
│   │       │   │   └── lib-rand_core.json
│   │       │   ├── rand-183cbe37fb732104
│   │       │   │   ├── dep-lib-rand
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rand
│   │       │   │   └── lib-rand.json
│   │       │   ├── rand-34a4cc4a0e3a86b8
│   │       │   │   ├── dep-lib-rand
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rand
│   │       │   │   └── lib-rand.json
│   │       │   ├── rawpointer-4680d0045883066a
│   │       │   │   ├── dep-lib-rawpointer
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rawpointer
│   │       │   │   └── lib-rawpointer.json
│   │       │   ├── rayon-7a412bce7dd89abf
│   │       │   │   ├── dep-lib-rayon
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rayon
│   │       │   │   └── lib-rayon.json
│   │       │   ├── rayon-cond-91077b9baa855a6f
│   │       │   │   ├── dep-lib-rayon_cond
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rayon_cond
│   │       │   │   └── lib-rayon_cond.json
│   │       │   ├── rayon-core-ab63a3e8adbe9570
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── rayon-core-be24bf43f09c0a51
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── rayon-core-d6407a3fb3fc84fa
│   │       │   │   ├── dep-lib-rayon_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rayon_core
│   │       │   │   └── lib-rayon_core.json
│   │       │   ├── regex-6c73474ad10b4cc2
│   │       │   │   ├── dep-lib-regex
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-regex
│   │       │   │   └── lib-regex.json
│   │       │   ├── regex-automata-221bed759260be28
│   │       │   │   ├── dep-lib-regex_automata
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-regex_automata
│   │       │   │   └── lib-regex_automata.json
│   │       │   ├── regex-syntax-37d168b62650f492
│   │       │   │   ├── dep-lib-regex_syntax
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-regex_syntax
│   │       │   │   └── lib-regex_syntax.json
│   │       │   ├── rusqlite-7b9bd0c9576af8b8
│   │       │   │   ├── dep-lib-rusqlite
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rusqlite
│   │       │   │   └── lib-rusqlite.json
│   │       │   ├── rustls-pki-types-496084e25437f7c9
│   │       │   │   ├── dep-lib-rustls_pki_types
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-rustls_pki_types
│   │       │   │   └── lib-rustls_pki_types.json
│   │       │   ├── same-file-b514e486478ab817
│   │       │   │   ├── dep-lib-same_file
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-same_file
│   │       │   │   └── lib-same_file.json
│   │       │   ├── schannel-0a747fe2687e5b48
│   │       │   │   ├── dep-lib-schannel
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-schannel
│   │       │   │   └── lib-schannel.json
│   │       │   ├── scheduled-thread-pool-bd3e6f49408ecaa4
│   │       │   │   ├── dep-lib-scheduled_thread_pool
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-scheduled_thread_pool
│   │       │   │   └── lib-scheduled_thread_pool.json
│   │       │   ├── scopeguard-7be9983266248e23
│   │       │   │   ├── dep-lib-scopeguard
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-scopeguard
│   │       │   │   └── lib-scopeguard.json
│   │       │   ├── serde_core-0c77ad7c24f4d667
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── serde_core-5b5847a817d91d54
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── serde_core-88cb8f2e57290578
│   │       │   │   ├── dep-lib-serde_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-serde_core
│   │       │   │   └── lib-serde_core.json
│   │       │   ├── serde_derive-c187e3bd38ad7827
│   │       │   │   ├── dep-lib-serde_derive
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-serde_derive
│   │       │   │   └── lib-serde_derive.json
│   │       │   ├── serde_json-5ecec71f0830eafa
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── serde_json-75d5f9a1587a9e6b
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── serde_json-daa1c510a59e2c06
│   │       │   │   ├── dep-lib-serde_json
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-serde_json
│   │       │   │   └── lib-serde_json.json
│   │       │   ├── serde-43c534d03a98e9e1
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── serde-903a4c11ec945302
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── serde-d3849bd7a330dceb
│   │       │   │   ├── dep-lib-serde
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-serde
│   │       │   │   └── lib-serde.json
│   │       │   ├── sharded-slab-6f34432e1c3d4ad3
│   │       │   │   ├── dep-lib-sharded_slab
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-sharded_slab
│   │       │   │   └── lib-sharded_slab.json
│   │       │   ├── shlex-600e69eb33c63794
│   │       │   │   ├── dep-lib-shlex
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-shlex
│   │       │   │   └── lib-shlex.json
│   │       │   ├── smallvec-9251f454a0736d24
│   │       │   │   ├── dep-lib-smallvec
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-smallvec
│   │       │   │   └── lib-smallvec.json
│   │       │   ├── socket2-7b2b365d96649457
│   │       │   │   ├── dep-lib-socket2
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-socket2
│   │       │   │   └── lib-socket2.json
│   │       │   ├── socks-32bb4bc1ab50ded6
│   │       │   │   ├── dep-lib-socks
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-socks
│   │       │   │   └── lib-socks.json
│   │       │   ├── spm_precompiled-32273c37212c7107
│   │       │   │   ├── dep-lib-spm_precompiled
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-spm_precompiled
│   │       │   │   └── lib-spm_precompiled.json
│   │       │   ├── strsim-3faf8fe7b30b49b2
│   │       │   │   ├── dep-lib-strsim
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-strsim
│   │       │   │   └── lib-strsim.json
│   │       │   ├── syn-91b2f0d402bca54d
│   │       │   │   ├── dep-lib-syn
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-syn
│   │       │   │   └── lib-syn.json
│   │       │   ├── thiserror-02fd1504d27c08cc
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── thiserror-1207fc6866189221
│   │       │   │   ├── dep-lib-thiserror
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-thiserror
│   │       │   │   └── lib-thiserror.json
│   │       │   ├── thiserror-fa146a30dcee840a
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── thiserror-impl-dfbdb77ec7dc192b
│   │       │   │   ├── dep-lib-thiserror_impl
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-thiserror_impl
│   │       │   │   └── lib-thiserror_impl.json
│   │       │   ├── thread_local-8886d7ac88188379
│   │       │   │   ├── dep-lib-thread_local
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-thread_local
│   │       │   │   └── lib-thread_local.json
│   │       │   ├── tokenizers-bda1015cb0580631
│   │       │   │   ├── dep-lib-tokenizers
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tokenizers
│   │       │   │   └── lib-tokenizers.json
│   │       │   ├── tokio-49a34a2c287e6080
│   │       │   │   ├── dep-lib-tokio
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tokio
│   │       │   │   └── lib-tokio.json
│   │       │   ├── tokio-macros-53556798f60e6410
│   │       │   │   ├── dep-lib-tokio_macros
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tokio_macros
│   │       │   │   └── lib-tokio_macros.json
│   │       │   ├── tracing-2215d3da5d7fbf22
│   │       │   │   ├── dep-lib-tracing
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tracing
│   │       │   │   └── lib-tracing.json
│   │       │   ├── tracing-attributes-69e0cce5a1e087c2
│   │       │   │   ├── dep-lib-tracing_attributes
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tracing_attributes
│   │       │   │   └── lib-tracing_attributes.json
│   │       │   ├── tracing-core-34eff25d7ae34ea0
│   │       │   │   ├── dep-lib-tracing_core
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tracing_core
│   │       │   │   └── lib-tracing_core.json
│   │       │   ├── tracing-log-85846a57a945f6a6
│   │       │   │   ├── dep-lib-tracing_log
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tracing_log
│   │       │   │   └── lib-tracing_log.json
│   │       │   ├── tracing-subscriber-df8168ae570a8a2f
│   │       │   │   ├── dep-lib-tracing_subscriber
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tracing_subscriber
│   │       │   │   └── lib-tracing_subscriber.json
│   │       │   ├── tree-sitter-0259e3732a66be5a
│   │       │   │   ├── dep-lib-tree_sitter
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tree_sitter
│   │       │   │   └── lib-tree_sitter.json
│   │       │   ├── tree-sitter-a9cca43a5ce71a5f
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── tree-sitter-d83edb0342766d70
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── tree-sitter-rust-655555e062e94284
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── tree-sitter-rust-afe8e53969112426
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── tree-sitter-rust-c26af413dbe15329
│   │       │   │   ├── dep-lib-tree_sitter_rust
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-tree_sitter_rust
│   │       │   │   └── lib-tree_sitter_rust.json
│   │       │   ├── unicode_categories-6f2a970d6a871e1e
│   │       │   │   ├── dep-lib-unicode_categories
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-unicode_categories
│   │       │   │   └── lib-unicode_categories.json
│   │       │   ├── unicode-ident-c0a85e118412d9fb
│   │       │   │   ├── dep-lib-unicode_ident
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-unicode_ident
│   │       │   │   └── lib-unicode_ident.json
│   │       │   ├── unicode-normalization-alignments-435af4aa80518bc3
│   │       │   │   ├── dep-lib-unicode_normalization_alignments
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-unicode_normalization_alignments
│   │       │   │   └── lib-unicode_normalization_alignments.json
│   │       │   ├── unicode-segmentation-389752e447623914
│   │       │   │   ├── dep-lib-unicode_segmentation
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-unicode_segmentation
│   │       │   │   └── lib-unicode_segmentation.json
│   │       │   ├── unicode-width-0374255ad6db2145
│   │       │   │   ├── dep-lib-unicode_width
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-unicode_width
│   │       │   │   └── lib-unicode_width.json
│   │       │   ├── ureq-fb8b404a31d74069
│   │       │   │   ├── dep-lib-ureq
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ureq
│   │       │   │   └── lib-ureq.json
│   │       │   ├── ureq-proto-54e9ac6d31c9581b
│   │       │   │   ├── dep-lib-ureq_proto
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-ureq_proto
│   │       │   │   └── lib-ureq_proto.json
│   │       │   ├── utf8-zero-d88a574a0fd4de32
│   │       │   │   ├── dep-lib-utf8_zero
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-utf8_zero
│   │       │   │   └── lib-utf8_zero.json
│   │       │   ├── uuid-5354959e35171212
│   │       │   │   ├── dep-lib-uuid
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-uuid
│   │       │   │   └── lib-uuid.json
│   │       │   ├── vcpkg-9114f554c6fd89b1
│   │       │   │   ├── dep-lib-vcpkg
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-vcpkg
│   │       │   │   └── lib-vcpkg.json
│   │       │   ├── version_check-9646349495015550
│   │       │   │   ├── dep-lib-version_check
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-version_check
│   │       │   │   └── lib-version_check.json
│   │       │   ├── walkdir-f522fb2d75f18d4f
│   │       │   │   ├── dep-lib-walkdir
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-walkdir
│   │       │   │   └── lib-walkdir.json
│   │       │   ├── webpki-root-certs-60a6ab375623e773
│   │       │   │   ├── dep-lib-webpki_root_certs
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-webpki_root_certs
│   │       │   │   └── lib-webpki_root_certs.json
│   │       │   ├── winapi-44c4b10abd4aaebb
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── winapi-5472ee2533e25a44
│   │       │   │   ├── dep-lib-winapi
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-winapi
│   │       │   │   └── lib-winapi.json
│   │       │   ├── winapi-e4920535a426e67f
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── winapi-util-5f9445c76b0efabd
│   │       │   │   ├── dep-lib-winapi_util
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-winapi_util
│   │       │   │   └── lib-winapi_util.json
│   │       │   ├── windows_x86_64_msvc-5e8837d4e8b5eb51
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── windows_x86_64_msvc-9d9052f7f902dba0
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── windows_x86_64_msvc-b2059ac9004dcf91
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── windows_x86_64_msvc-c148466f3e121814
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── windows_x86_64_msvc-c64e562027c1bd5d
│   │       │   │   ├── dep-lib-windows_x86_64_msvc
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_x86_64_msvc
│   │       │   │   └── lib-windows_x86_64_msvc.json
│   │       │   ├── windows_x86_64_msvc-eacb94f76b4d579b
│   │       │   │   ├── dep-lib-windows_x86_64_msvc
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_x86_64_msvc
│   │       │   │   └── lib-windows_x86_64_msvc.json
│   │       │   ├── windows-link-1a4b2d8659b40a7a
│   │       │   │   ├── dep-lib-windows_link
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_link
│   │       │   │   └── lib-windows_link.json
│   │       │   ├── windows-link-a6b7ba4bf106afb3
│   │       │   │   ├── dep-lib-windows_link
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_link
│   │       │   │   └── lib-windows_link.json
│   │       │   ├── windows-sys-04087aa1421fdd8d
│   │       │   │   ├── dep-lib-windows_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_sys
│   │       │   │   └── lib-windows_sys.json
│   │       │   ├── windows-sys-040b70ee219b13a6
│   │       │   │   ├── dep-lib-windows_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_sys
│   │       │   │   └── lib-windows_sys.json
│   │       │   ├── windows-sys-3da07929e4bcface
│   │       │   │   ├── dep-lib-windows_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_sys
│   │       │   │   └── lib-windows_sys.json
│   │       │   ├── windows-sys-d5d9dc93825f4181
│   │       │   │   ├── dep-lib-windows_sys
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_sys
│   │       │   │   └── lib-windows_sys.json
│   │       │   ├── windows-targets-490beefd63a9f11e
│   │       │   │   ├── dep-lib-windows_targets
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_targets
│   │       │   │   └── lib-windows_targets.json
│   │       │   ├── windows-targets-638cc420987c04e1
│   │       │   │   ├── dep-lib-windows_targets
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-windows_targets
│   │       │   │   └── lib-windows_targets.json
│   │       │   ├── zerocopy-15e9af04aee41b96
│   │       │   │   ├── build-script-build-script-build
│   │       │   │   ├── build-script-build-script-build.json
│   │       │   │   ├── dep-build-script-build-script-build
│   │       │   │   └── invoked.timestamp
│   │       │   ├── zerocopy-34a313ba2b6a4c2b
│   │       │   │   ├── dep-lib-zerocopy
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-zerocopy
│   │       │   │   └── lib-zerocopy.json
│   │       │   ├── zerocopy-896e4d83713878c2
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── zeroize-3f963dff29bcf9a1
│   │       │   │   ├── dep-lib-zeroize
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-zeroize
│   │       │   │   └── lib-zeroize.json
│   │       │   ├── zmij-161813756fd307d5
│   │       │   │   ├── run-build-script-build-script-build
│   │       │   │   └── run-build-script-build-script-build.json
│   │       │   ├── zmij-aa9e5daa78350376
│   │       │   │   ├── dep-lib-zmij
│   │       │   │   ├── invoked.timestamp
│   │       │   │   ├── lib-zmij
│   │       │   │   └── lib-zmij.json
│   │       │   └── zmij-e0579f1d3c8c91ff
│   │       │       ├── build-script-build-script-build
│   │       │       ├── build-script-build-script-build.json
│   │       │       ├── dep-build-script-build-script-build
│   │       │       └── invoked.timestamp
│   │       ├── deps
│   │       │   ├── ahash-e078b8640013dc0e.d
│   │       │   ├── aho_corasick-4b644fddaefa6291.d
│   │       │   ├── anyhow-64f5acc7b5d2d8d9.d
│   │       │   ├── autocfg-595dc2db0709cc81.d
│   │       │   ├── base64-79fb3efb36e1397d.d
│   │       │   ├── base64-9c341375b507ed1a.d
│   │       │   ├── base64ct-1cb288e07540095b.d
│   │       │   ├── bitflags-dc3c5d8a0eba103e.d
│   │       │   ├── byteorder-a8c4c8b749b3bc0c.d
│   │       │   ├── bytes-61d7a7f94307a605.d
│   │       │   ├── bytes-a5d656192c74833c.d
│   │       │   ├── cc-8d60e041c6a204f7.d
│   │       │   ├── cfg_if-0aed049cbaf004b2.d
│   │       │   ├── chacha20-2f314f9348d578ac.d
│   │       │   ├── console-df809cbbc8be0953.d
│   │       │   ├── cpufeatures-fc82f5b8224a0a10.d
│   │       │   ├── crossbeam_channel-1fecbd56e8f1952a.d
│   │       │   ├── crossbeam_deque-f85d0f280cf86621.d
│   │       │   ├── crossbeam_epoch-3eedff14eb1ca204.d
│   │       │   ├── crossbeam_utils-5536d32ba88b51e4.d
│   │       │   ├── darling_core-c3b9d1015a0edcc4.d
│   │       │   ├── darling_macro-5f36e70272d4d330.d
│   │       │   ├── darling_macro-5f36e70272d4d330.dll
│   │       │   ├── darling_macro-5f36e70272d4d330.dll.exp
│   │       │   ├── darling_macro-5f36e70272d4d330.dll.lib
│   │       │   ├── darling_macro-5f36e70272d4d330.pdb
│   │       │   ├── darling-3a2fb4401119d1b7.d
│   │       │   ├── der-46d25d622808855a.d
│   │       │   ├── derive_builder_core-14516cffd851dfd6.d
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4.d
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4.dll
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4.dll.exp
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4.dll.lib
│   │       │   ├── derive_builder_macro-1bbf7e32844ad0e4.pdb
│   │       │   ├── derive_builder-615eafbacbd90123.d
│   │       │   ├── either-6d90bd5e756b030a.d
│   │       │   ├── encode_unicode-cd0fba09d238d29d.d
│   │       │   ├── esaxx_rs-61374720b79d80b3.d
│   │       │   ├── fallible_iterator-0d1201373a4cd062.d
│   │       │   ├── fallible_streaming_iterator-bf98164feb09bd31.d
│   │       │   ├── filetime-b0ebded795f04324.d
│   │       │   ├── find_msvc_tools-16e37ad165d2bd6c.d
│   │       │   ├── fnv-cc8a3207b85855dc.d
│   │       │   ├── getrandom-a5b4a0530237b683.d
│   │       │   ├── getrandom-dbc54eed1c5a6cdf.d
│   │       │   ├── hashbrown-be841ecae76c1beb.d
│   │       │   ├── hashlink-27b65c26e9ecebee.d
│   │       │   ├── hmac_sha256-11874b94547bcdf6.d
│   │       │   ├── http-30d085a8843d9106.d
│   │       │   ├── httparse-7de591706e3f6dc7.d
│   │       │   ├── ident_case-52faa40932e9375b.d
│   │       │   ├── indicatif-7f4b31b2eddc0dd7.d
│   │       │   ├── itertools-6fad28849e7771d9.d
│   │       │   ├── itertools-939652d0c2c5eac0.d
│   │       │   ├── itoa-1e1ff46248f290fe.d
│   │       │   ├── itoa-75667997c59a2b0c.d
│   │       │   ├── lazy_static-c3d7d6d760728976.d
│   │       │   ├── libahash-e078b8640013dc0e.rlib
│   │       │   ├── libahash-e078b8640013dc0e.rmeta
│   │       │   ├── libaho_corasick-4b644fddaefa6291.rlib
│   │       │   ├── libaho_corasick-4b644fddaefa6291.rmeta
│   │       │   ├── libanyhow-64f5acc7b5d2d8d9.rlib
│   │       │   ├── libanyhow-64f5acc7b5d2d8d9.rmeta
│   │       │   ├── libautocfg-595dc2db0709cc81.rlib
│   │       │   ├── libautocfg-595dc2db0709cc81.rmeta
│   │       │   ├── libbase64-79fb3efb36e1397d.rlib
│   │       │   ├── libbase64-79fb3efb36e1397d.rmeta
│   │       │   ├── libbase64-9c341375b507ed1a.rlib
│   │       │   ├── libbase64-9c341375b507ed1a.rmeta
│   │       │   ├── libbase64ct-1cb288e07540095b.rlib
│   │       │   ├── libbase64ct-1cb288e07540095b.rmeta
│   │       │   ├── libbitflags-dc3c5d8a0eba103e.rlib
│   │       │   ├── libbitflags-dc3c5d8a0eba103e.rmeta
│   │       │   ├── libbyteorder-a8c4c8b749b3bc0c.rlib
│   │       │   ├── libbyteorder-a8c4c8b749b3bc0c.rmeta
│   │       │   ├── libbytes-61d7a7f94307a605.rlib
│   │       │   ├── libbytes-61d7a7f94307a605.rmeta
│   │       │   ├── libbytes-a5d656192c74833c.rlib
│   │       │   ├── libbytes-a5d656192c74833c.rmeta
│   │       │   ├── libc-7ee64b3e8f453467.d
│   │       │   ├── libcc-8d60e041c6a204f7.rlib
│   │       │   ├── libcc-8d60e041c6a204f7.rmeta
│   │       │   ├── libcfg_if-0aed049cbaf004b2.rlib
│   │       │   ├── libcfg_if-0aed049cbaf004b2.rmeta
│   │       │   ├── libchacha20-2f314f9348d578ac.rlib
│   │       │   ├── libchacha20-2f314f9348d578ac.rmeta
│   │       │   ├── libconsole-df809cbbc8be0953.rlib
│   │       │   ├── libconsole-df809cbbc8be0953.rmeta
│   │       │   ├── libcpufeatures-fc82f5b8224a0a10.rlib
│   │       │   ├── libcpufeatures-fc82f5b8224a0a10.rmeta
│   │       │   ├── libcrossbeam_channel-1fecbd56e8f1952a.rlib
│   │       │   ├── libcrossbeam_channel-1fecbd56e8f1952a.rmeta
│   │       │   ├── libcrossbeam_deque-f85d0f280cf86621.rlib
│   │       │   ├── libcrossbeam_deque-f85d0f280cf86621.rmeta
│   │       │   ├── libcrossbeam_epoch-3eedff14eb1ca204.rlib
│   │       │   ├── libcrossbeam_epoch-3eedff14eb1ca204.rmeta
│   │       │   ├── libcrossbeam_utils-5536d32ba88b51e4.rlib
│   │       │   ├── libcrossbeam_utils-5536d32ba88b51e4.rmeta
│   │       │   ├── libdarling_core-c3b9d1015a0edcc4.rlib
│   │       │   ├── libdarling_core-c3b9d1015a0edcc4.rmeta
│   │       │   ├── libdarling-3a2fb4401119d1b7.rlib
│   │       │   ├── libdarling-3a2fb4401119d1b7.rmeta
│   │       │   ├── libder-46d25d622808855a.rlib
│   │       │   ├── libder-46d25d622808855a.rmeta
│   │       │   ├── libderive_builder_core-14516cffd851dfd6.rlib
│   │       │   ├── libderive_builder_core-14516cffd851dfd6.rmeta
│   │       │   ├── libderive_builder-615eafbacbd90123.rlib
│   │       │   ├── libderive_builder-615eafbacbd90123.rmeta
│   │       │   ├── libeither-6d90bd5e756b030a.rlib
│   │       │   ├── libeither-6d90bd5e756b030a.rmeta
│   │       │   ├── libencode_unicode-cd0fba09d238d29d.rlib
│   │       │   ├── libencode_unicode-cd0fba09d238d29d.rmeta
│   │       │   ├── libesaxx_rs-61374720b79d80b3.rlib
│   │       │   ├── libesaxx_rs-61374720b79d80b3.rmeta
│   │       │   ├── libfallible_iterator-0d1201373a4cd062.rlib
│   │       │   ├── libfallible_iterator-0d1201373a4cd062.rmeta
│   │       │   ├── libfallible_streaming_iterator-bf98164feb09bd31.rlib
│   │       │   ├── libfallible_streaming_iterator-bf98164feb09bd31.rmeta
│   │       │   ├── libfiletime-b0ebded795f04324.rlib
│   │       │   ├── libfiletime-b0ebded795f04324.rmeta
│   │       │   ├── libfind_msvc_tools-16e37ad165d2bd6c.rlib
│   │       │   ├── libfind_msvc_tools-16e37ad165d2bd6c.rmeta
│   │       │   ├── libfnv-cc8a3207b85855dc.rlib
│   │       │   ├── libfnv-cc8a3207b85855dc.rmeta
│   │       │   ├── libgetrandom-a5b4a0530237b683.rlib
│   │       │   ├── libgetrandom-a5b4a0530237b683.rmeta
│   │       │   ├── libgetrandom-dbc54eed1c5a6cdf.rlib
│   │       │   ├── libgetrandom-dbc54eed1c5a6cdf.rmeta
│   │       │   ├── libhashbrown-be841ecae76c1beb.rlib
│   │       │   ├── libhashbrown-be841ecae76c1beb.rmeta
│   │       │   ├── libhashlink-27b65c26e9ecebee.rlib
│   │       │   ├── libhashlink-27b65c26e9ecebee.rmeta
│   │       │   ├── libhmac_sha256-11874b94547bcdf6.rlib
│   │       │   ├── libhmac_sha256-11874b94547bcdf6.rmeta
│   │       │   ├── libhttp-30d085a8843d9106.rlib
│   │       │   ├── libhttp-30d085a8843d9106.rmeta
│   │       │   ├── libhttparse-7de591706e3f6dc7.rlib
│   │       │   ├── libhttparse-7de591706e3f6dc7.rmeta
│   │       │   ├── libident_case-52faa40932e9375b.rlib
│   │       │   ├── libident_case-52faa40932e9375b.rmeta
│   │       │   ├── libindicatif-7f4b31b2eddc0dd7.rlib
│   │       │   ├── libindicatif-7f4b31b2eddc0dd7.rmeta
│   │       │   ├── libitertools-6fad28849e7771d9.rlib
│   │       │   ├── libitertools-6fad28849e7771d9.rmeta
│   │       │   ├── libitertools-939652d0c2c5eac0.rlib
│   │       │   ├── libitertools-939652d0c2c5eac0.rmeta
│   │       │   ├── libitoa-1e1ff46248f290fe.rlib
│   │       │   ├── libitoa-1e1ff46248f290fe.rmeta
│   │       │   ├── libitoa-75667997c59a2b0c.rlib
│   │       │   ├── libitoa-75667997c59a2b0c.rmeta
│   │       │   ├── liblazy_static-c3d7d6d760728976.rlib
│   │       │   ├── liblazy_static-c3d7d6d760728976.rmeta
│   │       │   ├── liblibc-7ee64b3e8f453467.rlib
│   │       │   ├── liblibc-7ee64b3e8f453467.rmeta
│   │       │   ├── liblibsqlite3_sys-2e31ed58d3358bde.rlib
│   │       │   ├── liblibsqlite3_sys-2e31ed58d3358bde.rmeta
│   │       │   ├── liblock_api-3810751b30e36416.rlib
│   │       │   ├── liblock_api-3810751b30e36416.rmeta
│   │       │   ├── liblog-36c89f4e07310697.rlib
│   │       │   ├── liblog-36c89f4e07310697.rmeta
│   │       │   ├── liblog-cbc67f7b9c610127.rlib
│   │       │   ├── liblog-cbc67f7b9c610127.rmeta
│   │       │   ├── liblzma_rust2-70af5624b22a06b3.rlib
│   │       │   ├── liblzma_rust2-70af5624b22a06b3.rmeta
│   │       │   ├── libmacro_rules_attribute-203fc92873cd5baa.rlib
│   │       │   ├── libmacro_rules_attribute-203fc92873cd5baa.rmeta
│   │       │   ├── libmatchers-1476cb98497ecb7c.rlib
│   │       │   ├── libmatchers-1476cb98497ecb7c.rmeta
│   │       │   ├── libmatrixmultiply-5f6d85401fffd081.rlib
│   │       │   ├── libmatrixmultiply-5f6d85401fffd081.rmeta
│   │       │   ├── libmemchr-65a9950815c7e8a6.rlib
│   │       │   ├── libmemchr-65a9950815c7e8a6.rmeta
│   │       │   ├── libminimal_lexical-38d376f6535c0345.rlib
│   │       │   ├── libminimal_lexical-38d376f6535c0345.rmeta
│   │       │   ├── libmio-1e693d47a940ec17.rlib
│   │       │   ├── libmio-1e693d47a940ec17.rmeta
│   │       │   ├── libmonostate-18d9fae476a8f9c1.rlib
│   │       │   ├── libmonostate-18d9fae476a8f9c1.rmeta
│   │       │   ├── libnative_tls-1afcc3a9316c45d9.rlib
│   │       │   ├── libnative_tls-1afcc3a9316c45d9.rmeta
│   │       │   ├── libndarray-df1177512d20d972.rlib
│   │       │   ├── libndarray-df1177512d20d972.rmeta
│   │       │   ├── libnom-7f820d7b6e98ebb5.rlib
│   │       │   ├── libnom-7f820d7b6e98ebb5.rmeta
│   │       │   ├── libnotify-cda32c2761460238.rlib
│   │       │   ├── libnotify-cda32c2761460238.rmeta
│   │       │   ├── libnu_ansi_term-287e5bdfe08df06e.rlib
│   │       │   ├── libnu_ansi_term-287e5bdfe08df06e.rmeta
│   │       │   ├── libnum_complex-5835564acb1101a2.rlib
│   │       │   ├── libnum_complex-5835564acb1101a2.rmeta
│   │       │   ├── libnum_integer-5e8c70ceade3461c.rlib
│   │       │   ├── libnum_integer-5e8c70ceade3461c.rmeta
│   │       │   ├── libnum_traits-974b68336b617133.rlib
│   │       │   ├── libnum_traits-974b68336b617133.rmeta
│   │       │   ├── libnumber_prefix-135aa3b30e1339b6.rlib
│   │       │   ├── libnumber_prefix-135aa3b30e1339b6.rmeta
│   │       │   ├── libonce_cell-d8b46783864b2991.rlib
│   │       │   ├── libonce_cell-d8b46783864b2991.rmeta
│   │       │   ├── libonig_sys-ca8d08f10586fa3a.rlib
│   │       │   ├── libonig_sys-ca8d08f10586fa3a.rmeta
│   │       │   ├── libonig-873405d40a39fb3e.rlib
│   │       │   ├── libonig-873405d40a39fb3e.rmeta
│   │       │   ├── libort_sys-0c61de1d46dadbf3.rlib
│   │       │   ├── libort_sys-0c61de1d46dadbf3.rmeta
│   │       │   ├── libort-1776a8ae68fad826.rlib
│   │       │   ├── libort-1776a8ae68fad826.rmeta
│   │       │   ├── libparking_lot_core-776cedd0768071c4.rlib
│   │       │   ├── libparking_lot_core-776cedd0768071c4.rmeta
│   │       │   ├── libparking_lot-e0b706e4e0046169.rlib
│   │       │   ├── libparking_lot-e0b706e4e0046169.rmeta
│   │       │   ├── libpem_rfc7468-72bd6df5b9aa80f2.rlib
│   │       │   ├── libpem_rfc7468-72bd6df5b9aa80f2.rmeta
│   │       │   ├── libpercent_encoding-96165d9d37997cd3.rlib
│   │       │   ├── libpercent_encoding-96165d9d37997cd3.rmeta
│   │       │   ├── libpin_project_lite-9b2c1669d6a9d645.rlib
│   │       │   ├── libpin_project_lite-9b2c1669d6a9d645.rmeta
│   │       │   ├── libpkg_config-654ad8e1161e1b44.rlib
│   │       │   ├── libpkg_config-654ad8e1161e1b44.rmeta
│   │       │   ├── libportable_atomic-7799eb0436a822e8.rlib
│   │       │   ├── libportable_atomic-7799eb0436a822e8.rmeta
│   │       │   ├── libppv_lite86-2612821a05af2bbb.rlib
│   │       │   ├── libppv_lite86-2612821a05af2bbb.rmeta
│   │       │   ├── libproc_macro2-1979cae25ebfccda.rlib
│   │       │   ├── libproc_macro2-1979cae25ebfccda.rmeta
│   │       │   ├── libquote-3fc774c1ad54a937.rlib
│   │       │   ├── libquote-3fc774c1ad54a937.rmeta
│   │       │   ├── libr2d2_sqlite-98f5118d40ae8c1b.rlib
│   │       │   ├── libr2d2_sqlite-98f5118d40ae8c1b.rmeta
│   │       │   ├── libr2d2-4a9070c2fafdb7f3.rlib
│   │       │   ├── libr2d2-4a9070c2fafdb7f3.rmeta
│   │       │   ├── librand_chacha-e1e28301610d9765.rlib
│   │       │   ├── librand_chacha-e1e28301610d9765.rmeta
│   │       │   ├── librand_core-3127b9fb0b565568.rlib
│   │       │   ├── librand_core-3127b9fb0b565568.rmeta
│   │       │   ├── librand_core-c098f0a0f6c5e892.rlib
│   │       │   ├── librand_core-c098f0a0f6c5e892.rmeta
│   │       │   ├── librand-183cbe37fb732104.rlib
│   │       │   ├── librand-183cbe37fb732104.rmeta
│   │       │   ├── librand-34a4cc4a0e3a86b8.rlib
│   │       │   ├── librand-34a4cc4a0e3a86b8.rmeta
│   │       │   ├── librawpointer-4680d0045883066a.rlib
│   │       │   ├── librawpointer-4680d0045883066a.rmeta
│   │       │   ├── librayon_cond-91077b9baa855a6f.rlib
│   │       │   ├── librayon_cond-91077b9baa855a6f.rmeta
│   │       │   ├── librayon_core-d6407a3fb3fc84fa.rlib
│   │       │   ├── librayon_core-d6407a3fb3fc84fa.rmeta
│   │       │   ├── librayon-7a412bce7dd89abf.rlib
│   │       │   ├── librayon-7a412bce7dd89abf.rmeta
│   │       │   ├── libregex_automata-221bed759260be28.rlib
│   │       │   ├── libregex_automata-221bed759260be28.rmeta
│   │       │   ├── libregex_syntax-37d168b62650f492.rlib
│   │       │   ├── libregex_syntax-37d168b62650f492.rmeta
│   │       │   ├── libregex-6c73474ad10b4cc2.rlib
│   │       │   ├── libregex-6c73474ad10b4cc2.rmeta
│   │       │   ├── librusqlite-7b9bd0c9576af8b8.rlib
│   │       │   ├── librusqlite-7b9bd0c9576af8b8.rmeta
│   │       │   ├── librustls_pki_types-496084e25437f7c9.rlib
│   │       │   ├── librustls_pki_types-496084e25437f7c9.rmeta
│   │       │   ├── libsame_file-b514e486478ab817.rlib
│   │       │   ├── libsame_file-b514e486478ab817.rmeta
│   │       │   ├── libschannel-0a747fe2687e5b48.rlib
│   │       │   ├── libschannel-0a747fe2687e5b48.rmeta
│   │       │   ├── libscheduled_thread_pool-bd3e6f49408ecaa4.rlib
│   │       │   ├── libscheduled_thread_pool-bd3e6f49408ecaa4.rmeta
│   │       │   ├── libscopeguard-7be9983266248e23.rlib
│   │       │   ├── libscopeguard-7be9983266248e23.rmeta
│   │       │   ├── libserde_core-88cb8f2e57290578.rlib
│   │       │   ├── libserde_core-88cb8f2e57290578.rmeta
│   │       │   ├── libserde_json-daa1c510a59e2c06.rlib
│   │       │   ├── libserde_json-daa1c510a59e2c06.rmeta
│   │       │   ├── libserde-d3849bd7a330dceb.rlib
│   │       │   ├── libserde-d3849bd7a330dceb.rmeta
│   │       │   ├── libsharded_slab-6f34432e1c3d4ad3.rlib
│   │       │   ├── libsharded_slab-6f34432e1c3d4ad3.rmeta
│   │       │   ├── libshlex-600e69eb33c63794.rlib
│   │       │   ├── libshlex-600e69eb33c63794.rmeta
│   │       │   ├── libsmallvec-9251f454a0736d24.rlib
│   │       │   ├── libsmallvec-9251f454a0736d24.rmeta
│   │       │   ├── libsocket2-7b2b365d96649457.rlib
│   │       │   ├── libsocket2-7b2b365d96649457.rmeta
│   │       │   ├── libsocks-32bb4bc1ab50ded6.rlib
│   │       │   ├── libsocks-32bb4bc1ab50ded6.rmeta
│   │       │   ├── libspm_precompiled-32273c37212c7107.rlib
│   │       │   ├── libspm_precompiled-32273c37212c7107.rmeta
│   │       │   ├── libsqlite3_sys-2e31ed58d3358bde.d
│   │       │   ├── libstrsim-3faf8fe7b30b49b2.rlib
│   │       │   ├── libstrsim-3faf8fe7b30b49b2.rmeta
│   │       │   ├── libsyn-91b2f0d402bca54d.rlib
│   │       │   ├── libsyn-91b2f0d402bca54d.rmeta
│   │       │   ├── libthiserror-1207fc6866189221.rlib
│   │       │   ├── libthiserror-1207fc6866189221.rmeta
│   │       │   ├── libthread_local-8886d7ac88188379.rlib
│   │       │   ├── libthread_local-8886d7ac88188379.rmeta
│   │       │   ├── libtokenizers-bda1015cb0580631.rlib
│   │       │   ├── libtokenizers-bda1015cb0580631.rmeta
│   │       │   ├── libtokio-49a34a2c287e6080.rlib
│   │       │   ├── libtokio-49a34a2c287e6080.rmeta
│   │       │   ├── libtracing_core-34eff25d7ae34ea0.rlib
│   │       │   ├── libtracing_core-34eff25d7ae34ea0.rmeta
│   │       │   ├── libtracing_log-85846a57a945f6a6.rlib
│   │       │   ├── libtracing_log-85846a57a945f6a6.rmeta
│   │       │   ├── libtracing_subscriber-df8168ae570a8a2f.rlib
│   │       │   ├── libtracing_subscriber-df8168ae570a8a2f.rmeta
│   │       │   ├── libtracing-2215d3da5d7fbf22.rlib
│   │       │   ├── libtracing-2215d3da5d7fbf22.rmeta
│   │       │   ├── libtree_sitter_rust-c26af413dbe15329.rlib
│   │       │   ├── libtree_sitter_rust-c26af413dbe15329.rmeta
│   │       │   ├── libtree_sitter-0259e3732a66be5a.rlib
│   │       │   ├── libtree_sitter-0259e3732a66be5a.rmeta
│   │       │   ├── libunicode_categories-6f2a970d6a871e1e.rlib
│   │       │   ├── libunicode_categories-6f2a970d6a871e1e.rmeta
│   │       │   ├── libunicode_ident-c0a85e118412d9fb.rlib
│   │       │   ├── libunicode_ident-c0a85e118412d9fb.rmeta
│   │       │   ├── libunicode_normalization_alignments-435af4aa80518bc3.rlib
│   │       │   ├── libunicode_normalization_alignments-435af4aa80518bc3.rmeta
│   │       │   ├── libunicode_segmentation-389752e447623914.rlib
│   │       │   ├── libunicode_segmentation-389752e447623914.rmeta
│   │       │   ├── libunicode_width-0374255ad6db2145.rlib
│   │       │   ├── libunicode_width-0374255ad6db2145.rmeta
│   │       │   ├── libureq_proto-54e9ac6d31c9581b.rlib
│   │       │   ├── libureq_proto-54e9ac6d31c9581b.rmeta
│   │       │   ├── libureq-fb8b404a31d74069.rlib
│   │       │   ├── libureq-fb8b404a31d74069.rmeta
│   │       │   ├── libutf8_zero-d88a574a0fd4de32.rlib
│   │       │   ├── libutf8_zero-d88a574a0fd4de32.rmeta
│   │       │   ├── libuuid-5354959e35171212.rlib
│   │       │   ├── libuuid-5354959e35171212.rmeta
│   │       │   ├── libvcpkg-9114f554c6fd89b1.rlib
│   │       │   ├── libvcpkg-9114f554c6fd89b1.rmeta
│   │       │   ├── libversion_check-9646349495015550.rlib
│   │       │   ├── libversion_check-9646349495015550.rmeta
│   │       │   ├── libwalkdir-f522fb2d75f18d4f.rlib
│   │       │   ├── libwalkdir-f522fb2d75f18d4f.rmeta
│   │       │   ├── libwebpki_root_certs-60a6ab375623e773.rlib
│   │       │   ├── libwebpki_root_certs-60a6ab375623e773.rmeta
│   │       │   ├── libwinapi_util-5f9445c76b0efabd.rlib
│   │       │   ├── libwinapi_util-5f9445c76b0efabd.rmeta
│   │       │   ├── libwinapi-5472ee2533e25a44.rlib
│   │       │   ├── libwinapi-5472ee2533e25a44.rmeta
│   │       │   ├── libwindows_link-1a4b2d8659b40a7a.rlib
│   │       │   ├── libwindows_link-1a4b2d8659b40a7a.rmeta
│   │       │   ├── libwindows_link-a6b7ba4bf106afb3.rlib
│   │       │   ├── libwindows_link-a6b7ba4bf106afb3.rmeta
│   │       │   ├── libwindows_sys-04087aa1421fdd8d.rlib
│   │       │   ├── libwindows_sys-04087aa1421fdd8d.rmeta
│   │       │   ├── libwindows_sys-040b70ee219b13a6.rlib
│   │       │   ├── libwindows_sys-040b70ee219b13a6.rmeta
│   │       │   ├── libwindows_sys-3da07929e4bcface.rlib
│   │       │   ├── libwindows_sys-3da07929e4bcface.rmeta
│   │       │   ├── libwindows_sys-d5d9dc93825f4181.rlib
│   │       │   ├── libwindows_sys-d5d9dc93825f4181.rmeta
│   │       │   ├── libwindows_targets-490beefd63a9f11e.rlib
│   │       │   ├── libwindows_targets-490beefd63a9f11e.rmeta
│   │       │   ├── libwindows_targets-638cc420987c04e1.rlib
│   │       │   ├── libwindows_targets-638cc420987c04e1.rmeta
│   │       │   ├── libwindows_x86_64_msvc-c64e562027c1bd5d.rlib
│   │       │   ├── libwindows_x86_64_msvc-c64e562027c1bd5d.rmeta
│   │       │   ├── libwindows_x86_64_msvc-eacb94f76b4d579b.rlib
│   │       │   ├── libwindows_x86_64_msvc-eacb94f76b4d579b.rmeta
│   │       │   ├── libzerocopy-34a313ba2b6a4c2b.rlib
│   │       │   ├── libzerocopy-34a313ba2b6a4c2b.rmeta
│   │       │   ├── libzeroize-3f963dff29bcf9a1.rlib
│   │       │   ├── libzeroize-3f963dff29bcf9a1.rmeta
│   │       │   ├── libzmij-aa9e5daa78350376.rlib
│   │       │   ├── libzmij-aa9e5daa78350376.rmeta
│   │       │   ├── lock_api-3810751b30e36416.d
│   │       │   ├── log-36c89f4e07310697.d
│   │       │   ├── log-cbc67f7b9c610127.d
│   │       │   ├── lzma_rust2-70af5624b22a06b3.d
│   │       │   ├── macro_rules_attribute_proc_macro-48b009b34581b4ea.d
│   │       │   ├── macro_rules_attribute_proc_macro-48b009b34581b4ea.dll
│   │       │   ├── macro_rules_attribute_proc_macro-48b009b34581b4ea.dll.exp
│   │       │   ├── macro_rules_attribute_proc_macro-48b009b34581b4ea.dll.lib
│   │       │   ├── macro_rules_attribute_proc_macro-48b009b34581b4ea.pdb
│   │       │   ├── macro_rules_attribute-203fc92873cd5baa.d
│   │       │   ├── matchers-1476cb98497ecb7c.d
│   │       │   ├── matrixmultiply-5f6d85401fffd081.d
│   │       │   ├── memchr-65a9950815c7e8a6.d
│   │       │   ├── memory_mcp_server.d
│   │       │   ├── memory_mcp_server.exe
│   │       │   ├── memory_mcp_server.exp
│   │       │   ├── memory_mcp_server.lib
│   │       │   ├── memory_mcp_server.pdb
│   │       │   ├── minimal_lexical-38d376f6535c0345.d
│   │       │   ├── mio-1e693d47a940ec17.d
│   │       │   ├── monostate_impl-caa758a6ef115fe6.d
│   │       │   ├── monostate_impl-caa758a6ef115fe6.dll
│   │       │   ├── monostate_impl-caa758a6ef115fe6.dll.exp
│   │       │   ├── monostate_impl-caa758a6ef115fe6.dll.lib
│   │       │   ├── monostate_impl-caa758a6ef115fe6.pdb
│   │       │   ├── monostate-18d9fae476a8f9c1.d
│   │       │   ├── native_tls-1afcc3a9316c45d9.d
│   │       │   ├── ndarray-df1177512d20d972.d
│   │       │   ├── nom-7f820d7b6e98ebb5.d
│   │       │   ├── notify-cda32c2761460238.d
│   │       │   ├── nu_ansi_term-287e5bdfe08df06e.d
│   │       │   ├── num_complex-5835564acb1101a2.d
│   │       │   ├── num_integer-5e8c70ceade3461c.d
│   │       │   ├── num_traits-974b68336b617133.d
│   │       │   ├── number_prefix-135aa3b30e1339b6.d
│   │       │   ├── once_cell-d8b46783864b2991.d
│   │       │   ├── onig_sys-ca8d08f10586fa3a.d
│   │       │   ├── onig-873405d40a39fb3e.d
│   │       │   ├── ort_sys-0c61de1d46dadbf3.d
│   │       │   ├── ort-1776a8ae68fad826.d
│   │       │   ├── parking_lot_core-776cedd0768071c4.d
│   │       │   ├── parking_lot-e0b706e4e0046169.d
│   │       │   ├── paste-cb4dfa892a5b298d.d
│   │       │   ├── paste-cb4dfa892a5b298d.dll
│   │       │   ├── paste-cb4dfa892a5b298d.dll.exp
│   │       │   ├── paste-cb4dfa892a5b298d.dll.lib
│   │       │   ├── paste-cb4dfa892a5b298d.pdb
│   │       │   ├── pem_rfc7468-72bd6df5b9aa80f2.d
│   │       │   ├── percent_encoding-96165d9d37997cd3.d
│   │       │   ├── pin_project_lite-9b2c1669d6a9d645.d
│   │       │   ├── pkg_config-654ad8e1161e1b44.d
│   │       │   ├── portable_atomic-7799eb0436a822e8.d
│   │       │   ├── ppv_lite86-2612821a05af2bbb.d
│   │       │   ├── proc_macro2-1979cae25ebfccda.d
│   │       │   ├── quote-3fc774c1ad54a937.d
│   │       │   ├── r2d2_sqlite-98f5118d40ae8c1b.d
│   │       │   ├── r2d2-4a9070c2fafdb7f3.d
│   │       │   ├── rand_chacha-e1e28301610d9765.d
│   │       │   ├── rand_core-3127b9fb0b565568.d
│   │       │   ├── rand_core-c098f0a0f6c5e892.d
│   │       │   ├── rand-183cbe37fb732104.d
│   │       │   ├── rand-34a4cc4a0e3a86b8.d
│   │       │   ├── rawpointer-4680d0045883066a.d
│   │       │   ├── rayon_cond-91077b9baa855a6f.d
│   │       │   ├── rayon_core-d6407a3fb3fc84fa.d
│   │       │   ├── rayon-7a412bce7dd89abf.d
│   │       │   ├── regex_automata-221bed759260be28.d
│   │       │   ├── regex_syntax-37d168b62650f492.d
│   │       │   ├── regex-6c73474ad10b4cc2.d
│   │       │   ├── rusqlite-7b9bd0c9576af8b8.d
│   │       │   ├── rustls_pki_types-496084e25437f7c9.d
│   │       │   ├── same_file-b514e486478ab817.d
│   │       │   ├── schannel-0a747fe2687e5b48.d
│   │       │   ├── scheduled_thread_pool-bd3e6f49408ecaa4.d
│   │       │   ├── scopeguard-7be9983266248e23.d
│   │       │   ├── serde_core-88cb8f2e57290578.d
│   │       │   ├── serde_derive-c187e3bd38ad7827.d
│   │       │   ├── serde_derive-c187e3bd38ad7827.dll
│   │       │   ├── serde_derive-c187e3bd38ad7827.dll.exp
│   │       │   ├── serde_derive-c187e3bd38ad7827.dll.lib
│   │       │   ├── serde_derive-c187e3bd38ad7827.pdb
│   │       │   ├── serde_json-daa1c510a59e2c06.d
│   │       │   ├── serde-d3849bd7a330dceb.d
│   │       │   ├── sharded_slab-6f34432e1c3d4ad3.d
│   │       │   ├── shlex-600e69eb33c63794.d
│   │       │   ├── smallvec-9251f454a0736d24.d
│   │       │   ├── socket2-7b2b365d96649457.d
│   │       │   ├── socks-32bb4bc1ab50ded6.d
│   │       │   ├── spm_precompiled-32273c37212c7107.d
│   │       │   ├── strsim-3faf8fe7b30b49b2.d
│   │       │   ├── syn-91b2f0d402bca54d.d
│   │       │   ├── thiserror_impl-dfbdb77ec7dc192b.d
│   │       │   ├── thiserror_impl-dfbdb77ec7dc192b.dll
│   │       │   ├── thiserror_impl-dfbdb77ec7dc192b.dll.exp
│   │       │   ├── thiserror_impl-dfbdb77ec7dc192b.dll.lib
│   │       │   ├── thiserror_impl-dfbdb77ec7dc192b.pdb
│   │       │   ├── thiserror-1207fc6866189221.d
│   │       │   ├── thread_local-8886d7ac88188379.d
│   │       │   ├── tokenizers-bda1015cb0580631.d
│   │       │   ├── tokio_macros-53556798f60e6410.d
│   │       │   ├── tokio_macros-53556798f60e6410.dll
│   │       │   ├── tokio_macros-53556798f60e6410.dll.exp
│   │       │   ├── tokio_macros-53556798f60e6410.dll.lib
│   │       │   ├── tokio_macros-53556798f60e6410.pdb
│   │       │   ├── tokio-49a34a2c287e6080.d
│   │       │   ├── tracing_attributes-69e0cce5a1e087c2.d
│   │       │   ├── tracing_attributes-69e0cce5a1e087c2.dll
│   │       │   ├── tracing_attributes-69e0cce5a1e087c2.dll.exp
│   │       │   ├── tracing_attributes-69e0cce5a1e087c2.dll.lib
│   │       │   ├── tracing_attributes-69e0cce5a1e087c2.pdb
│   │       │   ├── tracing_core-34eff25d7ae34ea0.d
│   │       │   ├── tracing_log-85846a57a945f6a6.d
│   │       │   ├── tracing_subscriber-df8168ae570a8a2f.d
│   │       │   ├── tracing-2215d3da5d7fbf22.d
│   │       │   ├── tree_sitter_rust-c26af413dbe15329.d
│   │       │   ├── tree_sitter-0259e3732a66be5a.d
│   │       │   ├── unicode_categories-6f2a970d6a871e1e.d
│   │       │   ├── unicode_ident-c0a85e118412d9fb.d
│   │       │   ├── unicode_normalization_alignments-435af4aa80518bc3.d
│   │       │   ├── unicode_segmentation-389752e447623914.d
│   │       │   ├── unicode_width-0374255ad6db2145.d
│   │       │   ├── ureq_proto-54e9ac6d31c9581b.d
│   │       │   ├── ureq-fb8b404a31d74069.d
│   │       │   ├── utf8_zero-d88a574a0fd4de32.d
│   │       │   ├── uuid-5354959e35171212.d
│   │       │   ├── vcpkg-9114f554c6fd89b1.d
│   │       │   ├── version_check-9646349495015550.d
│   │       │   ├── walkdir-f522fb2d75f18d4f.d
│   │       │   ├── webpki_root_certs-60a6ab375623e773.d
│   │       │   ├── winapi_util-5f9445c76b0efabd.d
│   │       │   ├── winapi-5472ee2533e25a44.d
│   │       │   ├── windows_link-1a4b2d8659b40a7a.d
│   │       │   ├── windows_link-a6b7ba4bf106afb3.d
│   │       │   ├── windows_sys-04087aa1421fdd8d.d
│   │       │   ├── windows_sys-040b70ee219b13a6.d
│   │       │   ├── windows_sys-3da07929e4bcface.d
│   │       │   ├── windows_sys-d5d9dc93825f4181.d
│   │       │   ├── windows_targets-490beefd63a9f11e.d
│   │       │   ├── windows_targets-638cc420987c04e1.d
│   │       │   ├── windows_x86_64_msvc-c64e562027c1bd5d.d
│   │       │   ├── windows_x86_64_msvc-eacb94f76b4d579b.d
│   │       │   ├── zerocopy-34a313ba2b6a4c2b.d
│   │       │   ├── zeroize-3f963dff29bcf9a1.d
│   │       │   └── zmij-aa9e5daa78350376.d
│   │       ├── DirectML.dll
│   │       ├── examples
│   │       ├── incremental
│   │       ├── memory_mcp_server.pdb
│   │       ├── memory-mcp-server.d
│   │       ├── memory-mcp-server.exe
│   │       ├── onnxruntime_providers_cuda.dll
│   │       ├── onnxruntime_providers_nv_tensorrt_rtx.dll
│   │       ├── onnxruntime_providers_shared.dll
│   │       └── onnxruntime_providers_tensorrt.dll
│   ├── test_agent.py
│   ├── test_graph_adversarial.py
│   ├── test_graph_stress.py
│   └── test_metrics.py
├── orchestration
│   ├── choreography-protocol.md
│   ├── merge-strategy.md
│   ├── spawn-rules.md
│   └── worktree-protocol.md
├── ORIGINAL_REQUEST.md
├── package-lock.json
├── package.json
├── patches
├── PRD.md
├── PROJECT.md
├── prompts
│   ├── base
│   │   ├── critique.md
│   │   └── system.md
│   ├── README.md
│   └── roles
│       ├── backend-task.md
│       ├── frontend-task.md
│       └── review-task.md
├── README.md
├── rules
│   ├── backend.md
│   ├── frontend.md
│   ├── git.md
│   ├── global.md
│   ├── security.md
│   └── testing.md
├── src
│   ├── backend.js
│   └── frontend.js
├── STACK.md
├── standards
│   ├── code-style.md
│   └── naming-conventions.md
├── State.md
├── templates
│   ├── CRP.md
│   ├── PR.md
│   └── SPEC.md
├── tests
│   └── bin
│       ├── ast-transform.test.js
│       ├── context-stress.test.js
│       ├── context.test.js
│       ├── dashboard-stress.test.js
│       ├── dashboard.test.js
│       ├── db.test.js
│       ├── event-bus.test.js
│       ├── governance.test.js
│       ├── intent.test.js
│       ├── m20-adversarial.test.js
│       ├── patch.test.js
│       ├── router.test.js
│       ├── schema.test.js
│       ├── task-queue.test.js
│       ├── ui.test.js
│       ├── verify.test.js
│       ├── veyra.test.js
│       └── visual-review.test.js
├── ToDo.md
├── TRD.md
├── veyra
├── veyra.cmd
├── veyra.ps1
├── visual-testing
│   ├── audit_test.go
│   ├── audit.go
│   ├── diff_test.go
│   ├── diff.go
│   ├── go.mod
│   ├── go.sum
│   ├── main.go
│   ├── snapshot_test.go
│   ├── snapshot.go
│   └── visual-testing.exe
├── vitest.config.js
├── walkthrough.md
└── workflows
    ├── bug-fixing.yaml
    ├── documentation-generation.yaml
    ├── feature-development.yaml
    ├── README.md
    ├── refactoring.yaml
    ├── security-audit.yaml
    └── testing-generation.yaml
```

*Indexed at: 2026-06-14T05:46:09.792Z*
