const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * Task Queue Discipline Tests
 * Tests claim/release/start/complete/fail/reopen with optimistic locking.
 */

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-queue-'));
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

function freshDB(tmpDir) {
  const dbPath = require.resolve('../../bin/db.js');
  delete require.cache[dbPath];
  const intentPath = path.join(path.dirname(dbPath), 'intent.js');
  if (require.cache[intentPath]) delete require.cache[intentPath];
  return require('../../bin/db.js');
}

describe('Task Queue — Claim/Release', () => {
  let originalCwd, tmpDir, db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    db = freshDB(tmpDir);
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'Queue Target', tags: [], dependencies: [] });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('claim() succeeds on open bead', () => {
    const ok = db.claim('bd-0001', 'agent-1');
    expect(ok).toBe(true);
    const bead = db.get('bd-0001');
    expect(bead.status).toBe('claimed');
    expect(bead.claimed_by).toBe('agent-1');
    expect(bead.claimed_at).toBeTruthy();
  });

  test('claim() fails when different agent tries to claim', () => {
    db.claim('bd-0001', 'agent-1');
    const ok = db.claim('bd-0001', 'agent-2');
    expect(ok).toBe(false);
    const bead = db.get('bd-0001');
    expect(bead.claimed_by).toBe('agent-1');
  });

  test('release() clears claim and sets status to open', () => {
    db.claim('bd-0001', 'agent-1');
    const ok = db.release('bd-0001', 'agent-1');
    expect(ok).toBe(true);
    const bead = db.get('bd-0001');
    expect(bead.status).toBe('open');
    expect(bead.claimed_by).toBeNull();
  });

  test('release() fails for non-owning agent', () => {
    db.claim('bd-0001', 'agent-1');
    const ok = db.release('bd-0001', 'agent-2');
    expect(ok).toBe(false);
    expect(db.get('bd-0001').claimed_by).toBe('agent-1');
  });
});

describe('Task Queue — State Transitions', () => {
  let originalCwd, tmpDir, db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    db = freshDB(tmpDir);
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'Transition Target', tags: [], dependencies: [] });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('start() transitions claimed → in_progress', () => {
    db.claim('bd-0001', 'agent-1');
    const ok = db.start('bd-0001', 'agent-1');
    expect(ok).toBe(true);
    expect(db.get('bd-0001').status).toBe('in_progress');
  });

  test('complete() transitions in_progress → resolved, clears claim', () => {
    db.claim('bd-0001', 'agent-1');
    db.start('bd-0001', 'agent-1');
    const ok = db.complete('bd-0001', 'agent-1', 'tests pass');
    expect(ok).toBe(true);
    const bead = db.get('bd-0001');
    expect(bead.status).toBe('resolved');
    expect(bead.claimed_by).toBeNull();
    expect(bead.evidence).toBe('tests pass');
  });

  test('complete() writes status to JSON file', () => {
    db.claim('bd-0001', 'agent-1');
    db.start('bd-0001', 'agent-1');
    db.complete('bd-0001', 'agent-1', 'success');

    const jsonPath = path.join(tmpDir, 'memory', 'beads', 'bd-0001.json');
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(content.status).toBe('resolved');
  });

  test('fail() transitions → failed, clears claim', () => {
    db.claim('bd-0001', 'agent-1');
    db.start('bd-0001', 'agent-1');
    const ok = db.fail('bd-0001', 'agent-1', 'compile error');
    expect(ok).toBe(true);
    const bead = db.get('bd-0001');
    expect(bead.status).toBe('failed');
    expect(bead.claimed_by).toBeNull();
    expect(bead.evidence).toBe('compile error');
  });

  test('reopen() transitions resolved → open', () => {
    db.claim('bd-0001', 'agent-1');
    db.start('bd-0001', 'agent-1');
    db.complete('bd-0001', 'agent-1');
    const ok = db.reopen('bd-0001');
    expect(ok).toBe(true);
    expect(db.get('bd-0001').status).toBe('open');
  });

  test('claim() works on failed bead (retry)', () => {
    db.claim('bd-0001', 'agent-1');
    db.fail('bd-0001', 'agent-1', 'oops');
    const ok = db.claim('bd-0001', 'agent-2');
    expect(ok).toBe(true);
    expect(db.get('bd-0001').claimed_by).toBe('agent-2');
  });
});

describe('Task Queue — Stale Claim Expiry', () => {
  let originalCwd, tmpDir, db;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    db = freshDB(tmpDir);
    db.create({ id: 'bd-0001', type: 'task_state', status: 'open', title: 'Stale Target', tags: [], dependencies: [] });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
  });

  test('stale claims are expired on next claim() call', () => {
    db.claim('bd-0001', 'agent-1');
    const staleTime = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    db._writeToJSON('bd-0001', { claimed_at: staleTime });

    db.create({ id: 'bd-0002', type: 'task_state', status: 'open', title: 'Second', tags: [], dependencies: [] });
    db.claim('bd-0002', 'agent-2');

    const bead = db.get('bd-0001');
    expect(bead.status).toBe('open');
    expect(bead.claimed_by).toBeNull();
  });
});
