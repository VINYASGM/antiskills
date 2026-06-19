const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

// Helper: create isolated temp dir for each test to avoid cross-test contamination
function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-test-'));
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {}
}

afterEach(() => {
  if (typeof vi !== 'undefined') {
    vi.restoreAllMocks();
  }
});

describe('BeadsDB — Frontmatter Parsing', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];

    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);

    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('parseFrontmatter extracts valid YAML fields', () => {
    const content = `---
id: bd-0001
type: task_state
status: open
title: "Test Bead"
author: human
timestamp: 2026-01-01T00:00:00Z
tags: [cli, test]
dependencies: [bd-0000]
evidence: ""
superseded_by: null
---

This is the description body.`;

    const result = db.parseFrontmatter(content);

    expect(result).not.toBeNull();
    expect(result.id).toBe('bd-0001');
    expect(result.type).toBe('task_state');
    expect(result.status).toBe('open');
    expect(result.title).toBe('Test Bead');
    expect(result.author).toBe('human');
    expect(result.tags).toEqual(['cli', 'test']);
    expect(result.dependencies).toEqual(['bd-0000']);
    expect(result.description).toBe('This is the description body.');
  });

  test('parseFrontmatter returns null for content without frontmatter', () => {
    const result = db.parseFrontmatter('Just some plain text without YAML.');
    expect(result).toBeNull();
  });

  test('parseFrontmatter handles empty body', () => {
    const content = `---
id: bd-0002
type: decision
status: resolved
title: "No Body"
---`;

    const result = db.parseFrontmatter(content);
    expect(result).not.toBeNull();
    expect(result.id).toBe('bd-0002');
    expect(result.description).toBe('');
  });

  test('parseFrontmatter handles empty tag arrays', () => {
    const content = `---
id: bd-0003
type: task_state
status: open
title: "Empty Tags"
tags: []
dependencies: []
---`;

    const result = db.parseFrontmatter(content);
    expect(result.tags).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  test('parseFrontmatter handles null superseded_by', () => {
    const content = `---
id: bd-0004
superseded_by: null
---`;

    const result = db.parseFrontmatter(content);
    expect(result.superseded_by).toBeNull();
  });
});

describe('BeadsDB — Frontmatter Roundtrip', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('stringifyFrontmatter → parseFrontmatter roundtrip preserves data', () => {
    const bead = {
      id: 'bd-0010',
      type: 'task_state',
      status: 'open',
      title: 'Roundtrip Test',
      author: 'agent',
      timestamp: '2026-05-25T10:00:00Z',
      tags: ['test', 'roundtrip'],
      dependencies: ['bd-0001'],
      evidence: '',
      superseded_by: null,
      description: 'Testing roundtrip fidelity.',
    };

    const serialized = db.stringifyFrontmatter(bead);
    const parsed = db.parseFrontmatter(serialized);

    expect(parsed.id).toBe(bead.id);
    expect(parsed.type).toBe(bead.type);
    expect(parsed.status).toBe(bead.status);
    expect(parsed.title).toBe(bead.title);
    expect(parsed.tags).toEqual(bead.tags);
    expect(parsed.dependencies).toEqual(bead.dependencies);
    expect(parsed.description).toBe(bead.description);
  });
});

describe('BeadsDB — CRUD Operations', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('create() writes JSON file and returns UUIDv4 bead ID', () => {
    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Created Bead',
      description: 'Test creation.',
      author: 'test',
      tags: ['unit-test'],
      dependencies: [],
    });

    const beadIdRegex = /^bd-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(beadId).toMatch(beadIdRegex);

    const filePath = path.join(tmpDir, 'memory', 'beads', `${beadId}.json`);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('create() syncs to Map — get() retrieves it', () => {
    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Map Sync Test',
      description: 'Should appear in cache.',
      author: 'test',
      tags: ['sync'],
      dependencies: [],
    });

    const retrieved = db.get(beadId);
    expect(retrieved).not.toBeNull();
    expect(retrieved.title).toBe('Map Sync Test');
    expect(retrieved.tags).toEqual(['sync']);
  });

  test('getAll() returns all beads sorted by ID', () => {
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'First', tags: [], dependencies: [] });
    db.create({ id: 'bd-0002', type: 'task_state', status: 'open', title: 'Second', tags: [], dependencies: [] });
    db.create({ id: 'bd-0003', type: 'task_state', status: 'resolved', title: 'Third', tags: [], dependencies: [] });

    const all = db.getAll();
    expect(all.length).toBe(3);
    expect(all[0].id).toBe('bd-0001');
    expect(all[1].id).toBe('bd-0002');
    expect(all[2].id).toBe('bd-0003');
  });

  test('getNextId() returns UUIDv4 IDs matching regex', () => {
    const beadIdRegex = /^bd-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(db.getNextId()).toMatch(beadIdRegex);
  });

  test('get() returns null for non-existent ID', () => {
    const result = db.get('bd-9999');
    expect(result).toBeNull();
  });
});

