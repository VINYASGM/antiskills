const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

class Linter {
  lintAll() {
    console.log(`Running standard ecosystem linters...`);
    try {
      if (fs.existsSync(path.join(process.cwd(), 'eslint.config.js')) || fs.existsSync(path.join(process.cwd(), '.eslintrc.js'))) {
        execSync('npx eslint . --ext .ts,.tsx,.js,.jsx', { stdio: 'inherit' });
      } else {
        const pkgPath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = require(pkgPath);
          if (pkg.scripts && pkg.scripts.lint) {
            execSync('npm run lint', { stdio: 'inherit' });
            return;
          }
        }
        console.log(`No explicit linter found. Skipping.`);
      }
      console.log(`✔ Code passes constitution constraints natively.`);
    } catch (e) {
      console.error(`✘ Linting failed. Constitution violated.`);
      process.exit(1);
    }
  }

  lintFile(file) {
    try {
      execSync(`npx eslint ${file}`, { stdio: 'inherit' });
      console.log(`✔ ${file} passes constitution constraints.`);
    } catch (e) {
      console.error(`✘ ${file} violates constitution.`);
      process.exit(1);
    }
  }
}

module.exports = new Linter();
