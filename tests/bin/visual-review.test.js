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

describe('VisualReviewRunner — VLM & Fallback Audits', () => {
  let originalCwd;
  let tmpDir;
  let exitSpy;

  let savedApiKey;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-audit-test-'));
    fs.mkdirSync(path.join(tmpDir, 'memory', 'evidence', 'visual'), { recursive: true });
    process.chdir(tmpDir);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    savedApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    exitSpy.mockRestore();
    process.chdir(originalCwd);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    delete process.env.MOCK_VLM_FAIL;
    if (savedApiKey !== undefined) {
      process.env.GEMINI_API_KEY = savedApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    vi.unstubAllGlobals();
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
  });

  test('Fallback audit passes when no issues and exits with 0', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Run audit
    await visualReview.audit();

    // Expect process.exit(0)
    expect(exitSpy).toHaveBeenCalledWith(0);

    // Expect reports to be created
    expect(fs.existsSync(path.join(visualReview.evidenceDir, 'vlm_audit_report_desktop.json'))).toBe(true);
    expect(fs.existsSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'))).toBe(true);

    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(true);
    expect(masterReport.violations.length).toBe(0);
  });

  test('Fallback audit fails and exits with 1 when MOCK_VLM_FAIL is set', async () => {
    process.env.MOCK_VLM_FAIL = 'true';
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);

    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.severity === 'critical')).toBe(true);
  });

  test('Fallback audit detects low-contrast-text ID in dom_structure.json', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Write a dom_structure.json containing low-contrast-text
    const liveDom = [
      { id: 'low-contrast-text', tagName: 'div', x: 10, y: 20 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);

    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'low-contrast-text')).toBe(true);
  });

  test('Fallback audit detects layout shifts greater than 5 pixels', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Set up baseline and live DOM structures with shift > 5px
    const baselineDom = [
      { id: 'shifted-element', tagName: 'div', x: 10, y: 20 }
    ];
    const liveDom = [
      { id: 'shifted-element', tagName: 'div', x: 16, y: 20 } // Shift of 6 pixels in x
    ];

    fs.mkdirSync(path.join(tmpDir, 'memory', 'design'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'memory', 'design', 'dom_structure.json'), JSON.stringify(baselineDom), 'utf8');
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);

    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'layout-shift-shifted-element')).toBe(true);
  });

  test('Fallback audit does not trigger violation on shifts <= 5 pixels', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    const baselineDom = [
      { id: 'shifted-element', tagName: 'div', x: 10, y: 20 }
    ];
    const liveDom = [
      { id: 'shifted-element', tagName: 'div', x: 15, y: 20 } // Shift of exactly 5 pixels
    ];

    fs.mkdirSync(path.join(tmpDir, 'memory', 'design'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'memory', 'design', 'dom_structure.json'), JSON.stringify(baselineDom), 'utf8');
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(0);

    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(true);
    expect(masterReport.violations.length).toBe(0);
  });

  test('Fallback audit writes live dom_structure.json as baseline if baseline does not exist', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    const liveDom = [
      { id: 'test-element', tagName: 'div', x: 100, y: 200 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure.json'), JSON.stringify(liveDom), 'utf8');

    const baselineDomPath = path.join(tmpDir, 'memory', 'design', 'dom_structure.json');
    expect(fs.existsSync(baselineDomPath)).toBe(false);

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(fs.existsSync(baselineDomPath)).toBe(true);
    const savedBaseline = JSON.parse(fs.readFileSync(baselineDomPath, 'utf8'));
    expect(savedBaseline[0].id).toBe('test-element');
  });

  test('Gemini VLM API call path passes and exits with 0 on successful response', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({ pass: true, violations: [] })
            }]
          }
        }]
      })
    }));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('Gemini VLM API call path fails and exits with 1 on critical severity violation response', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                pass: false,
                violations: [{
                  id: 'visual-mismatch-1',
                  severity: 'critical',
                  description: 'VLM detected critical misalignment'
                }]
              })
            }]
          }
        }]
      })
    }));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('Gemini VLM API call path fails and exits with 1 on high severity violation response (case-insensitive test)', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                pass: true,
                violations: [{
                  id: 'visual-mismatch-2',
                  severity: 'HIGH',
                  description: 'VLM detected high misalignment'
                }]
              })
            }]
          }
        }]
      })
    }));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('Gemini VLM API call path fails and exits with 1 on fetch rejection', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('Gemini VLM API call path fails and exits with 1 on malformed JSON response', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: '{{{invalid json'
            }]
          }
        }]
      })
    }));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('Gemini VLM API call path fails and exits with 1 on missing candidates response structure', async () => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    }));

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(global.fetch).toHaveBeenCalled();
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

describe('VisualReviewRunner — URL Sanitization & Command Injection Mitigation', () => {
  let originalCwd;
  let tmpDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-url-test-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    delete process.env.VISUAL_AUDIT_URL;
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
  });

  test('run() throws an error when VISUAL_AUDIT_URL is invalid (command injection attempt)', async () => {
    process.env.VISUAL_AUDIT_URL = 'http://localhost:3000; rm -rf /';
    const visualReview = require('../../bin/visual-review.js');
    
    await expect(visualReview.run()).rejects.toThrow('Invalid target URL');
  });

  test('run() does not throw when VISUAL_AUDIT_URL is valid', async () => {
    process.env.VISUAL_AUDIT_URL = 'http://localhost:3000/some-path?param=value';
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');
    visualReview.designDir = path.join(tmpDir, 'memory', 'design');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    
    await expect(visualReview.run()).resolves.not.toThrow();
    
    exitSpy.mockRestore();
  });
});
