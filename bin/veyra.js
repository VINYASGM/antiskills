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
const path = require('node:path');
const fs = require('node:fs');

const styles = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
};

const printHeader = () => {
  console.log(`\n${styles.bright}${styles.cyan}⚡ VEYRA — AI-Native Engineering Operating System (Elite)${styles.reset}`);
  console.log(`${styles.dim}-----------------------------------------------------------------${styles.reset}`);
};

const showHelp = () => {
  printHeader();
  console.log(`${styles.bright}USAGE:${styles.reset}`);
  console.log(`  node bin/veyra.js <command> [subcommand] [options]\n`);
  console.log(`${styles.bright}COMMANDS:${styles.reset}`);
  console.log(`  ${styles.green}bead list${styles.reset}                  List all memory beads (SQLite JIT compiled)`);
  console.log(`  ${styles.green}bead create${styles.reset}                Create a new memory bead`);
  console.log(`  ${styles.green}context assemble <task>${styles.reset}    Assemble hybrid context and write task manifest`);
  console.log(`  ${styles.green}context index${styles.reset}              Generate dynamic codebase repo map and dependency DAG`);
  console.log(`  ${styles.green}intent publish <ag> <tsk>${styles.reset}  Broadcast agent files, DB, routes, styles intents`);
  console.log(`  ${styles.green}intent check <ag> <tsk>${styles.reset}    Verify structural & semantic overlaps JIT`);
  console.log(`  ${styles.green}intent list${styles.reset}                  List all active agent broadcasts`);
  console.log(`  ${styles.green}worktree merge <branch...>${styles.reset} Optimistic concurrent merge`);
  console.log(`  ${styles.green}agent spawn <role> <task>${styles.reset}  Spawn an agent under supervisor tree`);
  console.log(`  ${styles.green}workflow list${styles.reset}              List all awesome-skills workflows`);
  console.log(`  ${styles.green}workflow run <id>${styles.reset}          Execute a workflow and spawn agents step-by-step`);
  console.log(`  ${styles.green}skill search <query>${styles.reset}       Search global Awesome Skills registry`);
  console.log(`  ${styles.green}skill install <id>${styles.reset}         Download and mount a skill to .agent/skills/`);
  console.log(`  ${styles.green}visual-review${styles.reset}                Execute automated Playwright visual audit`);
  console.log(`  ${styles.green}lint${styles.reset}                       Run static analysis`);
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
      if (beads.length === 0) console.log("No memory beads found.");
      for (const b of beads) {
        console.log(`[${b.id}] ${b.type} | ${b.status} | ${b.title}`);
      }
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
      console.log(`✔ Bead created successfully: [${newId}] ${title}`);
    } else {
      showHelp();
    }
  } else if (command === 'intent') {
    printHeader();
    if (subcommand === 'publish') {
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
        console.log('✔ No active structural or semantic conflicts detected with peer agents. Safe to edit!');
      } else {
        console.log(`⚠ Conflict Warning: Found ${conflicts.length} potential clashes!`);
        conflicts.forEach(c => {
          console.log(`\n[${c.severity}] ${c.type} (Peer: ${c.peer}, Task: ${c.task})`);
          console.log(`Details: ${c.details}`);
        });
      }
    } else if (subcommand === 'list') {
      const intents = intentManager.list();
      if (intents.length === 0) console.log("No active intents broadcasted.");
      for (const i of intents) {
        console.log(`\n[Agent: ${i.agentId}] | [Task: ${i.taskId}]`);
        console.log(` - Intended Files: ${i.files.join(', ') || 'None'}`);
        console.log(` - Intended Schema changes: ${i.databaseColumns.join(', ') || 'None'}`);
        console.log(` - Intended Routes: ${i.routes.join(', ') || 'None'}`);
        console.log(` - Intended Styles: ${i.styles.join(', ') || 'None'}`);
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
        const fs = require('fs');
        const codeFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
        if (codeFiles.length > 0) entryFiles.push(codeFiles[0]);
      }
      
      if (entryFiles.length === 0) return console.log('No entry files found for graph traversal.');

      console.log('Running Hybrid Code Intelligence (AST + Semantic Discovery)...');
      const allFiles = contextAssembler.buildGraph(entryFiles);
      const { ranked, totalTokens } = contextAssembler.rankFiles(allFiles, 15000);
      
      console.log(`\nRanked Context Files (${totalTokens} tokens):`);
      ranked.forEach(f => console.log(` - ${f.path} (${f.tokens} tokens)`));
      
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
      
      console.log(`✔ Manifest indexed & saved: context/file-manifests/${taskId}.json`);
      console.log('✔ Hybrid context compiled successfully.');
    } else if (subcommand === 'index') {
      printHeader();
      contextAssembler.generateIndex();
    } else {
      showHelp();
    }
  } else if (command === 'worktree') {
    if (subcommand === 'merge') {
      printHeader();
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
  } else if (command === 'agent') {
    if (subcommand === 'spawn') {
      printHeader();
      const role = rest[0];
      const task = rest[1];
      if (!role || !task) return console.log('Missing role or task ID.');
      await supervisor.spawnAgent(role, task);
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
