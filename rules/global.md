---
name: global-rules
description: Universal coding standards that apply to ALL code in the Veyra repository. These are non-negotiable engineering principles.
globs: "**/*"
---

# Global Engineering Rules

> These rules apply to **every file, every function, every line** in the Veyra codebase.
> No exceptions. No "quick hacks." No "I'll fix it later."

---

## 1. Determinism Over Cleverness

Prefer explicit, readable code over metaprogramming or clever abstractions.

```typescript
// ❌ WRONG: Clever metaprogramming
const handlers = ['create', 'update', 'delete'].reduce(
  (acc, action) => ({ ...acc, [action]: generateHandler(action) }), {}
);

// ✅ RIGHT: Explicit and debuggable
const handlers = {
  create: createHandler,
  update: updateHandler,
  delete: deleteHandler,
};
```

- Prefer explicit loops over `reduce` for complex transformations.
- Prefer `if/else` chains over nested ternaries.
- Prefer named functions over inline arrow functions for non-trivial logic.
- If a junior developer can't understand it in 30 seconds, simplify it.

---

## 2. Zero-Trust Modularity

Validate data at **every** service boundary. Never assume upstream code sent correct data.

```typescript
// ✅ Every module boundary validates its inputs
export function processOrder(input: unknown): Order {
  const parsed = OrderSchema.parse(input); // Validate at boundary
  return buildOrder(parsed);               // Internal logic trusts parsed data
}
```

- Public function inputs: always validated.
- Internal helper inputs: trust the caller (already validated at boundary).
- Cross-service calls: validate both request and response.
- Database reads: validate shape matches expected schema.

---

## 3. Error Handling — No Swallowing

Every error must be caught, logged with full context, and either recovered or re-thrown.

```typescript
// ❌ WRONG: Silent swallowing
try {
  await saveUser(user);
} catch (e) {
  // "it's fine"
}

// ❌ WRONG: Logging without context
try {
  await saveUser(user);
} catch (e) {
  console.log('error');
}

// ✅ RIGHT: Full context, explicit decision
try {
  await saveUser(user);
} catch (error) {
  logger.error('Failed to save user', {
    userId: user.id,
    error: error instanceof Error ? error.stack : String(error),
  });
  throw new UserPersistenceError('Failed to save user', { cause: error });
}
```

**Rules:**
- `catch` blocks must log with full stack trace.
- Recoverable errors: handle and continue with degraded behavior. Document the degradation.
- Unrecoverable errors: re-throw with added context.
- Never use empty `catch {}` blocks.
- Never catch `Error` and return `null` silently.

---

## 4. Explicit Typing

TypeScript's type system exists to prevent bugs. Use it fully.

```typescript
// ❌ NEVER: any is forbidden
function processData(data: any): any { ... }

// ✅ ALWAYS: unknown + narrowing
function processData(data: unknown): ProcessedResult {
  if (!isValidInput(data)) {
    throw new ValidationError('Invalid input shape');
  }
  return transform(data); // data is narrowed here
}
```

**Rules:**
- `any` is **banned**. Use `unknown` and narrow with type guards.
- All function parameters have explicit types.
- All exported functions have explicit return types.
- Use discriminated unions over optional properties for state modeling.
- Prefer `interface` for object shapes, `type` for unions/intersections.

---

## 5. Size Constraints

| Metric | Limit | Action When Exceeded |
|---|---|---|
| Function body | 40 lines max | Extract helper functions |
| File length | 300 lines max | Split into focused modules |
| Function parameters | 4 max | Use an options object |
| Nesting depth | 3 levels max | Extract or use early returns |
| Cyclomatic complexity | 10 max | Decompose into smaller functions |

**Exclusions:** Test files are exempt from function length limits (test setup can be verbose).

---

## 6. Boundary Interfaces

Every module exposes a clean public interface. Internal implementation is hidden.

```
src/
  user-management/
    index.ts          ← Public API (re-exports only)
    user-service.ts   ← Implementation (not imported directly)
    user-repository.ts
    types.ts          ← Shared types for this module
```

```typescript
// user-management/index.ts — the ONLY import path for consumers
export { UserService } from './user-service';
export type { User, CreateUserInput } from './types';
```

