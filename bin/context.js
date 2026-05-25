const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

/**
 * 🧠 Hybrid Code Intelligence Engine
 * Blends strict local AST dependency graphs with global semantic scanning.
 * Captures decoupled components (API contracts, CSS styling, Event payloads, ORMs)
 * that compiler-level AST traversals are blind to.
 */
class ContextAssembler {
  
  /**
   * Resolves explicit static import and export path strings within a given file using the TypeScript AST.
   * 
   * @param {string} filePath - Absolute path to the source file being parsed.
   * @param {ts.SourceFile} sourceFile - TypeScript AST representation of the source file.
   * @returns {string[]} An array of absolute file paths resolved from the file's imports and exports.
   * @throws {Error} If filesystem verification encounters permissions or structural errors.
   * @example
   * const imports = contextAssembler.resolveImports('/path/to/main.ts', sourceFile);
   */
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
      if (!rel.startsWith('.') && !rel.startsWith('@/')) continue;
      
      let baseName = rel;
      if (rel.startsWith('@/')) {
        baseName = path.join(process.cwd(), 'src', rel.slice(2));
      } else {
        baseName = path.join(dirname, rel);
      }

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

  /**
   * Scans raw file contents using optimized regular expressions to discover
   * decoupled semantic anchors (REST routes, styling bindings, database payload configurations).
   * 
   * @param {string} filePath - Absolute path to the file to parse.
   * @returns {string[]} Ordered collection of semantic key tags mapped from content literals.
   * @throws {Error} If reading the file encounters filesystem errors.
   * @example
   * const keys = contextAssembler.extractSemanticKeys('/path/to/api-router.ts');
   */
  extractSemanticKeys(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Set();

    // 1. API Route Patterns: matches "/api/users", "GET /api/v1/auth"
    const routeRegex = /(?:\/api\/[\w\-\/]+)/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      keys.add(`route:${match[0]}`);
    }

    // 2. CSS class bindings in templates/JS
    const classRegex = /class(?:Name)?\s*=\s*["']([^"']+)["']/g;
    while ((match = classRegex.exec(content)) !== null) {
      const classes = match[1].split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        keys.add(`style:${cls}`);
      }
    }

    // 3. Database column/event payload mappings
    const schemaRegex = /(?:id|userId|email|status|title|payload|event|type|column)\s*[:=]\s*["']([\w\-]+)["']/g;
    while ((match = schemaRegex.exec(content)) !== null) {
      keys.add(`schema:${match[1]}`);
    }

    return Array.from(keys);
  }

  /**
   * Builds the comprehensive hybrid context graph using AST + Implicit semantic linking.
   * Integrates decoupled components into the direct execution graph.
   * 
   * @param {string[]} entryFiles - Relative or absolute paths to primary codebase entrypoints.
   * @returns {string[]} Unified array of file paths forming the total blast-radius scope of changes.
   * @throws {Error} If recursive directory traversal hits system bottlenecks.
   * @example
   * const fileScope = contextAssembler.buildGraph(['./index.js']);
   */
  buildGraph(entryFiles) {
    const visited = new Set();
    const queue = [...entryFiles];
    const fileSemanticKeys = new Map();
    const semanticIndex = new Map(); // key -> [files]

    // Step 1: Deterministic AST Traversal
    while (queue.length > 0) {
      const file = queue.shift();
      const absPath = path.resolve(file);
      if (visited.has(absPath) || !fs.existsSync(absPath)) continue;
      visited.add(absPath);

      try {
        const content = fs.readFileSync(absPath, 'utf8');
        const sourceFile = ts.createSourceFile(
          absPath,
          content,
          ts.ScriptTarget.Latest,
          true
        );

        const deps = this.resolveImports(absPath, sourceFile);
        for (const dep of deps) {
          const absDep = path.resolve(dep);
          if (!visited.has(absDep)) queue.push(absDep);
        }

        // Extract semantic keys for implicit linking
        const keys = this.extractSemanticKeys(absPath);
        fileSemanticKeys.set(absPath, keys);
        for (const key of keys) {
          if (!semanticIndex.has(key)) semanticIndex.set(key, []);
          semanticIndex.get(key).push(absPath);
        }
      } catch (err) {
        // Safe skip on unparseable/binary files
      }
    }

    // Step 2: Global Decoupled Code Discovery (implicit RAG fallback)
    const allProjFiles = [];
    const scanDir = (dir) => {
      if (allProjFiles.length > 200) return; // Cap directory scanning for performance
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name)) continue;
            scanDir(path.join(dir, item.name));
          } else {
            const ext = path.extname(item.name);
            if (['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].includes(ext)) {
              allProjFiles.push(path.join(dir, item.name));
            }
          }
        }
      } catch (e) {}
    };
    scanDir(process.cwd());

    // Extract keys for global files
    for (const file of allProjFiles) {
      const absPath = path.resolve(file);
      if (visited.has(absPath)) continue; 
      try {
        const keys = this.extractSemanticKeys(absPath);
        fileSemanticKeys.set(absPath, keys);
        for (const key of keys) {
          if (!semanticIndex.has(key)) semanticIndex.set(key, []);
          semanticIndex.get(key).push(absPath);
        }
      } catch (e) {}
    }

    // Step 3: Draw links between AST graph and Decoupled Files based on shared intents
    const hybridList = Array.from(visited);
    const addedDecoupled = new Set();

    for (const file of hybridList) {
      const myKeys = fileSemanticKeys.get(file) || [];
      for (const key of myKeys) {
        const matchingFiles = semanticIndex.get(key) || [];
        for (const matchFile of matchingFiles) {
          if (matchFile !== file && !visited.has(matchFile) && !addedDecoupled.has(matchFile)) {
            addedDecoupled.add(matchFile);
            hybridList.push(matchFile); // Pull semantic peer into context!
          }
        }
      }
    }

    return hybridList;
  }

  /**
   * Sorts and budget-filters compiled files to generate a final prioritized context structure.
   * 
   * @param {string[]} files - Scoped collection of target files.
   * @param {number} budget - Maximum token estimation permitted for context injection.
   * @returns {{ranked: Array<{path: string, sizeBytes: number, tokens: number}>, totalTokens: number}} Priority mapped ranked list and total token count.
   * @example
   * const rankedData = contextAssembler.rankFiles(files, 15000);
   */
  rankFiles(files, budget) {
    const ranked = [];
    let tokens = 0;

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      try {
        const sizeBytes = fs.statSync(file).size;
        const content = fs.readFileSync(file, 'utf8');
        const estTokens = Math.ceil(content.length / 4); // Token approximation

        if (tokens + estTokens > budget) continue; // Try smaller files rather than breaking entirely

        tokens += estTokens;
        ranked.push({
          path: path.relative(process.cwd(), file),
          sizeBytes,
          tokens: estTokens
        });
      } catch (e) {}
    }

    return { ranked, totalTokens: tokens };
  }
}

module.exports = new ContextAssembler();
