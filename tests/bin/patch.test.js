const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * Patch System Tests
 * Tests unified diff creation, patch application, and conflict detection.
 */

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-patch-test-'));
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('Patch — createPatch', () => {
  let patchModule;

  beforeEach(() => {
    const patchPath = require.resolve('../../bin/patch.js');
    delete require.cache[patchPath];
    patchModule = require('../../bin/patch.js');
  });

  test('generates unified diff from original to modified', () => {
    const original = 'line1\nline2\nline3\n';
    const modified = 'line1\nline2-changed\nline3\n';

    const diff = patchModule.createPatch(original, modified);
    expect(typeof diff).toBe('string');
    expect(diff).toContain('-line2');
    expect(diff).toContain('+line2-changed');
  });

  test('returns empty string when no changes', () => {
    const content = 'same\ncontent\n';
    const diff = patchModule.createPatch(content, content);
    expect(diff).toBe('');
  });

  test('handles addition of new lines', () => {
    const original = 'line1\nline2\n';
    const modified = 'line1\nline2\nline3\n';

    const diff = patchModule.createPatch(original, modified);
    expect(diff).toContain('+line3');
  });

  test('handles deletion of lines', () => {
    const original = 'line1\nline2\nline3\n';
    const modified = 'line1\nline3\n';

    const diff = patchModule.createPatch(original, modified);
    expect(diff).toContain('-line2');
  });
});

describe('Patch — applyPatch', () => {
  let patchModule;

  beforeEach(() => {
    const patchPath = require.resolve('../../bin/patch.js');
    delete require.cache[patchPath];
    patchModule = require('../../bin/patch.js');
  });

  test('applying a patch reconstructs modified content', () => {
    const original = 'line1\nline2\nline3\n';
    const modified = 'line1\nline2-changed\nline3\n';

    const diff = patchModule.createPatch(original, modified);
    const result = patchModule.applyPatch(original, diff);

    expect(result).toBe(modified);
  });

  test('applying empty patch returns original', () => {
    const content = 'unchanged\n';
    const result = patchModule.applyPatch(content, '');
    expect(result).toBe(content);
  });

  test('applying AST patch modifies content successfully', () => {
    const original = 'const port = 8080;\n';
    const astPatch = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9000 }
    ]);
    const result = patchModule.applyPatch(original, astPatch);
    expect(result).toContain('port = 9000');
  });

  test('applying invalid AST patch falls back to line patch', () => {
    const original = 'line1\nline2\n';
    // Invalid JSON starts with [ but fails to parse
    const invalidAstPatch = '[ { "type": "updateVariableAssignment"'; 
    const result = patchModule.applyPatch(original, invalidAstPatch);
    expect(result).toBe(original);
  });
});

describe('Patch — detectConflicts', () => {
  let patchModule;

  beforeEach(() => {
    const patchPath = require.resolve('../../bin/patch.js');
    delete require.cache[patchPath];
    patchModule = require('../../bin/patch.js');
  });

  test('detects conflict when two patches modify same lines', () => {
    const original = 'line1\nline2\nline3\n';
    const patchA = patchModule.createPatch(original, 'line1\nline2-A\nline3\n');
    const patchB = patchModule.createPatch(original, 'line1\nline2-B\nline3\n');

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/shared.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/shared.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(true);
    expect(result.details.length).toBeGreaterThan(0);
    expect(result.details[0]).toContain('src/shared.ts');
  });

  test('no conflict when patches modify different files', () => {
    const original = 'line1\nline2\n';
    const patchA = patchModule.createPatch(original, 'line1\nline2-A\n');
    const patchB = patchModule.createPatch(original, 'line1\nline2-B\n');

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/a.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/b.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(false);
    expect(result.details.length).toBe(0);
  });

  test('no conflict when patches modify different lines in same file', () => {
    const original = 'line1\nline2\nline3\nline4\nline5\n';
    const patchA = patchModule.createPatch(original, 'line1-A\nline2\nline3\nline4\nline5\n');
    const patchB = patchModule.createPatch(original, 'line1\nline2\nline3\nline4\nline5-B\n');

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/shared.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/shared.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(false);
  });

  test('detects AST conflict when two patches modify same resource', () => {
    const patchA = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9000 }
    ]);
    const patchB = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9500 }
    ]);

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/config.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/config.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(true);
    expect(result.details[0]).toContain('both modify the same AST resources: var:port');
  });

  test('no conflict when two AST patches modify different resources in same file', () => {
    const patchA = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9000 }
    ]);
    const patchB = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'host', value: 'localhost' }
    ]);

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/config.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/config.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(false);
  });

  test('detects conflict when mixing AST and line-based patches on same file', () => {
    const patchA = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9000 }
    ]);
    const patchB = '@@ -1,1 +1,1 @@\n-const port = 8080;\n+const port = 9500;\n';

    const result = patchModule.detectConflicts([
      { agentId: 'agent-a', filePath: 'src/config.ts', patch: patchA },
      { agentId: 'agent-b', filePath: 'src/config.ts', patch: patchB },
    ]);

    expect(result.hasConflict).toBe(true);
    expect(result.details[0]).toContain('Mixed patch types');
  });
});

describe('Workspace — commit', () => {
  let patchModule;
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempDir();
    const patchPath = require.resolve('../../bin/patch.js');
    delete require.cache[patchPath];
    patchModule = require('../../bin/patch.js');
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  test('workspace.commit() applies patches to real files atomically', () => {
    // Setup: create a real file
    const filePath = path.join(tmpDir, 'test.ts');
    fs.writeFileSync(filePath, 'original content\n');

    const workspace = patchModule.createWorkspace();
    const diff = patchModule.createPatch('original content\n', 'modified content\n');
    workspace.addPatch('agent-1', filePath, diff);

    const result = workspace.commit();
    expect(result.applied).toBe(1);
    expect(result.rejected).toBe(0);

    const newContent = fs.readFileSync(filePath, 'utf8');
    expect(newContent).toBe('modified content\n');
  });

  test('workspace.commit() applies AST patches to real files atomically', () => {
    const filePath = path.join(tmpDir, 'test_ast.ts');
    fs.writeFileSync(filePath, 'const port = 8080;\n');

    const workspace = patchModule.createWorkspace();
    const astPatch = JSON.stringify([
      { type: 'updateVariableAssignment', variableName: 'port', value: 9000 }
    ]);
    workspace.addPatch('agent-1', filePath, astPatch);

    const result = workspace.commit();
    expect(result.applied).toBe(1);
    expect(result.rejected).toBe(0);

    const newContent = fs.readFileSync(filePath, 'utf8');
    expect(newContent).toContain('port = 9000');
  });
});
