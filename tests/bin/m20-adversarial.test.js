const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-m20-adversarial-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('Milestone 20 Adversarial & Robustness Tests', () => {
  let originalCwd;
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    const ctxPath = require.resolve('../../bin/context.js');
    delete require.cache[ctxPath];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const ctxPath = require.resolve('../../bin/context.js');
    delete require.cache[ctxPath];
  });

  describe('isZipBomb - Invalid/Corrupted Zip Headers & Extreme Compression', () => {
    test('handles empty file', () => {
      const filePath = path.join(tmpDir, 'empty.zip');
      fs.writeFileSync(filePath, '');
      expect(contextAssembler.isZipBomb(filePath)).toBe(false);
    });

    test('handles truncated header (fewer than 30 bytes)', () => {
      const filePath = path.join(tmpDir, 'truncated.zip');
      const buf = Buffer.alloc(15);
      buf.writeUInt32LE(0x04034b50, 0);
      fs.writeFileSync(filePath, buf);
      expect(contextAssembler.isZipBomb(filePath)).toBe(false);
    });

    test('handles invalid signature with 30 bytes', () => {
      const filePath = path.join(tmpDir, 'bad_sig.zip');
      const buf = Buffer.alloc(30);
      buf.writeUInt32LE(0x12345678, 0);
      fs.writeFileSync(filePath, buf);
      expect(contextAssembler.isZipBomb(filePath)).toBe(false);
    });

    test('handles out of bounds sizes / corrupted offsets', () => {
      const filePath = path.join(tmpDir, 'corrupted_offset.zip');
      const buf = Buffer.alloc(30);
      buf.writeUInt32LE(0x04034b50, 0);
      buf.writeUInt32LE(10, 18);
      buf.writeUInt32LE(10, 22);
      buf.writeUInt16LE(500, 26);
      buf.writeUInt16LE(500, 28);
      fs.writeFileSync(filePath, buf);

      let result;
      expect(() => {
        result = contextAssembler.isZipBomb(filePath);
      }).not.toThrow();
    });

    test('handles extreme compression ratio (> 200)', () => {
      const filePath = path.join(tmpDir, 'bomb.zip');
      const buf = Buffer.alloc(34);
      buf.writeUInt32LE(0x04034b50, 0);
      buf.writeUInt32LE(5, 18);
      buf.writeUInt32LE(1005, 22);
      buf.writeUInt16LE(4, 26);
      buf.writeUInt16LE(0, 28);
      buf.write('test', 30);
      fs.writeFileSync(filePath, buf);
      expect(contextAssembler.isZipBomb(filePath)).toBe(true);
    });

    test('handles absolute uncompressed limit (> 500MB)', () => {
      const filePath = path.join(tmpDir, 'huge_uncompressed.zip');
      const buf = Buffer.alloc(34);
      buf.writeUInt32LE(0x04034b50, 0);
      buf.writeUInt32LE(10 * 1024 * 1024, 18);
      buf.writeUInt32LE(501 * 1024 * 1024, 22);
      buf.writeUInt16LE(4, 26);
      buf.writeUInt16LE(0, 28);
      buf.write('test', 30);
      fs.writeFileSync(filePath, buf);
      expect(contextAssembler.isZipBomb(filePath)).toBe(true);
    });

    test('handles anomalous zip (totalCompressed === 0 and totalUncompressed > 0)', () => {
      const filePath = path.join(tmpDir, 'anomalous.zip');
      const buf = Buffer.alloc(34);
      buf.writeUInt32LE(0x04034b50, 0);
      buf.writeUInt32LE(0, 18);
      buf.writeUInt32LE(100, 22);
      buf.writeUInt16LE(4, 26);
      buf.writeUInt16LE(0, 28);
      buf.write('test', 30);
      fs.writeFileSync(filePath, buf);
      expect(contextAssembler.isZipBomb(filePath)).toBe(true);
    });
  });

  describe('detectShebangLanguage - Shebang Coercion and Edge Cases', () => {
    test('handles empty shebang file', () => {
      const filePath = path.join(tmpDir, 'empty_shebang');
      fs.writeFileSync(filePath, '');
      expect(contextAssembler.detectShebangLanguage(filePath)).toBeNull();
    });

    test('handles shebang without a newline', () => {
      const filePath = path.join(tmpDir, 'no_newline');
      fs.writeFileSync(filePath, '#!/usr/bin/env python');
      expect(contextAssembler.detectShebangLanguage(filePath)).toBe('.py');
    });

    test('handles shebang with carriage return \\r\\n', () => {
      const filePath = path.join(tmpDir, 'carriage_return');
      fs.writeFileSync(filePath, '#!/usr/bin/env node\r\nconsole.log(1);');
      expect(contextAssembler.detectShebangLanguage(filePath)).toBe('.js');
    });

    test('handles extremely long shebang line', () => {
      const filePath = path.join(tmpDir, 'long_shebang');
      const longShebang = '#!' + 'A'.repeat(500) + 'python' + '\n';
      fs.writeFileSync(filePath, longShebang);
      expect(() => {
        const lang = contextAssembler.detectShebangLanguage(filePath);
        expect(lang).toBeNull();
      }).not.toThrow();
    });

    test('handles shebang containing binary data', () => {
      const filePath = path.join(tmpDir, 'binary_shebang');
      const buf = Buffer.alloc(128);
      buf.write('#!', 0);
      buf.writeUInt32LE(0xDEADBEEF, 2);
      buf.write('python', 6);
      fs.writeFileSync(filePath, buf);
      expect(() => {
        const lang = contextAssembler.detectShebangLanguage(filePath);
        expect(lang).toBe('.py');
      }).not.toThrow();
    });
  });

  describe('Multi-language Imports - Robustness', () => {
    test('handles malformed python import lines', () => {
      const filePath = path.join(tmpDir, 'main.py');
      fs.writeFileSync(filePath, 'import a, , b\nfrom . import\nimport');
      expect(() => {
        const resolved = contextAssembler.resolveImports(filePath);
        expect(Array.isArray(resolved)).toBe(true);
      }).not.toThrow();
    });

    test('handles malformed rust mod / use lines', () => {
      const filePath = path.join(tmpDir, 'main.rs');
      fs.writeFileSync(filePath, 'use ;\npub mod ;\nuse a::;');
      expect(() => {
        const resolved = contextAssembler.resolveImports(filePath);
        expect(Array.isArray(resolved)).toBe(true);
      }).not.toThrow();
    });

    test('handles malformed go import blocks', () => {
      const filePath = path.join(tmpDir, 'main.go');
      fs.writeFileSync(filePath, 'import (\n  \n  "\n)');
      expect(() => {
        const resolved = contextAssembler.resolveImports(filePath);
        expect(Array.isArray(resolved)).toBe(true);
      }).not.toThrow();
    });
  });
});
