const path = require('node:path');
const fs = require('node:fs');

class Supervisor {
  spawnAgent(agentRole, taskId) {
    console.log(`\n\x1b[36m⚡ VEYRA + ANTIGRAVITY ORCHESTRATOR\x1b[0m`);
    console.log(`Preparing to spawn subagent for task: \x1b[1m${taskId}\x1b[0m\n`);

    const contextPath = path.join(process.cwd(), 'context', 'file-manifests', `${taskId}.json`);
    let contextStr = "No pre-assembled context found. Run 'veyra context assemble' first.";
    
    if (fs.existsSync(contextPath)) {
       const manifest = require(contextPath);
       contextStr = `Please review the following files as your primary context:\n` + manifest.files.map(f => `- ${f.path}`).join('\n');
    }

    const worktreePath = `veyra-worktree-${agentRole}-${taskId}`;

    console.log(`\x1b[33mTo start this agent in Antigravity, use the 'invoke_subagent' tool with the following prompt:\x1b[0m\n`);
    console.log(`-----------------------------------------------------------------`);
    console.log(`ROLE: ${agentRole}`);
    console.log(`PROMPT:`);
    console.log(`You are the ${agentRole}. Your current task is ${taskId}.`);
    console.log(`\nYour isolated Git worktree has been created at: ../${worktreePath}`);
    console.log(`You MUST ` + `cd` + ` into this directory before running any commands or editing files.\n`);
    console.log(contextStr);
    console.log(`\nRead CLAUDE.md for your constitution. Once tests pass, notify the human orchestrator to run the 'veyra worktree merge' command.`);
    console.log(`-----------------------------------------------------------------\n`);
  }
}

module.exports = new Supervisor();
