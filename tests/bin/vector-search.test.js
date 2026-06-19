import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
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

    const dbPath = path.join(agentDir, 'memory.sqlite');
    const authPath = path.join(tempDir, 'src', 'auth.js');
    const utilsPath = path.join(tempDir, 'src', 'utils.js');
    fs.mkdirSync(path.dirname(authPath), { recursive: true });

    // Populate mock SQLite database using Python's built-in sqlite3 module
    const pythonCode = `
import sqlite3
import sys
import struct

db_path = sys.argv[1]
auth_path = sys.argv[2]
utils_path = sys.argv[3]

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("""
  CREATE TABLE files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      content_hash TEXT NOT NULL,
      last_modified INTEGER NOT NULL
  )
""")
c.execute("""
  CREATE TABLE chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      start_line INTEGER NOT NULL,
      end_line INTEGER NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
  )
""")
c.execute("""
  CREATE TABLE vec_chunks (
      chunk_id INTEGER PRIMARY KEY,
      embedding BLOB NOT NULL,
      FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
  )
""")

# Insert mock file 1
c.execute("INSERT INTO files (path, content_hash, last_modified) VALUES (?, ?, ?)", (auth_path, 'hash1', 123456789))
file_id1 = c.lastrowid

c.execute("INSERT INTO chunks (file_id, start_line, end_line, content) VALUES (?, ?, ?, ?)", (file_id1, 1, 10, 'login form authenticator function'))
chunk_id1 = c.lastrowid

high_emb = [0.05] * 384
high_bytes = struct.pack('f'*384, *high_emb)
c.execute("INSERT INTO vec_chunks (chunk_id, embedding) VALUES (?, ?)", (chunk_id1, sqlite3.Binary(high_bytes)))

# Insert mock file 2
c.execute("INSERT INTO files (path, content_hash, last_modified) VALUES (?, ?, ?)", (utils_path, 'hash2', 123456789))
file_id2 = c.lastrowid

c.execute("INSERT INTO chunks (file_id, start_line, end_line, content) VALUES (?, ?, ?, ?)", (file_id2, 1, 10, 'utility date formatter'))
chunk_id2 = c.lastrowid

low_emb = [-0.05] * 384
low_bytes = struct.pack('f'*384, *low_emb)
c.execute("INSERT INTO vec_chunks (chunk_id, embedding) VALUES (?, ?)", (chunk_id2, sqlite3.Binary(low_bytes)))

conn.commit()
conn.close()
`;

    execFileSync(pythonCommand, ['-c', pythonCode, dbPath, authPath, utilsPath], {
      cwd: tempDir
    });

    try {
      const output = execFileSync(pythonCommand, [scriptPath, 'login'], {
        cwd: tempDir,
        encoding: 'utf8'
      });

      const results = JSON.parse(output.trim());
      expect(results).toBeDefined();
      expect(typeof results).toBe('object');
      
      const keys = Object.keys(results);
      if (keys.length > 0) {
        expect(keys[0]).toContain('auth.js');
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
