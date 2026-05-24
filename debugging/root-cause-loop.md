# Root Cause Loop — The Debugging Discipline

Every bug is a search problem. The search terminates when you have a **fast, deterministic, agent-runnable pass/fail signal** that isolates the cause. This document defines the 7-phase protocol.

---

## Phase 1 — Build a Feedback Loop

> **THIS IS THE SKILL.** Everything else is mechanical.

If you have a fast, deterministic, agent-runnable pass/fail signal, you **WILL** find the cause. If you don't have one, you are not debugging — you are guessing.

### Feedback Loop Construction Strategies

Try these in order. Use the first one that works. Fall through only when the previous strategy is impossible, not merely inconvenient.

| Priority | Strategy | When to Use | Example |
| :--- | :--- | :--- | :--- |
| 1 | **Failing test at the seam** | Bug is in a function with testable I/O | `vitest run src/parser.test.ts -t "handles empty input"` |
| 2 | **Curl/HTTP script against dev server** | Bug is in an API endpoint | `curl -s localhost:3000/api/users \| jq .status` |
| 3 | **CLI invocation with fixture input** | Bug is in a CLI tool or script | `node cli.js --input fixture.json \| diff - expected.json` |
| 4 | **Headless browser script** | Bug is in rendered UI behavior | Playwright script asserting DOM state |
| 5 | **Replay a captured trace** | Bug occurred in production, you have logs | Replay request sequence against local server |
| 6 | **Throwaway harness with mocked deps** | Bug is deep in a module with heavy dependencies | Isolate the module, mock its imports, feed it the failing input |
| 7 | **Property/fuzz loop** | Bug is "sometimes wrong" / nondeterministic | `fast-check` property test narrowing the input space |
| 8 | **Bisection harness** | Bug is a regression between two known states | `git bisect run ./test-script.sh` |
| 9 | **Differential loop** | Bug might be a behavioral change | Run old version and new version side-by-side, diff outputs |
| 10 | **HITL bash script** | Nothing else works (LAST RESORT) | Script that runs the operation and prompts human for pass/fail |

### Iterate on the Loop

Once you have a feedback loop, make it:
- **Faster** — under 5 seconds per iteration. Strip unnecessary setup, mock slow deps.
- **Sharper** — the signal should distinguish root causes. If two different bugs produce the same failure, narrow the assertion.
- **More deterministic** — eliminate flakiness. Pin random seeds, mock time, control concurrency.

---

## Phase 2 — Minimize the Reproduction

Strip the failing case to the **smallest possible input** that still triggers the bug.

### Procedure

1. Start with the full failing input
2. Binary search on complexity: remove half the input, check if it still fails
3. Remove fields/parameters one at a time until the minimal trigger remains
4. Document the minimal reproduction in the incident bead

### Why This Matters

- Smaller inputs make hypotheses more precise
- Smaller inputs make the feedback loop faster
- Smaller inputs eliminate red herrings

---

## Phase 3 — Generate Hypotheses

Generate a **minimum of 3 falsifiable hypotheses**. More is better. Rank by likelihood.

### Hypothesis Format

```markdown
### Hypothesis [N]: [Short description]

**Claim:** [What you think is causing the bug]
**Likelihood:** [High / Medium / Low]
**Falsifiable by:** [Specific test or observation that would disprove this]
**Expected evidence if true:** [What you would see in logs/traces/output]
**Expected evidence if false:** [What you would see instead]
```

### Example

```markdown
### Hypothesis 1: Off-by-one in pagination offset

**Claim:** The `getPage()` function calculates offset as `page * limit` instead of `(page - 1) * limit`, causing page 1 to skip the first N records.
**Likelihood:** High
**Falsifiable by:** Log the SQL query generated for page=1 and check the OFFSET value.
**Expected evidence if true:** OFFSET equals `limit` (e.g., 20) instead of 0.
**Expected evidence if false:** OFFSET equals 0, and the bug is elsewhere.
```

### Rules

