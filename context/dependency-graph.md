# Module Dependency Graph — Veyra OS

This document maps explicit module-level dependencies parsed directly from TypeScript/JavaScript import statements JIT.

## Dependency DAG Topology
```mermaid
graph TD
    _agent_skills_ui_ux_pro_max_scripts_design_system_py[".agent/skills/ui-ux-pro-max/scripts/design_system.py"] --> _agent_skills_ui_ux_pro_max_scripts_design_system_py[".agent/skills/ui-ux-pro-max/scripts/design_system.py"]
    _agent_skills_ui_ux_pro_max_scripts_design_system_py[".agent/skills/ui-ux-pro-max/scripts/design_system.py"] --> _agent_skills_ui_ux_pro_max_scripts_core_py[".agent/skills/ui-ux-pro-max/scripts/core.py"]
    _agent_skills_ui_ux_pro_max_scripts_search_py[".agent/skills/ui-ux-pro-max/scripts/search.py"] --> _agent_skills_ui_ux_pro_max_scripts_search_py[".agent/skills/ui-ux-pro-max/scripts/search.py"]
    _agent_skills_ui_ux_pro_max_scripts_search_py[".agent/skills/ui-ux-pro-max/scripts/search.py"] --> _agent_skills_ui_ux_pro_max_scripts_core_py[".agent/skills/ui-ux-pro-max/scripts/core.py"]
    _agent_skills_ui_ux_pro_max_scripts_search_py[".agent/skills/ui-ux-pro-max/scripts/search.py"] --> _agent_skills_ui_ux_pro_max_scripts_design_system_py[".agent/skills/ui-ux-pro-max/scripts/design_system.py"]
    _agents_teamwork_preview_explorer_dashboard_1_proposed_dashboard_test_js[".agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.test.js"] --> bin_dashboard_js["bin/dashboard.js"]
    _agents_teamwork_preview_explorer_dashboard_1_proposed_dashboard_test_js[".agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.test.js"] --> bin_db_js["bin/db.js"]
    bin_db_js["bin/db.js"] --> bin_schema_js["bin/schema.js"]
    bin_supervisor_js["bin/supervisor.js"] --> bin_skills_js["bin/skills.js"]
    bin_verify_js["bin/verify.js"] --> bin_patch_js["bin/patch.js"]
    bin_verify_js["bin/verify.js"] --> bin_context_js["bin/context.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_db_js["bin/db.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_context_js["bin/context.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_intent_js["bin/intent.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_patch_js["bin/patch.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_verify_js["bin/verify.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_governance_js["bin/governance.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_dashboard_js["bin/dashboard.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_visual_review_js["bin/visual-review.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_linter_js["bin/linter.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_ast_transform_js["bin/ast_transform.js"]
    bin_veyra_js["bin/veyra.js"] --> bin_event_bus_js["bin/event_bus.js"]
    bin_workflow_js["bin/workflow.js"] --> bin_supervisor_js["bin/supervisor.js"]
    memory_mcp_server_server_py["memory-mcp-server/server.py"] --> memory_mcp_server_graph_py["memory-mcp-server/graph.py"]
    memory_mcp_server_server_py["memory-mcp-server/server.py"] --> memory_mcp_server_compress_py["memory-mcp-server/compress.py"]
    memory_mcp_server_src_actors_mod_rs["memory-mcp-server/src/actors/mod.rs"] --> memory_mcp_server_src_actors_coordinator_rs["memory-mcp-server/src/actors/coordinator.rs"]
    memory_mcp_server_src_actors_mod_rs["memory-mcp-server/src/actors/mod.rs"] --> memory_mcp_server_src_actors_watcher_rs["memory-mcp-server/src/actors/watcher.rs"]
    memory_mcp_server_src_db_mod_rs["memory-mcp-server/src/db/mod.rs"] --> memory_mcp_server_src_db_writer_rs["memory-mcp-server/src/db/writer.rs"]
    memory_mcp_server_src_db_mod_rs["memory-mcp-server/src/db/mod.rs"] --> memory_mcp_server_src_db_schema_rs["memory-mcp-server/src/db/schema.rs"]
    memory_mcp_server_src_main_rs["memory-mcp-server/src/main.rs"] --> memory_mcp_server_src_actors_mod_rs["memory-mcp-server/src/actors/mod.rs"]
    memory_mcp_server_src_main_rs["memory-mcp-server/src/main.rs"] --> memory_mcp_server_src_db_mod_rs["memory-mcp-server/src/db/mod.rs"]
    memory_mcp_server_src_main_rs["memory-mcp-server/src/main.rs"] --> memory_mcp_server_src_mcp_mod_rs["memory-mcp-server/src/mcp/mod.rs"]
    memory_mcp_server_src_main_rs["memory-mcp-server/src/main.rs"] --> memory_mcp_server_src_pipeline_mod_rs["memory-mcp-server/src/pipeline/mod.rs"]
    memory_mcp_server_src_mcp_mod_rs["memory-mcp-server/src/mcp/mod.rs"] --> memory_mcp_server_src_mcp_server_rs["memory-mcp-server/src/mcp/server.rs"]
    memory_mcp_server_src_pipeline_mod_rs["memory-mcp-server/src/pipeline/mod.rs"] --> memory_mcp_server_src_pipeline_worker_rs["memory-mcp-server/src/pipeline/worker.rs"]
    memory_mcp_server_test_graph_stress_py["memory-mcp-server/test_graph_stress.py"] --> memory_mcp_server_graph_py["memory-mcp-server/graph.py"]
    memory_mcp_server_test_metrics_py["memory-mcp-server/test_metrics.py"] --> memory_mcp_server_graph_py["memory-mcp-server/graph.py"]
    memory_mcp_server_test_metrics_adversarial_py["memory-mcp-server/test_metrics_adversarial.py"] --> memory_mcp_server_graph_py["memory-mcp-server/graph.py"]
    tests_bin_dashboard_stress_test_js["tests/bin/dashboard-stress.test.js"] --> bin_dashboard_js["bin/dashboard.js"]
    tests_bin_dashboard_stress_test_js["tests/bin/dashboard-stress.test.js"] --> bin_db_js["bin/db.js"]
    tests_bin_dashboard_test_js["tests/bin/dashboard.test.js"] --> bin_dashboard_js["bin/dashboard.js"]
    tests_bin_dashboard_test_js["tests/bin/dashboard.test.js"] --> bin_db_js["bin/db.js"]
    tests_bin_governance_test_js["tests/bin/governance.test.js"] --> bin_governance_js["bin/governance.js"]
    tests_bin_schema_test_js["tests/bin/schema.test.js"] --> bin_schema_js["bin/schema.js"]
    tests_bin_verify_test_js["tests/bin/verify.test.js"] --> bin_verify_js["bin/verify.js"]
    tests_bin_verify_test_js["tests/bin/verify.test.js"] --> bin_patch_js["bin/patch.js"]
```


