const fs = require('node:fs');
const path = require('node:path');
const beadsDB = require('./db.js');
const eventBus = require('./event_bus.js');

function evaluateBeads() {
  let changed = true;
  let iterations = 0;
  // Limit iterations to prevent any infinite loops
  while (changed && iterations < 100) {
    changed = false;
    iterations++;
    const beads = beadsDB.getAll();

    for (const bead of beads) {
      if (bead.status === 'open' || bead.status === 'failed') {
        const deps = bead.dependencies || [];
        let hasFailedDep = false;
        let allDepsResolved = true;

        for (const depId of deps) {
          const depBead = beads.find(b => b.id === depId);
          if (!depBead) {
            allDepsResolved = false;
            continue;
          }
          if (depBead.status === 'failed') {
            hasFailedDep = true;
          }
          if (depBead.status !== 'resolved') {
            allDepsResolved = false;
          }
        }

        if (hasFailedDep) {
          if (bead.status !== 'failed') {
            console.log(`[Daemon] Cascading failure to bead ${bead.id} due to failed parent dependency`);
            const claimed = beadsDB.claim(bead.id, 'daemon');
            if (claimed) {
              beadsDB.fail(bead.id, 'daemon', 'Parent dependency failed');
              changed = true;
            }
          }
        } else if (allDepsResolved) {
          const { routeTask } = require('./router.js');
          const description = bead.description || bead.title;
          const route = routeTask(description);
          const primaryRole = route.roles && route.roles[0];
          if (primaryRole) {
            console.log(`[Daemon] Routing and allocating bead ${bead.id} to role ${primaryRole}`);
            const claimed = beadsDB.claim(bead.id, primaryRole);
            if (claimed) {
              beadsDB.start(bead.id, primaryRole);
              eventBus.publish('task_allocated', primaryRole, {
                beadId: bead.id,
                role: primaryRole,
                roles: route.roles
              });
              changed = true;
            }
          }
        }
      }
    }
  }
}

function startupSweep() {
  console.log('[Daemon] Running startup recovery sweep...');
  beadsDB.sync();
  const beads = beadsDB.getAll();
  
  for (const bead of beads) {
    if (bead.status === 'claimed' || bead.status === 'in_progress') {
      console.log(`[Daemon] Force-releasing stale bead ${bead.id} (status: ${bead.status})`);
      beadsDB.release(bead.id, null, true);
    }
  }

  evaluateBeads();
}

function tick() {
  beadsDB.sync();

  eventBus.subscribe('bead_created', (payload, sender) => {
    console.log(`[Daemon] Event bead_created received:`, payload);
  });

  eventBus.subscribe('bead_resolved', (payload, sender) => {
    console.log(`[Daemon] Event bead_resolved received:`, payload);
  });

  eventBus.subscribe('bead_failed', (payload, sender) => {
    console.log(`[Daemon] Event bead_failed received:`, payload);
  });

  eventBus.subscribe('bead_status_changed', (payload, sender) => {
    console.log(`[Daemon] Event bead_status_changed received:`, payload);
  });

  eventBus.subscribe('task_allocated', (payload, sender) => {
    console.log(`[Daemon] Event task_allocated received:`, payload);
  });

  evaluateBeads();
}

function startDaemon() {
  const agentDir = path.join(process.cwd(), '.agent');
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }



  const pidPath = path.join(agentDir, 'daemon.pid');
  if (process.env.VEYRA_DAEMON_BACKGROUND === 'true') {
    const logPath = path.join(agentDir, 'daemon.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    const logger = new console.Console(logStream, logStream);
    global.console = logger;
  }
  fs.writeFileSync(pidPath, process.pid.toString(), 'utf8');

  console.log(`[Daemon] Daemon started with PID ${process.pid}`);

  const cleanup = () => {
    try {
      if (fs.existsSync(pidPath)) {
        const currentPid = fs.readFileSync(pidPath, 'utf8').trim();
        if (currentPid === process.pid.toString()) {
          fs.unlinkSync(pidPath);
        }
      }
    } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });

  startupSweep();

  const interval = setInterval(() => {
    try {
      tick();
    } catch (err) {
      console.error('[Daemon] Error in polling loop tick:', err);
    }
  }, 500);

  return () => {
    clearInterval(interval);
    cleanup();
  };
}

if (require.main === module) {
  startDaemon();
}

module.exports = {
  startDaemon,
  startupSweep,
  evaluateBeads,
  tick
};