- Consumers import from the module root, never from internal files.
- Internal files can import from each other freely.
- Cross-module imports go through the public interface only.

---

## 7. Import Ordering

Imports are grouped and sorted in this exact order, with one blank line between groups:

```typescript
// 1. Standard library / Node built-ins
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 2. External packages (node_modules)
import { z } from 'zod';
import express from 'express';

// 3. Internal modules (absolute paths / aliases)
import { UserService } from '@/user-management';
import { logger } from '@/shared/logger';

// 4. Relative imports (current module)
import { validateInput } from './validators';
import type { UserInput } from './types';
```

- Type-only imports use `import type { ... }`.
- No unused imports. Ever.

---

## 8. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files | kebab-case | `user-service.ts` |
| Directories | kebab-case | `user-management/` |
| Types / Interfaces / Classes | PascalCase | `UserProfile`, `IAuthService` |
| Functions / Variables / Methods | camelCase | `getUserById`, `isActive` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| Enums | PascalCase (members too) | `UserRole.Admin` |
| Boolean variables | `is`/`has`/`can`/`should` prefix | `isActive`, `hasPermission` |

See [standards/naming-conventions.md](../standards/naming-conventions.md) for the complete naming guide.

---

## 9. Comments — WHY, Not WHAT

```typescript
// ❌ WRONG: Restates the code
// Increment counter by 1
counter += 1;

// ✅ RIGHT: Explains the business reason
// Rate limiter requires a warm-up period of 10 requests before
// applying sliding window. Without this, cold-start bursts get throttled.
counter += 1;
```

**Rules:**
- Code must be self-documenting for WHAT it does.
- Comments explain WHY a decision was made, not WHAT the code does.
- Delete commented-out code. That's what git history is for.
- TODO comments must include a tracking reference: `// TODO(bd-1042): migrate to cursor pagination`.

---

## 10. Public API Documentation

Every exported function has a JSDoc comment.

```typescript
/**
 * Retrieves a user by their unique identifier.
 *
 * @param userId - The UUID of the user to retrieve.
 * @returns The user object if found.
 * @throws {UserNotFoundError} When no user exists with the given ID.
 */
export async function getUserById(userId: string): Promise<User> {
  // ...
}
```

**Required JSDoc tags:**
- `@param` for every parameter.
- `@returns` describing the return value.
- `@throws` for every error the function can throw.
- `@example` for non-obvious usage (optional but encouraged).

---

## 11. No Circular Dependencies

Circular dependencies create unpredictable initialization order and make code untestable.

```
// ❌ WRONG: A imports B, B imports A
user-service.ts → auth-service.ts → user-service.ts

// ✅ RIGHT: Use dependency injection
user-service.ts → AuthPort (interface)
auth-service.ts implements AuthPort
Composition root wires them together
```

**Rules:**
- Use dependency injection to break circular chains.
- Define interfaces (ports) in the consuming module.
- Wire implementations in the composition root (main entry point).
- Use a circular dependency detector in CI (e.g., `madge --circular`).

---

## 12. Async Operations — Timeout and Cancellation

Every async operation must support timeout and cancellation. Hanging operations are silent killers.

```typescript
// ✅ Every external call has a timeout
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000), // 5 second timeout
});

// ✅ Long-running operations accept AbortSignal
async function processLargeDataset(
  data: DataItem[],
  signal?: AbortSignal,
): Promise<ProcessedResult[]> {
  const results: ProcessedResult[] = [];
  for (const item of data) {
    signal?.throwIfAborted();
    results.push(await processItem(item));
  }
  return results;
}
```

**Rules:**
- HTTP requests: 5s default timeout, configurable per-call.
- Database queries: 10s default timeout.
- Background jobs: explicit max runtime with forced termination.
- All timeouts are constants, not magic numbers.

---

## Quick Reference Checklist

Before submitting any code, verify:

- [ ] No `any` types anywhere
- [ ] All errors caught with full stack traces
- [ ] No function exceeds 40 lines
- [ ] No file exceeds 300 lines
- [ ] Imports ordered correctly
- [ ] All exported functions have JSDoc
- [ ] No circular dependencies
- [ ] All async calls have timeouts
- [ ] Data validated at every boundary
- [ ] Comments explain WHY, not WHAT
