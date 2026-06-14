const fs = require('node:fs');
const path = require('node:path');
const astTransform = require('./ast_transform.js');

/**
 * Creates a unified diff between original and modified content.
 * Simple line-based diff — sufficient for agent patch operations.
 *
 * @param {string} original - Original file content.
 * @param {string} modified - Modified file content.
 * @returns {string} Unified diff string, or empty string if no changes.
 */
function createPatch(original, modified) {
  if (original === modified) return '';

  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const hunks = [];
  let i = 0;
  let j = 0;

  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
      i++;
      j++;
      continue;
    }

    // Found a difference — build a hunk
    const hunkStartOrig = i;
    const hunkStartMod = j;
    const removed = [];
    const added = [];

    // Scan forward to find where lines reconverge
    let foundSync = false;
    const lookAhead = Math.max(origLines.length - i, modLines.length - j);

    for (let step = 0; step <= lookAhead && !foundSync; step++) {
      // Check if current orig[i+step] matches any upcoming mod line
      if (i + step < origLines.length) {
        for (let mj = j; mj < modLines.length && mj < j + step + 1; mj++) {
          if (origLines[i + step] === modLines[mj]) {
            // Collect removed/added up to sync point
            for (let k = i; k < i + step; k++) removed.push(origLines[k]);
            for (let k = j; k < mj; k++) added.push(modLines[k]);
            i = i + step;
            j = mj;
            foundSync = true;
            break;
          }
        }
      }
    }

    if (!foundSync) {
      // No reconvergence — rest of file differs
      for (let k = i; k < origLines.length; k++) removed.push(origLines[k]);
      for (let k = j; k < modLines.length; k++) added.push(modLines[k]);
      i = origLines.length;
      j = modLines.length;
    }

    if (removed.length > 0 || added.length > 0) {
      hunks.push({
        origStart: hunkStartOrig + 1,
        origCount: removed.length,
        modStart: hunkStartMod + 1,
        modCount: added.length,
        removed,
        added,
      });
    }
  }

  if (hunks.length === 0) return '';

  let diff = '';
  for (const hunk of hunks) {
    diff += `@@ -${hunk.origStart},${hunk.origCount} +${hunk.modStart},${hunk.modCount} @@\n`;
    for (const line of hunk.removed) diff += `-${line}\n`;
    for (const line of hunk.added) diff += `+${line}\n`;
  }

  return diff;
}

/**
 * Applies a unified diff to original content to reconstruct modified content.
 *
 * @param {string} original - Original file content.
 * @param {string} patch - Unified diff string.
 * @returns {string} Patched content.
 */
function applyLinePatch(original, patch) {
  if (!patch || patch.trim() === '') return original;

  const origLines = original.split('\n');
  const resultLines = [...origLines];

  // Parse hunks
  const hunkRegex = /@@ -(\d+),(\d+) \+(\d+),(\d+) @@/g;
  const hunks = [];
  let match;

  while ((match = hunkRegex.exec(patch)) !== null) {
    const origStart = parseInt(match[1], 10) - 1; // 0-indexed
    const origCount = parseInt(match[2], 10);

    // Extract removed and added lines after this hunk header
    const afterHeader = patch.slice(match.index + match[0].length);
    const lines = afterHeader.split('\n');
    const removed = [];
    const added = [];

    for (const line of lines) {
      if (line.startsWith('-')) removed.push(line.slice(1));
      else if (line.startsWith('+')) added.push(line.slice(1));
      else if (line.startsWith('@@')) break; // Next hunk
      else if (line.trim() === '') continue;
    }

    hunks.push({ origStart, origCount, removed, added });
  }

  // Apply hunks in reverse order to preserve line numbers
  for (let h = hunks.length - 1; h >= 0; h--) {
    const hunk = hunks[h];
    resultLines.splice(hunk.origStart, hunk.origCount, ...hunk.added);
  }

  return resultLines.join('\n');
}

/**
 * Applies an AST-based JSON patch or falls back to a unified diff.
 *
 * @param {string} original - Original file content.
 * @param {string} patch - JSON array of AST transformations, or unified diff.
 * @returns {string} Patched content.
 */
function applyPatch(original, patch) {
  if (!patch || patch.trim() === '') return original;

  if (patch.trim().startsWith('[')) {
    try {
      const transforms = JSON.parse(patch);
      if (Array.isArray(transforms)) {
        return astTransform.applyTransformations(original, transforms);
      }
    } catch (err) {
      // Fallback silently to line-based patching if parsing fails
    }
  }

  return applyLinePatch(original, patch);
}

/**
 * Detects conflicts between multiple patches targeting the same files.
 * Supports semantic AST resource conflict checking and mixed patch types.
 *
 * @param {Array<{agentId: string, filePath: string, patch: string}>} patches
 * @returns {{hasConflict: boolean, details: string[]}}
 */
