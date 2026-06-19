#!/usr/bin/env node

const path = require('node:path');
const fs = require('node:fs');
const beadsDB = require('./db');

try {
  fs.appendFileSync(path.join(process.cwd(), '.agent', 'argv.log'), JSON.stringify(process.argv) + '\n', 'utf8');
} catch (e) {}

// Zero-dependency argument parser
const args = process.argv.slice(2);
if (args.length === 0) {
  printHelp();
  process.exit(0);
}

const command = args[0];
const subcommand = args[1];
const remainingArgs = args.slice(2);

// JIT Synchronize memory whenever CLI runs
beadsDB.sync();

function printHelp() {
  console.log(`Veyra OS CLI
Usage: node bin/veyra.js <command> [subcommand] [options]

Core Commands:
  bead create <title> [--desc <desc>] [--tags <tags>] [--deps <deps>]
  bead list
  bead update <id> <key=value...>
  worktree add <name>
  worktree remove <name>
  status                     Display live task progress
  dashboard | ui dashboard   Display swarm status, database locks, and active channels
  daemon start [--background]
  daemon stop
  daemon status
  daemon run
  mcp                        Run Model Context Protocol (MCP) server
`);
}

// Option parser helper
function parseOptions(argsList) {
  const options = {};
  const positional = [];
  const updates = {};

  for (let i = 0; i < argsList.length; i++) {
    const arg = argsList[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = argsList[i + 1];
      if (val && !val.startsWith('--')) {
        options[key] = val;
        i++;
      } else {
        options[key] = true;
      }
    } else if (arg.includes('=')) {
      const idx = arg.indexOf('=');
      const k = arg.slice(0, idx).trim();
      let v = arg.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      updates[k] = v;
    } else {
      positional.push(arg);
    }
  }
  return { options, positional, updates };
}

