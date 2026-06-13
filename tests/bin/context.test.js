const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * ContextAssembler Tests
 * Tests AST import resolution, semantic key extraction, graph building, and file ranking.
 */

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-context-test-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('ContextAssembler — extractSemanticKeys', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    // context.js is a singleton but doesn't bind to cwd in constructor
    const ctxPath = require.resolve('../../bin/context.js');
    delete require.cache[ctxPath];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('extracts API route patterns', () => {
    const filePath = path.join(tmpDir, 'src', 'routes.ts');
    fs.writeFileSync(filePath, `
      app.get('/api/users', handler);
      app.post('/api/users/create', handler);
    `);

    const keys = contextAssembler.extractSemanticKeys(filePath);
    expect(keys).toContain('route:/api/users');
    expect(keys).toContain('route:/api/users/create');
  });

  test('extracts CSS class bindings', () => {
    const filePath = path.join(tmpDir, 'src', 'Button.tsx');
    fs.writeFileSync(filePath, `
      <div className="btn-primary active"></div>
    `);

    const keys = contextAssembler.extractSemanticKeys(filePath);
    expect(keys).toContain('style:btn-primary');
    expect(keys).toContain('style:active');
  });

  test('extracts database column mappings', () => {
    const filePath = path.join(tmpDir, 'src', 'schema.ts');
    fs.writeFileSync(filePath, `
      const config = { userId: 'user_id', email: 'email_field' };
    `);

    const keys = contextAssembler.extractSemanticKeys(filePath);
    expect(keys).toContain('schema:user_id');
    expect(keys).toContain('schema:email_field');
  });

  test('returns empty array for file with no semantic anchors', () => {
    const filePath = path.join(tmpDir, 'src', 'util.ts');
    fs.writeFileSync(filePath, `
      function add(a, b) { return a + b; }
    `);

    const keys = contextAssembler.extractSemanticKeys(filePath);
    expect(keys.length).toBe(0);
  });
});

describe('ContextAssembler — resolveImports', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;
  let ts;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
    ts = require('typescript');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('resolves relative .ts imports', () => {
    const utilPath = path.join(tmpDir, 'src', 'util.ts');
    const mainPath = path.join(tmpDir, 'src', 'main.ts');

    fs.writeFileSync(utilPath, 'export const x = 1;');
    fs.writeFileSync(mainPath, "import { x } from './util';");

    const mainContent = fs.readFileSync(mainPath, 'utf8');
    const sourceFile = ts.createSourceFile(mainPath, mainContent, ts.ScriptTarget.Latest, true);
    const resolved = contextAssembler.resolveImports(mainPath, sourceFile);

    expect(resolved.length).toBe(1);
    expect(resolved[0]).toBe(utilPath);
  });

  test('resolves require() calls', () => {
    const helperPath = path.join(tmpDir, 'src', 'helper.js');
    const indexPath = path.join(tmpDir, 'src', 'index.js');

    fs.writeFileSync(helperPath, 'module.exports = {};');
    fs.writeFileSync(indexPath, "const helper = require('./helper');");

    const content = fs.readFileSync(indexPath, 'utf8');
    const sourceFile = ts.createSourceFile(indexPath, content, ts.ScriptTarget.Latest, true);
    const resolved = contextAssembler.resolveImports(indexPath, sourceFile);

    expect(resolved.length).toBe(1);
    expect(resolved[0]).toBe(helperPath);
  });

  test('skips non-relative imports (node_modules)', () => {
    const mainPath = path.join(tmpDir, 'src', 'main.ts');
    fs.writeFileSync(mainPath, "import express from 'express';");

    const content = fs.readFileSync(mainPath, 'utf8');
    const sourceFile = ts.createSourceFile(mainPath, content, ts.ScriptTarget.Latest, true);
    const resolved = contextAssembler.resolveImports(mainPath, sourceFile);

    expect(resolved.length).toBe(0);
  });
});