## Dependency Matrix Table
| Module | Depends On | Depended By |
| :--- | :--- | :--- |
| `.agent/skills/ui-ux-pro-max/scripts/core.py` | *None* | `.agent/skills/ui-ux-pro-max/scripts/design_system.py`, `.agent/skills/ui-ux-pro-max/scripts/search.py` |
| `.agent/skills/ui-ux-pro-max/scripts/design_system.py` | `.agent/skills/ui-ux-pro-max/scripts/design_system.py`, `.agent/skills/ui-ux-pro-max/scripts/core.py` | `.agent/skills/ui-ux-pro-max/scripts/design_system.py`, `.agent/skills/ui-ux-pro-max/scripts/search.py` |
| `.agent/skills/ui-ux-pro-max/scripts/search.py` | `.agent/skills/ui-ux-pro-max/scripts/search.py`, `.agent/skills/ui-ux-pro-max/scripts/core.py`, `.agent/skills/ui-ux-pro-max/scripts/design_system.py` | `.agent/skills/ui-ux-pro-max/scripts/search.py` |
| `.agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.js` | *None* | *None* |
| `.agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.test.js` | `bin/dashboard.js`, `bin/db.js` | *None* |
| `bin/ast_transform.js` | *None* | `bin/veyra.js` |
| `bin/context.js` | *None* | `bin/verify.js`, `bin/veyra.js` |
| `bin/dashboard.js` | *None* | `.agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.test.js`, `bin/veyra.js`, `tests/bin/dashboard-stress.test.js`, `tests/bin/dashboard.test.js` |
| `bin/db.js` | `bin/schema.js` | `.agents/teamwork_preview_explorer_dashboard_1/proposed_dashboard.test.js`, `bin/veyra.js`, `tests/bin/dashboard-stress.test.js`, `tests/bin/dashboard.test.js` |
| `bin/event_bus.js` | *None* | `bin/veyra.js` |
| `bin/governance.js` | *None* | `bin/veyra.js`, `tests/bin/governance.test.js` |
| `bin/intent.js` | *None* | `bin/veyra.js` |
| `bin/linter.js` | *None* | `bin/veyra.js` |
| `bin/patch.js` | *None* | `bin/verify.js`, `bin/veyra.js`, `tests/bin/verify.test.js` |
| `bin/router.js` | *None* | *None* |
| `bin/schema.js` | *None* | `bin/db.js`, `tests/bin/schema.test.js` |
| `bin/skills.js` | *None* | `bin/supervisor.js` |
| `bin/supervisor.js` | `bin/skills.js` | `bin/workflow.js` |
| `bin/ui.js` | *None* | *None* |
| `bin/vector_search.py` | *None* | *None* |
| `bin/verify.js` | `bin/patch.js`, `bin/context.js` | `bin/veyra.js`, `tests/bin/verify.test.js` |
| `bin/veyra.js` | `bin/db.js`, `bin/context.js`, `bin/intent.js`, `bin/patch.js`, `bin/verify.js`, `bin/governance.js`, `bin/dashboard.js`, `bin/visual-review.js`, `bin/linter.js`, `bin/ast_transform.js`, `bin/event_bus.js` | *None* |
| `bin/visual-review.js` | *None* | `bin/veyra.js` |
| `bin/workflow.js` | `bin/supervisor.js` | *None* |
| `bin/worktree.js` | *None* | *None* |
| `demo-ast-patching.js` | *None* | *None* |
| `memory-mcp-server/compress.py` | *None* | `memory-mcp-server/server.py` |
| `memory-mcp-server/graph.py` | *None* | `memory-mcp-server/server.py`, `memory-mcp-server/test_graph_stress.py`, `memory-mcp-server/test_metrics.py`, `memory-mcp-server/test_metrics_adversarial.py` |
| `memory-mcp-server/server.py` | `memory-mcp-server/graph.py`, `memory-mcp-server/compress.py` | *None* |
| `memory-mcp-server/src/actors/coordinator.rs` | *None* | `memory-mcp-server/src/actors/mod.rs` |
| `memory-mcp-server/src/actors/mod.rs` | `memory-mcp-server/src/actors/coordinator.rs`, `memory-mcp-server/src/actors/watcher.rs` | `memory-mcp-server/src/main.rs` |
| `memory-mcp-server/src/actors/watcher.rs` | *None* | `memory-mcp-server/src/actors/mod.rs` |
| `memory-mcp-server/src/db/mod.rs` | `memory-mcp-server/src/db/writer.rs`, `memory-mcp-server/src/db/schema.rs` | `memory-mcp-server/src/main.rs` |
| `memory-mcp-server/src/db/schema.rs` | *None* | `memory-mcp-server/src/db/mod.rs` |
| `memory-mcp-server/src/db/writer.rs` | *None* | `memory-mcp-server/src/db/mod.rs` |
| `memory-mcp-server/src/main.rs` | `memory-mcp-server/src/actors/mod.rs`, `memory-mcp-server/src/db/mod.rs`, `memory-mcp-server/src/mcp/mod.rs`, `memory-mcp-server/src/pipeline/mod.rs` | *None* |
| `memory-mcp-server/src/mcp/mod.rs` | `memory-mcp-server/src/mcp/server.rs` | `memory-mcp-server/src/main.rs` |
| `memory-mcp-server/src/mcp/server.rs` | *None* | `memory-mcp-server/src/mcp/mod.rs` |
| `memory-mcp-server/src/pipeline/mod.rs` | `memory-mcp-server/src/pipeline/worker.rs` | `memory-mcp-server/src/main.rs` |
| `memory-mcp-server/src/pipeline/worker.rs` | *None* | `memory-mcp-server/src/pipeline/mod.rs` |
| `memory-mcp-server/test_agent.py` | *None* | *None* |
| `memory-mcp-server/test_graph_stress.py` | `memory-mcp-server/graph.py` | *None* |
| `memory-mcp-server/test_metrics.py` | `memory-mcp-server/graph.py` | *None* |
| `memory-mcp-server/test_metrics_adversarial.py` | `memory-mcp-server/graph.py` | *None* |
| `src/backend.js` | *None* | *None* |
| `src/frontend.js` | *None* | *None* |
| `tests/bin/ast-transform.test.js` | *None* | *None* |
| `tests/bin/context-stress.test.js` | *None* | *None* |
| `tests/bin/context.test.js` | *None* | *None* |
| `tests/bin/dashboard-stress.test.js` | `bin/dashboard.js`, `bin/db.js` | *None* |
| `tests/bin/dashboard.test.js` | `bin/dashboard.js`, `bin/db.js` | *None* |
| `tests/bin/db.test.js` | *None* | *None* |
| `tests/bin/event-bus.test.js` | *None* | *None* |
| `tests/bin/governance.test.js` | `bin/governance.js` | *None* |
| `tests/bin/intent.test.js` | *None* | *None* |
| `tests/bin/m20-adversarial.test.js` | *None* | *None* |
| `tests/bin/patch.test.js` | *None* | *None* |
| `tests/bin/router.test.js` | *None* | *None* |
| `tests/bin/schema.test.js` | `bin/schema.js` | *None* |
| `tests/bin/task-queue.test.js` | *None* | *None* |
| `tests/bin/ui.test.js` | *None* | *None* |
| `tests/bin/verify.test.js` | `bin/verify.js`, `bin/patch.js` | *None* |
| `tests/bin/veyra.test.js` | *None* | *None* |
| `tests/bin/visual-review.test.js` | *None* | *None* |
| `tests/bin/worktree.test.js` | *None* | *None* |
| `visual-testing/audit.go` | *None* | *None* |
| `visual-testing/audit_test.go` | *None* | *None* |
| `visual-testing/diff.go` | *None* | *None* |
| `visual-testing/diff_test.go` | *None* | *None* |
| `visual-testing/main.go` | *None* | *None* |
| `visual-testing/snapshot.go` | *None* | *None* |
| `visual-testing/snapshot_test.go` | *None* | *None* |
| `vitest.config.js` | *None* | *None* |


*Indexed at: 2026-06-13T09:08:53.331Z*
