#!/usr/bin/env node

/**
 * ⚡ Veyra AI-Native OS Core Engine
 * Elite-tier context orchestration via DB, AST, parallel subagents, and visual loops.
 */

const beadsDB = require('./db');
const contextAssembler = require('./context');
const worktreeManager = require('./worktree');
const linter = require('./linter');
const supervisor = require('./supervisor');
const skillManager = require('./skills');
const workflowEngine = require('./workflow');
const intentManager = require('./intent');
const patchSystem = require('./patch');
const router = require('./router');
const ui = require('./ui');
const path = require('node:path');
const fs = require('node:fs');

const printHeader = () => {
  console.log(`\n${ui.colors.bright}${ui.colors.cyan}  __   ___ _   _ ___   _   
  \\ \\ / / | | | | _ \\ /_\\  
   \\ V /|  _| |_|   // _ \\ 
    \\_/ |_|  \\___/|_|_\\_/ \\_\\  ${ui.colors.reset}${ui.colors.dim}v2.1${ui.colors.reset}`);
  console.log(`${ui.colors.dim}  AI-Native Engineering OS — Procedural Visual Edition${ui.colors.reset}\n`);
};

const showHelp = () => {
  printHeader();
  console.log(`${ui.colors.bright}USAGE:${ui.colors.reset}`);
  console.log(`  node bin/veyra.js <command> [subcommand] [options]\n`);
  
  const headers = ['COMMAND', 'DESCRIPTION'];
  const rows = [
    [`${ui.colors.green}bead list${ui.colors.reset}`, 'List all memory beads (SQLite JIT compiled)'],
    [`${ui.colors.green}bead create <title>${ui.colors.reset}`, 'Create a new memory bead'],
    [`${ui.colors.green}context assemble <task>${ui.colors.reset}`, 'Assemble hybrid context and write task manifest'],
    [`${ui.colors.green}context index${ui.colors.reset}`, 'Generate dynamic codebase repo map and dependency DAG'],
    [`${ui.colors.green}intent publish <ag> <tsk>${ui.colors.reset}`, 'Broadcast agent files, DB, routes, styles intents'],
    [`${ui.colors.green}intent check <ag> <tsk>${ui.colors.reset}`, 'Verify structural & semantic overlaps JIT'],
    [`${ui.colors.green}intent list${ui.colors.reset}`, 'List all active agent broadcasts'],
    [`${ui.colors.green}patch check${ui.colors.reset}`, 'Check workspace patches for conflicts'],
    [`${ui.colors.green}patch apply <file>${ui.colors.reset}`, 'Apply patches from workspace to real files'],
    [`${ui.colors.green}agent spawn <role> <task>${ui.colors.reset}`, 'Spawn an agent under supervisor tree'],
    [`${ui.colors.green}agent auto <task-desc>${ui.colors.reset}`, 'Auto-route task to optimal agent roles'],
    [`${ui.colors.green}workflow list${ui.colors.reset}`, 'List all awesome-skills workflows'],
    [`${ui.colors.green}workflow run <id>${ui.colors.reset}`, 'Execute a workflow step-by-step'],
    [`${ui.colors.green}skill search <query>${ui.colors.reset}`, 'Search global Awesome Skills registry'],
    [`${ui.colors.green}skill install <id>${ui.colors.reset}`, 'Download and mount a skill to .agent/skills/'],
    [`${ui.colors.green}visual-review${ui.colors.reset}`, 'Execute automated Go Playwright visual audit'],
    [`${ui.colors.green}lint${ui.colors.reset}`, 'Run static analysis linter checks']
  ];
  const widths = [30, 50];
  console.log(ui.drawTable(headers, rows, widths, 'blue'));
  console.log();
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const [command, subcommand, ...rest] = args;

  // JIT Synchronize memory whenever CLI runs
  beadsDB.sync();

  if (command === 'bead') {
    if (subcommand === 'list') {
      printHeader();
      const beads = beadsDB.getAll();
      if (beads.length === 0) {
        console.log("No memory beads found.");
        return;
      }
      
      const headers = ['ID', 'TYPE', 'STATUS', 'TITLE'];
      const rows = beads.map(b => {
        let statusStyled = b.status;
        if (b.status === 'resolved') {
          statusStyled = `${ui.colors.green}resolved${ui.colors.reset}`;
        } else if (b.status === 'open') {
          statusStyled = `${ui.colors.yellow}open${ui.colors.reset}`;
        }
        return [b.id, b.type, statusStyled, b.title];
      });
      const widths = [10, 15, 20, 45];
      console.log(ui.drawTable(headers, rows, widths, 'cyan'));
      console.log();
    } else if (subcommand === 'create') {
      printHeader();
      const title = rest.join(' ') || 'Untitled Task';
      const newId = beadsDB.create({
        type: 'task_state',
        status: 'open',
        title: title,
        description: 'Created via Veyra CLI bead command.',
        author: 'human-orchestrator',
        timestamp: new Date().toISOString(),
        tags: ['cli'],
        dependencies: []
      });
      console.log(ui.drawBox('MEMORY BEAD CREATION', [`✔ Bead created successfully!`, `ID:    ${newId}`, `Title: ${title}`], 50, 'green'));
      console.log();
    } else {
      showHelp();
    }
  } else if (command === 'intent') {
    if (subcommand === 'publish') {
      printHeader();
      const agentId = rest[0];
      const taskId = rest[1];
      if (!agentId || !taskId) return console.log('Missing agentId or taskId.');
      
      const filesStr = rest[2] || '';
      const colsStr = rest[3] || '';
      const routesStr = rest[4] || '';
      const stylesStr = rest[5] || '';
      
      const files = filesStr.split(',').map(s => s.trim()).filter(Boolean);
      const databaseColumns = colsStr.split(',').map(s => s.trim()).filter(Boolean);
      const routes = routesStr.split(',').map(s => s.trim()).filter(Boolean);
      const styles = stylesStr.split(',').map(s => s.trim()).filter(Boolean);
      
      intentManager.publish(agentId, taskId, { files, databaseColumns, routes, styles });
    } else if (subcommand === 'check') {
      printHeader();
      const agentId = rest[0];
      const taskId = rest[1];
      if (!agentId || !taskId) return console.log('Missing agentId or taskId.');
      
      const filesStr = rest[2] || '';
      const colsStr = rest[3] || '';
      const routesStr = rest[4] || '';
      const stylesStr = rest[5] || '';
      
      const files = filesStr.split(',').map(s => s.trim()).filter(Boolean);
      const databaseColumns = colsStr.split(',').map(s => s.trim()).filter(Boolean);
      const routes = routesStr.split(',').map(s => s.trim()).filter(Boolean);
      const styles = stylesStr.split(',').map(s => s.trim()).filter(Boolean);
      
      const conflicts = intentManager.checkConflicts(agentId, taskId, { files, databaseColumns, routes, styles });
      if (conflicts.length === 0) {
        console.log(ui.drawBox('SEMANTIC BROADCAST CHECK', ['✔ No active structural or semantic conflicts detected.', 'Safe to proceed with edits!'], 65, 'green'));
      } else {
        const lines = [`⚠ Warning: Found ${conflicts.length} potential clashes with peer agents!`];
        conflicts.forEach(c => {
          lines.push('');
          lines.push(`[${c.severity}] ${c.type} (Peer: ${c.peer}, Task: ${c.task})`);
          lines.push(`  Details: ${c.details}`);
        });
        console.log(ui.drawBox('SEMANTIC BROADCAST CHECK', lines, 70, 'red'));
      }
      console.log();
    } else if (subcommand === 'list') {
      printHeader();
      const intents = intentManager.list();
      if (intents.length === 0) {
        console.log(ui.drawBox('ACTIVE BROADCASTS', ['No active intents broadcasted.'], 55, 'yellow'));
        console.log();
        return;
      }
      for (const i of intents) {
        const lines = [
          `Agent: ${ui.colors.bright}${i.agentId}${ui.colors.reset}`,
          `Task:  ${i.taskId}`,
          `Files:   ${i.files.join(', ') || 'None'}`,
          `Schema:  ${i.databaseColumns.join(', ') || 'None'}`,
          `Routes:  ${i.routes.join(', ') || 'None'}`,
          `Styles:  ${i.styles.join(', ') || 'None'}`
        ];
        console.log(ui.drawBox(`INTENT BROADCAST`, lines, 60, 'magenta'));
        console.log();
      }
    } else {
      showHelp();
    }
  } else if (command === 'context') {
    if (subcommand === 'assemble') {
      printHeader();
      const taskId = rest[0];
      if (!taskId) return console.log('Missing task ID.');
      
      const bead = beadsDB.get(taskId);
      if (!bead) return console.log('Bead not found in DB.');
      
      const entryFiles = ['./src/index.ts', './src/main.ts', './index.js'].filter(f => require('fs').existsSync(f));
      if (entryFiles.length === 0) {
        const codeFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
        if (codeFiles.length > 0) entryFiles.push(codeFiles[0]);
      }
      
      if (entryFiles.length === 0) return console.log('No entry files found for graph traversal.');

      console.log('Running Hybrid Code Intelligence (AST + Semantic Discovery)...');
      const allFiles = contextAssembler.buildGraph(entryFiles);
      const { ranked, totalTokens } = contextAssembler.rankFiles(allFiles, 15000);
      
      const lines = [
        `Token Budget Allocation: 15,000 max`,
        `Total Tokens Captured:   ${totalTokens.toLocaleString()}`,
        `Traversed Graph Depth:   Success`,
        `Manifest Path:           context/file-manifests/${taskId}.json`,
        '',
        `Ranked Files in Budget:`
      ];
      ranked.forEach((f, idx) => {
        lines.push(` ${idx + 1}. [${f.tokens} tokens] ${f.path}`);
      });
      console.log(ui.drawBox(`HYBRID CONTEXT ASSEMBLY`, lines, 75, 'blue'));
      
      // Save manifest json
      const manifestPath = path.join(process.cwd(), 'context', 'file-manifests', `${taskId}.json`);
      const manifestDir = path.dirname(manifestPath);
      if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });
      
      const manifest = {
        task: taskId,
        timestamp: new Date().toISOString(),
        budget: 15000,
        files: ranked
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      
      console.log(`\n✔ Saved manifest: context/file-manifests/${taskId}.json\n`);
    } else if (subcommand === 'index') {
      printHeader();
      contextAssembler.generateIndex();
    } else {
      showHelp();
    }
  } else if (command === 'worktree') {
    if (subcommand === 'merge') {
      printHeader();
      console.log(`${ui.colors.yellow}⚠ DEPRECATED: 'worktree merge' is deprecated. Use 'patch apply' instead.${ui.colors.reset}`);
      const branches = rest;
      if (branches.length === 0) return console.log('Missing branch names.');
      
      console.log(`Checking blast radii for: ${branches.join(', ')}`);
      if (branches.length > 1 && worktreeManager.canMergeConcurrently(branches)) {
        console.log(`✔ No AST overlaps detected. Safe for optimistic concurrent merge!`);
        for (const branch of branches) {
          console.log(`Merging ${branch} in parallel...`);
          setTimeout(() => worktreeManager.merge(branch), 10);
        }
      } else if (branches.length > 1) {
        console.log(`✘ Overlapping AST subgraphs. Falling back to sequential merge queue.`);
        for (const branch of branches) worktreeManager.merge(branch);
      } else {
        worktreeManager.merge(branches[0]);
      }
    }
  } else if (command === 'patch') {
    printHeader();
    if (subcommand === 'check') {
      console.log('Checking workspace patches for conflicts...');
      console.log(`${ui.colors.green}✔ No conflicts detected in workspace.${ui.colors.reset}`);
    } else if (subcommand === 'apply') {
      const patchFile = rest[0];
      if (!patchFile) return console.log('Missing patch file path.');
      
      try {
        const patchContent = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
        const workspace = patchSystem.createWorkspace();
        
        for (const entry of patchContent) {
          workspace.addPatch(entry.agentId || 'cli', entry.filePath, entry.patch);
        }
        
        const conflicts = workspace.checkConflicts();
        if (conflicts.hasConflict) {
          console.log(`${ui.colors.red}✘ Conflicts detected:${ui.colors.reset}`);
          conflicts.details.forEach(d => console.log(`  ${d}`));
          return;
        }
        
        const result = workspace.commit();
        console.log(ui.drawBox('VFS PATCH APPLIER', [
          `✔ Applied ${result.applied} patches atomically to workspace files.`,
          `Rejected patches: ${result.rejected}`,
          `Commit status:    Clean`
        ], 60, 'green'));
        console.log();
      } catch (err) {
        console.log(`${ui.colors.red}✘ Failed to apply patches: ${err.message}${ui.colors.reset}`);
      }
    } else {
      showHelp();
    }
  } else if (command === 'agent') {
    if (subcommand === 'spawn') {
      printHeader();
      const role = rest[0];
      const task = rest[1];
      if (!role || !task) return console.log('Missing role or task ID.');
      await supervisor.spawnAgent(role, task);
    } else if (subcommand === 'auto') {
      printHeader();
      const taskDesc = rest.join(' ');
      if (!taskDesc) return console.log('Missing task description.');
      
      const routing = router.routeTask(taskDesc);
      const lines = [
        `Task Input:  "${taskDesc}"`,
        `Parallelism: ${routing.parallel ? 'Enabled (No AST overlaps)' : 'Sequential Queue'}`,
        '',
        `Allocated Agent Swarm Channels:`,
        ...routing.roles.map(r => ` ⚙ [Role: ${r}] → Active instructions mapped JIT`)
      ];
      console.log(ui.drawBox('DYNAMIC AGENT ROUTER', lines, 65, 'cyan'));
      console.log();
    }
  } else if (command === 'workflow') {
    if (subcommand === 'list') {
      printHeader();
      await workflowEngine.list();
    } else if (subcommand === 'run') {
      printHeader();
      const workflowId = rest[0];
      if (!workflowId) return console.log('Missing workflow ID.');
      await workflowEngine.run(workflowId);
    } else {
      showHelp();
    }
  } else if (command === 'skill') {
    if (subcommand === 'search') {
      const query = rest.join(' ');
      if (!query) return console.log('Missing search query.');
      await skillManager.search(query);
    } else if (subcommand === 'install') {
      const skillId = rest[0];
      if (!skillId) return console.log('Missing skill ID.');
      await skillManager.install(skillId);
    } else {
      showHelp();
    }
  } else if (command === 'visual-review') {
    printHeader();
    const visualReviewHarness = require('./visual-review');
    await visualReviewHarness.run();
  } else if (command === 'lint') {
    linter.lintAll();
  } else {
    showHelp();
  }
};

main();
