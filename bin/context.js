const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

class ContextAssembler {
  resolveImports(filePath, sourceFile) {
    const imports = [];
    const dirname = path.dirname(filePath);

    // Use TypeScript AST to find exactly what is imported and exported
    const visit = (node) => {
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      } else if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Resolve paths accurately
    const resolvedPaths = [];
    for (const rel of imports) {
      // Ignore node_modules, we only want local files
      if (!rel.startsWith('.') && !rel.startsWith('@/')) continue;
      
      let baseName = rel;
      if (rel.startsWith('@/')) {
        // Handle alias: map @ to src roughly
        baseName = path.join(process.cwd(), 'src', rel.slice(2));
      } else {
        baseName = path.join(dirname, rel);
      }

      // Find exact file extension
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
      let resolved = '';
      for (const ext of extensions) {
        if (fs.existsSync(baseName + ext)) {
          resolved = baseName + ext;
          break;
        }
      }
      if (resolved && !resolvedPaths.includes(resolved)) {
        resolvedPaths.push(resolved);
      }
    }
    return resolvedPaths;
  }

  buildGraph(entryFiles) {
    const visited = new Set();
    const queue = [...entryFiles];

    while (queue.length > 0) {
      const file = queue.shift();
      if (visited.has(file) || !fs.existsSync(file)) continue;
      visited.add(file);

      const content = fs.readFileSync(file, 'utf8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const deps = this.resolveImports(file, sourceFile);
      for (const dep of deps) {
        if (!visited.has(dep)) queue.push(dep);
      }
    }

    return Array.from(visited);
  }

  // Simplified PageRank implementation for files
  rankFiles(files, budget) {
    // For simplicity, we assume files closer to entry points (first ones in array) have higher priority.
    // In a real system, we would calculate indegree/outdegree graph metrics here.
    const ranked = [];
    let tokens = 0;

    for (const file of files) {
      const sizeBytes = fs.statSync(file).size;
      const content = fs.readFileSync(file, 'utf8');
      const estTokens = Math.ceil(content.length / 4); // Approximation

      if (tokens + estTokens > budget) break;

      tokens += estTokens;
      ranked.push({
        path: file,
        sizeBytes,
        tokens: estTokens
      });
    }

    return { ranked, totalTokens: tokens };
  }
}

module.exports = new ContextAssembler();