describe('ContextAssembler — buildGraph', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('builds graph from entry files following imports', () => {
    fs.writeFileSync(path.join(tmpDir, 'src', 'a.ts'), "import { b } from './b';");
    fs.writeFileSync(path.join(tmpDir, 'src', 'b.ts'), "import { c } from './c';");
    fs.writeFileSync(path.join(tmpDir, 'src', 'c.ts'), 'export const c = 1;');

    const files = contextAssembler.buildGraph([path.join(tmpDir, 'src', 'a.ts')]);

    // Should include a.ts, b.ts, c.ts via transitive imports
    const relativePaths = files.map(f => path.relative(tmpDir, f).replace(/\\/g, '/'));
    expect(relativePaths).toContain('src/a.ts');
    expect(relativePaths).toContain('src/b.ts');
    expect(relativePaths).toContain('src/c.ts');
  });

  test('includes decoupled files via shared semantic keys', () => {
    // Entry file has an API route
    fs.writeFileSync(path.join(tmpDir, 'src', 'main.ts'), `
      app.get('/api/users', handler);
    `);
    // Decoupled file shares the same route pattern
    fs.writeFileSync(path.join(tmpDir, 'src', 'client.ts'), `
      fetch('/api/users');
    `);

    const files = contextAssembler.buildGraph([path.join(tmpDir, 'src', 'main.ts')]);
    const relativePaths = files.map(f => path.relative(tmpDir, f).replace(/\\/g, '/'));

    expect(relativePaths).toContain('src/main.ts');
    expect(relativePaths).toContain('src/client.ts');
  });
});

describe('ContextAssembler — rankFiles', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('respects token budget — skips files that would exceed', () => {
    // Create a small file (~10 tokens) and a large file (~5000 tokens)
    const smallFile = path.join(tmpDir, 'src', 'small.ts');
    const largeFile = path.join(tmpDir, 'src', 'large.ts');

    fs.writeFileSync(smallFile, 'const x = 1;'); // ~4 chars = ~1 token
    fs.writeFileSync(largeFile, 'x'.repeat(20000)); // ~5000 tokens

    const { ranked, totalTokens } = contextAssembler.rankFiles(
      [smallFile, largeFile],
      100 // Very tight budget
    );

    // Small file fits, large file skipped
    expect(ranked.length).toBe(1);
    expect(totalTokens).toBeLessThan(100);
  });

  test('current behavior is FIFO (baseline — will change in Phase 3)', () => {
    const fileA = path.join(tmpDir, 'src', 'a.ts');
    const fileB = path.join(tmpDir, 'src', 'b.ts');

    fs.writeFileSync(fileA, 'const a = 1;');
    fs.writeFileSync(fileB, 'const b = 2;');

    const { ranked } = contextAssembler.rankFiles([fileA, fileB], 10000);

    // Currently FIFO — first in list appears first in ranked
    expect(ranked[0].path).toContain('a.ts');
    expect(ranked[1].path).toContain('b.ts');
  });
});

// ──────────────────────────────────────────────
// Phase 3: Relevance Scoring tests
// ──────────────────────────────────────────────

