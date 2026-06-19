# Project: Veyra Swarm Telemetry Dashboard

## Architecture
The terminal-based dashboard aggregates real-time swarm telemetry, displaying overall task progress, database claim locks, governance strike counters (circuit breakers), and active patch apply workspaces.
- **Data flow:** 
  - `bin/dashboard.js` reads task beads from the SQLite database via `bin/db.js`.
  - Parses governance transactions from `.agent/governance/tx-*.json` and detects escalations.
  - Scans `patches/` to identify active workspace channels.
  - Uses visual primitives from `bin/ui.js` (`colors`, `drawBox`, `drawTable`, `progressBar`) to render clean terminal layouts.
- **CLI Integration:** Routes the `dashboard` and `ui dashboard` commands in `bin/veyra.js`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Update Docs | Update global tracking files (PRD.md, TRD.md, Architecture.md, ToDo.md, State.md, context.md) and deploy PROJECT.md | none | COMPLETED |
| 2 | Implement Dashboard | Create bin/dashboard.js and integrate CLI routing in bin/veyra.js | M1 | COMPLETED |
| 3 | Implement Tests | Write tests/bin/dashboard.test.js and run Vitest suite | M2 | COMPLETED |
| 4 | Verification & Audit | Review correctness and execute forensic integrity audit | M3 | COMPLETED |
| 21 | AST Expansion & Agent Integration | Implement classes, decorators, JSX, interfaces/types AST APIs, wire to CLI/patch, and update agent markdown prompts | none | COMPLETED |
| 25 | Zero-Dependency Refactoring | Decommission SQLite, migrate to UUIDv4, add veyra status CLI, OSV.dev checking, structured audit logging, and tests | none | COMPLETED |

## Interface Contracts
### SwarmDashboard (`bin/dashboard.js`)
- `constructor(storageDir)`: Initializes telemetry tracker (defaults to `.agent/governance`).
- `getBeadStats(beads)`: Computes counts and completion rate.
- `getActiveLocks(beads)`: Computes claim durations.
- `getGovernanceTransactions()`: Reads governance status and highlights warnings/trips.
- `getPatchChannels()`: Lists active workspace subdirectories.
- `render()`: Returns the fully formatted string output.

### Supply Chain Security (`bin/verify.js` or `bin/security.js`)
- `queryOSV(packageName, version)`: Construct and POST OSV JSON payload to OSV.dev API, returning vulnerability object.
- `checkOSV(packageJsonPath, lockfilePath)`: Scan package manifests, check each dependency against OSV vulnerability database via queryOSV with offline mock fallbacks, throwing/returning exit code 1 on threat.

### Dynamic Status CLI (`bin/veyra.js` & `bin/db.js`)
- `status`: Command-line command `status [--json]` querying Map cache and JSON persistence files under lockfile, rendering user-friendly ANSI text or structured JSON of beads, active events, task queues, and system health.
