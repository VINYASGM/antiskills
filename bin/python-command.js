const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function findPythonCommand() {
  const candidates = [
    process.env.VEYRA_PYTHON,
    process.env.PYTHON,
    'py',
    'python',
    'python3',
    path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const result = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (!result.error) return candidate;
  }

  return null;
}

module.exports = { findPythonCommand };