- Every hypothesis must name the **specific code location** or **specific condition** suspected
- "Something is wrong with X" is not a hypothesis. "X fails when input Y contains Z because of condition W" is a hypothesis.
- If you cannot generate 3 hypotheses, you do not understand the system well enough — read more code before proceeding.

---

## Phase 4 — Instrument and Test

### Procedure

1. Select the highest-likelihood hypothesis
2. Add **targeted instrumentation** to the suspected code path:
   - `console.log` / `console.trace` at specific decision points
   - Conditional breakpoints
   - Temporary assertions that throw on unexpected state
3. Run the feedback loop from Phase 1
4. Collect execution evidence:
   - Log output
   - Variable values at key points
   - Stack traces
   - Timing data
5. Compare collected evidence against expected evidence from each hypothesis
6. Mark each hypothesis as **confirmed**, **refuted**, or **inconclusive**

### Rules

- Instrument the code — do not read it and guess. Your mental model of the code is less reliable than actual execution data.
- If all hypotheses are refuted, return to Phase 3 with the new evidence and generate new hypotheses.
- Never skip instrumentation because the cause "seems obvious."

---

## Phase 5 — Apply Fix

### Pre-Fix Checklist

- [ ] Root cause is confirmed by evidence from Phase 4
- [ ] Regression test is written and currently **fails** (proving it catches the bug)
- [ ] Fix is scoped to the confirmed root cause only

### Fix Rules

1. **Targeted fix only.** Change the minimum code required to resolve the confirmed root cause.
2. **Do not touch adjacent code.** No cleanup, no refactoring, no "while I'm here" improvements.
3. **Do not change code you don't understand.** If the fix requires modifying unfamiliar code, read it thoroughly first.
4. **Match existing style.** Even if you disagree with the conventions in the file.

### Applying the Fix

1. Write the regression test first — it must fail before the fix
2. Apply the fix
3. Run the regression test — it must now pass
4. Run the full test suite — no new failures

---

## Phase 6 — Validate

### Validation Checklist

- [ ] The regression test from Phase 5 passes
- [ ] The feedback loop from Phase 1 shows a pass signal
- [ ] `pnpm vitest run` — full test suite passes with zero new failures
- [ ] `pnpm lint` — no new lint errors
- [ ] `pnpm tsc --noEmit` — no new type errors

### Post-Validation

1. Remove all temporary instrumentation added in Phase 4
2. Update the incident bead:
   - Status: `resolved`
   - Root cause: confirmed description
   - Fix: description with file and line references
   - Evidence: test output proving the fix works
3. Commit with message format: `fix(scope): description (closes bd-XXXX)`

---

## Phase 7 — Escalation

**Enter this phase ONLY if Phase 5 has failed 3 times.**

### Immediate Actions

1. **`git revert`** the offending commit(s):
   ```bash
   git revert <commit-sha> --no-edit
   ```
2. **Verify revert** — the codebase returns to a known-good state:
   ```bash
   pnpm vitest run
   ```

### Log Incident Bead

Create a high-severity incident bead using [incident-template.md](./incident-template.md) with:
- Severity: `P1` minimum
- Status: `escalated`
- All 3+ hypotheses tested with results
- All evidence collected across all attempts
- The specific reason each fix attempt failed

### Generate CRP

The CRP (Change Request Proposal) for human review must contain:

```markdown
## CRP: Escalated Bug — [Title]

### Context
[What triggered the bug, when it was detected, what it affects]

### Stack Trace
[Full stack trace from the original failure]

### Hypotheses Tested
1. [Hypothesis] — [Result: confirmed/refuted] — [Evidence]
2. [Hypothesis] — [Result: confirmed/refuted] — [Evidence]
3. [Hypothesis] — [Result: confirmed/refuted] — [Evidence]

### Fix Attempts
1. [What was tried] — [Why it failed]
2. [What was tried] — [Why it failed]
3. [What was tried] — [Why it failed]

### Current State
- Offending commit reverted: [commit SHA]
- Codebase is on known-good state: [yes/no]
- Full test suite passing: [yes/no]

### Recommendation
[Agent's best assessment of what a human should investigate]
```
