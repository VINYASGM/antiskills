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

console.log("\n==================================================");
console.log("--- AST-based Patching (Milestone 15) ---");
console.log("==================================================");

// Agent A wants to add logger property to config object
const astPatchA = JSON.stringify([
  { type: 'updateObjectProperty', variableName: 'config', propertyKey: 'logger', propertyValue: true }
]);

// Agent B wants to add db property to config object
const astPatchB = JSON.stringify([
  { type: 'updateObjectProperty', variableName: 'config', propertyKey: 'db', propertyValue: true }
]);

console.log("--- AST Patch A ---");
console.log(astPatchA);
console.log("--- AST Patch B ---");
console.log(astPatchB);

const astWorkspace = createWorkspace();
astWorkspace.addPatch('AgentA', 'config.js', astPatchA);
astWorkspace.addPatch('AgentB', 'config.js', astPatchB);

const astConflicts = astWorkspace.checkConflicts();
console.log("--- AST Conflicts (Should be empty/false) ---");
console.log(astConflicts);

let astPatched = originalCode;
astPatched = applyPatch(astPatched, astPatchA);
astPatched = applyPatch(astPatched, astPatchB);

console.log("--- Final Code under AST Patching (Both keys present and syntax clean) ---");
console.log(astPatched);