function detectConflicts(patches) {
  const filePatches = new Map(); // filePath → [{agentId, isAST, lineRanges, resourceKeys}]

  for (const p of patches) {
    if (!filePatches.has(p.filePath)) filePatches.set(p.filePath, []);

    const isAST = p.patch && p.patch.trim().startsWith('[');
    let lineRanges = [];
    let resourceKeys = [];

    if (isAST) {
      try {
        const transforms = JSON.parse(p.patch);
        if (Array.isArray(transforms)) {
          resourceKeys = getASTResourceKeys(transforms);
        }
      } catch (err) {
        // Fallback to line-based parsing
      }
    }

    // Fallback or legacy line extraction
    if (resourceKeys.length === 0) {
      const hunkRegex = /@@ -(\d+),(\d+)/g;
      let match;
      while ((match = hunkRegex.exec(p.patch)) !== null) {
        const start = parseInt(match[1], 10);
        const count = parseInt(match[2], 10);
        lineRanges.push({ start, end: start + count - 1 });
      }
    }

    filePatches.get(p.filePath).push({
      agentId: p.agentId,
      isAST: resourceKeys.length > 0,
      lineRanges,
      resourceKeys
    });
  }

  const details = [];

  for (const [filePath, agents] of filePatches) {
    if (agents.length < 2) continue;

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];

        if (a.isAST && b.isAST) {
          const overlap = a.resourceKeys.filter(k => b.resourceKeys.includes(k));
          if (overlap.length > 0) {
            details.push(
              `Conflict in ${filePath}: ${a.agentId} and ${b.agentId} both modify the same AST resources: ${overlap.join(', ')}`
            );
          }
        } else if (!a.isAST && !b.isAST) {
          for (const rangeA of a.lineRanges) {
            for (const rangeB of b.lineRanges) {
              if (rangeA.start <= rangeB.end && rangeB.start <= rangeA.end) {
                details.push(
                  `Conflict in ${filePath}: ${a.agentId} (lines ${rangeA.start}-${rangeA.end}) overlaps with ${b.agentId} (lines ${rangeB.start}-${rangeB.end})`
                );
              }
            }
          }
        } else {
          details.push(
            `Conflict in ${filePath}: Mixed patch types (AST vs Line-based) between ${a.agentId} and ${b.agentId}. Cannot safely merge.`
          );
        }
      }
    }
  }

  return { hasConflict: details.length > 0, details };
}

/**
 * Maps AST transformation types to semantic resource identifiers for conflict detection.
 */
function getASTResourceKeys(transforms) {
  const keys = [];
  for (const t of transforms) {
    switch (t.type) {
      case 'addImport':
        keys.push(`import:${t.moduleSpecifier}:${t.importSpecifier}`);
        break;
      case 'addMethod':
        keys.push(`class-method:${t.className}:${t.methodName}`);
        break;
      case 'updateObjectProperty':
        keys.push(`prop:${t.variableName}:${t.propertyKey}`);
        break;
      case 'addFunction':
      case 'modifyFunction':
        keys.push(`func:${t.functionName}`);
        break;
      case 'updateVariableAssignment':
        keys.push(`var:${t.variableName}`);
        break;
      case 'addClass':
        keys.push(`class:${t.className}`);
        break;
      case 'addClassDecorator':
        keys.push(`class-decorator:${t.className}:${t.decoratorName}`);
        break;
      case 'addClassMethod':
        keys.push(`class-method:${t.className}:${t.methodName}`);
        break;
      case 'addClassProperty':
        keys.push(`class-property:${t.className}:${t.propertyName}`);
        break;
      case 'addJsxElement':
        keys.push(`jsx-element:${t.targetSelector.tagName || ''}:${t.targetSelector.attributeName || ''}:${t.targetSelector.attributeValue || ''}`);
        break;
      case 'updateJsxAttribute':
        keys.push(`jsx-attribute:${t.targetSelector.tagName || ''}:${t.attrName}`);
        break;
      case 'addInterface':
        keys.push(`interface:${t.interfaceName}`);
        break;
      case 'addInterfaceProperty':
        keys.push(`interface-property:${t.interfaceName}:${t.propertyName}`);
        break;
      case 'addTypeAlias':
        keys.push(`type-alias:${t.typeName}`);
        break;
    }
  }
  return keys;
}

/**
 * Creates a virtual workspace for collecting agent patches before atomic commit.
 *
 * @returns {object} Workspace with addPatch, checkConflicts, and commit methods.
 */
