const path = require('node:path');

function sanitizePathSegment(segment) {
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_') || '_';
}

function sandboxPathFor(sandboxDir, filePath, rootDir = process.cwd()) {
  const sandboxRoot = path.resolve(sandboxDir);
  const workspaceRoot = path.resolve(rootDir);
  const absoluteFilePath = path.resolve(filePath);
  const workspaceRelativePath = path.relative(workspaceRoot, absoluteFilePath);

  let targetPath;
  if (workspaceRelativePath && !workspaceRelativePath.startsWith('..') && !path.isAbsolute(workspaceRelativePath)) {
    targetPath = path.resolve(sandboxRoot, workspaceRelativePath);
  } else {
    const parsed = path.parse(absoluteFilePath);
    const rootSegment = sanitizePathSegment(parsed.root);
    const pathSegments = absoluteFilePath
      .slice(parsed.root.length)
      .split(/[\\/]+/)
      .filter(Boolean)
      .map(sanitizePathSegment);
    targetPath = path.resolve(sandboxRoot, '__external__', rootSegment, ...pathSegments);
  }

  const sandboxRelativePath = path.relative(sandboxRoot, targetPath);
  if (!sandboxRelativePath || sandboxRelativePath.startsWith('..') || path.isAbsolute(sandboxRelativePath)) {
    throw new Error(`Sandbox path escaped sandbox root: ${filePath}`);
  }

  return targetPath;
}

module.exports = { sandboxPathFor };
