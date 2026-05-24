#!/usr/bin/env node

/**
 * ⚡ Veyra AI-Native OS Core Engine
 * Zero external dependencies. Built for Antigravity-style orchestration.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Terminal Styles for Premium Aesthetics
const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
};

const printHeader = () => {
  console.log(`\n${styles.bright}${styles.cyan}⚡ VEYRA — AI-Native Engineering Operating System${styles.reset}`);
  console.log(`${styles.dim}-----------------------------------------------------------------${styles.reset}`);
};

const showHelp = () => {
  printHeader();
  console.log(`${styles.bright}USAGE:${styles.reset}`);
  console.log(`  node bin/veyra.js <command> [subcommand] [options]\n`);
  console.log(`${styles.bright}COMMANDS:${styles.reset}`);
  console.log(`  ${styles.green}bead list${styles.reset}                  List all decentralized memory beads`);
  console.log(`  ${styles.green}bead show <id>${styles.reset}             Display details of a specific bead`);
  console.log(`  ${styles.green}bead create <options>${styles.reset}      Create a new decentralized bead`);
  console.log(`  ${styles.green}bead graph${styles.reset}                 Generate a Mermaid diagram of the beads graph`);
  console.log(`  ${styles.green}lint [file]${styles.reset}                Static analysis pre-merge linter`);
  console.log(`  ${styles.green}context assemble <task>${styles.reset}    Assemble deterministic context for a task`);
  console.log(`  ${styles.green}worktree create <agt> <tsk>${styles.reset} Spin up isolated Git worktree for an agent`);
  console.log(`  ${styles.green}worktree merge <branch>${styles.reset}     Safely sequential-merge an agent branch`);
  console.log(`  ${styles.green}worktree cleanup <branch>${styles.reset}   Remove Git worktree and delete local branch`);
  console.log(`\n${styles.bright}OPTIONS FOR BEAD CREATE:${styles.reset}`);
  console.log(`  --type <type>            architectural_decision | bug_discovery | task_state | incident`);
  console.log(`  --title <title>          Short, punchy title`);
  console.log(`  --desc <desc>            Detailed description`);
  console.log(`  --dep <dep1,dep2>        Comma-separated bead dependencies (e.g. bd-0001)`);
  console.log(`  --author <author>        Author (e.g. backend-engineer, human-orchestrator)`);
  console.log(`  --tags <tags>            Comma-separated tags`);
  console.log(`  --evidence <evidence>    Execution or test evidence`);
  console.log();
};

// HELPER: Parse command line arguments into structured options
const parseArgs = (args) => {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('--')) {
        options[key] = val;
        i++;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
};

// ==========================================
// 1. BEADS MEMORY CONTROLLER
// ==========================================
const beadsController = {
  getBeadsDir() {
    const dir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },

  getAllBeads() {
    const dir = this.getBeadsDir();
    const files = fs.readdirSync(dir).filter(f => f.startsWith('bd-') && f.endsWith('.json'));
    const beads = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        beads.push(JSON.parse(content));
      } catch (err) {
        console.error(`${styles.red}Error parsing bead file ${file}: ${err.message}${styles.reset}`);
      }
    }
    return beads.sort((a, b) => a.id.localeCompare(b.id));
  },

  list() {
    printHeader();
    const beads = this.getAllBeads();
    if (beads.length === 0) {
      console.log(`${styles.yellow}No memory beads found. Run 'veyra bead create' to add one.${styles.reset}\n`);
      return;
    }

    console.log(`${styles.bright}${'ID'.padEnd(10)} | ${'TYPE'.padEnd(22)} | ${'STATUS'.padEnd(12)} | ${'TITLE'}${styles.reset}`);
    console.log(`${styles.dim}-----------------------------------------------------------------${styles.reset}`);
    
    for (const b of beads) {
      let statusColor = styles.reset;
      if (b.status === 'resolved') statusColor = styles.green;
      else if (b.status === 'in_progress' || b.status === 'open') statusColor = styles.cyan;
      else if (b.status === 'blocked') statusColor = styles.red;

      const title = b.title.length > 40 ? b.title.slice(0, 37) + '...' : b.title;
      console.log(`${styles.bright}${b.id.padEnd(10)}${styles.reset} | ${b.type.padEnd(22)} | ${statusColor}${b.status.padEnd(12)}${styles.reset} | ${title}`);
    }
    console.log();
  },

  show(id) {
    printHeader();
    const dir = this.getBeadsDir();
    const filePath = path.join(dir, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`${styles.red}Error: Bead '${id}' not found at ${filePath}${styles.reset}\n`);
      process.exit(1);
    }

    const bead = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`${styles.bright}${styles.cyan}BEAD DETAILS: ${bead.id}${styles.reset}\n`);
    console.log(`${styles.bright}Title:${styles.reset}        ${bead.title}`);
    console.log(`${styles.bright}Type:${styles.reset}         ${bead.type}`);
    console.log(`${styles.bright}Status:${styles.reset}       ${bead.status}`);
    console.log(`${styles.bright}Author:${styles.reset}       ${bead.author}`);
    console.log(`${styles.bright}Timestamp:${styles.reset}    ${bead.timestamp}`);
    console.log(`${styles.bright}Tags:${styles.reset}         ${bead.tags ? bead.tags.join(', ') : 'none'}`);
    console.log(`${styles.bright}Dependencies:${styles.reset} ${bead.dependencies ? bead.dependencies.join(', ') : 'none'}`);
    if (bead.superseded_by) {
      console.log(`${styles.bright}Superseded By:${styles.reset} ${styles.yellow}${bead.superseded_by}${styles.reset}`);
    }
    console.log(`\n${styles.bright}Description:${styles.reset}`);
    console.log(`  ${bead.description}`);
    if (bead.evidence) {
      console.log(`\n${styles.bright}Evidence:${styles.reset}`);
      console.log(`  ${bead.evidence}`);
    }
    console.log();
  },

  create(options) {
    printHeader();
    const beads = this.getAllBeads();
    let nextNum = 1;
    if (beads.length > 0) {
      const lastBead = beads[beads.length - 1];
      const match = lastBead.id.match(/bd-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    const nextId = `bd-${String(nextNum).padStart(4, '0')}`;
    const type = options.type || 'task_state';
    const title = options.title || 'Untitled Action';
    const description = options.desc || 'No description provided.';
    const dependencies = options.dep ? options.dep.split(',').map(d => d.trim()) : [];
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : ['task'];
    const author = options.author || 'system';
    const evidence = options.evidence || '';

    const newBead = {
      id: nextId,
      type,
      status: 'open',
      title,
      description,
      dependencies,
      author,
      timestamp: new Date().toISOString(),
      tags,
      evidence,
      superseded_by: null,
    };

    const dir = this.getBeadsDir();
    fs.writeFileSync(path.join(dir, `${nextId}.json`), JSON.stringify(newBead, null, 2), 'utf8');
    console.log(`${styles.green}✔ Bead ${styles.bright}${nextId}${styles.reset}${styles.green} successfully created!${styles.reset}`);
    console.log(`${styles.dim}Path: memory/beads/${nextId}.json${styles.reset}\n`);
  },

  graph() {
    printHeader();
    const beads = this.getAllBeads();
    console.log(`${styles.bright}Mermaid Dependency Graph:${styles.reset}\n`);
    console.log('```mermaid');
    console.log('graph TD');
    for (const b of beads) {
      let nodeStyle = '';
      if (b.status === 'resolved') nodeStyle = ':::resolved';
      else if (b.status === 'blocked') nodeStyle = ':::blocked';
      
      console.log(`    ${b.id}["${b.id}: ${b.title.replace(/"/g, "'")}"]${nodeStyle}`);
      if (b.dependencies) {
        for (const dep of b.dependencies) {
          console.log(`    ${dep} --> ${b.id}`);
        }
      }
    }
    console.log('\n    classDef resolved fill:#82C91E,stroke:#333,stroke-width:1px,color:#fff;');
    console.log('    classDef blocked fill:#E8590C,stroke:#333,stroke-width:1px,color:#fff;');
    console.log('```\n');
  }
};

// ==========================================
// 2. CONSTITUTION PRE-MERGE LINTER
// ==========================================
const linterController = {
  lintFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.log(`${styles.red}File not found: ${filePath}${styles.reset}`);
      return { success: false, errors: ['File not found'] };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const errors = [];
    const basename = path.basename(filePath);

    // Rule 1: File line count limits
    if (lines.length > 300) {
      errors.push(`File exceeds size limit: ${lines.length} lines (max 300)`);
    }

    // Rule 2: Explicit typings (ban 'any')
    const anyRegex = /(:\s*any\b|<\s*any\s*>)/;
    lines.forEach((line, idx) => {
      // Exclude comments
      const cleanLine = line.split('//')[0].split('/*')[0];
      if (anyRegex.test(cleanLine)) {
        errors.push(`Forbidden 'any' type on line ${idx + 1}: "${line.trim()}"`);
      }
    });

    // Rule 3: JSDoc on public exports
    // Parse top-level exports and verify preceding comment blocks
    const exportRegex = /^\s*export\s+(async\s+)?(function|class|const|interface|type)\s+(\w+)/;
    lines.forEach((line, idx) => {
      const match = line.match(exportRegex);
      if (match) {
        const type = match[2];
        const name = match[3];
        
        // Scan backwards to find JSDoc start
        let foundJSDoc = false;
        let isPrecedingJSDoc = false;
        
        for (let i = idx - 1; i >= 0; i--) {
          const prevLine = lines[i].trim();
          if (prevLine === '') continue; // Skip empty lines
          if (prevLine.endsWith('*/')) {
            isPrecedingJSDoc = true;
          }
          if (isPrecedingJSDoc && prevLine.startsWith('/**')) {
            foundJSDoc = true;
            break;
          }
          if (!prevLine.startsWith('*') && !prevLine.startsWith('/*') && !prevLine.endsWith('*/')) {
            // Broken chain, not a JSDoc block
            break;
          }
        }
        
        if (!foundJSDoc && (type === 'function' || type === 'class')) {
          errors.push(`Missing JSDoc comment for exported ${type} "${name}" on line ${idx + 1}`);
        }
      }
    });

    // Rule 4: Function body line count limits (max 40 lines)
    // Dynamic brace-depth tracker to trace exact body lengths
    const funcHeaderRegex = /^\s*(async\s+)?function\s+(\w+)\s*\(|^\s*(const|let)\s+(\w+)\s*=\s*(async\s+)?\(.*\)\s*=>\s*\{/;
    let inFunction = false;
    let funcStartLine = 0;
    let funcName = '';
    let braceDepth = 0;

    lines.forEach((line, idx) => {
      const cleanLine = line.split('//')[0].split('/*')[0];
      
      if (!inFunction) {
        const match = line.match(funcHeaderRegex);
        if (match) {
          inFunction = true;
          funcStartLine = idx + 1;
          funcName = match[2] || match[4];
          braceDepth = 0;
        }
      }

      if (inFunction) {
        // Track braces
        for (let char of cleanLine) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
        }

        if (braceDepth === 0 && idx + 1 > funcStartLine) {
          // Closed! Calculate line count
          const bodyLinesCount = (idx + 1) - funcStartLine - 1;
          if (bodyLinesCount > 40) {
            errors.push(`Function "${funcName}" on line ${funcStartLine} exceeds body limit: ${bodyLinesCount} lines (max 40)`);
          }
          inFunction = false;
        }
      }
    });

    return {
      success: errors.length === 0,
      errors
    };
  },

  lintAll() {
    printHeader();
    console.log(`${styles.cyan}Running pre-commit/pre-merge constitution validation...${styles.reset}`);

    // Detect modified files via Git
    let modifiedFiles = [];
    try {
      const output = execSync('git status --porcelain', { encoding: 'utf8' });
      modifiedFiles = output
        .split('\n')
        .map(line => line.slice(3).trim())
        .filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'))
        .filter(f => !f.includes('node_modules') && !f.startsWith('dist/') && !f.startsWith('bin/'));
    } catch (e) {
      console.log(`${styles.dim}Not a git repo or git not found, checking all JS/TS source files...${styles.reset}`);
    }

    if (modifiedFiles.length === 0) {
      console.log(`${styles.green}✔ No modified JS/TS code files detected. Linter passed!${styles.reset}\n`);
      return;
    }

    console.log(`${styles.dim}Modified files to validate: ${modifiedFiles.join(', ')}${styles.reset}\n`);

    let totalErrors = 0;
    for (const file of modifiedFiles) {
      console.log(`${styles.bright}Validating ${file}...${styles.reset}`);
      const result = this.lintFile(file);
      if (result.success) {
        console.log(`  ${styles.green}✔ Clean!${styles.reset}`);
      } else {
        totalErrors += result.errors.length;
        for (const err of result.errors) {
          console.log(`  ${styles.red}✘ ${err}${styles.reset}`);
        }
      }
    }

    console.log(`\n${styles.bright}LINT REPORT:${styles.reset}`);
    if (totalErrors === 0) {
      console.log(`${styles.green}✔ Clean pre-commit compile! Constitution is fully respected.${styles.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${styles.red}✘ Pre-merge block: ${totalErrors} constitution violations found. Please refactor prior to push.${styles.reset}\n`);
      process.exit(1);
    }
  }
};

