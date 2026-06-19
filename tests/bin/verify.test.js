import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseContract, verifyContract } from '../../bin/verify';
import { createPatch } from '../../bin/patch';
import { sandboxPathFor } from '../../bin/sandbox-path';

describe('Verify Engine — Contract Checker & Sandboxed Execution', () => {
  let tempDir;
  let contractPath;
  let patchPath;
  let targetFilePath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-verify-test-'));
    contractPath = path.join(tempDir, 'contract.json');
    patchPath = path.join(tempDir, 'patch.diff');
    targetFilePath = path.join(tempDir, 'source.js');
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('parseContract() parses a syntactically correct Zod contract schema', () => {
    const validData = {
      contractId: 'ct-100',
      taskId: 'bd-100',
      targetFiles: [targetFilePath],
      rules: {
        noConsoleLogs: true,
        maxFileSizeLines: 15
      },
      formalProofs: [
        { type: 'test', command: 'echo "success"' }
      ]
    };
    
    const parsed = parseContract(validData);
    expect(parsed.contractId).toBe('ct-100');
    expect(parsed.formalProofs[0].type).toBe('test');
  });

  it('verifyContract() succeeds when rules and command execution pass', async () => {
    // Write original file
    fs.writeFileSync(targetFilePath, 'const x = 42;\nconst y = 100;\n', 'utf8');

    // Create a valid patch
    const modified = 'const x = 42;\nconst y = 200;\n';
    const diff = createPatch('const x = 42;\nconst y = 100;\n', modified);
    fs.writeFileSync(patchPath, diff, 'utf8');

    // Write a contract
    const contract = {
      contractId: 'ct-200',
      taskId: 'bd-200',
      targetFiles: [targetFilePath],
      rules: {
        noConsoleLogs: true
      },
      formalProofs: [
        { type: 'ping', command: 'echo "proof works"' }
      ]
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const result = await verifyContract(contractPath, patchPath);
    expect(result.success).toBe(true);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(modified); // Assert file is modified permanently after pass
  });

  it('verifyContract() fails and rolls back changes when a rule is violated (e.g., console.log found)', async () => {
    const original = 'const x = 42;\n';
    fs.writeFileSync(targetFilePath, original, 'utf8');

    // Patched file introduces console.log
    const modified = 'const x = 42;\nconsole.log(x);\n';
    const diff = createPatch(original, modified);
    fs.writeFileSync(patchPath, diff, 'utf8');

    const contract = {
      contractId: 'ct-300',
      taskId: 'bd-300',
      targetFiles: [targetFilePath],
      rules: {
        noConsoleLogs: true
      },
      formalProofs: []
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const result = await verifyContract(contractPath, patchPath);
    expect(result.success).toBe(false);
    expect(result.logs.some(l => l.includes('Rule Violation'))).toBe(true);
    
    // Assert backup rollback successfully restored the original content
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(original);
  });

  it('verifyContract() fails and rolls back changes when an executable proof command fails', async () => {
    const original = 'const val = 10;\n';
    fs.writeFileSync(targetFilePath, original, 'utf8');

    const modified = 'const val = 50;\n';
    const diff = createPatch(original, modified);
    fs.writeFileSync(patchPath, diff, 'utf8');

    const contract = {
      contractId: 'ct-400',
      taskId: 'bd-400',
      targetFiles: [targetFilePath],
      formalProofs: [
        { type: 'test-fail', command: 'node -e "process.exit(1)"' }
      ]
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const result = await verifyContract(contractPath, patchPath);
    expect(result.success).toBe(false);
    expect(result.logs.some(l => l.includes('Proof [test-fail] Failed!'))).toBe(true);

    // Assert backup rollback successfully restored the original content
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(original);
  });

  it('verifyContract() triggers JIT context freshness checks and re-evaluation when manifest is stale', async () => {
    // Write original file
    fs.writeFileSync(targetFilePath, 'const x = 42;\n', 'utf8');

    // Create a manifest directory
    const manifestDir = path.join(process.cwd(), 'context', 'file-manifests');
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }
    const manifestPath = path.join(manifestDir, 'bd-500.json');

    // Write a dummy stale manifest (timestamp in past)
    const dummyManifest = {
      task: 'bd-500',
      timestamp: '2020-01-01T00:00:00.000Z',
      budget: 15000,
      files: [
        { path: path.relative(process.cwd(), targetFilePath).replace(/\\/g, '/') }
      ]
    };
    fs.writeFileSync(manifestPath, JSON.stringify(dummyManifest, null, 2), 'utf8');

    // Create a valid patch
    const modified = 'const x = 100;\n';
    const diff = createPatch('const x = 42;\n', modified);
    fs.writeFileSync(patchPath, diff, 'utf8');

    // Write a contract matching taskId
    const contract = {
      contractId: 'ct-500',
      taskId: 'bd-500',
      targetFiles: [targetFilePath],
      rules: {},
      formalProofs: []
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const result = await verifyContract(contractPath, patchPath);
    expect(result.success).toBe(true);
    expect(result.logs.some(l => l.includes('JIT Context dependency graph re-evaluated'))).toBe(true);

    // Verify manifest has been refreshed (timestamp should be new/recent)
    const refreshed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(new Date(refreshed.timestamp).getTime()).toBeGreaterThan(new Date('2025-01-01').getTime());

    // Cleanup manifest file
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }
  });

  it('verifyContract() supports sandboxed execution and does not modify original files or rollback main workspace', async () => {
    // 1. Setup original file in workspace
    const originalContent = 'const val = 100;\n';
    fs.writeFileSync(targetFilePath, originalContent, 'utf8');

    // 2. Setup sandbox directory
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-sandbox-test-'));

    // 3. Create a patch introducing a console.log (violating rule)
    const modifiedContent = 'const val = 100;\nconsole.log(val);\n';
    const diff = createPatch(originalContent, modifiedContent);
    fs.writeFileSync(patchPath, diff, 'utf8');

    // 4. Create a contract with noConsoleLogs rule
    const contract = {
      contractId: 'ct-sandbox-fail',
      taskId: 'bd-sandbox-fail',
      targetFiles: [targetFilePath],
      rules: {
        noConsoleLogs: true
      },
      formalProofs: []
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    // 5. Run verifyContract with sandboxDir
    const result = await verifyContract(contractPath, patchPath, sandboxDir);
    expect(result.success).toBe(false);
    expect(result.logs.some(l => l.includes('Rule Violation'))).toBe(true);

    // 6. Verify that targetFilePath in main workspace remains completely unmodified
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(originalContent);

    // 7. Verify that no rollback attempt happened on main workspace (no logs about rolling back main workspace)
    expect(result.logs.some(l => l.includes('Initiating workspace rollback transactional recovery'))).toBe(false);

    // Cleanup sandbox
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  it('verifyContract() handles null/empty patchPath gracefully and checks sandbox files directly', async () => {
    // 1. Setup original file
    fs.writeFileSync(targetFilePath, 'const a = 1;\n', 'utf8');

    // 2. Setup sandbox directory
    const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-sandbox-test-2-'));

    // 3. Write a compliant file directly to sandboxDir
    const sandboxTargetPath = sandboxPathFor(sandboxDir, targetFilePath);
    fs.mkdirSync(path.dirname(sandboxTargetPath), { recursive: true });
    fs.writeFileSync(sandboxTargetPath, 'const a = 1;\n', 'utf8');

    // 4. Create a contract
    const contract = {
      contractId: 'ct-sandbox-null-patch',
      taskId: 'bd-sandbox-null-patch',
      targetFiles: [targetFilePath],
      rules: {
        noConsoleLogs: true
      },
      formalProofs: [
        { type: 'echo', command: 'echo "hello from sandbox"' }
      ]
    };
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    // 5. Run verifyContract with null patchPath
    const result = await verifyContract(contractPath, null, sandboxDir);
    expect(result.success).toBe(true);
    expect(result.logs.some(l => l.includes('Skipping patch application'))).toBe(true);

    // Cleanup sandbox
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  it('OSV dependency check rejects vulnerable package additions/updates', async () => {
    // 1. Setup original package.json in tempDir
    const originalPkg = {
      name: 'test-app',
      dependencies: {
        'lodash': '4.17.21'
      }
    };
    const packageJsonPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(originalPkg, null, 2), 'utf8');

    // 2. Setup modified package.json content
    const patchedPkg = {
      name: 'test-app',
      dependencies: {
        'lodash': '4.17.11' // Vulnerable package version in offline mock
      }
    };
    const patchedContent = JSON.stringify(patchedPkg, null, 2);

    // 3. Create a patch diff
    const diff = createPatch(JSON.stringify(originalPkg, null, 2), patchedContent);
    const patchFile = path.join(tempDir, 'package-patch.diff');
    fs.writeFileSync(patchFile, diff, 'utf8');

    // 4. Create a contract specifying package.json in targetFiles
    const contract = {
      contractId: 'ct-osv-vulnerable',
      taskId: 'bd-osv',
      targetFiles: ['package.json'],
      formalProofs: []
    };
    const osvContractPath = path.join(tempDir, 'osv-contract.json');
    fs.writeFileSync(osvContractPath, JSON.stringify(contract, null, 2), 'utf8');

    // 5. Run verifyContract
    const originalCwd = process.cwd();
    process.chdir(tempDir);
    try {
      const result = await verifyContract(osvContractPath, patchFile);
      expect(result.success).toBe(false);
      expect(result.logs.some(l => l.includes('VULNERABLE') || l.includes('detected'))).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('OSV dependency check permits safe package additions/updates', async () => {
    // 1. Setup original package.json in tempDir
    const originalPkg = {
      name: 'test-app',
      dependencies: {
        'lodash': '4.17.20'
      }
    };
    const packageJsonPath = path.join(tempDir, 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(originalPkg, null, 2), 'utf8');

    // 2. Setup modified package.json content
    const patchedPkg = {
      name: 'test-app',
      dependencies: {
        'lodash': '4.17.21' // Safe package version
      }
    };
    const patchedContent = JSON.stringify(patchedPkg, null, 2);

    // 3. Create a patch diff
    const diff = createPatch(JSON.stringify(originalPkg, null, 2), patchedContent);
    const patchFile = path.join(tempDir, 'package-patch-safe.diff');
    fs.writeFileSync(patchFile, diff, 'utf8');

    // 4. Create a contract specifying package.json in targetFiles
    const contract = {
      contractId: 'ct-osv-safe',
      taskId: 'bd-osv-safe',
      targetFiles: ['package.json'],
      formalProofs: []
    };
    const osvContractPath = path.join(tempDir, 'osv-contract-safe.json');
    fs.writeFileSync(osvContractPath, JSON.stringify(contract, null, 2), 'utf8');

    // 5. Run verifyContract
    const originalCwd = process.cwd();
    process.chdir(tempDir);
    try {
      const result = await verifyContract(osvContractPath, patchFile);
      expect(result.success).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
