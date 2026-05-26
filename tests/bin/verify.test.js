import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseContract, verifyContract } from '../../bin/verify';
import { createPatch } from '../../bin/patch';

describe('Verify Engine — Contract Checker & Sandboxed Execution', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_verify_test');
  const contractPath = path.join(tempDir, 'contract.json');
  const patchPath = path.join(tempDir, 'patch.diff');
  const targetFilePath = path.join(tempDir, 'source.js');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('parseContract() parses a syntactically correct Zod contract schema', () => {
    const validData = {
      contractId: 'ct-100',
      taskId: 'bd-100',
      targetFiles: ['tests/temp_verify_test/source.js'],
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

  it('verifyContract() succeeds when rules and command execution pass', () => {
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

    const result = verifyContract(contractPath, patchPath);
    expect(result.success).toBe(true);
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(modified); // Assert file is modified permanently after pass
  });

  it('verifyContract() fails and rolls back changes when a rule is violated (e.g., console.log found)', () => {
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

    const result = verifyContract(contractPath, patchPath);
    expect(result.success).toBe(false);
    expect(result.logs.some(l => l.includes('Rule Violation'))).toBe(true);
    
    // Assert backup rollback successfully restored the original content
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(original);
  });

  it('verifyContract() fails and rolls back changes when an executable proof command fails', () => {
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

    const result = verifyContract(contractPath, patchPath);
    expect(result.success).toBe(false);
    expect(result.logs.some(l => l.includes('Proof [test-fail] Failed!'))).toBe(true);

    // Assert backup rollback successfully restored the original content
    expect(fs.readFileSync(targetFilePath, 'utf8')).toBe(original);
  });
});
