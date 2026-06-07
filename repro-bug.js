const { createPatch, createWorkspace } = require('./bin/patch.js');

// Simulate the exact architectural flaw described in the audit:
// "Agents will constantly overwrite each other's uncommitted changes, leading to endless loops of validation failures... destroy the integrity of the parallel workflow."
// We will test if two agents adding valid but different AST nodes to adjacent lines results in a syntax error (invalid code) without throwing a line-based conflict.

const originalCode = `function configureApp() {
  const config = {};
  return config;
}
`;

// Agent A wants to add a logger
const agentACode = `function configureApp() {
  const config = {};
  config.logger = true;
  return config;
}
`;

// Agent B wants to add a database connection
const agentBCode = `function configureApp() {
  const config = {};
  config.db = true;
  return config;
}
`;

const patchA = createPatch(originalCode, agentACode);
const patchB = createPatch(originalCode, agentBCode);

console.log("--- Patch A ---");
console.log(patchA);
console.log("--- Patch B ---");
console.log(patchB);

const workspace = createWorkspace();
workspace.addPatch('AgentA', 'config.js', patchA);
workspace.addPatch('AgentB', 'config.js', patchB);

const conflicts = workspace.checkConflicts();
console.log("--- Line-based Conflicts ---");
console.log(conflicts);

// To test application, we need to mock fs or just apply directly
const { applyPatch } = require('./bin/patch.js');
let patched = originalCode;
patched = applyPatch(patched, patchA);
patched = applyPatch(patched, patchB);

console.log("--- Final Code (Semantically invalid if overlapping blindly) ---");
console.log(patched);