(async () => {
  try {
    if (command === 'bead') {
      if (subcommand === 'create') {
        const { options, positional } = parseOptions(remainingArgs);
        const title = positional.join(' ') || 'Untitled Task';
        
        let tags = [];
        if (options.tags) {
          tags = String(options.tags).split(',').map(s => s.trim()).filter(Boolean);
        }
        let dependencies = [];
        if (options.deps || options.dependencies) {
          dependencies = String(options.deps || options.dependencies).split(',').map(s => s.trim()).filter(Boolean);
        }
        const description = options.desc || options.description || '';

        const newId = beadsDB.create({
          type: 'task_state',
          status: 'open',
          title: title,
          description: description,
          author: 'system',
          timestamp: new Date().toISOString(),
          tags: tags,
          dependencies: dependencies
        });
        console.log(`Created bead ${newId}.`);
      } 
      else if (subcommand === 'list') {
        const beads = beadsDB.getAll();
        for (const bead of beads) {
          const claimedBy = bead.claimed_by || 'none';
          console.log(`${bead.id} | ${bead.status} | ${claimedBy} | ${bead.title}`);
        }
      } 
      else if (subcommand === 'update') {
        if (remainingArgs.length === 0) {
          console.error('Usage: bead update <id> [key=value...]');
          process.exit(1);
        }
        const { options, positional, updates } = parseOptions(remainingArgs);
        const id = positional[0];
        if (!id) {
          console.error('Missing bead ID.');
          process.exit(1);
        }

        const normalizedUpdates = {};
        const allUpdates = { ...updates, ...options };

        if (allUpdates.status !== undefined) normalizedUpdates.status = allUpdates.status;
        if (allUpdates.title !== undefined) normalizedUpdates.title = allUpdates.title;
        if (allUpdates.description !== undefined) normalizedUpdates.description = allUpdates.description;
        if (allUpdates.desc !== undefined) normalizedUpdates.description = allUpdates.desc;
        if (allUpdates.tags !== undefined) {
          normalizedUpdates.tags = String(allUpdates.tags).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (allUpdates.deps !== undefined) {
          normalizedUpdates.dependencies = String(allUpdates.deps).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (allUpdates.dependencies !== undefined) {
          normalizedUpdates.dependencies = String(allUpdates.dependencies).split(',').map(s => s.trim()).filter(Boolean);
        }
        if (allUpdates.claimed_by !== undefined) normalizedUpdates.claimed_by = allUpdates.claimed_by;
        if (allUpdates.claimed_at !== undefined) normalizedUpdates.claimed_at = allUpdates.claimed_at;
        if (allUpdates.evidence !== undefined) normalizedUpdates.evidence = allUpdates.evidence;

        beadsDB._writeToJSON(id, normalizedUpdates);
        console.log(`Updated bead ${id}.`);
      }
      else if (subcommand === 'get') {
        const id = remainingArgs[0];
        if (!id) return console.log('Missing bead ID.');
        const bead = beadsDB.get(id);
        if (!bead) return console.log(`Bead '${id}' not found.`);
        console.log(`ID: ${bead.id}`);
        console.log(`Status: ${bead.status}`);
        console.log(`Title: ${bead.title}`);
        console.log(`Claimed By: ${bead.claimed_by || 'none'}`);
        if (bead.description) console.log(`Description: ${bead.description}`);
      }
      else if (subcommand === 'claim') {
        const id = remainingArgs[0], agentId = remainingArgs[1];
        if (!id || !agentId) return console.log('Usage: bead claim <id> <agentId>');
        const ok = beadsDB.claim(id, agentId);
        if (ok) console.log(`✔ Bead ${id} claimed by ${agentId}.`);
        else console.log(`✘ Cannot claim ${id}.`);
      }
      else if (subcommand === 'release') {
        const id = remainingArgs[0], agentId = remainingArgs[1];
        if (!id || !agentId) return console.log('Usage: bead release <id> <agentId>');
        const ok = beadsDB.release(id, agentId);
        if (ok) console.log(`✔ Bead ${id} released.`);
        else console.log(`✘ Cannot release ${id}.`);
      }
      else if (subcommand === 'start') {
        const id = remainingArgs[0], agentId = remainingArgs[1];
        if (!id || !agentId) return console.log('Usage: bead start <id> <agentId>');
        const ok = beadsDB.start(id, agentId);
        if (ok) console.log(`✔ Bead ${id} → in_progress.`);
        else console.log(`✘ Cannot start ${id}.`);
      }
      else if (subcommand === 'complete') {
        const id = remainingArgs[0], agentId = remainingArgs[1];
        if (!id || !agentId) return console.log('Usage: bead complete <id> <agentId>');
        const evidence = remainingArgs.slice(2).join(' ') || '';
        const ok = beadsDB.complete(id, agentId, evidence);
        if (ok) console.log(`✔ Bead ${id} → resolved.`);
        else console.log(`✘ Cannot complete ${id}.`);
      }
      else if (subcommand === 'fail') {
        const id = remainingArgs[0], agentId = remainingArgs[1];
        if (!id || !agentId) return console.log('Usage: bead fail <id> <agentId>');
        const reason = remainingArgs.slice(2).join(' ') || '';
        const ok = beadsDB.fail(id, agentId, reason);
        if (ok) console.log(`✔ Bead ${id} → failed.`);
        else console.log(`✘ Cannot fail ${id}.`);
      }
      else if (subcommand === 'reopen') {
        const id = remainingArgs[0];
        if (!id) return console.log('Usage: bead reopen <id>');
        const ok = beadsDB.reopen(id);
        if (ok) console.log(`✔ Bead ${id} → open.`);
        else console.log(`✘ Cannot reopen ${id}.`);
      }
      else {
        printHelp();
      }
    } 
    else if (command === 'status') {
      const { options } = parseOptions(args.slice(1));
      const beads = beadsDB.getAll();
      if (options.json) {
        console.log(JSON.stringify(beads, null, 2));
      } else {
        console.log('\n\x1b[1m\x1b[36m=== Live Active Task Progress ===\x1b[0m\n');
        const colWidths = { id: 10, status: 15, author: 15, claimed: 15, title: 30 };
        const header = `| ${'ID'.padEnd(colWidths.id)} | ${'Status'.padEnd(colWidths.status)} | ${'Author'.padEnd(colWidths.author)} | ${'Claimed By'.padEnd(colWidths.claimed)} | ${'Title'.padEnd(colWidths.title)} |`;
        const separator = `+-${'-'.repeat(colWidths.id)}-+-${'-'.repeat(colWidths.status)}-+-${'-'.repeat(colWidths.author)}-+-${'-'.repeat(colWidths.claimed)}-+-${'-'.repeat(colWidths.title)}-+`;
        
        console.log(separator);
        console.log(header);
        console.log(separator);
        
        for (const bead of beads) {
          let statusColor = '\x1b[0m';
          if (bead.status === 'open') statusColor = '\x1b[32m';
          else if (bead.status === 'claimed') statusColor = '\x1b[33m';
          else if (bead.status === 'in_progress') statusColor = '\x1b[35m';
          else if (bead.status === 'resolved') statusColor = '\x1b[34m';
          else if (bead.status === 'failed') statusColor = '\x1b[31m';
          
          const idStr = bead.id.padEnd(colWidths.id);
          const rawStatus = bead.status || '';
          const paddedStatus = rawStatus.padEnd(colWidths.status);
          const coloredStatus = statusColor + paddedStatus + '\x1b[0m';
          const authorStr = (bead.author || 'system').padEnd(colWidths.author);
          const claimedStr = (bead.claimed_by || 'None').padEnd(colWidths.claimed);
          const titleStr = ((bead.title || '').length > colWidths.title ? (bead.title || '').slice(0, colWidths.title - 3) + '...' : (bead.title || '')).padEnd(colWidths.title);
          
          console.log(`| ${idStr} | ${coloredStatus} | ${authorStr} | ${claimedStr} | ${titleStr} |`);
        }
        console.log(separator + '\n');
      }
    } 
    else if (command === 'worktree') {
      if (subcommand === 'add') {
        const name = remainingArgs[0];
        if (!name) {
          console.error('Usage: worktree add <name>');
          process.exit(1);
        }
        const patchDir = path.join(process.cwd(), 'patches', name);
        if (!fs.existsSync(patchDir)) {
          fs.mkdirSync(patchDir, { recursive: true });
        }
        console.log(`Added worktree ${name}.`);
      } 
      else if (subcommand === 'remove') {
        const name = remainingArgs[0];
        if (!name) {
          console.error('Usage: worktree remove <name>');
          process.exit(1);
        }
        const patchDir = path.join(process.cwd(), 'patches', name);
        if (fs.existsSync(patchDir)) {
          fs.rmSync(patchDir, { recursive: true, force: true });
        }
        console.log(`Removed worktree ${name}.`);
      } 
      else {
        printHelp();
      }
    } 
    else {
      if (command === 'context') {
        const contextAssembler = require('./context');
        if (subcommand === 'assemble') {
          const taskId = remainingArgs[0];
          if (!taskId) return console.log('Missing task ID.');
          const entryFiles = ['./src/index.ts', './src/main.ts', './index.js'].filter(f => fs.existsSync(f));
          if (entryFiles.length === 0) {
            const codeFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
            if (codeFiles.length > 0) entryFiles.push(codeFiles[0]);
          }
          if (entryFiles.length === 0) return console.log('No entry files found.');
          const allFiles = contextAssembler.buildGraph(entryFiles);
          const { ranked } = contextAssembler.rankFiles(allFiles, 15000);
          
          const manifestPath = path.join(process.cwd(), 'context', 'file-manifests', `${taskId}.json`);
          if (!fs.existsSync(path.dirname(manifestPath))) fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
          fs.writeFileSync(manifestPath, JSON.stringify({ task: taskId, timestamp: new Date().toISOString(), budget: 15000, files: ranked }, null, 2), 'utf8');
          console.log(`Saved manifest: context/file-manifests/${taskId}.json`);
        } else if (subcommand === 'index') {
          contextAssembler.generateIndex();
        }
      } 
      else if (command === 'intent') {
        const intentManager = require('./intent');
        if (subcommand === 'publish') {
          const [agentId, taskId, filesStr, colsStr, routesStr, stylesStr] = remainingArgs;
          const files = (filesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const databaseColumns = (colsStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const routes = (routesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const styles = (stylesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          intentManager.publish(agentId, taskId, { files, databaseColumns, routes, styles });
        } else if (subcommand === 'check') {
          const [agentId, taskId, filesStr, colsStr, routesStr, stylesStr] = remainingArgs;
          const files = (filesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const databaseColumns = (colsStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const routes = (routesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const styles = (stylesStr || '').split(',').map(s => s.trim()).filter(Boolean);
          const conflicts = intentManager.checkConflicts(agentId, taskId, { files, databaseColumns, routes, styles });
          console.log(JSON.stringify(conflicts, null, 2));
        } else if (subcommand === 'list') {
          console.log(JSON.stringify(intentManager.list(), null, 2));
        }
      }
      else if (command === 'patch') {
        const patchSystem = require('./patch');
        if (subcommand === 'apply') {
          const patchFile = remainingArgs[0];
          if (!patchFile) return console.log('Missing patch file.');
          const patchContent = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
          const workspace = patchSystem.createWorkspace();
          for (const entry of patchContent) {
            workspace.addPatch(entry.agentId || 'cli', entry.filePath, entry.patch);
          }
          const conflicts = workspace.checkConflicts();
          if (conflicts.hasConflict) {
            console.error('Conflicts detected:', conflicts.details);
            process.exit(1);
          }
          const result = await workspace.commit();
          console.log(`Applied ${result.applied} patches.`);
        }
      }
      else if (command === 'verify') {
        const verifyEngine = require('./verify');
        if (subcommand === 'check') {
          const [patchFilePath, contractFilePath] = remainingArgs;
          const result = await verifyEngine.verifyContract(contractFilePath, patchFilePath);
          if (!result.success) {
            console.error('Verification failed:', result.logs);
            process.exit(1);
          }
          console.log('Verification passed.');
        }
      }
      else if (command === 'governance') {
        const GovernanceSystem = require('./governance');
        const gov = new GovernanceSystem();
        const txId = remainingArgs[0];
        if (subcommand === 'status') {
          console.log(JSON.stringify(gov.getTransaction(txId), null, 2));
        } else if (subcommand === 'reset') {
          gov.resetTransaction(txId);
          console.log(`Reset transaction tx-${txId}`);
        }
      }
      else if (command === 'dashboard' || (command === 'ui' && subcommand === 'dashboard')) {
        const SwarmDashboard = require('./dashboard');
        const dashboard = new SwarmDashboard();
        console.log(dashboard.render());
      }
      else if (command === 'visual-review') {
        const visualReview = require('./visual-review');
        await visualReview.run();
      }
      else if (command === 'mcp') {
        const mcp = require('./veyra-mcp');
        mcp.startServer();
      }
      else if (command === 'lint') {
        const linter = require('./linter');
        linter.lintAll();
      }
      else if (command === 'ast' && subcommand === 'apply') {
        const astTransform = require('./ast_transform');
        const [filePath, action, target, name, ...params] = remainingArgs;
        const originalContent = fs.readFileSync(filePath, 'utf8');
        let modifiedContent = originalContent;
        if (action === 'import') {
          modifiedContent = astTransform.addImport(originalContent, target, name);
        } else if (action === 'method') {
          modifiedContent = astTransform.addMethod(originalContent, target, name, (params[0] || '').split(','), params.slice(1).join(' '));
        } else if (action === 'property') {
          let parsedValue = params[0];
          if (parsedValue !== undefined) {
            try {
              parsedValue = JSON.parse(params[0]);
            } catch (e) {
              // fallback to raw string
            }
          }
          modifiedContent = astTransform.updateObjectProperty(originalContent, target, name, parsedValue);
        } else if (action === 'class') {
          modifiedContent = astTransform.addClass(originalContent, target, name === 'true');
        } else if (action === 'class-decorator') {
          modifiedContent = astTransform.addClassDecorator(originalContent, target, name, params[0] ? JSON.parse(params[0]) : undefined);
        } else if (action === 'class-method') {
          modifiedContent = astTransform.addClassMethod(
            originalContent,
            target,
            name,
            (params[0] || '').split(',').map(s => s.trim()).filter(Boolean),
            params[1] || '',
            params[2] ? JSON.parse(params[2]) : [],
            params[3] ? JSON.parse(params[3]) : []
          );
        } else if (action === 'class-property') {
          modifiedContent = astTransform.addClassProperty(
            originalContent,
            target,
            name,
            params[0],
            params[1] || undefined,
            params[2] ? JSON.parse(params[2]) : [],
            params[3] ? JSON.parse(params[3]) : []
          );
        } else if (action === 'jsx-element') {
          modifiedContent = astTransform.addJsxElement(originalContent, JSON.parse(target), name);
        } else if (action === 'jsx-attribute') {
          modifiedContent = astTransform.updateJsxAttribute(originalContent, JSON.parse(target), name, params[0]);
        } else if (action === 'interface') {
          modifiedContent = astTransform.addInterface(originalContent, target, name ? name.split(',').map(s => s.trim()).filter(Boolean) : []);
        } else if (action === 'interface-property') {
          modifiedContent = astTransform.addInterfaceProperty(originalContent, target, name, params[0] === 'true', params[1]);
        } else if (action === 'type-alias') {
          modifiedContent = astTransform.addTypeAlias(originalContent, target, name);
        }
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log(`Applied AST transform to ${filePath}`);
      }
      else if (command === 'event') {
        const eventBus = require('./event_bus');
        if (subcommand === 'publish') {
          const [topic, sender, payloadStr] = remainingArgs;
          const payload = payloadStr ? JSON.parse(payloadStr) : {};
          eventBus.publish(topic, sender, payload);
        } else if (subcommand === 'list') {
          console.log(JSON.stringify(eventBus.listEvents(remainingArgs[0]), null, 2));
        } else if (subcommand === 'prune') {
          eventBus.clearHistory();
        }
      }
      else if (command === 'daemon') {
        const daemon = require('./daemon');
        const { options } = parseOptions(remainingArgs);

        if (subcommand === 'start') {
          if (options.background) {
            const { spawn } = require('node:child_process');
            const child = spawn(process.execPath, [process.argv[1], 'daemon', 'run'], {
              cwd: process.cwd(),
              detached: true,
              stdio: 'pipe',
              env: {
                ...process.env,
                VEYRA_DAEMON_BACKGROUND: 'true'
              }
            });
            if (child.stdout) child.stdout.unref();
            if (child.stderr) child.stderr.unref();
            child.unref();
            console.log('Daemon started in background.');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            daemon.startDaemon();
          }
        }
        else if (subcommand === 'stop') {
          const pidFile = path.join(process.cwd(), '.agent', 'daemon.pid');
          if (fs.existsSync(pidFile)) {
            const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
            if (pid) {
              try {
                process.kill(pid, 'SIGTERM');
                console.log(`Daemon with PID ${pid} stopped.`);
              } catch (e) {
                if (e.code === 'ESRCH') {
                  console.log(`Daemon process with PID ${pid} not found (already stopped).`);
                } else {
                  console.error(`Error killing daemon: ${e.message}`);
                }
              }
            }
            try { fs.unlinkSync(pidFile); } catch (e) {}
          } else {
            console.log('No active daemon process found.');
          }
        }
        else if (subcommand === 'status') {
          const pidFile = path.join(process.cwd(), '.agent', 'daemon.pid');
          let running = false;
          let pid = null;
          if (fs.existsSync(pidFile)) {
            const pidStr = fs.readFileSync(pidFile, 'utf8').trim();
            pid = parseInt(pidStr, 10);
            if (pid) {
              try {
                process.kill(pid, 0);
                running = true;
              } catch (e) {
                running = (e.code === 'EPERM');
              }
            }
          }
          if (running) {
            console.log(`Running (PID: ${pid})`);
          } else {
            console.log('Stopped');
          }
        }
        else if (subcommand === 'run') {
          daemon.startDaemon();
          // Keep process alive in foreground
          await new Promise(() => {});
        }
        else {
          printHelp();
        }
      }
      else {
        printHelp();
      }
    }
  } catch (err) {
    try {
      fs.writeFileSync(2, `Error: ${err.message}\n${err.stack}\n`, 'utf8');
    } catch (e) {}
    process.exit(1);
  }
})();
