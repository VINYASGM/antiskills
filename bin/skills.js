const fs = require('node:fs');
const path = require('node:path');

class SkillManager {
  constructor() {
    this.indexUrl = 'https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills_index.json';
    this.rawBaseUrl = 'https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/';
    this.localSkillsDir = path.join(process.cwd(), '.agent', 'skills');
    if (!fs.existsSync(this.localSkillsDir)) fs.mkdirSync(this.localSkillsDir, { recursive: true });
  }

  async fetchIndex() {
    const response = await fetch(this.indexUrl);
    if (!response.ok) throw new Error(`Failed to fetch index: ${response.status}`);
    return await response.json();
  }

  async search(query) {
    console.log(`Searching global awesome-skills registry for "${query}"...`);
    try {
      const index = await this.fetchIndex();
      const results = index.filter(skill => 
        skill.id.toLowerCase().includes(query.toLowerCase()) || 
        (skill.description && skill.description.toLowerCase().includes(query.toLowerCase()))
      );
      
      console.log(`\nFound ${results.length} results:\n`);
      results.slice(0, 10).forEach(skill => {
        console.log(`\x1b[32m${skill.id}\x1b[0m`);
        console.log(`  ${skill.description || 'No description'}\n`);
      });
      if (results.length > 10) console.log(`... and ${results.length - 10} more.`);
    } catch (err) {
      console.error(`Search failed: ${err.message}`);
    }
  }

  async install(skillId) {
    console.log(`Resolving skill "${skillId}"...`);
    try {
      const index = await this.fetchIndex();
      const skill = index.find(s => s.id === skillId);
      if (!skill) {
        console.log(`\x1b[31mError: Skill "${skillId}" not found in registry.\x1b[0m`);
        return;
      }

      const skillPath = path.join(this.localSkillsDir, skillId);
      if (!fs.existsSync(skillPath)) fs.mkdirSync(skillPath, { recursive: true });

      const remoteFileUrl = `${this.rawBaseUrl}${skill.path}/SKILL.md`;
      const localFilePath = path.join(skillPath, 'SKILL.md');

      console.log(`Downloading ${skill.id}/SKILL.md...`);
      const response = await fetch(remoteFileUrl);
      if (!response.ok) throw new Error(`Failed to download SKILL.md: ${response.status}`);
      
      const content = await response.text();
      fs.writeFileSync(localFilePath, content, 'utf8');

      console.log(`\x1b[32m✔ Successfully installed ${skillId}\x1b[0m`);
    } catch (err) {
      console.error(`Install failed: ${err.message}`);
    }
  }
}

module.exports = new SkillManager();
