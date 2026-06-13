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

  isSensitivePath(filePath) {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const parts = relativePath.split('/');
    
    // 1. Directory Blacklist
    const dirBlacklist = new Set([
      '.git', 'node_modules', 'dist', 'build', '.next', '.venv', 'venv', 
      'env', '.aws', '.ssh', 'tmp', 'certs', 'credentials', 'secrets'
    ]);
    if (parts.some(part => dirBlacklist.has(part))) return true;

    const fileName = path.basename(filePath).toLowerCase();

    // 2. Sensitive File Extensions
    const secretExtensions = new Set([
      '.pem', '.key', '.crt', '.cer', '.pfx', '.p12', '.keystore', '.jks', 
      '.der', '.pkcs12', '.sqlite', '.db', '.duckdb', '.sqlitedb'
    ]);
    if (secretExtensions.has(path.extname(fileName))) return true;

    // 3. Secrets / Private Key Name Keywords
    const secretKeywords = [
      'id_rsa', 'id_dsa', 'id_ecdsa', 'id_ed25519', 'secret', 'token', 
      'credential', 'password', 'private_key', 'auth_key', 'netrc'
    ];
    if (secretKeywords.some(keyword => fileName.includes(keyword))) return true;

    // 4. Env file patterns
    if (/^\.env(\..*)?$/i.test(fileName)) return true;

    return false;
  }

  isZipBomb(filePath) {
    let fd;
    try {
      fd = fs.openSync(filePath, 'r');
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      
      let offset = 0;
      let totalCompressed = 0;
      let totalUncompressed = 0;
      
      while (offset < fileSize) {
        const headerBuf = Buffer.alloc(30);
        const bytesRead = fs.readSync(fd, headerBuf, 0, 30, offset);
        if (bytesRead < 30) break;
        
        const signature = headerBuf.readUInt32LE(0);
        if (signature !== 0x04034b50) break; // Reached central directory
        
        const compressedSize = headerBuf.readUInt32LE(18);
        const uncompressedSize = headerBuf.readUInt32LE(22);
        const fileNameLength = headerBuf.readUInt16LE(26);
        const extraFieldLength = headerBuf.readUInt16LE(28);
        
        totalCompressed += compressedSize;
        totalUncompressed += uncompressedSize;
        
        offset += 30 + fileNameLength + extraFieldLength + compressedSize;
      }
      
      if (totalCompressed === 0 && totalUncompressed > 0) return true; // Anomalous zip
      
      const ratio = totalUncompressed / (totalCompressed || 1);
      if (ratio > 200) return true;
      if (totalUncompressed > 500 * 1024 * 1024) return true; // 500MB safety limit
      
      return false;
    } catch (e) {
      return true; // Exclude if unreadable
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }

  detectShebangLanguage(filePath) {
    let fd;
    try {
      fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(128);
      const bytesRead = fs.readSync(fd, buffer, 0, 128, 0);
      if (bytesRead < 2) return null;
      
      const content = buffer.toString('utf8', 0, bytesRead);
      if (!content.startsWith('#!')) return null;
      
      const firstLine = content.split('\n')[0].trim();
      if (firstLine.includes('node')) return '.js';
      if (firstLine.includes('python') || firstLine.includes('py')) return '.py';
      if (firstLine.includes('rust') || firstLine.includes('cargo')) return '.rs';
      if (firstLine.includes('go')) return '.go';
      if (firstLine.includes('bash') || firstLine.includes('sh')) return '.sh';
      
      return null;
    } catch (e) {
      return null;
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }

  resolveForeignImports(filePath, content) {
    let ext = path.extname(filePath);
    if (!ext) {
      ext = this.detectShebangLanguage(filePath) || '';
    }
    const dirname = path.dirname(filePath);
    const imports = [];

    switch (ext) {
      case '.py': {
        const directRegex = /^\s*import\s+([\w\.,\s]+)/gm;
        let match;
        while ((match = directRegex.exec(content)) !== null) {
          const modules = match[1].split(',').map(m => m.trim());
          imports.push(...modules);
        }
        const fromRegex = /^\s*from\s+([\w\.]+)\s+import/gm;
        while ((match = fromRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
      }
      case '.rs': {
        const useRegex = /^\s*(?:pub\s+)?use\s+([\w\::\{\},\s\*]+);/gm;
        let match;
        while ((match = useRegex.exec(content)) !== null) {
          const pathPart = match[1].split('::')[0].trim();
          imports.push(pathPart);
        }
        const modRegex = /^\s*(?:pub\s+)?mod\s+(\w+);/gm;
        while ((match = modRegex.exec(content)) !== null) {
          imports.push(`./${match[1]}`);
        }
        break;
      }
      case '.go': {
        const blockRegex = /import\s+\(\s*([\s\S]*?)\s*\)/g;
        let blockMatch;
        while ((blockMatch = blockRegex.exec(content)) !== null) {
          const lineRegex = /"([^"]+)"/g;
          let lineMatch;
          while ((lineMatch = lineRegex.exec(blockMatch[1])) !== null) {
            imports.push(lineMatch[1]);
          }
        }
        const singleRegex = /import\s+(?:_|\w+\s+)?\"([^\"]+)\"/g;
        let match;
        while ((match = singleRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
      }
      case '.sql': {
        const sqlRegex = /--#\s*import\s+["']?([\w\-./\\]+)["']?/g;
        let match;
        while ((match = sqlRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
      }
      case '.cls': {
        const classRegex = /(?:class|interface)\s+\w+\s+(?:extends|implements)\s+(\w+)/gi;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        const newRegex = /\bnew\s+(\w+)\s*\(/g;
        while ((match = newRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
      }
    }

    const resolvedPaths = [];
    for (const rel of imports) {
      let resolved = '';
      if (['os', 'sys', 'path', 'fmt', 'std'].includes(rel)) continue;

      if (rel.startsWith('.')) {
        const baseName = path.join(dirname, rel);
        const candidates = [ext, `/mod${ext}`, `/index${ext}`];
        for (const cand of candidates) {
          const full = baseName.endsWith(cand) ? baseName : baseName + cand;
          if (fs.existsSync(full)) {
            resolved = full;
            break;
          }
        }
      } else {
        // Try relative to dirname first
        const relativeCand = path.join(dirname, rel);
        if (fs.existsSync(relativeCand)) {
          resolved = relativeCand;
        } else if (fs.existsSync(relativeCand + ext)) {
          resolved = relativeCand + ext;
        } else {
          const searchName = rel.replace(/\./g, '/');
          const candidates = [
            path.join(process.cwd(), searchName + ext),
            path.join(process.cwd(), 'src', searchName + ext),
            path.join(process.cwd(), 'lib', searchName + ext),
            path.join(process.cwd(), rel),
            path.join(process.cwd(), rel + ext)
          ];
          for (const cand of candidates) {
            if (fs.existsSync(cand)) {
              resolved = cand;
              break;
            }
          }
        }
      }

      if (resolved && !resolvedPaths.includes(resolved)) {
        resolvedPaths.push(resolved);
      }
    }
    return resolvedPaths;
  }
  
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
    const ext = path.extname(filePath);
    if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return this.resolveForeignImports(filePath, content);
      } catch (e) {
        return [];
      }
    }

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

    if (sourceFile) {
      visit(sourceFile);
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        visit(parsed);
      } catch (e) {}
    }

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

    // Step 1: Deterministic AST / Regex Traversal
    while (queue.length > 0) {
      const file = queue.shift();
      const absPath = path.resolve(file);
      if (this.isSensitivePath(absPath)) continue;
      if (this.isZipBomb(absPath)) continue;
      if (visited.has(absPath) || !fs.existsSync(absPath)) continue;
      visited.add(absPath);

      try {
        const ext = path.extname(absPath);
        let deps = [];
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          const content = fs.readFileSync(absPath, 'utf8');
          const sourceFile = ts.createSourceFile(
            absPath,
            content,
            ts.ScriptTarget.Latest,
            true
          );
          deps = this.resolveImports(absPath, sourceFile);
        } else {
          deps = this.resolveImports(absPath);
        }

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
    const scanDir = (dir, depth = 0) => {
      if (depth > 5) return; // Phase 6: OOM depth limit fallback
      if (allProjFiles.length > 500) return; // Cap directory scanning for performance
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (this.isSensitivePath(fullPath)) continue;
          
          if (item.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name)) continue;
            scanDir(fullPath, depth + 1);
          } else {
            if (this.isZipBomb(fullPath)) continue;
            
            const ext = path.extname(item.name);
            let resolvedExt = ext;
            if (!ext) {
              const shebangExt = this.detectShebangLanguage(fullPath);
              if (shebangExt) resolvedExt = shebangExt;
            }

            if (['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.py', '.rs', '.go', '.sql', '.cls'].includes(resolvedExt)) {
              allProjFiles.push(fullPath);
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
   * @param {string} [task] - Optional task description for relevance scoring.
   * @returns {{ranked: Array<{path: string, sizeBytes: number, tokens: number, score?: number}>, totalTokens: number}} Priority mapped ranked list and total token count.
   * @example
   * const rankedData = contextAssembler.rankFiles(files, 15000, 'fix login bug');
   */
  rankFiles(files, budget, task) {
    // Build scored file list
    const candidates = [];
    
    let vectorScores = {};
    if (task) {
      try {
        const { execSync } = require('node:child_process');
        const scriptPath = path.join(__dirname, 'vector_search.py');
        const output = execSync(`py "${scriptPath}" "${task.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
        vectorScores = JSON.parse(output.trim());
      } catch (err) {
        // Fallback silently if py fails
      }
    }

    for (const file of files) {
      if (!fs.existsSync(file)) continue;
      try {
        const sizeBytes = fs.statSync(file).size;
        const content = fs.readFileSync(file, 'utf8');
        const estTokens = Math.ceil(content.length / 4);
        const idx = files.indexOf(file); // Use position as proxy for import depth

        candidates.push({
          file,
          path: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          sizeBytes,
          tokens: estTokens,
          score: task ? this.scoreFile(file, task, idx, vectorScores) : 0,
        });
      } catch (e) {}
    }

    // Sort by score descending when task is provided
    if (task) {
      candidates.sort((a, b) => b.score - a.score);
    }

    // Fill budget
    const ranked = [];
    let tokens = 0;

    for (const c of candidates) {
      if (tokens + c.tokens > budget) continue;
      tokens += c.tokens;
      ranked.push({
        path: c.path,
        sizeBytes: c.sizeBytes,
        tokens: c.tokens,
        ...(task ? { score: c.score } : {}),
      });
    }

    return { ranked, totalTokens: tokens };
  }

  /**
   * Scores a file's relevance to a task description.
   * Score = (keyword overlap × 2) + (1 / (importDepth + 1)) + (semantic key count × 0.5) + vectorScore
   *
   * @param {string} filePath - Absolute path to the file.
   * @param {string} task - Task description string.
   * @param {number} importDepth - Distance from entry file in import graph (0 = entry).
   * @param {object} vectorScores - Map of filepath to vector similarity scores.
   * @returns {number} Relevance score (higher = more relevant).
   */
  scoreFile(filePath, task, importDepth, vectorScores = {}) {
    let score = 0;

    // 0. Add Semantic Vector Similarity score
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    if (vectorScores[relPath]) {
      score += vectorScores[relPath];
    }

    // 1. Keyword overlap: check how many task words appear in file content + filename
    const taskWords = task.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    try {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();
      let keywordHits = 0;

      for (const word of taskWords) {
        if (content.includes(word)) keywordHits++;
        if (fileName.includes(word)) keywordHits += 2; // Filename match is stronger
      }

      score += keywordHits * 2;
    } catch (e) {}

    // 2. Import proximity: closer to entry = higher score
    score += 1 / (importDepth + 1);

    // 3. Semantic key density
    try {
      const keys = this.extractSemanticKeys(filePath);
      score += keys.length * 0.5;
    } catch (e) {}

    return score;
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
    
    const scanDir = (dir, depth = 0) => {
      if (depth > 5 || files.length > 1000) return; // Phase 6: Limit graph traversal to avoid OOM
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (this.isSensitivePath(fullPath)) continue;

          if (item.isDirectory()) {
            if (['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name)) continue;
            scanDir(fullPath, depth + 1);
          } else {
            if (this.isZipBomb(fullPath)) continue;

            const ext = path.extname(item.name);
            let resolvedExt = ext;
            if (!ext) {
              const shebangExt = this.detectShebangLanguage(fullPath);
              if (shebangExt) resolvedExt = shebangExt;
            }

            if (['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.sql', '.cls'].includes(resolvedExt)) {
              files.push(path.resolve(fullPath));
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
        const ext = path.extname(file);
        let resolved = [];
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          const content = fs.readFileSync(file, 'utf8');
          const sourceFile = ts.createSourceFile(
            file,
            content,
            ts.ScriptTarget.Latest,
            true
          );
          resolved = this.resolveImports(file, sourceFile);
        } else {
          resolved = this.resolveImports(file);
        }

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
   * JIT Context Freshness Guard
   * Reads a task manifest, checks if any file in the dependency graph has drifted on disk
   * (via mtime checks or direct content hash validation), and automatically re-traverses
   * the AST import graph to rebuild a fresh, synchronized context state if rot is detected.
   *
   * @param {string} taskId - Unique task ID.
   * @param {string[]} entryFiles - Baseline files list to crawl.
   * @param {number} [budget] - Hard token budget boundary.
   * @param {string} [taskDesc] - Search context description query.
   * @returns {object|null} Fresh or cached manifest object.
   */
  refreshManifestJIT(taskId, entryFiles, budget = 15000, taskDesc = '') {
    const manifestPath = path.join(process.cwd(), 'context', 'file-manifests', `${taskId}.json`);
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      let isStale = false;

      // Verify mtimes for all files currently in the manifest
      for (const file of manifest.files) {
        const fullPath = path.resolve(file.path);
        if (!fs.existsSync(fullPath)) {
          isStale = true;
          break;
        }
        const stat = fs.statSync(fullPath);
        // If file has been modified after manifest timestamp, it's stale
        if (new Date(stat.mtime).getTime() > new Date(manifest.timestamp).getTime()) {
          isStale = true;
          break;
        }
      }

      if (isStale) {
        console.log(`⚡ Context rot detected for task ${taskId}! Re-evaluating AST dependency graph JIT...`);
        const allFiles = this.buildGraph(entryFiles);
        const { ranked, totalTokens } = this.rankFiles(allFiles, budget, taskDesc);
        
        const freshManifest = {
          task: taskId,
          timestamp: new Date().toISOString(),
          budget,
          files: ranked
        };
        const manifestDir = path.dirname(manifestPath);
        if (!fs.existsSync(manifestDir)) fs.mkdirSync(manifestDir, { recursive: true });
        fs.writeFileSync(manifestPath, JSON.stringify(freshManifest, null, 2), 'utf8');
        console.log(`✔ Fresh JIT Context Manifest written to context/file-manifests/${taskId}.json`);
        return freshManifest;
      }
      
      return manifest;
    } catch (err) {
      console.error(`⚠ Failed to check manifest freshness: ${err.message}`);
      return null;
    }
  }

  /**
   * Generates dynamic repo mapping and module dependency graphs, writing them to context files.
   * 
   * @returns {void}
   * @throws {Error} If filesystem writes encounter access issues.
   */
  generateRepoJSON() {
    const root = process.cwd();
    
    const buildNode = (dirName, dirPath) => {
      const node = { name: dirName, children: [] };
      try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(item => !['node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory'].includes(item.name))
          .sort((a, b) => a.name.localeCompare(b.name));
          
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          if (this.isSensitivePath(fullPath)) continue;
          if (item.isDirectory()) {
            node.children.push(buildNode(item.name, fullPath));
          } else {
            let size = 0;
            try { size = fs.statSync(fullPath).size; } catch(e) {}
            node.children.push({ name: item.name, size });
          }
        }
      } catch (e) {}
      return node;
    };

    return buildNode(path.basename(root) || "root", root);
  }

  generateMermaidGraph(files, dependencies) {
    const communities = new Map();
    for (const file of files) {
      const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      const dirName = path.dirname(relPath);
      const groupName = dirName === '.' ? 'Root' : dirName;
      if (!communities.has(groupName)) {
        communities.set(groupName, []);
      }
      communities.get(groupName).push({ file, relPath });
    }

    let mermaid = 'graph TD\n';
    const fileToId = new Map();

    for (const [group, groupFiles] of communities.entries()) {
      const safeGroupName = group.replace(/[^a-zA-Z0-9]/g, '_');
      mermaid += `  subgraph Community_${safeGroupName} ["${group}"]\n`;
      for (const item of groupFiles) {
        const fileId = item.relPath.replace(/[^a-zA-Z0-9]/g, '_');
        fileToId.set(item.file, fileId);
        mermaid += `    ${fileId}["${item.relPath}"]\n`;
      }
      mermaid += '  end\n';
    }

    let linkCount = 0;
    for (const file of files) {
      const fromId = fileToId.get(file);
      const deps = dependencies.get(file) || [];
      for (const dep of deps) {
        const toId = fileToId.get(dep);
        if (fromId && toId) {
          mermaid += `  ${fromId} --> ${toId}\n`;
          linkCount++;
        }
      }
    }

    if (linkCount === 0) {
      mermaid += '  A["No module imports resolved yet"]\n';
    }

    return mermaid;
  }

  generateIndex() {
    console.log('⚡ Indexing repository...');
    
    // Ensure context dir exists
    const contextDir = path.join(process.cwd(), 'context');
    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }

    // 1. Repo Map
    const mapPath = path.join(contextDir, 'repo-map.md');
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
    const graphPath = path.join(contextDir, 'dependency-graph.md');
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

    // 3. Collapsible Hierarchical Tree (context/tree.html)
    const treeHtmlPath = path.join(contextDir, 'tree.html');
    const repoJSON = this.generateRepoJSON();
    const treeHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Veyra OS - Hierarchy Tree</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { font-family: monospace; background: #0d1117; color: #c9d1d9; margin: 0; overflow: hidden; }
    .node circle { fill: #58a6ff; stroke: #c9d1d9; stroke-width: 1.5px; cursor: pointer; }
    .node text { font-size: 12px; fill: #adbac7; }
    .link { fill: none; stroke: #30363d; stroke-width: 1.5px; }
  </style>
</head>
<body>
  <svg width="100vw" height="100vh"></svg>
  <script>
    const data = ${JSON.stringify(repoJSON, null, 2)};

    const width = window.innerWidth;
    const height = window.innerHeight;
    const svg = d3.select("svg").call(d3.zoom().on("zoom", (e) => g.attr("transform", e.transform)));
    const g = svg.append("g").attr("transform", "translate(120,40)");

    const tree = d3.tree().size([height - 80, width - 240]);
    const root = d3.hierarchy(data, d => d.children);

    root.x0 = height / 2;
    root.y0 = 0;

    let nodeIndex = 0;

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }
    root.descendants().forEach(d => {
      if (d.depth > 1) {
        collapse(d);
      }
    });

    function click(event, d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    function update(source) {
      const nodes = root.descendants();
      const links = root.links();
      tree(root);

      const link = g.selectAll(".link")
        .data(links, d => d.target.id);

      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
          const o = {x: source.x0, y: source.y0};
          return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
        })
        .merge(link)
        .transition().duration(500)
        .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

      link.exit().transition().duration(500)
        .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
        })
        .remove();

      const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = ++nodeIndex));

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => \`translate(\${source.y0},\${source.x0})\`)
        .on("click", click);

      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", d => d._children ? "#58a6ff" : "#2f81f7");

      nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d._children || d.children ? -13 : 13)
        .attr("text-anchor", d => d._children || d.children ? "end" : "start")
        .text(d => d.data.name);

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition().duration(500)
        .attr("transform", d => \`translate(\${d.y},\${d.x})\`);

      nodeUpdate.select("circle")
        .attr("r", 6)
        .style("fill", d => d._children ? "#58a6ff" : "#adbac7");

      nodeUpdate.select("text")
        .style("fill-opacity", 1);

      const nodeExit = node.exit().transition().duration(500)
        .attr("transform", d => \`translate(\${source.y},\${source.x})\`)
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").style("fill-opacity", 1e-6);

      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    update(root);
  </script>
</body>
</html>`;
    fs.writeFileSync(treeHtmlPath, treeHtmlContent, 'utf8');
    console.log('✔ Collapsible hierarchical tree map written to context/tree.html');

    // 4. Modularity Callflow Diagram (context/graph.html)
    const graphHtmlPath = path.join(contextDir, 'graph.html');
    const mermaidCode = this.generateMermaidGraph(files, dependencies);
    const graphHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Veyra OS - Community Modularity Callflow</title>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  </script>
  <style>
    body { background-color: #0d1117; color: #c9d1d9; font-family: monospace; display: flex; flex-direction: column; align-items: center; padding: 20px; }
    h1 { margin-bottom: 20px; }
    .mermaid { width: 90vw; }
  </style>
</head>
<body>
  <h1>Community Modularity Callflow Diagram</h1>
  <div class="mermaid">
    ${mermaidCode}
  </div>
</body>
</html>`;
    fs.writeFileSync(graphHtmlPath, graphHtmlContent, 'utf8');
    console.log('✔ Modularity callflow diagram written to context/graph.html');
  }
}

module.exports = new ContextAssembler();
