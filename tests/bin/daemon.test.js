const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execSync } = require('node:child_process');

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-daemon-test-'));
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.agent'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

function freshModules(tmpDir) {
  const dbPath = require.resolve('../../bin/db.js');
  const eventBusPath = require.resolve('../../bin/event_bus.js');
  const daemonPath = require.resolve('../../bin/daemon.js');
  const routerPath = require.resolve('../../bin/router.js');

  delete require.cache[dbPath];
  delete require.cache[eventBusPath];
  delete require.cache[daemonPath];
  delete require.cache[routerPath];

  const db = require('../../bin/db.js');
  const eventBus = require('../../bin/event_bus.js');
  const daemon = require('../../bin/daemon.js');

  return { db, eventBus, daemon };
}

describe('Daemon Swarm — Event Publishing', () => {
  let originalCwd, tmpDir, db, eventBus;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const mods = freshModules(tmpDir);
    db = mods.db;
    eventBus = mods.eventBus;
  });

  afterEach(() => {
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
  });

  test('db operations publish expected events to the event bus', () => {
    // 1. Create bead
    const beadId = db.create({
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Test Bead',
      description: 'Test Description',
      author: 'tester',
      tags: [],
      dependencies: []
    });
    expect(beadId).toBe('bd-0001');

    let events = eventBus.listEvents();
    expect(events.length).toBe(1);
    expect(events[0].topic).toBe('bead_created');
    expect(events[0].payload.beadId).toBe('bd-0001');

    // 2. Claim bead
    const claimOk = db.claim('bd-0001', 'agent-1');
    expect(claimOk).toBe(true);

    events = eventBus.listEvents();
    expect(events.length).toBe(2);
    expect(events[0].topic).toBe('bead_status_changed');
    expect(events[0].payload.newStatus).toBe('claimed');

    // 3. Start bead
    const startOk = db.start('bd-0001', 'agent-1');
    expect(startOk).toBe(true);

    events = eventBus.listEvents();
    expect(events.length).toBe(3);
    expect(events[0].topic).toBe('bead_status_changed');
    expect(events[0].payload.newStatus).toBe('in_progress');

    // 4. Complete bead
    const completeOk = db.complete('bd-0001', 'agent-1', 'done');
    expect(completeOk).toBe(true);

    events = eventBus.listEvents();
    // Complete publishes bead_status_changed and bead_resolved
    expect(events.length).toBe(5);
    expect(events[1].topic).toBe('bead_status_changed');
    expect(events[1].payload.newStatus).toBe('resolved');
    expect(events[0].topic).toBe('bead_resolved');
    expect(events[0].payload.evidence).toBe('done');
  });

  test('db.fail() publishes fail events', () => {
    db.create({
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Fail Bead',
      author: 'tester',
      tags: [],
      dependencies: []
    });
    db.claim('bd-0001', 'agent-1');
    db.start('bd-0001', 'agent-1');

    const failOk = db.fail('bd-0001', 'agent-1', 'broken');
    expect(failOk).toBe(true);

    const events = eventBus.listEvents();
    expect(events.length).toBe(5); // created, status claimed, status in_progress, status failed, failed
    expect(events[1].topic).toBe('bead_status_changed');
    expect(events[1].payload.newStatus).toBe('failed');
    expect(events[0].topic).toBe('bead_failed');
    expect(events[0].payload.reason).toBe('broken');
  });
});

