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
   * Resolves explicit static import, export, and CommonJS require path strings using TypeScript AST.
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

    // Use TypeScript AST to find exactly what is imported, exported, or required
    const visit = (node) => {
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      } else if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          imports.push(node.moduleSpecifier.text);
        }
      } else if (ts.isCallExpression(node)) {
        if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
          if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
            imports.push(node.arguments[0].text);
          }
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
          path: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          sizeBytes,
          tokens: estTokens
        });
      } catch (e) {}
    }

    return { ranked, totalTokens: tokens };
  }

  /**
   * Recursively traverses filesystem directory nodes to construct an ASCII tree topology.
   * Normalizes output layout paths using platform-agnostic forward-slashes.
   * 
   * @returns {string} The formatted ASCII folder/file tree string.
   */
  generateRepoMap() {
    const root = process.cwd();
    let ascii = '';
    
    const buildTree = (dir, prefix = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true })
        .filter(item => !['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name))
        .sort((a, b) => a.name.localeCompare(b.name));
        
      items.forEach((item, idx) => {
        const isLast = idx === items.length - 1;
        const line = `${prefix}${isLast ? '└── ' : '├── '}${item.name}`;
        ascii += `${line}\n`;
        
        if (item.isDirectory()) {
          buildTree(path.join(dir, item.name), `${prefix}${isLast ? '    ' : '│   '}`);
        }
      });
    };
    
    buildTree(root);
    return ascii.replace(/\\/g, '/');
  }

  /**
   * Scans JS/TS files in the codebase, parses import linkages, and establishes explicit dependency graphs.
   * Normalizes files lists using forward-slash path structures.
   * 
   * @returns {{files: string[], dependencies: Map<string, string[]>, dependedBy: Map<string, string[]>}} The resolved files lists and import mappings.
   */
  generateDependencyGraph() {
    const root = process.cwd();
    const files = [];
    
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name)) continue;
            scanDir(path.join(dir, item.name));
          } else {
            const ext = path.extname(item.name);
            if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
              files.push(path.resolve(path.join(dir, item.name)));
            }
          }
        }
      } catch (e) {}
    };
    scanDir(root);

    const dependencies = new Map();
    const dependedBy = new Map();
    
    for (const f of files) {
      dependencies.set(f, []);
      dependedBy.set(f, []);
    }

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const sourceFile = ts.createSourceFile(
          file,
          content,
          ts.ScriptTarget.Latest,
          true
        );
        const resolved = this.resolveImports(file, sourceFile);
        for (const r of resolved) {
          const absR = path.resolve(r);
          if (dependencies.has(file) && !dependencies.get(file).includes(absR)) {
            dependencies.get(file).push(absR);
          }
          if (dependedBy.has(absR) && !dependedBy.get(absR).includes(file)) {
            dependedBy.get(absR).push(file);
          }
        }
      } catch (e) {}
    }

    return { files, dependencies, dependedBy };
  }

  /**
   * Generates dynamic repo mapping and module dependency graphs, writing them to context files.
   * 
   * @returns {void}
   * @throws {Error} If filesystem writes encounter access issues.
   */
  generateIndex() {
    console.log('⚡ Indexing repository...');
    
    // 1. Repo Map
    const mapPath = path.join(process.cwd(), 'context', 'repo-map.md');
    const asciiTree = this.generateRepoMap();
    const mapContent = `# Repository Structure Map — Veyra OS

This is the dynamically generated repository tree of Veyra OS. It is automatically indexed to assist AI agents in swift navigation.

## Directory Topology
\`\`\`
${asciiTree}\`\`\`

*Indexed at: ${new Date().toISOString()}*
`;
    fs.writeFileSync(mapPath, mapContent, 'utf8');
    console.log('✔ Repository index map written to context/repo-map.md');

    // 2. Dependency Graph
    const graphPath = path.join(process.cwd(), 'context', 'dependency-graph.md');
    const { files, dependencies, dependedBy } = this.generateDependencyGraph();
    
    let table = '| Module | Depends On | Depended By |\n| :--- | :--- | :--- |\n';
    let mermaid = '```mermaid\ngraph TD\n';
    let linkCount = 0;

    for (const f of files) {
      const relFile = path.relative(process.cwd(), f).replace(/\\/g, '/');
      const myDeps = dependencies.get(f).map(d => path.relative(process.cwd(), d).replace(/\\/g, '/'));
      const myRevDeps = dependedBy.get(f).map(d => path.relative(process.cwd(), d).replace(/\\/g, '/'));

      table += `| \`${relFile}\` | ${myDeps.map(d => `\`${d}\``).join(', ') || '*None*'} | ${myRevDeps.map(d => `\`${d}\``).join(', ') || '*None*'} |\n`;
      
      const fileId = relFile.replace(/[^a-zA-Z0-9]/g, '_');
      for (const d of myDeps) {
        const depId = d.replace(/[^a-zA-Z0-9]/g, '_');
        mermaid += `    ${fileId}["${relFile}"] --> ${depId}["${d}"]\n`;
        linkCount++;
      }
    }
    
    if (linkCount === 0) {
      mermaid += '    A["No module imports resolved yet"]\n';
    }
    
    mermaid += '```\n';

    const graphContent = `# Module Dependency Graph — Veyra OS

This document maps explicit module-level dependencies parsed directly from TypeScript/JavaScript import statements JIT.

## Dependency DAG Topology
${mermaid}

## Dependency Matrix Table
${table}

*Indexed at: ${new Date().toISOString()}*
`;
    fs.writeFileSync(graphPath, graphContent, 'utf8');
    console.log('✔ Module dependency graph written to context/dependency-graph.md');
  }
}

module.exports = new ContextAssembler();