// ==========================================
// 3. DETERMINISTIC CONTEXT ASSEMBLER
// ==========================================
const contextController = {
  resolveImports(filePath, fileContent) {
    const importRegex = /import\s+.*?\s+from\s+['"]\.\/(.*?)['"]/g;
    const imports = [];
    let match;
    const dirname = path.dirname(filePath);

    while ((match = importRegex.exec(fileContent)) !== null) {
      const relPath = match[1];
      // Resolve path
      const baseName = path.join(dirname, relPath);
      let resolved = '';
      if (fs.existsSync(baseName + '.ts')) resolved = baseName + '.ts';
      else if (fs.existsSync(baseName + '.tsx')) resolved = baseName + '.tsx';
      else if (fs.existsSync(baseName + '.js')) resolved = baseName + '.js';

      if (resolved && !imports.includes(resolved)) {
        imports.push(resolved);
      }
    }
    return imports;
  },

  assemble(taskId, options = {}) {
    printHeader();
    const budget = parseInt(options.budget, 10) || 15000;
    console.log(`${styles.cyan}Assembling deterministic context for task ${styles.bright}${taskId}...${styles.reset}`);
    console.log(`${styles.dim}Token target budget: ${budget} tokens${styles.reset}\n`);

    // 1. Load active task bead to discover scope
    const beadsDir = beadsController.getBeadsDir();
    const beadFile = path.join(beadsDir, `${taskId}.json`);
    if (!fs.existsSync(beadFile)) {
      console.log(`${styles.red}Error: Task bead '${taskId}' not found.${styles.reset}`);
      process.exit(1);
    }

    const bead = JSON.parse(fs.readFileSync(beadFile, 'utf8'));
    
    // 2. Discover related codebase directories
    let filesToScan = [];
    try {
      const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
        .split('\n')
        .map(f => f.trim())
        .filter(f => f !== '' && !f.includes('node_modules') && !f.startsWith('bin/'));
      filesToScan = gitFiles;
    } catch (e) {
      // Fallback
      filesToScan = [];
    }

    // Filter matching files in task scope tags or description
    const relevantFiles = filesToScan.filter(f => {
      const inTags = bead.tags ? bead.tags.some(t => f.includes(t)) : false;
      const inTitle = f.includes(bead.title.toLowerCase().split(' ')[0]);
      return inTags || inTitle;
    });

    console.log(`${styles.bright}Task scope files discovered:${styles.reset}`);
    for (const f of relevantFiles) {
      console.log(`  - ${f}`);
    }

    // 3. Scan dependencies recursively
    const manifestSet = new Set(relevantFiles);
    for (const f of manifestSet) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf8');
        const deps = this.resolveImports(f, content);
        for (const d of deps) {
          const relativeToCwd = path.relative(process.cwd(), d);
          manifestSet.add(relativeToCwd);
        }
      }
    }

    // 4. Budget check and manifest assembly
    const manifestFiles = Array.from(manifestSet);
    const compiledManifest = {
      task: taskId,
      timestamp: new Date().toISOString(),
      budget,
      files: []
    };

    let runningTokens = 0;
    console.log(`\n${styles.bright}Context allocation pipeline:${styles.reset}`);

    for (const file of manifestFiles) {
      if (!fs.existsSync(file)) continue;
      const sizeBytes = fs.statSync(file).size;
      // Estimate token count (chars / 4 roughly)
      const content = fs.readFileSync(file, 'utf8');
      const estTokens = Math.ceil(content.length / 4);

      if (runningTokens + estTokens > budget) {
        console.log(`  ${styles.red}⚠ Truncated: ${file} (${estTokens} tokens) - Exceeds Budget limit${styles.reset}`);
        continue;
      }

      runningTokens += estTokens;
      compiledManifest.files.push({
        path: file,
        sizeBytes,
        tokens: estTokens
      });
      console.log(`  ${styles.green}✔ Allocated: ${file} (${estTokens} tokens)${styles.reset}`);
    }

    // Save manifest
    const outDir = path.join(process.cwd(), 'context', 'file-manifests');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, `${taskId}.json`);
    fs.writeFileSync(outFile, JSON.stringify(compiledManifest, null, 2), 'utf8');
    
    console.log(`\n${styles.green}✔ Manifest compiled successfully! Total tokens allocated: ${runningTokens}/${budget}${styles.reset}`);
    console.log(`${styles.dim}Saved to context/file-manifests/${taskId}.json${styles.reset}\n`);
  }
};

