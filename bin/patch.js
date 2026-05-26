/**
 * 🔧 Patch System — Agent File Isolation Without Git Worktrees
 * Agents produce unified diffs. Orchestrator applies patches atomically.
 * Conflicts = rejected patches, not corrupted repos.
 */

const fs = require('node:fs');

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
function applyPatch(original, patch) {
  if (!patch || patch.trim() === '') return original;

  const origLines = original.split('\n');
  const resultLines = [...origLines];
  let offset = 0;

  // Parse hunks
  const hunkRegex = /@@ -(\d+),(\d+) \+(\d+),(\d+) @@/g;
  const hunks = [];
  let match;

  while ((match = hunkRegex.exec(patch)) !== null) {
    const origStart = parseInt(match[1], 10) - 1; // 0-indexed
    const origCount = parseInt(match[2], 10);
    const modCount = parseInt(match[4], 10);

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
 * Detects conflicts between multiple patches targeting the same files.
 *
 * @param {Array<{agentId: string, filePath: string, patch: string}>} patches
 * @returns {{hasConflict: boolean, details: string[]}}
 */
function detectConflicts(patches) {
  const filePatches = new Map(); // filePath → [{agentId, patch, lines}]

  for (const p of patches) {
    if (!filePatches.has(p.filePath)) filePatches.set(p.filePath, []);

    // Extract line ranges from hunk headers
    const lineRanges = [];
    const hunkRegex = /@@ -(\d+),(\d+)/g;
    let match;
    while ((match = hunkRegex.exec(p.patch)) !== null) {
      const start = parseInt(match[1], 10);
      const count = parseInt(match[2], 10);
      lineRanges.push({ start, end: start + count - 1 });
    }

    filePatches.get(p.filePath).push({ agentId: p.agentId, lineRanges });
  }

  const details = [];

  for (const [filePath, agents] of filePatches) {
    if (agents.length < 2) continue;

    // Check pairwise line range overlap
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];

        for (const rangeA of a.lineRanges) {
          for (const rangeB of b.lineRanges) {
            if (rangeA.start <= rangeB.end && rangeB.start <= rangeA.end) {
              details.push(
                `Conflict in ${filePath}: ${a.agentId} (lines ${rangeA.start}-${rangeA.end}) overlaps with ${b.agentId} (lines ${rangeB.start}-${rangeB.end})`
              );
            }
          }
        }
      }
    }
  }

  return { hasConflict: details.length > 0, details };
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

      let applied = 0;
      const errors = [];

      for (const p of patches) {
        try {
          const original = fs.readFileSync(p.filePath, 'utf8');
          const result = applyPatch(original, p.patch);
          fs.writeFileSync(p.filePath, result, 'utf8');
          applied++;
        } catch (err) {
          errors.push(`Failed to apply patch from ${p.agentId} to ${p.filePath}: ${err.message}`);
        }
      }

      return { applied, rejected: errors.length, errors };
    },
  };
}

module.exports = { createPatch, applyPatch, detectConflicts, createWorkspace };
