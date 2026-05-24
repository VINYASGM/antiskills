const supervisor = require('./supervisor');

class WorkflowEngine {
  constructor() {
    this.workflowsUrl = 'https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/data/workflows.json';
  }

  async fetchWorkflows() {
    const response = await fetch(this.workflowsUrl);
    if (!response.ok) throw new Error(`Failed to fetch workflows: ${response.status}`);
    return await response.json();
  }

  async list() {
    console.log('Fetching awesome-skills workflows...');
    try {
      const data = await this.fetchWorkflows();
      console.log('\nAvailable Workflows:\n');
      data.workflows.forEach(wf => {
        console.log(`\x1b[32m${wf.id}\x1b[0m`);
        console.log(`  ${wf.description}\n`);
      });
    } catch(err) {
      console.error(err.message);
    }
  }

  async run(workflowId) {
    try {
      const data = await this.fetchWorkflows();
      const wf = data.workflows.find(w => w.id === workflowId);
      if (!wf) {
        console.log(`\x1b[31mWorkflow "${workflowId}" not found.\x1b[0m`);
        return;
      }

      console.log(`\n\x1b[36m🚀 STARTING WORKFLOW: ${wf.name}\x1b[0m`);
      console.log(`${wf.description}\n`);

      for (let i = 0; i < wf.steps.length; i++) {
        const step = wf.steps[i];
        console.log(`\x1b[33m=================================================================\x1b[0m`);
        console.log(`\x1b[33m--- STEP ${i + 1}: ${step.title} ---\x1b[0m`);
        console.log(`Goal: ${step.goal}`);
        console.log(`Notes: ${step.notes}`);
        console.log(`Recommended Skills: ${step.recommendedSkills.join(', ')}\n`);
        
        await supervisor.spawnAgent(
          step.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replace(/-+/g, '-'),
          `${workflowId}-step-${i+1}`,
          step.recommendedSkills,
          step.goal
        );
      }
    } catch(err) {
      console.error(err.message);
    }
  }
}

module.exports = new WorkflowEngine();
