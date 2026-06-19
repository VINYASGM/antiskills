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

describe('VisualReviewRunner — Accessibility Audit Exit Codes', () => {
  let originalCwd;
  let tmpDir;
  let exitSpy;
  let execSpy;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-a11y-exit-test-'));
    fs.mkdirSync(path.join(tmpDir, 'memory', 'evidence', 'visual'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'visual-testing'), { recursive: true });
    
    // Fake the Go JIT environment files
    const binName = process.platform === 'win32' ? 'visual-testing.exe' : 'visual-testing';
    fs.writeFileSync(path.join(tmpDir, 'visual-testing', 'go.mod'), 'module visual-testing');
    fs.writeFileSync(path.join(tmpDir, 'visual-testing', binName), 'mock binary');
    
    process.chdir(tmpDir);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    execSpy = vi.spyOn(require('node:child_process'), 'execSync');
  });

  afterEach(() => {
    exitSpy.mockRestore();
    execSpy.mockRestore();
    process.chdir(originalCwd);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
  });

  test('run() exits with code 1 when there are accessibility violations', async () => {
    execSpy.mockImplementation((cmd, options) => {
      if (cmd.includes('audit')) {
        return Buffer.from(JSON.stringify({
          violations: [
            {
              id: 'image-alt',
              selector: 'img#bad-image',
              description: 'Image missing alt'
            }
          ]
        }));
      }
      return Buffer.from('');
    });

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.run();

    expect(exitSpy).toHaveBeenCalledWith(1);
    
    // Verify violations were written to audit_summary.log
    const log = fs.readFileSync(path.join(visualReview.evidenceDir, 'audit_summary.log'), 'utf8');
    expect(log).toContain('Violations:');
    expect(log).toContain('image-alt');
  });

  test('run() exits with code 0 when there are no accessibility violations', async () => {
    execSpy.mockImplementation((cmd, options) => {
      if (cmd.includes('audit')) {
        return Buffer.from(JSON.stringify({
          violations: []
        }));
      }
      return Buffer.from('');
    });

    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    await visualReview.run();

    expect(exitSpy).toHaveBeenCalledWith(0);

    // Verify passing summary was written to audit_summary.log
    const log = fs.readFileSync(path.join(visualReview.evidenceDir, 'audit_summary.log'), 'utf8');
    expect(log).toContain('No accessibility violations detected');
  });
});

describe('VisualReviewRunner — New Geometric Layout Assertions', () => {
  let originalCwd;
  let tmpDir;
  let exitSpy;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-geom-test-'));
    fs.mkdirSync(path.join(tmpDir, 'memory', 'evidence', 'visual'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'checklists'), { recursive: true });
    process.chdir(tmpDir);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    process.chdir(originalCwd);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
    const vrPath = require.resolve('../../bin/visual-review.js');
    delete require.cache[vrPath];
  });

  test('Figma layout bounding box mismatch triggers violation', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Create a figma-layout spec
    const figmaSpec = {
      desktop: {
        header: { x: 0, y: 0, width: 1440, height: 80, tolerance: 5 }
      }
    };
    fs.writeFileSync(path.join(tmpDir, 'checklists', 'figma-layout.json'), JSON.stringify(figmaSpec), 'utf8');

    // Live DOM structure with header mismatching the spec
    const liveDom = [
      { id: 'header', tagName: 'header', x: 10, y: 0, width: 1440, height: 80 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_desktop.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'figma-mismatch-header')).toBe(true);
  });

  test('Figma layout missing required element triggers violation', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    const figmaSpec = {
      desktop: {
        header: { x: 0, y: 0, width: 1440, height: 80, tolerance: 5 }
      }
    };
    fs.writeFileSync(path.join(tmpDir, 'checklists', 'figma-layout.json'), JSON.stringify(figmaSpec), 'utf8');

    // Empty live DOM structure (missing header)
    const liveDom = [];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_desktop.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'figma-missing-header')).toBe(true);
  });

  test('Collision detection ignores nested parent-child elements but detects sibling overlap', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // 1. Nested: el2 is completely inside el1
    const liveDomNested = [
      { id: 'parent-div', tagName: 'div', x: 0, y: 0, width: 100, height: 100 },
      { id: 'child-div', tagName: 'div', x: 10, y: 10, width: 50, height: 50 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_desktop.json'), JSON.stringify(liveDomNested), 'utf8');

    await visualReview.audit();
    expect(exitSpy).toHaveBeenCalledWith(0); // Passes because nested elements don't collide

    // 2. Siblings overlapping (colliding)
    exitSpy.mockClear();
    const liveDomCollision = [
      { id: 'sibling-1', tagName: 'div', x: 0, y: 0, width: 100, height: 100 },
      { id: 'sibling-2', tagName: 'div', x: 50, y: 50, width: 100, height: 100 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_desktop.json'), JSON.stringify(liveDomCollision), 'utf8');

    await visualReview.audit();
    expect(exitSpy).toHaveBeenCalledWith(1);
    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id.includes('collision'))).toBe(true);
  });

  test('Touch target size check enforces >= 44x44px for interactive elements on mobile', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Live DOM structure for mobile with a button that is too small
    const liveDomMobile = [
      { id: 'tiny-btn', tagName: 'button', x: 100, y: 100, width: 30, height: 30 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_mobile.json'), JSON.stringify(liveDomMobile), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'touch-target-size-tiny-btn')).toBe(true);
  });

  test('Baseline grid alignment check identifies non-multiples of 4 coordinates/padding', async () => {
    const visualReview = require('../../bin/visual-review.js');
    visualReview.evidenceDir = path.join(tmpDir, 'memory', 'evidence', 'visual');

    // Define in figma spec so it gets checked
    const figmaSpec = {
      desktop: {
        header: { x: 0, y: 0, width: 1440, height: 80 }
      }
    };
    fs.writeFileSync(path.join(tmpDir, 'checklists', 'figma-layout.json'), JSON.stringify(figmaSpec), 'utf8');

    // Live DOM structure with header not aligned to 4px grid (e.g. x=5)
    const liveDom = [
      { id: 'header', tagName: 'header', x: 5, y: 0, width: 1440, height: 80, paddingTop: 1, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 }
    ];
    fs.writeFileSync(path.join(visualReview.evidenceDir, 'dom_structure_desktop.json'), JSON.stringify(liveDom), 'utf8');

    await visualReview.audit();

    expect(exitSpy).toHaveBeenCalledWith(1);
    const masterReport = JSON.parse(fs.readFileSync(path.join(visualReview.evidenceDir, 'vlm_audit_report.json'), 'utf8'));
    expect(masterReport.pass).toBe(false);
    expect(masterReport.violations.some(v => v.id === 'grid-alignment-header')).toBe(true);
  });
});
