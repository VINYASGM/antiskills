---
name: memory-manager
description: Controls persistence of long-horizon state via the Beads pattern.
---
Purpose: Controls persistence of long-horizon state via the Beads pattern.
Required Context: @memory/beads.json, @memory/README.md, active task states
Constraints: NEVER delete beads — only archive. ALWAYS merge duplicate memory nodes. ALWAYS link beads to their dependencies.
Escalation: Memory graph corruption -> snapshot + human review.