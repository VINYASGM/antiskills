const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * BeadsDB Tests
 * Tests the SQLite-backed memory system: frontmatter parsing, bead CRUD, sync, migration.
 */

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

// We can't import db.js directly because it's a singleton that binds to process.cwd().
// Instead, test the class methods by requiring the module fresh in a controlled cwd.
// For unit tests, we'll extract parseFrontmatter/stringifyFrontmatter logic inline.

describe('BeadsDB — Frontmatter Parsing', () => {
  // Test parseFrontmatter by instantiating a fresh DB in a temp dir
  let originalCwd;
  let tmpDir;
  let db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    // Clear require cache to get fresh singleton
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    // Also clear intent.js cache since it imports db.js
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];

    db = require('../../bin/db.js');
  });

  afterEach(() => {
    // Close the database connection
    if (db && db.db) {
      try { db.db.close(); } catch (e) {}
    }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);

    // Clean require cache again
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
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
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
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('create() writes Markdown file and returns bead ID', () => {
    const beadId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Created Bead',
      description: 'Test creation.',
      author: 'test',
      tags: ['unit-test'],
      dependencies: [],
    });

    expect(beadId).toBe('bd-0001');

    const filePath = path.join(tmpDir, 'memory', 'beads', 'bd-0001.md');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('create() syncs to SQLite — get() retrieves it', () => {
    db.create({
      type: 'task_state',
      status: 'open',
      title: 'SQLite Sync Test',
      description: 'Should appear in DB.',
      author: 'test',
      tags: ['sync'],
      dependencies: [],
    });

    const retrieved = db.get('bd-0001');
    expect(retrieved).not.toBeNull();
    expect(retrieved.title).toBe('SQLite Sync Test');
    expect(retrieved.tags).toEqual(['sync']);
  });

  test('getAll() returns all beads sorted by ID', () => {
    db.create({ type: 'task_state', status: 'open', title: 'First', tags: [], dependencies: [] });
    db.create({ type: 'task_state', status: 'open', title: 'Second', tags: [], dependencies: [] });
    db.create({ type: 'task_state', status: 'done', title: 'Third', tags: [], dependencies: [] });

    const all = db.getAll();
    expect(all.length).toBe(3);
    expect(all[0].id).toBe('bd-0001');
    expect(all[1].id).toBe('bd-0002');
    expect(all[2].id).toBe('bd-0003');
  });

  test('getNextId() returns sequential IDs', () => {
    expect(db.getNextId()).toBe('bd-0001');

    db.create({ type: 'task_state', status: 'open', title: 'A', tags: [], dependencies: [] });
    // After creation, next should be bd-0002
    const next = db.getNextId();
    expect(next).toBe('bd-0002');
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

  test('migrateLegacy() converts JSON bead to Markdown', () => {
    // Write a legacy JSON bead
    const legacyBead = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Legacy Bead',
      description: 'From JSON.',
      tags: ['legacy'],
      dependencies: [],
    };
    fs.writeFileSync(
      path.join(tmpDir, 'memory', 'beads', 'bd-0001.json'),
      JSON.stringify(legacyBead),
    );

    // Initialize DB (triggers migrateLegacy in constructor)
    process.chdir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const intentPath = path.join(path.dirname(dbPath), 'intent.js');
    if (require.cache[intentPath]) delete require.cache[intentPath];
    const db = require('../../bin/db.js');

    // JSON should be renamed to .migrated
    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0001.json.migrated'))).toBe(true);
    // Markdown should exist
    expect(fs.existsSync(path.join(tmpDir, 'memory', 'beads', 'bd-0001.md'))).toBe(true);
    // Should be queryable
    const bead = db.get('bd-0001');
    expect(bead).not.toBeNull();
    expect(bead.title).toBe('Legacy Bead');

    if (db && db.db) { try { db.db.close(); } catch (e) {} }
  });
});

// ──────────────────────────────────────────────
// Phase 2: Dirty-flag sync optimization tests
// ──────────────────────────────────────────────

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
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('sync() tracks file mtimes and skips unchanged files on re-sync', () => {
    // Create a bead
    db.create({ type: 'task_state', status: 'open', title: 'Tracked', tags: [], dependencies: [] });

    // db should expose _fileHashes or _fileMtimes map
    expect(db._fileMtimes).toBeDefined();
    expect(db._fileMtimes instanceof Map).toBe(true);
    expect(db._fileMtimes.size).toBeGreaterThan(0);
  });

  test('sync() only re-parses files with changed mtime', () => {
    db.create({ type: 'task_state', status: 'open', title: 'A', tags: [], dependencies: [] });
    db.create({ type: 'task_state', status: 'open', title: 'B', tags: [], dependencies: [] });

    // Track sync count via _syncStats
    db.sync();
    expect(db._syncStats).toBeDefined();
    expect(db._syncStats.filesScanned).toBe(2);
    expect(db._syncStats.filesSkipped).toBe(2); // Both unchanged since last sync

    // Modify one file
    const filePath = path.join(tmpDir, 'memory', 'beads', 'bd-0001.md');
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, content.replace('title: "A"', 'title: "A-modified"'));

    db.sync();
    expect(db._syncStats.filesScanned).toBe(2);
    expect(db._syncStats.filesSkipped).toBe(1); // Only bd-0002 skipped
  });

  test('get() uses cached data when sync TTL has not expired', () => {
    db.create({ type: 'task_state', status: 'open', title: 'Cached', tags: [], dependencies: [] });

    // First get() triggers sync
    db.get('bd-0001');
    const firstSyncTime = db._lastSyncTime;

    // Second get() within TTL should NOT re-sync
    const result = db.get('bd-0001');
    expect(result.title).toBe('Cached');
    expect(db._lastSyncTime).toBe(firstSyncTime); // Same sync time = no re-sync
  });

  test('getNextId() queries SQLite directly without full sync', () => {
    db.create({ type: 'task_state', status: 'open', title: 'X', tags: [], dependencies: [] });

    const syncTimeBefore = db._lastSyncTime;
    const nextId = db.getNextId();
    expect(nextId).toBe('bd-0002');
    // getNextId should NOT trigger a new sync
    expect(db._lastSyncTime).toBe(syncTimeBefore);
  });
});
