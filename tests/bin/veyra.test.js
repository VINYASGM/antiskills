const { execSync } = require('child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('Veyra CLI property coercion', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-cli-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {}
  });

  test('CLI properly parses numbers, booleans, and objects/arrays', () => {
    const filePath = path.join(tmpDir, 'config.js');
    const original = `const config = {\n  port: 8080,\n  debug: false,\n  tags: []\n};`;
    fs.writeFileSync(filePath, original, 'utf8');

    // Run CLI to update port (number)
    execSync(`node bin/veyra.js ast apply "${filePath}" property config port 9000`, { encoding: 'utf8' });
    let content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('port: 9000');
    expect(content).not.toContain('port: "9000"');

    // Run CLI to update debug (boolean)
    execSync(`node bin/veyra.js ast apply "${filePath}" property config debug true`, { encoding: 'utf8' });
    content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('debug: true');
    expect(content).not.toContain('debug: "true"');

    // Run CLI to update tags (array/object)
    execSync(`node bin/veyra.js ast apply "${filePath}" property config tags "[\\"admin\\",\\"user\\"]"`, { encoding: 'utf8' });
    content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('tags: ["admin", "user"]');

    // Run CLI to update a string fallback
    execSync(`node bin/veyra.js ast apply "${filePath}" property config name hello`, { encoding: 'utf8' });
    content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('name: "hello"');
  });

  test('CLI status command outputs progress table and JSON formats', () => {
    const beadsDir = path.join(process.cwd(), 'memory', 'beads');
    if (!fs.existsSync(beadsDir)) {
      fs.mkdirSync(beadsDir, { recursive: true });
    }
    const mockBead = {
      id: 'bd-0001',
      type: 'task_state',
      status: 'open',
      title: 'Mock Status Task',
      author: 'system',
      timestamp: new Date().toISOString(),
      tags: [],
      dependencies: [],
      claimed_by: null,
      claimed_at: null,
      evidence: null
    };
    const beadFile = path.join(beadsDir, 'bd-0001.json');
    fs.writeFileSync(beadFile, JSON.stringify(mockBead, null, 2), 'utf8');

    try {
      const outputText = execSync('node bin/veyra.js status', { encoding: 'utf8' });
      expect(outputText).toContain('Live Active Task Progress');
      expect(outputText).toContain('bd-0001');
      expect(outputText).toContain('Mock Status Task');

      const outputJsonStr = execSync('node bin/veyra.js status --json', { encoding: 'utf8' });
      const parsed = JSON.parse(outputJsonStr);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some(b => b.id === 'bd-0001' && b.title === 'Mock Status Task')).toBe(true);
    } finally {
      if (fs.existsSync(beadFile)) {
        fs.unlinkSync(beadFile);
      }
    }
  });
});