describe('Daemon Swarm — Polling Loop and Dependency Resolution', () => {
  let originalCwd, tmpDir, db, eventBus, daemon;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    const mods = freshModules(tmpDir);
    db = mods.db;
    eventBus = mods.eventBus;
    daemon = mods.daemon;
  });

  afterEach(() => {
    if (db && db.db) { try { db.db.close(); } catch (e) {} }
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
  });

  test('polling tick subscribes to events and processes them to completed', () => {
    db.create({ type: 'task_state', status: 'open', title: 'Task 1', tags: [], dependencies: [] });
    
    // There should be a pending event
    let events = eventBus.listEvents();
    expect(events.some(e => e.status === 'pending')).toBe(true);

    // Run daemon ticks to process both the initial and the triggered allocation events
    daemon.tick();
    daemon.tick();

    // The events should now be completed
    events = eventBus.listEvents();
    expect(events.every(e => e.status === 'completed')).toBe(true);
  });

  test('dependency resolution routes and allocates task only when dependencies resolved', () => {
    // Parent task
    const parentId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Parent Task',
      tags: [],
      dependencies: []
    });
    // Dependent child task
    const childId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Dependent Task',
      tags: [],
      dependencies: [parentId]
    });

    // Run tick - parent should be routed immediately since it has no dependencies.
    // Child should remain open.
    daemon.tick();

    expect(db.get(parentId).status).toBe('in_progress');
    expect(db.get(childId).status).toBe('open');

    // Complete parent task
    db.complete(parentId, db.get(parentId).claimed_by, 'parent done');

    // Run tick - child should now be routed because parent is resolved.
    daemon.tick();

    expect(db.get(parentId).status).toBe('resolved');
    expect(db.get(childId).status).toBe('in_progress');
  });

  test('cascading failure propagates parent failure to child', () => {
    const parentId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Parent Task',
      tags: [],
      dependencies: []
    });
    const childId = db.create({
      type: 'task_state',
      status: 'open',
      title: 'Dependent Task',
      tags: [],
      dependencies: [parentId]
    });

    // Run tick to allocate parent
    daemon.tick();
    expect(db.get(parentId).status).toBe('in_progress');

    // Fail the parent
    db.fail(parentId, db.get(parentId).claimed_by, 'parent crashed');
    expect(db.get(parentId).status).toBe('failed');

    // Run tick to cascade the failure to child
    daemon.tick();
    expect(db.get(childId).status).toBe('failed');

    // Verify cascade publishes the correct failed events
    const events = eventBus.listEvents();
    const childFailedEvent = events.find(e => e.topic === 'bead_failed' && e.payload.beadId === childId);
    expect(childFailedEvent).toBeDefined();
    expect(childFailedEvent.payload.reason).toBe('Parent dependency failed');
  });
});

describe('Daemon Swarm — Process Operations CLI', () => {
  let originalCwd, tmpDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
  });

  test('CLI daemon start, status, and stop operations work successfully', () => {
    const cliPath = path.resolve(originalCwd, 'bin/veyra.js');

    // 1. Initial status should be Stopped
    let statusOut = execSync(`node "${cliPath}" daemon status`, { encoding: 'utf8' }).trim();
    expect(statusOut).toBe('Stopped');

    // 2. Start daemon in background
    execSync(`node "${cliPath}" daemon start --background`, { encoding: 'utf8' });

    // Wait a brief moment for it to spawn and write PID
    let pidFile = path.join(tmpDir, '.agent', 'daemon.pid');
    let attempts = 0;
    while (!fs.existsSync(pidFile) && attempts < 10) {
      execSync('node -e "setTimeout(() => {}, 200)"');
      attempts++;
    }

    expect(fs.existsSync(pidFile)).toBe(true);

    // 3. Status should now be Running
    statusOut = execSync(`node "${cliPath}" daemon status`, { encoding: 'utf8' }).trim();
    expect(statusOut).toContain('Running');

    // 4. Stop daemon
    const stopOut = execSync(`node "${cliPath}" daemon stop`, { encoding: 'utf8' }).trim();
    expect(stopOut).toContain('stopped');

    // 5. Status should be Stopped again
    statusOut = execSync(`node "${cliPath}" daemon status`, { encoding: 'utf8' }).trim();
    expect(statusOut).toBe('Stopped');

    // 6. PID file should be cleaned up
    expect(fs.existsSync(pidFile)).toBe(false);
  });
});