// ==========================================
// 4. GIT WORKTREE ISOLATION MANAGER
// ==========================================
const worktreeController = {
  create(agent, taskId) {
    printHeader();
    console.log(`${styles.cyan}Spinning up isolated Git worktree for ${styles.bright}${agent}${styles.reset}...`);

    const branchName = `agent/${agent}/${taskId}`;
    const worktreePath = path.join(path.dirname(process.cwd()), `veyra-worktree-${agent}-${taskId}`);

    try {
      console.log(`Running git worktree add...`);
      execSync(`git worktree add -b ${branchName} "${worktreePath}" main`, { stdio: 'inherit' });
      
      console.log(`\n${styles.green}✔ Git worktree successfully created!${styles.reset}`);
      console.log(`  Agent Branch: ${styles.bright}${branchName}${styles.reset}`);
      console.log(`  Directory:    ${styles.bright}${worktreePath}${styles.reset}\n`);
    } catch (err) {
      console.error(`${styles.red}Failed to create worktree: ${err.message}${styles.reset}\n`);
      process.exit(1);
    }
  },

  merge(branch) {
    printHeader();
    console.log(`${styles.cyan}Starting sequential fast-forward merge for branch ${styles.bright}${branch}${styles.reset}...`);

    try {
      // 1. Checkout main
      console.log(`Checking out main...`);
      execSync('git checkout main', { stdio: 'inherit' });

      // 2. Rebase target branch
      console.log(`Rebasing branch ${branch} onto main...`);
      execSync(`git checkout ${branch} && git rebase main`, { stdio: 'inherit' });

      // 3. Fast-forward merge onto main
      console.log(`Merging into main (fast-forward only)...`);
      execSync(`git checkout main && git merge ${branch} --ff-only`, { stdio: 'inherit' });

      console.log(`\n${styles.green}✔ Sequential merge successfully completed on main!${styles.reset}\n`);
    } catch (err) {
      console.error(`${styles.red}Merge/Rebase failed: ${err.message}${styles.reset}`);
      console.log(`${styles.yellow}Escalating to human orchestrator. Run git rebase --abort or fix conflicts.${styles.reset}\n`);
      process.exit(1);
    }
  },

  cleanup(branch) {
    printHeader();
    console.log(`${styles.cyan}Cleaning up worktree for branch ${styles.bright}${branch}${styles.reset}...`);

    try {
      // Find worktree matching branch
      const worktreeList = execSync('git worktree list --porcelain', { encoding: 'utf8' });
      const lines = worktreeList.split('\n');
      let targetPath = '';

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('worktree ')) {
          const wtPath = lines[i].slice(9);
          if (lines[i+2] && lines[i+2].includes(branch)) {
            targetPath = wtPath;
            break;
          }
        }
      }

      if (targetPath) {
        console.log(`Removing worktree path ${targetPath}...`);
        execSync(`git worktree remove "${targetPath}"`, { stdio: 'inherit' });
      }

      console.log(`Deleting local branch ${branch}...`);
      execSync(`git branch -d ${branch}`, { stdio: 'inherit' });

      console.log(`\n${styles.green}✔ Cleanup complete.${styles.reset}\n`);
    } catch (err) {
      console.error(`${styles.red}Cleanup failed: ${err.message}${styles.reset}\n`);
      process.exit(1);
    }
  }
};