describe('BeadsDB — Legacy Migration', () => {
  let originalCwd;
  let tmpDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('migrateLegacy() converts legacy Markdown and json.migrated to Zod JSON', () => {
    const mdContent = `---
id: bd-0001
type: task_state
status: open
title: "Legacy Markdown Bead"
author: human
timestamp: 2026-01-01T00:00:00Z
tags: [legacy, md]
dependencies: []
evidence: ""
superseded_by: null
---

This is legacy md description.`;
    fs.writeFileSync(
      path.join(tmpDir, 'memory', 'beads', 'bd-0001.md'),
      mdContent,
      'utf8'
    );

    const legacyMigrated = {
      id: 'bd-0002',
      type: 'task_state',
      status: 'claimed',
      title: 'Legacy Migrated JSON',
      description: 'From migrated JSON.',
      author: 'system',
      timestamp: '2026-05-25T10:00:00.000Z',
      tags: ['legacy'],
      dependencies: [],
      claimed_by: 'agent',
      claimed_at: '2026-05-25T10:00:00.000Z',
      evidence: null
    };
    fs.writeFileSync(
      path.join(tmpDir, 'memory', 'beads', 'bd-0002.json.migrated'),
      JSON.stringify(legacyMigrated),
      'utf8'
    );

    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    const db = require('../../bin/db.js');

    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0001.md'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0002.json.migrated'))).toBe(false);

    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0001.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0002.json'))).toBe(true);

    const bead1 = db.get('bd-0001');
    expect(bead1).not.toBeNull();
    expect(bead1.title).toBe('Legacy Markdown Bead');

    const bead2 = db.get('bd-0002');
    expect(bead2).not.toBeNull();
    expect(bead2.title).toBe('Legacy Migrated JSON');
    expect(bead2.status).toBe('claimed');
  });
});

describe('BeadsDB — Sync Optimization (Phase 2)', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('sync() tracks file mtimes and skips unchanged files on re-sync', () => {
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'Tracked', tags: [], dependencies: [] });

    expect(db._fileMtimes).toBeDefined();
    expect(db._fileMtimes instanceof Map).toBe(true);
    expect(db._fileMtimes.size).toBeGreaterThan(0);
  });

  test('sync() only re-parses files with changed mtime', () => {
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'A', tags: [], dependencies: [] });
    db.create({ id: 'bd-0002', type: 'task_state', status: 'open', title: 'B', tags: [], dependencies: [] });

    db.sync();
    expect(db._syncStats).toBeDefined();
    expect(db._syncStats.filesScanned).toBe(2);
    expect(db._syncStats.filesSkipped).toBe(2);

    const filePath = path.join(tmpDir, 'memory', 'beads', 'bd-0001.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.title = 'A-modified';
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    db.sync();
    expect(db._syncStats.filesScanned).toBe(2);
    expect(db._syncStats.filesSkipped).toBe(1);
  });

  test('get() uses cached data when sync TTL has not expired', () => {
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'Cached', tags: [], dependencies: [] });

    db.get('bd-0001');
    const firstSyncTime = db._lastSyncTime;

    const result = db.get('bd-0001');
    expect(result.title).toBe('Cached');
    expect(db._lastSyncTime).toBe(firstSyncTime);
  });

  test('getNextId() returns UUIDv4 directly without full sync', () => {
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'X', tags: [], dependencies: [] });

    const syncTimeBefore = db._lastSyncTime;
    const nextId = db.getNextId();
    expect(nextId).toMatch(/^bd-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(db._lastSyncTime).toBe(syncTimeBefore);
  });
});

