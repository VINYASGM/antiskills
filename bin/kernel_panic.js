const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const ts = require('typescript');

function parseLine(line) {
  // 1. Matches stack trace format inside parentheses, e.g. (C:\path\file.ts:12:34) or (C:\path\file.ts(12,34))
  const parenMatch = line.match(/\(([^()]+):(\d+):(\d+)\)/);
  if (parenMatch) {
    return {
      filePath: parenMatch[1],
      line: parseInt(parenMatch[2], 10),
      column: parseInt(parenMatch[3], 10)
    };
  }
  const parenParenMatch = line.match(/\(([^()]+)\((\d+),(\d+)\)\)/);
  if (parenParenMatch) {
    return {
      filePath: parenParenMatch[1],
      line: parseInt(parenParenMatch[2], 10),
      column: parseInt(parenParenMatch[3], 10)
    };
  }

  // 2. Matches stack trace format starting with 'at ', e.g. "at C:\path\file.ts:12:34"
  const atMatch = line.match(/^\s*at\s+([a-zA-Z]:\\[^:]+|[^\s].*?):(\d+):(\d+)/);
  if (atMatch) {
    return {
      filePath: atMatch[1],
      line: parseInt(atMatch[2], 10),
      column: parseInt(atMatch[3], 10)
    };
  }

  // 3. Matches file.ts(12,34) style
  const winMatchParen = line.match(/([a-zA-Z]:\\[^()]+|[^()\s]+)\((\d+),(\d+)\)/);
  if (winMatchParen) {
    return {
      filePath: winMatchParen[1],
      line: parseInt(winMatchParen[2], 10),
      column: parseInt(winMatchParen[3], 10)
    };
  }

  // 4. Matches file.ts:12:34 style
  const colonMatch = line.match(/([a-zA-Z]:\\[^:]+|[^:\s]+):(\d+):(\d+)/);
  if (colonMatch) {
    return {
      filePath: colonMatch[1],
      line: parseInt(colonMatch[2], 10),
      column: parseInt(colonMatch[3], 10)
    };
  }
  return null;
}

function findExistingFileLocation(stderr, sandboxDir) {
  if (!stderr) return null;
  const lines = stderr.split(/\r?\n/);
  for (const line of lines) {
    const match = parseLine(line);
    if (match) {
      let resolvedPath = match.filePath.trim();
      resolvedPath = resolvedPath.replace(/^['"]|['"]$/g, '');
      
      let absolutePath = resolvedPath;
      if (!path.isAbsolute(absolutePath)) {
        if (sandboxDir) {
          absolutePath = path.resolve(sandboxDir, resolvedPath);
        } else {
          absolutePath = path.resolve(process.cwd(), resolvedPath);
        }
      }
      
      if (fs.existsSync(absolutePath)) {
        return {
          filePath: absolutePath,
          line: match.line,
          column: match.column
        };
      }
      
      if (sandboxDir && !path.isAbsolute(resolvedPath)) {
        const fallbackPath = path.resolve(process.cwd(), resolvedPath);
        if (fs.existsSync(fallbackPath)) {
          return {
            filePath: fallbackPath,
            line: match.line,
            column: match.column
          };
        }
      }
    }
  }
  return null;
}

function findDeepestNode(node, pos, sourceFile) {
  let deepest = node;
  node.forEachChild(child => {
    const start = child.getStart(sourceFile);
    const end = child.getEnd();
    if (pos >= start && pos <= end) {
      deepest = findDeepestNode(child, pos, sourceFile);
    }
  });
  return deepest;
}

function getDeepestASTNode(filePath, line, column) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let scriptKind = ts.ScriptKind.TS;
    if (filePath.endsWith('.tsx')) {
      scriptKind = ts.ScriptKind.TSX;
    } else if (filePath.endsWith('.jsx')) {
      scriptKind = ts.ScriptKind.JSX;
    } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
      scriptKind = ts.ScriptKind.JS;
    }
    
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );
    
    const lineIdx = Math.max(0, line - 1);
    const colIdx = Math.max(0, column - 1);
    
    let pos;
    try {
      pos = sourceFile.getPositionOfLineAndCharacter(lineIdx, colIdx);
    } catch (e) {
      return null;
    }
    
    const deepestNode = findDeepestNode(sourceFile, pos, sourceFile);
    if (!deepestNode) return null;
    
    let name = undefined;
    if (deepestNode.name && typeof deepestNode.name.text === 'string') {
      name = deepestNode.name.text;
    } else if (typeof deepestNode.text === 'string' && ts.isIdentifier(deepestNode)) {
      name = deepestNode.text;
    }
    
    return {
      kind: deepestNode.kind,
      kindName: ts.SyntaxKind[deepestNode.kind],
      name,
      start: deepestNode.getStart(sourceFile),
      end: deepestNode.getEnd(),
      text: deepestNode.getText(sourceFile)
    };
  } catch (e) {
    return null;
  }
}

function handleKernelPanic(execErr, sandboxDir) {
  const errDetails = execErr.stderr ? execErr.stderr.toString() : execErr.message;
  const stderrStr = execErr.stderr ? execErr.stderr.toString() : '';
  
  const location = findExistingFileLocation(stderrStr, sandboxDir);
  let astNode = null;
  if (location) {
    astNode = getDeepestASTNode(location.filePath, location.line, location.column);
  }
  
  const report = {
    rawError: errDetails,
    location: location || null,
    astNode: astNode || null
  };
  
  const reportPath = path.resolve(process.cwd(), 'memory/evidence/kernel_panic_report.json.gz');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  const jsonStr = JSON.stringify(report, null, 2);
  const compressed = zlib.gzipSync(jsonStr);
  fs.writeFileSync(reportPath, compressed);
}

module.exports = {
  handleKernelPanic,
  parseErrorLocation: findExistingFileLocation,
  getDeepestASTNode
};
