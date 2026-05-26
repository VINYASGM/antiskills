const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

/**
 * VisualReviewRunner Tests
 * Tests mock capture fallback (the only testable path without Playwright/Puppeteer installed).
 */

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-visual-test-'));
  fs.mkdirSync(path.join(dir, 'memory', 'evidence', 'visual'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

describe('VisualReviewRunner — Mock Capture', () => {
  let originalCwd;
  let tmpDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
  });

  test('runMockCapture() generates 3 viewport files + audit summary', () => {
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
    const visualReview = require('../../bin/visual-review.js');

    // Override evidence dir to temp
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    visualReview.runMockCapture();

    const evidenceDir = visualReview.evidenceDir;
    expect(fs.existsSync(path.join(evidenceDir, 'viewport_mobile.png'))).toBe(true);
    expect(fs.existsSync(path.join(evidenceDir, 'viewport_tablet.png'))).toBe(true);
    expect(fs.existsSync(path.join(evidenceDir, 'viewport_desktop.png'))).toBe(true);
    expect(fs.existsSync(path.join(evidenceDir, 'audit_summary.log'))).toBe(true);
  });

  test('audit_summary.log contains expected fields', () => {
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    visualReview.runMockCapture();

    const log = fs.readFileSync(path.join(visualReview.evidenceDir, 'audit_summary.log'), 'utf8');
    expect(log).toContain('VEYRA VISUAL AUDIT');
    expect(log).toContain('Mobile');
    expect(log).toContain('Tablet');
    expect(log).toContain('Desktop');
  });
});

describe('VisualReviewRunner — Syntax Validity', () => {
  test('visual-review.js parses without syntax errors', () => {
    // This test verifies the line 110 fix
    expect(() => {
      const vrPath = require.resolve('../../bin/visual-review.js');
      delete require.cache[vrPath];
      require('../../bin/visual-review.js');
    }).not.toThrow();
  });
});
