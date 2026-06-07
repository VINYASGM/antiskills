#!/usr/bin/env node

const path = require('node:path');
const fs = require('node:fs');
const beadsDB = require('./db');

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
          const result = workspace.commit();
          console.log(`Applied ${result.applied} patches.`);
        }
      }
      else if (command === 'verify') {
        const verifyEngine = require('./verify');
        if (subcommand === 'check') {
          const [patchFilePath, contractFilePath] = remainingArgs;
          const result = verifyEngine.verifyContract(contractFilePath, patchFilePath);
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
      else if (command === 'visual-review') {
        const visualReview = require('./visual-review');
        await visualReview.run();
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
          modifiedContent = astTransform.updateObjectProperty(originalContent, target, name, params[0]);
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
      else {
        printHelp();
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
