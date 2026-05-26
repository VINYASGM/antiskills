const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * IntentManager Tests
 * Tests SQLite WAL-based intent broadcasting, conflict detection (4 types), and cleanup.
 */

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-intent-test-'));
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'intents'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('IntentManager — Publish & List', () => {
  let originalCwd;
  let tmpDir;
  let intentManager;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    // Clear caches
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = require.resolve('../../bin/intent.js');
    delete require.cache[intentPath];

    db = require('../../bin/db.js');
    intentManager = require('../../bin/intent.js');
  });

  afterEach(() => {
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/db.js')];
    delete require.cache[require.resolve('../../bin/intent.js')];
  });

  test('publish() stores intent and returns it', () => {
    const result = intentManager.publish('fe-agent', 'bd-0001', {
      files: ['src/App.tsx'],
      databaseColumns: [],
      routes: ['/api/users'],
      styles: ['btn-primary'],
    });

    expect(result.agentId).toBe('fe-agent');
    expect(result.taskId).toBe('bd-0001');
    expect(result.files).toEqual(['src/App.tsx']);
    expect(result.routes).toEqual(['/api/users']);
  });

  test('list() returns all published intents', () => {
    intentManager.publish('fe-agent', 'bd-0001', { files: ['src/A.tsx'] });
    intentManager.publish('be-agent', 'bd-0002', { files: ['src/B.ts'] });

    const intents = intentManager.list();
    expect(intents.length).toBe(2);
  });

  test('publish() upserts on same agent+task', () => {
    intentManager.publish('fe-agent', 'bd-0001', { files: ['src/Old.tsx'] });
    intentManager.publish('fe-agent', 'bd-0001', { files: ['src/New.tsx'] });

    const intents = intentManager.list();
    expect(intents.length).toBe(1);
    expect(intents[0].files).toEqual(['src/New.tsx']);
  });
});

describe('IntentManager — Conflict Detection', () => {
  let originalCwd;
  let tmpDir;
  let intentManager;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/db.js')];
    delete require.cache[require.resolve('../../bin/intent.js')];
    db = require('../../bin/db.js');
    intentManager = require('../../bin/intent.js');
  });

  afterEach(() => {
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/db.js')];
    delete require.cache[require.resolve('../../bin/intent.js')];
  });

  test('detects textual file overlap (HIGH severity)', () => {
    intentManager.publish('fe-agent', 'bd-0001', { files: ['src/shared.ts'] });

    const conflicts = intentManager.checkConflicts('be-agent', 'bd-0002', {
      files: ['src/shared.ts'],
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('textual_file_overlap');
    expect(conflicts[0].severity).toBe('HIGH');
    expect(conflicts[0].peer).toBe('fe-agent');
  });

  test('detects database schema drift (CRITICAL severity)', () => {
    intentManager.publish('be-agent', 'bd-0001', {
      databaseColumns: ['users.email'],
    });

    const conflicts = intentManager.checkConflicts('migration-agent', 'bd-0002', {
      databaseColumns: ['users.email'],
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('database_schema_drift');
    expect(conflicts[0].severity).toBe('CRITICAL');
  });

  test('detects API contract drift (HIGH severity)', () => {
    intentManager.publish('be-agent', 'bd-0001', {
      routes: ['/api/users'],
    });

    const conflicts = intentManager.checkConflicts('fe-agent', 'bd-0002', {
      routes: ['/api/users'],
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('api_contract_drift');
    expect(conflicts[0].severity).toBe('HIGH');
  });

  test('detects CSS style collision (MEDIUM severity)', () => {
    intentManager.publish('fe-agent', 'bd-0001', {
      styles: ['btn-primary'],
    });

    const conflicts = intentManager.checkConflicts('design-agent', 'bd-0002', {
      styles: ['btn-primary'],
    });

    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('css_style_collision');
    expect(conflicts[0].severity).toBe('MEDIUM');
  });

  test('no conflicts when intents are disjoint', () => {
    intentManager.publish('fe-agent', 'bd-0001', {
      files: ['src/A.tsx'],
      routes: ['/api/a'],
    });

    const conflicts = intentManager.checkConflicts('be-agent', 'bd-0002', {
      files: ['src/B.ts'],
      routes: ['/api/b'],
    });

    expect(conflicts.length).toBe(0);
  });

  test('skips self when checking conflicts', () => {
    intentManager.publish('fe-agent', 'bd-0001', {
      files: ['src/shared.ts'],
    });

    // Same agent+task checking its own intent — no conflict
    const conflicts = intentManager.checkConflicts('fe-agent', 'bd-0001', {
      files: ['src/shared.ts'],
    });

    expect(conflicts.length).toBe(0);
  });
});

describe('IntentManager — Clear', () => {
  let originalCwd;
  let tmpDir;
  let intentManager;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/db.js')];
    delete require.cache[require.resolve('../../bin/intent.js')];
    db = require('../../bin/db.js');
    intentManager = require('../../bin/intent.js');
  });

  afterEach(() => {
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/db.js')];
    delete require.cache[require.resolve('../../bin/intent.js')];
  });

  test('clear() removes specific agent+task intent', () => {
    intentManager.publish('fe-agent', 'bd-0001', { files: ['src/A.tsx'] });
    intentManager.publish('be-agent', 'bd-0002', { files: ['src/B.ts'] });

    intentManager.clear('fe-agent', 'bd-0001');

    const intents = intentManager.list();
    expect(intents.length).toBe(1);
    expect(intents[0].agentId).toBe('be-agent');
  });
});
