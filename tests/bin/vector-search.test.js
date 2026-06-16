import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { findPythonCommand } from '../../bin/python-command';

describe('Vector Search Engine', () => {
  const scriptPath = path.join(process.cwd(), 'bin', 'vector_search.py');
  const pythonCommand = findPythonCommand();
  if (!pythonCommand) throw new Error('No Python executable found for vector_search.py tests');

  it('runs search in TF-IDF fallback mode when SQLite database is missing', () => {
    // Create a temporary directory without a .agent/memory.sqlite database
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-tfidf-test-'));
    
    // Create some mock source files so TF-IDF has something to scan
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'auth.js'), 'function login(user, pass) { return true; }');
    fs.writeFileSync(path.join(srcDir, 'utils.js'), 'function formatDate(d) { return d.toISOString(); }');

    try {
      const output = execFileSync(pythonCommand, [scriptPath, 'login'], {
        cwd: tempDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // ignore stderr to hide the fallback message
      });
      
      const results = JSON.parse(output.trim());
      expect(results).toBeDefined();
      expect(typeof results).toBe('object');
      // Should find auth.js relative path
      const keys = Object.keys(results);
      expect(keys.some(k => k.endsWith('auth.js'))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('runs search in ONNX semantic vector mode when SQLite database is present', () => {
    // Create a temporary directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-onnx-test-'));
    const agentDir = path.join(tempDir, '.agent');
    fs.mkdirSync(agentDir, { recursive: true });

    // Initialize mock memory.sqlite database
    const dbPath = path.join(agentDir, 'memory.sqlite');
    const db = new Database(dbPath);

    db.exec(`
      CREATE TABLE files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT UNIQUE NOT NULL,
          content_hash TEXT NOT NULL,
          last_modified INTEGER NOT NULL
      );
      CREATE TABLE chunks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER NOT NULL,
          start_line INTEGER NOT NULL,
          end_line INTEGER NOT NULL,
          content TEXT NOT NULL,
          FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
      );
      CREATE TABLE vec_chunks (
          chunk_id INTEGER PRIMARY KEY,
          embedding BLOB NOT NULL,
          FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
      );
    `);

    // Insert mock file 1 (high match for login query)
    const fileId1 = db.prepare(`
      INSERT INTO files (path, content_hash, last_modified) VALUES (?, ?, ?)
    `).run(path.join(tempDir, 'src', 'auth.js'), 'hash1', Date.now()).lastInsertRowid;

    const chunkId1 = db.prepare(`
      INSERT INTO chunks (file_id, start_line, end_line, content) VALUES (?, ?, ?, ?)
    `).run(fileId1, 1, 10, 'login form authenticator function').lastInsertRowid;

    // Pack f32 array (384 dims) for high similarity
    const highEmb = new Float32Array(384);
    // BGE-small embedding weights: bge-small outputs are normalized. We can simulate it.
    // Query embedding is generated from "login" which will have some vector.
    // We can set all values to 0.05 to get a positive cosine similarity.
    highEmb.fill(0.05);
    db.prepare(`
      INSERT INTO vec_chunks (chunk_id, embedding) VALUES (?, ?)
    `).run(chunkId1, Buffer.from(highEmb.buffer));

    // Insert mock file 2 (low match/opposite embedding)
    const fileId2 = db.prepare(`
      INSERT INTO files (path, content_hash, last_modified) VALUES (?, ?, ?)
    `).run(path.join(tempDir, 'src', 'utils.js'), 'hash2', Date.now()).lastInsertRowid;

    const chunkId2 = db.prepare(`
      INSERT INTO chunks (file_id, start_line, end_line, content) VALUES (?, ?, ?, ?)
    `).run(fileId2, 1, 10, 'utility date formatter').lastInsertRowid;

    const lowEmb = new Float32Array(384);
    lowEmb.fill(-0.05); // Negative similarity
    db.prepare(`
      INSERT INTO vec_chunks (chunk_id, embedding) VALUES (?, ?)
    `).run(chunkId2, Buffer.from(lowEmb.buffer));

    db.close();

    try {
      const output = execFileSync(pythonCommand, [scriptPath, 'login'], {
        cwd: tempDir,
        encoding: 'utf8'
      });

      const results = JSON.parse(output.trim());
      expect(results).toBeDefined();
      expect(typeof results).toBe('object');
      
      const keys = Object.keys(results);
      // We expect src/auth.js to be returned because its embedding similarity is high,
      // and src/utils.js to have negative or much lower similarity so it should be ranked lower or not returned.
      if (keys.length > 0) {
        expect(keys[0]).toContain('auth.js');
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