// ==========================================
// MAIN COMMAND ROUTER
// ==========================================
const main = () => {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }

  const command = args[0];
  const subcommand = args[1];

  if (command === 'bead') {
    if (subcommand === 'list') {
      beadsController.list();
    } else if (subcommand === 'show') {
      const id = args[2];
      if (!id) {
        console.log(`${styles.red}Error: Missing bead ID.${styles.reset}`);
        process.exit(1);
      }
      beadsController.show(id);
    } else if (subcommand === 'create') {
      const options = parseArgs(args.slice(2));
      beadsController.create(options);
    } else if (subcommand === 'graph') {
      beadsController.graph();
    } else {
      console.log(`${styles.red}Unknown subcommand '${subcommand}' for bead.${styles.reset}`);
      showHelp();
    }
  } else if (command === 'lint') {
    const file = args[1];
    if (file) {
      printHeader();
      console.log(`Validating specific file: ${file}`);
      const res = linterController.lintFile(file);
      if (res.success) {
        console.log(`${styles.green}✔ File is clean!${styles.reset}`);
      } else {
        for (const err of res.errors) {
          console.log(`${styles.red}✘ ${err}${styles.reset}`);
        }
        process.exit(1);
      }
    } else {
      linterController.lintAll();
    }
  } else if (command === 'context') {
    if (subcommand === 'assemble') {
      const taskId = args[2];
      if (!taskId) {
        console.log(`${styles.red}Error: Missing task bead ID.${styles.reset}`);
        process.exit(1);
      }
      const options = parseArgs(args.slice(3));
      contextController.assemble(taskId, options);
    } else {
      console.log(`${styles.red}Unknown subcommand for context.${styles.reset}`);
      showHelp();
    }
  } else if (command === 'worktree') {
    if (subcommand === 'create') {
      const agent = args[2];
      const taskId = args[3];
      if (!agent || !taskId) {
        console.log(`${styles.red}Error: Usage is veyra worktree create <agent> <task_id>${styles.reset}`);
        process.exit(1);
      }
      worktreeController.create(agent, taskId);
    } else if (subcommand === 'merge') {
      const branch = args[2];
      if (!branch) {
        console.log(`${styles.red}Error: Usage is veyra worktree merge <branch>${styles.reset}`);
        process.exit(1);
      }
      worktreeController.merge(branch);
    } else if (subcommand === 'cleanup') {
      const branch = args[2];
      if (!branch) {
        console.log(`${styles.red}Error: Usage is veyra worktree cleanup <branch>${styles.reset}`);
        process.exit(1);
      }
      worktreeController.cleanup(branch);
    } else {
      console.log(`${styles.red}Unknown subcommand for worktree.${styles.reset}`);
      showHelp();
    }
  } else {
    console.log(`${styles.red}Error: Unknown command '${command}'${styles.reset}`);
    showHelp();
  }
};

main();