describe('ContextAssembler — Relevance Scoring (Phase 3)', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('scoreFile() method exists and returns a number', () => {
    const filePath = path.join(tmpDir, 'src', 'test.ts');
    fs.writeFileSync(filePath, 'const x = 1;');

    expect(typeof contextAssembler.scoreFile).toBe('function');
    const score = contextAssembler.scoreFile(filePath, 'fix login bug', 0);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('task keyword matching boosts file score', () => {
    const loginFile = path.join(tmpDir, 'src', 'login.ts');
    const unrelatedFile = path.join(tmpDir, 'src', 'utils.ts');

    fs.writeFileSync(loginFile, `
      // Login form validation
      function validateLogin(email, password) { return true; }
    `);
    fs.writeFileSync(unrelatedFile, `
      function formatDate(d) { return d.toISOString(); }
    `);

    const loginScore = contextAssembler.scoreFile(loginFile, 'fix login validation', 0);
    const utilScore = contextAssembler.scoreFile(unrelatedFile, 'fix login validation', 0);

    expect(loginScore).toBeGreaterThan(utilScore);
  });

  test('files closer to entry in import graph score higher', () => {
    const filePath = path.join(tmpDir, 'src', 'test.ts');
    fs.writeFileSync(filePath, 'const x = 1;');

    const nearScore = contextAssembler.scoreFile(filePath, 'some task', 0); // depth 0
    const farScore = contextAssembler.scoreFile(filePath, 'some task', 5);  // depth 5

    expect(nearScore).toBeGreaterThan(farScore);
  });

  test('rankFiles with task sorts by relevance, not insertion order', () => {
    const loginFile = path.join(tmpDir, 'src', 'login.ts');
    const utilFile = path.join(tmpDir, 'src', 'utils.ts');

    fs.writeFileSync(loginFile, `
      // Authentication and login logic
      function login(email, password) { return true; }
    `);
    fs.writeFileSync(utilFile, `
      function add(a, b) { return a + b; }
    `);

    // Pass utilFile FIRST — if relevance works, loginFile should still rank higher
    const { ranked } = contextAssembler.rankFiles(
      [utilFile, loginFile],
      10000,
      'fix login authentication bug'
    );

    expect(ranked.length).toBe(2);
    // Login file should be ranked first despite being second in input
    expect(ranked[0].path).toContain('login.ts');
  });
});

describe('ContextAssembler — Milestone 20 Security and Visualizations', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    delete require.cache[require.resolve('../../bin/context.js')];
  });

  test('isSensitivePath flags sensitive files and directories', () => {
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, '.git', 'config'))).toBe(true);
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'src', '.env'))).toBe(true);
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'id_rsa'))).toBe(true);
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'secrets', 'passwords.txt'))).toBe(true);
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'credentials.pem'))).toBe(true);
    
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'src', 'index.js'))).toBe(false);
    expect(contextAssembler.isSensitivePath(path.join(tmpDir, 'lib', 'utils.ts'))).toBe(false);
  });

  test('isZipBomb detects zip bombs and allows safe zips', () => {
    const bombPath = path.join(tmpDir, 'bomb.zip');
    const safePath = path.join(tmpDir, 'safe.zip');
    const normalPath = path.join(tmpDir, 'normal.txt');

    // Simulated Zip-Bomb (ratio 500:1)
    const bombBuf = Buffer.alloc(34);
    bombBuf.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    bombBuf.writeUInt32LE(10, 18); // Compressed Size
    bombBuf.writeUInt32LE(5000, 22); // Uncompressed Size
    bombBuf.writeUInt16LE(4, 26); // Filename length
    bombBuf.writeUInt16LE(0, 28); // Extra field length
    bombBuf.write('test', 30);
    fs.writeFileSync(bombPath, bombBuf);

    // Simulated Safe Zip (ratio 2:1)
    const safeBuf = Buffer.alloc(34);
    safeBuf.writeUInt32LE(0x04034b50, 0);
    safeBuf.writeUInt32LE(10, 18);
    safeBuf.writeUInt32LE(20, 22); // Uncompressed Size
    safeBuf.writeUInt16LE(4, 26);
    safeBuf.writeUInt16LE(0, 28);
    safeBuf.write('test', 30);
    fs.writeFileSync(safePath, safeBuf);

    // Non-zip file
    fs.writeFileSync(normalPath, 'Hello world');

    expect(contextAssembler.isZipBomb(bombPath)).toBe(true);
    expect(contextAssembler.isZipBomb(safePath)).toBe(false);
    expect(contextAssembler.isZipBomb(normalPath)).toBe(false);
  });

  test('detectShebangLanguage coerces shebang types', () => {
    const pyScript = path.join(tmpDir, 'pyscript');
    const nodeScript = path.join(tmpDir, 'nodescript');
    const normalFile = path.join(tmpDir, 'script');

    fs.writeFileSync(pyScript, '#!/usr/bin/env python\nprint("Hello")');
    fs.writeFileSync(nodeScript, '#!/usr/bin/env node\nconsole.log("Hello")');
    fs.writeFileSync(normalFile, 'console.log("Hello")');

    expect(contextAssembler.detectShebangLanguage(pyScript)).toBe('.py');
    expect(contextAssembler.detectShebangLanguage(nodeScript)).toBe('.js');
    expect(contextAssembler.detectShebangLanguage(normalFile)).toBeNull();
  });

  test('resolves foreign imports (Python, Rust, Go, SQL, Apex)', () => {
    // 1. Python
    const pyMain = path.join(tmpDir, 'main.py');
    const pyUtil = path.join(tmpDir, 'util.py');
    fs.writeFileSync(pyMain, 'from util import helper\nimport os');
    fs.writeFileSync(pyUtil, 'def helper(): pass');

    // 2. Rust
    const rsMain = path.join(tmpDir, 'main.rs');
    const rsHandler = path.join(tmpDir, 'handler.rs');
    fs.writeFileSync(rsMain, 'pub mod handler;\nuse std::io;');
    fs.writeFileSync(rsHandler, 'pub fn run() {}');

    // 3. Go
    const goMain = path.join(tmpDir, 'main.go');
    const goDb = path.join(tmpDir, 'db.go');
    fs.writeFileSync(goMain, `package main\nimport (\n  "db"\n  "fmt"\n)`);
    fs.writeFileSync(goDb, 'package db');

    // 4. SQL
    const sqlMain = path.join(tmpDir, 'main.sql');
    const sqlTable = path.join(tmpDir, 'table.sql');
    fs.writeFileSync(sqlMain, '--# import "table.sql"\nSELECT * FROM table;');
    fs.writeFileSync(sqlTable, 'CREATE TABLE table (id INT);');

    // 5. Apex
    const apexMain = path.join(tmpDir, 'main.cls');
    const apexBase = path.join(tmpDir, 'BaseController.cls');
    fs.writeFileSync(apexMain, 'public class Main extends BaseController {}');
    fs.writeFileSync(apexBase, 'public virtual class BaseController {}');

    const resolvedPy = contextAssembler.resolveImports(pyMain);
    expect(resolvedPy).toContain(pyUtil);

    const resolvedRs = contextAssembler.resolveImports(rsMain);
    expect(resolvedRs).toContain(rsHandler);

    const resolvedGo = contextAssembler.resolveImports(goMain);
    expect(resolvedGo).toContain(goDb);

    const resolvedSql = contextAssembler.resolveImports(sqlMain);
    expect(resolvedSql).toContain(sqlTable);

    const resolvedApex = contextAssembler.resolveImports(apexMain);
    expect(resolvedApex).toContain(apexBase);
  });

  test('generateIndex generates HTML visualizations', () => {
    // Create some files to index
    const mainFile = path.join(tmpDir, 'main.js');
    const utilFile = path.join(tmpDir, 'util.js');
    fs.writeFileSync(mainFile, 'import "./util.js";');
    fs.writeFileSync(utilFile, 'export const x = 1;');

    contextAssembler.generateIndex();

    const treePath = path.join(tmpDir, 'context', 'tree.html');
    const graphPath = path.join(tmpDir, 'context', 'graph.html');

    expect(fs.existsSync(treePath)).toBe(true);
    expect(fs.existsSync(graphPath)).toBe(true);

    const treeContent = fs.readFileSync(treePath, 'utf8');
    const graphContent = fs.readFileSync(graphPath, 'utf8');

    expect(treeContent).toContain('Veyra OS - Hierarchy Tree');
    expect(treeContent).toContain('main.js');
    expect(treeContent).toContain('util.js');

    expect(graphContent).toContain('mermaid');
    expect(graphContent).toContain('Community_Root');
  });
});
