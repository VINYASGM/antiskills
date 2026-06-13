const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-context-stress-'));
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('ContextAssembler Stress Tests — detectShebangLanguage', () => {
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    tmpDir = createTempProject();
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  test('handles empty file without crashing', () => {
    const filePath = path.join(tmpDir, 'empty_script');
    fs.writeFileSync(filePath, '');
    expect(contextAssembler.detectShebangLanguage(filePath)).toBeNull();
  });

  test('handles file with just #! and nothing else', () => {
    const filePath = path.join(tmpDir, 'only_shebang');
    fs.writeFileSync(filePath, '#!');
    expect(contextAssembler.detectShebangLanguage(filePath)).toBeNull();
  });

  test('handles file with spaces and newlines after #!', () => {
    const filePath = path.join(tmpDir, 'spaces_shebang');
    fs.writeFileSync(filePath, '#!   \n   ');
    expect(contextAssembler.detectShebangLanguage(filePath)).toBeNull();
  });

  test('handles carriage return style shebangs', () => {
    const filePath = path.join(tmpDir, 'cr_shebang');
    fs.writeFileSync(filePath, '#!/usr/bin/env python\r\nprint("hello")');
    expect(contextAssembler.detectShebangLanguage(filePath)).toBe('.py');
  });

  test('handles huge shebang lines (no crash or hang)', () => {
    const filePath = path.join(tmpDir, 'huge_shebang');
    // Write 1MB of text starting with shebang
    const content = '#!' + 'A'.repeat(1024 * 1024);
    fs.writeFileSync(filePath, content);
    expect(contextAssembler.detectShebangLanguage(filePath)).toBeNull();
  });

  test('handles shebang with null bytes', () => {
    const filePath = path.join(tmpDir, 'null_shebang');
    const buf = Buffer.alloc(100);
    buf.write('#!', 0);
    buf.write('python', 2);
    buf.write('\x00', 8);
    buf.write('\n', 9);
    fs.writeFileSync(filePath, buf);
    expect(contextAssembler.detectShebangLanguage(filePath)).toBe('.py');
  });

  test('handles non-existent files gracefully without throwing', () => {
    const nonExistentPath = path.join(tmpDir, 'does_not_exist_at_all');
    expect(() => {
      const res = contextAssembler.detectShebangLanguage(nonExistentPath);
      expect(res).toBeNull();
    }).not.toThrow();
  });
});

describe('ContextAssembler Stress Tests — isZipBomb', () => {
  let tmpDir;
  let contextAssembler;

  beforeEach(() => {
    tmpDir = createTempProject();
    delete require.cache[require.resolve('../../bin/context.js')];
    contextAssembler = require('../../bin/context.js');
  });

  afterEach(() => {
    cleanupTempDir(tmpDir);
  });

  test('non-existent file returns true (excluded)', () => {
    const filePath = path.join(tmpDir, 'non_existent.zip');
    expect(contextAssembler.isZipBomb(filePath)).toBe(true);
  });

  test('truncated zip header returns false (not a zip bomb)', () => {
    const filePath = path.join(tmpDir, 'truncated.zip');
    const buf = Buffer.alloc(15);
    buf.writeUInt32LE(0x04034b50, 0); // Signature matches
    fs.writeFileSync(filePath, buf);
    expect(contextAssembler.isZipBomb(filePath)).toBe(false);
  });

  test('highly corrupted zip header (incorrect signature) returns false', () => {
    const filePath = path.join(tmpDir, 'bad_sig.zip');
    const buf = Buffer.alloc(30);
    buf.writeUInt32LE(0x11223344, 0); // Bad signature
    fs.writeFileSync(filePath, buf);
    expect(contextAssembler.isZipBomb(filePath)).toBe(false);
  });

  test('zip bomb with uncompressed size > 500MB is flagged', () => {
    const filePath = path.join(tmpDir, 'giant.zip');
    const buf = Buffer.alloc(30);
    buf.writeUInt32LE(0x04034b50, 0);
    buf.writeUInt32LE(100, 18); // Compressed size
    buf.writeUInt32LE(500 * 1024 * 1024 + 100, 22); // Uncompressed size > 500MB
    fs.writeFileSync(filePath, buf);
    expect(contextAssembler.isZipBomb(filePath)).toBe(true);
  });

  test('zip bomb with zero compressed size and non-zero uncompressed size is flagged', () => {
    const filePath = path.join(tmpDir, 'zero_compressed.zip');
    const buf = Buffer.alloc(30);
    buf.writeUInt32LE(0x04034b50, 0);
    buf.writeUInt32LE(0, 18); // Compressed size
    buf.writeUInt32LE(10, 22); // Uncompressed size
    fs.writeFileSync(filePath, buf);
    expect(contextAssembler.isZipBomb(filePath)).toBe(true);
  });

  test('ratio boundary checks (exactly 200 vs 201)', () => {
    const borderSafe = path.join(tmpDir, 'safe_border.zip');
    const borderUnsafe = path.join(tmpDir, 'unsafe_border.zip');

    // 200:1 ratio
    const bufSafe = Buffer.alloc(30);
    bufSafe.writeUInt32LE(0x04034b50, 0);
    bufSafe.writeUInt32LE(10, 18);
    bufSafe.writeUInt32LE(2000, 22);
    fs.writeFileSync(borderSafe, bufSafe);

    // 201:1 ratio
    const bufUnsafe = Buffer.alloc(30);
    bufUnsafe.writeUInt32LE(0x04034b50, 0);
    bufUnsafe.writeUInt32LE(10, 18);
    bufUnsafe.writeUInt32LE(2010, 22);
    fs.writeFileSync(borderUnsafe, bufUnsafe);

    expect(contextAssembler.isZipBomb(borderSafe)).toBe(false);
    expect(contextAssembler.isZipBomb(borderUnsafe)).toBe(true);
  });

  test('huge file offset jump via invalid header field values', () => {
    const filePath = path.join(tmpDir, 'offset_jump.zip');
    const buf = Buffer.alloc(40);
    buf.writeUInt32LE(0x04034b50, 0);
    buf.writeUInt32LE(0xFFFFFFFF, 18); // Extreme compressed size
    buf.writeUInt32LE(10, 22); // Uncompressed size
    buf.writeUInt16LE(0, 26);
    buf.writeUInt16LE(0, 28);
    fs.writeFileSync(filePath, buf);

    // Should process the single record, jump, and terminate the loop
    // Total compressed: 4294967295, Total uncompressed: 10
    // Ratio = 10 / 4294967295 = ~0.000000002 <= 200, uncompressed size <= 500MB
    // So it should be marked as safe (return false) without throwing
    expect(contextAssembler.isZipBomb(filePath)).toBe(false);
  });

  test('infinite loop prevention with zero lengths and sizes', () => {
    const filePath = path.join(tmpDir, 'zero_lengths.zip');
    const buf = Buffer.alloc(30);
    buf.writeUInt32LE(0x04034b50, 0);
    buf.writeUInt32LE(0, 18);
    buf.writeUInt32LE(0, 22);
    buf.writeUInt16LE(0, 26);
    buf.writeUInt16LE(0, 28);
    fs.writeFileSync(filePath, buf);

    // Compressed=0, Uncompressed=0. Ratio=0. Returns false. No infinite loop because offset must advance by at least 30.
    expect(contextAssembler.isZipBomb(filePath)).toBe(false);
  });
});
