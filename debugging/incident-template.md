# Incident Report Template

Copy this template for each new incident. Fill every field — empty fields indicate incomplete investigation.

---

## Incident Header

| Field | Value |
| :--- | :--- |
| **Incident ID** | `bd-XXXX` |
| **Severity** | `P0` / `P1` / `P2` / `P3` |
| **Status** | `open` / `investigating` / `resolved` / `escalated` |
| **Detected By** | `agent` / `CI` / `human` |
| **Detected At** | `YYYY-MM-DDTHH:MM:SSZ` |
| **Resolved At** | `YYYY-MM-DDTHH:MM:SSZ` (blank if unresolved) |
| **Assigned To** | Agent ID or human name |
| **Related Beads** | `bd-XXXX`, `bd-YYYY` |

### Severity Definitions

| Level | Meaning | Response Time |
| :--- | :--- | :--- |
| **P0** | System down, data loss, security breach | Immediate — drop everything |
| **P1** | Major feature broken, no workaround | Within 1 hour |
| **P2** | Feature degraded, workaround exists | Within 4 hours |
| **P3** | Minor issue, cosmetic, low impact | Next work cycle |

---

## Stack Trace

```
[Paste the full, untruncated stack trace here]
[Include the error message, file paths, and line numbers]
[If multiple stack traces exist (e.g., caused by + original), include all]
```

---

## Affected Files

| File | Lines | Description of Impact |
| :--- | :--- | :--- |
| `src/module/file.ts` | `L42-L58` | Function that produces incorrect output |
| `src/module/helper.ts` | `L12` | Dependency called with wrong argument |

---

## Minimal Reproduction

```bash
# Exact commands to reproduce the bug from a clean state
# This should be copy-pasteable and produce the failure deterministically
```

**Minimal input:**
```json
{
  "key": "smallest input that triggers the bug"
}
```

**Expected output:**
```
[What should happen]
```

**Actual output:**
```
[What actually happens]
```

---

## Hypotheses Tested

| # | Hypothesis | Likelihood | Test Performed | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | [Description] | High | [What was tested] | Confirmed / Refuted | [Specific evidence] |
| 2 | [Description] | Medium | [What was tested] | Confirmed / Refuted | [Specific evidence] |
| 3 | [Description] | Low | [What was tested] | Confirmed / Refuted | [Specific evidence] |

---

## Root Cause

**Description:**
[Clear, specific explanation of what caused the bug. Name the exact code path, the exact condition, and why it produces the wrong behavior.]

**Category:** `logic-error` / `type-error` / `race-condition` / `missing-validation` / `config-error` / `dependency-bug` / `data-corruption` / `other`

---

## Fix Applied

**Description:**
[What was changed and why this change resolves the root cause]

**Diff:**
```diff
- [old code]
+ [new code]
```

**Commit:** `[commit SHA]`
**Branch:** `[branch name]`

---

## Regression Test

| Field | Value |
| :--- | :--- |
| **Test File** | `src/module/__tests__/file.test.ts` |
| **Test Name** | `"should handle [specific condition] correctly"` |
| **Line Reference** | `L15-L28` |

```typescript
// Paste the regression test here
test("should handle [specific condition] correctly", () => {
  // Arrange: set up the condition that triggered the bug
  // Act: call the function with the minimal reproduction input
  // Assert: verify correct behavior
});
```

---

## Evidence

### Test Output (Before Fix)
```
FAIL  src/module/__tests__/file.test.ts
  ✗ should handle [specific condition] correctly
    Expected: [value]
    Received: [value]
```

### Test Output (After Fix)
```
PASS  src/module/__tests__/file.test.ts
  ✓ should handle [specific condition] correctly
```

### Full Suite Output
```
Test Suites: XX passed, XX total
Tests:       XX passed, XX total
```

---

## Timeline

| Timestamp | Event |
| :--- | :--- |
| `YYYY-MM-DDTHH:MM:SSZ` | Bug detected by [source] |
| `YYYY-MM-DDTHH:MM:SSZ` | Feedback loop established |
| `YYYY-MM-DDTHH:MM:SSZ` | Root cause confirmed |
| `YYYY-MM-DDTHH:MM:SSZ` | Fix applied |
| `YYYY-MM-DDTHH:MM:SSZ` | All tests passing |
| `YYYY-MM-DDTHH:MM:SSZ` | Incident closed |

---

## Lessons Learned

### What went well
- [Specific thing that helped find/fix the bug faster]

### What went poorly
- [Specific thing that slowed down the investigation]

### Prevention
- [ ] [Action item to prevent this class of bug in the future]
- [ ] [E.g., "Add input validation for X", "Add integration test for Y scenario"]
- [ ] [E.g., "Update linter rules to catch Z pattern"]

### Tags
`#root-cause-category` `#affected-system` `#detection-method`