function copyRecursiveSync(src, dest) {
  try {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach((childItemName) => {
        if (['node_modules', '.git', '.agents', 'patches', 'scratch', 'target', '__pycache__', '.pytest_cache'].includes(childItemName)) {
          return;
        }
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    // Silently ignore copy failures for locked or missing files
  }
}

function cleanupSandbox(sandboxDir) {
  try {
    const junctionPath = path.join(sandboxDir, 'node_modules');
    if (fs.existsSync(junctionPath)) {
      fs.unlinkSync(junctionPath);
    }
  } catch (e) {
    // ignore
  }
  try {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Creates a virtual workspace for collecting agent patches before atomic commit.
 *
 * @returns {object} Workspace with addPatch, checkConflicts, and commit methods.
 */
function createWorkspace() {
  const patches = [];

  return {
    addPatch(agentId, filePath, patch) {
      patches.push({ agentId, filePath, patch });
    },

    checkConflicts() {
      return detectConflicts(patches);
    },

    commit() {
      const conflicts = detectConflicts(patches);
      if (conflicts.hasConflict) {
        return { applied: 0, rejected: patches.length, errors: conflicts.details };
      }

      const virtualCache = new Map();
      const errors = [];

      for (const p of patches) {
        try {
          const original = virtualCache.has(p.filePath)
            ? virtualCache.get(p.filePath)
            : fs.readFileSync(p.filePath, 'utf8');

          let result;
          if (p.patch && p.patch.trim().startsWith('[')) {
            const transforms = JSON.parse(p.patch);
            result = astTransform.applyTransformations(original, transforms);
          } else {
            result = applyPatch(original, p.patch);
          }
          virtualCache.set(p.filePath, result);
        } catch (err) {
          errors.push(`Failed to apply patch from ${p.agentId} to ${p.filePath}: ${err.message}`);
          break;
        }
      }

      if (errors.length > 0) {
        return { applied: 0, rejected: patches.length, errors };
      }

      // Check if there is an active taskId and checklist contract
      let contractPath = null;
      let taskId = null;
      const isTestEnv = process.env.NODE_ENV === 'test';
      const forceSandbox = process.env.VEYRA_FORCE_SANDBOX === 'true';

      if (!isTestEnv || forceSandbox) {
        const currentTaskPath = path.join(process.cwd(), 'memory', 'current-task.json');
        if (fs.existsSync(currentTaskPath)) {
          try {
            const currentTask = JSON.parse(fs.readFileSync(currentTaskPath, 'utf8'));
            taskId = currentTask.taskId || currentTask.active_bead;
          } catch (e) {
            // ignore
          }
        }

        if (taskId) {
          const checklistsDir = path.join(process.cwd(), 'checklists');
          if (fs.existsSync(checklistsDir)) {
            const directContract = path.join(checklistsDir, `contract-${taskId}.json`);
            if (fs.existsSync(directContract)) {
              contractPath = directContract;
            } else {
              try {
                const files = fs.readdirSync(checklistsDir);
                for (const file of files) {
                  if (file.toLowerCase().includes(taskId.toLowerCase()) && file.endsWith('.json')) {
                    contractPath = path.join(checklistsDir, file);
                    break;
                  }
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
      }

      if (contractPath && fs.existsSync(contractPath)) {
        const os = require('node:os');
        const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-sandbox-'));
        try {
          copyRecursiveSync(process.cwd(), sandboxDir);

          const sourceNodeModules = path.join(process.cwd(), 'node_modules');
          const targetNodeModules = path.join(sandboxDir, 'node_modules');
          if (fs.existsSync(sourceNodeModules)) {
            fs.symlinkSync(sourceNodeModules, targetNodeModules, 'junction');
          }

          // Write the memory-modified files from virtualCache to their corresponding paths in sandboxDir
          for (const [filePath, content] of virtualCache.entries()) {
            const absFilePath = path.resolve(filePath);
            const relativePath = path.relative(process.cwd(), absFilePath);
            const targetPath = path.resolve(sandboxDir, relativePath);
            const dir = path.dirname(targetPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(targetPath, content, 'utf8');
          }

          // Call verifyContract(contractPath, null, sandboxDir)
          const { verifyContract } = require('./verify.js');
          const verificationResult = verifyContract(contractPath, null, sandboxDir);

          if (!verificationResult.success) {
            const verificationLogs = verificationResult.logs.join('\n');
            return {
              applied: 0,
              rejected: patches.length,
              errors: [ "Contract verification failed: " + verificationLogs ]
            };
          }
        } finally {
          cleanupSandbox(sandboxDir);
        }
      }

      // Write all updated files to disk
      for (const [filePath, content] of virtualCache.entries()) {
        fs.writeFileSync(filePath, content, 'utf8');
      }

      return { applied: patches.length, rejected: 0, errors: [] };
    },
  };
}

module.exports = { createPatch, applyPatch, detectConflicts, createWorkspace };
