const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

class WorktreeManager {
  create(agent, taskId) {
    const branchName = `agent/${agent}/${taskId}`;
    const worktreePath = path.join(path.dirname(process.cwd()), `veyra-worktree-${agent}-${taskId}`);

    console.log(`Running git worktree add...`);
    execSync(`git worktree add -b ${branchName} "${worktreePath}" main`, { stdio: 'inherit' });
    return { branchName, worktreePath };
  }

  getChangedFiles(branch) {
    try {
      const output = execSync(`git diff --name-only main...${branch}`, { encoding: 'utf8' });
      return output.split('\n').filter(Boolean).map(f => f.trim());
    } catch (e) {
      return [];
    }
  }

  canMergeConcurrently(branches) {
    const touchedFiles = new Map();
    
    for (const branch of branches) {
      const files = this.getChangedFiles(branch);
      touchedFiles.set(branch, new Set(files));
    }

    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const filesA = touchedFiles.get(branches[i]);
        const filesB = touchedFiles.get(branches[j]);
        
        for (const file of filesA) {
          if (filesB.has(file)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  merge(branch) {
    console.log(`Checking out main...`);
    execSync('git checkout main', { stdio: 'inherit' });

    console.log(`Rebasing branch ${branch} onto main...`);
    execSync(`git checkout ${branch}`, { stdio: 'inherit' });
    execSync(`git rebase main`, { stdio: 'inherit' });

    console.log(`Merging into main (fast-forward only)...`);
    execSync(`git checkout main`, { stdio: 'inherit' });
    execSync(`git merge ${branch} --ff-only`, { stdio: 'inherit' });
  }

  cleanup(branch) {
    try {
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
        execSync(`git worktree remove "${targetPath}"`, { stdio: 'inherit' });
      }
      execSync(`git branch -d ${branch}`, { stdio: 'inherit' });
    } catch (err) {
      throw new Error(`Cleanup failed: ${err.message}`);
    }
  }
}

module.exports = new WorktreeManager();
