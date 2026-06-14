const path = require('node:path');
const fs = require('node:fs');
const skillManager = require('./skills');

class Supervisor {
  async spawnAgent(agentRole, taskId, skills = [], goal = '') {
    console.log(`\n\x1b[36m⚡ VEYRA + ANTIGRAVITY ORCHESTRATOR\x1b[0m`);
    console.log(`Preparing to spawn subagent for task: \x1b[1m${taskId}\x1b[0m\n`);

    if (skills && skills.length > 0) {
      console.log(`\x1b[35m[JIT Skill Mounting] Mounting required skills for ${agentRole}...\x1b[0m`);
      for (const skill of skills) {
        await skillManager.install(skill);
      }
    }

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
    if (goal) console.log(`Your goal is: ${goal}`);
    if (skills && skills.length > 0) {
      console.log(`\nUse the following skills located in .agent/skills/ to complete your task:`);
      skills.forEach(s => console.log(` - ${s}`));
    }
    console.log(`\n\x1b[31m[CIRCUIT BREAKER]\x1b[0m You are bound by a strict Time-To-Live (TTL) constraint.`);
    console.log(`If you enter an infinite hallucination loop (>3 messages with no code modifications), your execution will be terminated and logged to the Dead-Letter Queue (DLQ).`);
    console.log(`\nYour isolated VFS patch workspace has been created at: ../${worktreePath}`);
    console.log(`You MUST ` + `cd` + ` into this directory before running any commands or editing files.\n`);
    console.log(contextStr);
    console.log(`\nRead AGENT.md for your constitution. Once tests pass, notify the human orchestrator to run the 'veyra patch apply' command.`);
    console.log(`-----------------------------------------------------------------\n`);
  }
}

module.exports = new Supervisor();
