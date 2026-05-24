#!/usr/bin/env node

/**
 * ⚡ Veyra AI-Native OS Core Engine
 * Elite-tier context orchestration via DB, AST, and parallel subagents.
 */

const beadsDB = require('./db');
const contextAssembler = require('./context');
const worktreeManager = require('./worktree');
const linter = require('./linter');
const supervisor = require('./supervisor');

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
  console.log(`  ${styles.green}bead list${styles.reset}                  List all memory beads (SQLite backed)`);
  console.log(`  ${styles.green}bead create${styles.reset}                Create a new memory bead`);
  console.log(`  ${styles.green}context assemble <task>${styles.reset}    Assemble context using TS AST parsing`);
  console.log(`  ${styles.green}worktree merge <branch...>${styles.reset} Optimistic concurrent merge`);
  console.log(`  ${styles.green}agent spawn <role> <task>${styles.reset}  Spawn an agent under supervisor tree`);
  console.log(`  ${styles.green}lint${styles.reset}                       Run static analysis`);
  console.log();
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const [command, subcommand, ...rest] = args;

  if (command === 'bead') {
    if (subcommand === 'list') {
      printHeader();
      const beads = beadsDB.getAll();
      if (beads.length === 0) console.log("No memory beads found.");
      for (const b of beads) {
        console.log(`[${b.id}] ${b.type} | ${b.status} | ${b.title}`);
      }
    } else if (subcommand === 'create') {
      beadsDB.create({
        id: beadsDB.getNextId(),
        type: 'task_state',
        title: rest.join(' ') || 'Untitled Task'
      });
      console.log(`✔ Bead created successfully.`);
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
      if (entryFiles.length === 0) return console.log('No entry files found for graph traversal.');

      console.log('Traversing TS AST Dependency Graph...');
      const allFiles = contextAssembler.buildGraph(entryFiles);
      const { ranked, totalTokens } = contextAssembler.rankFiles(allFiles, 15000);
      
      console.log(`\nRanked Context Files (${totalTokens} tokens):`);
      ranked.forEach(f => console.log(` - ${f.path}`));
      console.log('✔ Context compiled efficiently without regex.');
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
      supervisor.spawnAgent(role, task);
    }
  } else if (command === 'lint') {
    linter.lintAll();
  } else {
    showHelp();
  }
};

main();