describe('BeadsDB — File Locking & Concurrency', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('lockfile.lockSync is called with proper arguments and releases lock even on validation failure', () => {
    const lockfile = require('proper-lockfile');
    const lockSpy = vi.spyOn(lockfile, 'lockSync');

    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Locking Test',
      description: 'Verifying lock is called.',
      author: 'test',
      tags: [],
      dependencies: []
    });

    const jsonPath = path.join(tmpDir, 'memory', 'beads', `${beadId}.json`);
    expect(lockSpy).toHaveBeenCalledWith(jsonPath, expect.objectContaining({
      retries: expect.objectContaining({
        retries: 10,
        minTimeout: 50,
        maxTimeout: 100
      })
    }));

    lockSpy.mockClear();

    expect(() => {
      db.create({
        type: 'task_state',
        status: 'invalid-status-to-trigger-zod-error',
        title: 'Validation Error Test'
      });
    }).toThrow();

    expect(lockSpy).toHaveBeenCalled();
  });

  test('concurrent writes do not corrupt the file and serialize correctly', async () => {
    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Initial',
      description: 'First title',
      author: 'test',
      tags: [],
      dependencies: []
    });

    const lockfile = require('proper-lockfile');
    const originalLockSync = lockfile.lockSync;

    let activeLocks = 0;
    let maxConcurrentLocks = 0;

    vi.spyOn(lockfile, 'lockSync').mockImplementation((file, options) => {
      activeLocks++;
      if (activeLocks > maxConcurrentLocks) {
        maxConcurrentLocks = activeLocks;
      }
      const release = originalLockSync(file, options);
      return () => {
        activeLocks--;
        release();
      };
    });

    db._writeToJSON(beadId, { title: 'Update 1' });
    db._writeToJSON(beadId, { title: 'Update 2' });

    expect(maxConcurrentLocks).toBe(1);
    expect(activeLocks).toBe(0);

    const updated = db.get(beadId);
    expect(updated.title).toBe('Update 2');
  });

  test('lockSync retries and eventually throws ELOCKED if lock remains held', () => {
    const lockfile = require('proper-lockfile');
    
    const beadId = 'bd-0001';
    const jsonPath = path.join(tmpDir, 'memory', 'beads', `${beadId}.json`);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, '{}', 'utf8');

    const manualRelease = lockfile.lockSync(jsonPath);

    const startTime = Date.now();
    let error;
    try {
      db._writeToJSON(beadId, { title: 'Should Fail' });
    } catch (e) {
      error = e;
    } finally {
      manualRelease();
    }

    const duration = Date.now() - startTime;

    expect(error).toBeDefined();
    expect(error.code).toBe('ELOCKED');
    expect(duration).toBeGreaterThanOrEqual(450);
  });
});

describe('BeadsDB — UUIDv4 Concurrency & Observability Logs', () => {
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    db = require('../../bin/db.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('concurrent creations do not collide', () => {
    const generatedIds = new Set();
    const count = 100;
    for (let i = 0; i < count; i++) {
      const id = db.create({
        type: 'task_state',
        status: 'open',
        title: `Concurrent Bead ${i}`,
        author: 'agent'
      });
      expect(generatedIds.has(id)).toBe(false);
      generatedIds.add(id);
    }
    expect(generatedIds.size).toBe(count);
  });

  test('observability logs are outputted to logs/agent-audit.jsonl on state changes', () => {
    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Audit Logged Bead',
      description: 'Audit test description.',
      author: 'agent-1'
    });

    db.claim(beadId, 'agent-1');
    db.start(beadId, 'agent-1');
    db.complete(beadId, 'agent-1', 'resolved successfully');

    const logPath = path.join(tmpDir, 'logs', 'agent-audit.jsonl');
    expect(fs.existsSync(logPath)).toBe(true);

    const logContent = fs.readFileSync(logPath, 'utf8').trim().split('\n');
    expect(logContent.length).toBeGreaterThanOrEqual(4);

    const entries = logContent.map(line => JSON.parse(line));
    
    // Check create entry
    const createEntry = entries.find(e => e.action_type === 'create');
    expect(createEntry).toBeDefined();
    expect(createEntry.agent_id).toBe('agent-1');
    expect(createEntry.bead_id).toBe(beadId);
    expect(createEntry.token_count).toBe(Math.round('Audit test description.'.length / 4));
    expect(typeof createEntry.input_hash).toBe('string');

    // Check claim entry
    const claimEntry = entries.find(e => e.action_type === 'claim');
    expect(claimEntry).toBeDefined();
    expect(claimEntry.agent_id).toBe('agent-1');
    expect(claimEntry.bead_id).toBe(beadId);
    expect(claimEntry.input_hash).toBeNull();
    expect(claimEntry.token_count).toBe(0);

    // Check complete entry
    const completeEntry = entries.find(e => e.action_type === 'complete');
    expect(completeEntry).toBeDefined();
    expect(completeEntry.agent_id).toBe('agent-1');
    expect(completeEntry.bead_id).toBe(beadId);
    expect(completeEntry.token_count).toBe(Math.round('resolved successfully'.length / 4));
    expect(typeof completeEntry.input_hash).toBe('string');
  });
});
