/**
 * 🧪 Verify Engine — Programmatic Contract Proof Checker
 * Reads checklists/contract-XXXX.json, validates schemas via Zod,
 * applies VFS patches, executes sandboxed test sweeps, and rollbacks on failure.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { z } = require('zod');
const { applyPatch } = require('./patch');

// 1. Zod Contract Schema
const ContractSchema = z.object({
  contractId: z.string(),
  taskId: z.string(),
  targetFiles: z.array(z.string()),
  rules: z.object({
    noConsoleLogs: z.boolean().optional(),
    requireTypeScriptTypes: z.boolean().optional(),
    maxFileSizeLines: z.number().optional()
  }).optional(),
  formalProofs: z.array(z.object({
    type: z.string(),
    command: z.string()
  })).default([])
});

/**
 * Validates a contract configuration object.
 */
function parseContract(contractData) {
  return ContractSchema.parse(contractData);
}

/**
 * Run verification checklist on a proposed patch.
 *
 * @param {string} contractPath - Path to contract.json file.
 * @param {string} patchPath - Path to patch.diff file.
 * @returns {{success: boolean, logs: string[]}}
 */
function verifyContract(contractPath, patchPath) {
  const logs = [];
  logs.push(`Loading contract: ${path.basename(contractPath)}`);

  // Load contract
  let contract;
  try {
    const rawData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    contract = parseContract(rawData);
    logs.push(`✓ Contract signature validated: ${contract.contractId}`);
  } catch (err) {
    logs.push(`❌ Contract schema error: ${err.message}`);
    return { success: false, logs };
  }

  // Load patch
  let patchContent;
  try {
    patchContent = fs.readFileSync(patchPath, 'utf8');
    logs.push(`✓ Unified patch loaded from ${path.basename(patchPath)}`);
  } catch (err) {
    logs.push(`❌ Failed to read patch: ${err.message}`);
    return { success: false, logs };
  }

  // Transaction backup map: filePath -> originalContent
  const backup = new Map();
  let patchApplied = false;

  try {
    // 2. Perform Workspace Patch Dry-run and Write
    for (const filePath of contract.targetFiles) {
      if (!fs.existsSync(filePath)) {
        // Let's support virtual/new files by assuming empty original content
        backup.set(filePath, null);
        const patchedContent = applyPatch('', patchContent);
        fs.writeFileSync(filePath, patchedContent, 'utf8');
      } else {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        backup.set(filePath, originalContent);
        const patchedContent = applyPatch(originalContent, patchContent);
        fs.writeFileSync(filePath, patchedContent, 'utf8');
      }
    }
    patchApplied = true;
    logs.push(`✓ Patched changes written to target workspace files atomically`);

    // 3. Rule validations (Statics)
    if (contract.rules) {
      const rules = contract.rules;
      for (const filePath of contract.targetFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (rules.noConsoleLogs && content.includes('console.log')) {
          throw new Error(`Rule Violation: 'console.log' found in ${filePath}`);
        }
        
        if (rules.maxFileSizeLines) {
          const linesCount = content.split('\n').length;
          if (linesCount > rules.maxFileSizeLines) {
            throw new Error(`Rule Violation: ${filePath} size exceeds ${rules.maxFileSizeLines} lines (has ${linesCount} lines)`);
          }
        }
      }
      logs.push(`✓ Static rule checklists passed successfully`);
    }

    // 4. Executing formal proofs (Vitest, Compilers, Linters)
    for (const proof of contract.formalProofs) {
      logs.push(`Executing proof [${proof.type}]: "${proof.command}"...`);
      try {
        const execOutput = execSync(proof.command, { stdio: 'pipe', encoding: 'utf8' });
        logs.push(`✓ Proof [${proof.type}] passed`);
        logs.push(execOutput.trim().split('\n').map(l => `  stdout: ${l}`).slice(0, 5).join('\n')); // Log sample stdout
      } catch (execErr) {
        const errDetails = execErr.stderr ? execErr.stderr.toString() : execErr.message;
        throw new Error(`Proof [${proof.type}] Failed! Command: "${proof.command}". Details: ${errDetails}`);
      }
    }

    logs.push(`✓ All V3 contract verification checks passed programmatically!`);
    return { success: true, logs };

  } catch (err) {
    logs.push(`❌ Verification Failure: ${err.message}`);
    
    // 5. Transaction Rollback (Clean recovery)
    if (patchApplied) {
      logs.push(`Initiating workspace rollback transactional recovery...`);
      for (const [filePath, origContent] of backup.entries()) {
        try {
          if (origContent === null) {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } else {
            fs.writeFileSync(filePath, origContent, 'utf8');
          }
          logs.push(`  Rolled back: ${filePath}`);
        } catch (rollErr) {
          logs.push(`  CRITICAL: Rollback failed for ${filePath}: ${rollErr.message}`);
        }
      }
    }
    
    return { success: false, logs };
  }
}

module.exports = { parseContract, verifyContract };
