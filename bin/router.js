/**
 * 🧭 Dynamic Task Router
 * Classifies task descriptions and selects 1-3 relevant agent roles.
 * Replaces the rigid 9-agent sequential pipeline.
 */

const ROLE_PATTERNS = [
  {
    pattern: /\b(bug|fix|error|crash|broken|issue|fail|exception)\b/i,
    roles: ['backend-engineer', 'testing-engineer'],
    parallel: false,
  },
  {
    pattern: /\b(feature|add|build|create|implement|new)\b/i,
    roles: ['planner', 'backend-engineer', 'testing-engineer'],
    parallel: false,
  },
  {
    pattern: /\b(doc|readme|guide|documentation|comment)\b/i,
    roles: ['documentation-writer'],
    parallel: true,
  },
  {
    pattern: /\b(security|audit|vuln|cve|auth|permission)\b/i,
    roles: ['security-reviewer', 'code-reviewer'],
    parallel: true,
  },
  {
    pattern: /\b(refactor|clean|optimize|reorganize|simplify)\b/i,
    roles: ['architect', 'code-reviewer'],
    parallel: false,
  },
  {
    pattern: /\b(test|coverage|spec|assertion|mock)\b/i,
    roles: ['testing-engineer'],
    parallel: true,
  },
  {
    pattern: /\b(ui|frontend|css|layout|design|component|page|dashboard|responsive|style)\b/i,
    roles: ['frontend-engineer', 'vlm-ui-reviewer'],
    parallel: false,
  },
];

/**
 * Routes a task description to 1-3 agent roles.
 *
 * @param {string} taskDescription - Natural language task description.
 * @returns {{roles: string[], parallel: boolean}} Selected roles and parallelism flag.
 */
function routeTask(taskDescription) {
  const matchedRoles = new Set();
  let parallel = true;

  for (const { pattern, roles, parallel: p } of ROLE_PATTERNS) {
    if (pattern.test(taskDescription)) {
      for (const role of roles) matchedRoles.add(role);
      if (!p) parallel = false;
    }
  }

  // Fallback: if nothing matched, default to planner + backend
  if (matchedRoles.size === 0) {
    matchedRoles.add('planner');
    matchedRoles.add('backend-engineer');
    parallel = false;
  }

  return {
    roles: Array.from(matchedRoles),
    parallel,
  };
}

module.exports = { routeTask };
