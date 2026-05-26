const path = require('node:path');
const fs = require('node:fs');

describe('CLI UI Helpers — Visual Styles', () => {
  let ui;

  beforeEach(() => {
    // Dynamically load the UI module
    const uiPath = require.resolve('../../bin/ui.js');
    delete require.cache[uiPath];
    ui = require('../../bin/ui.js');
  });

  test('drawBox() generates a beautiful double-bordered box', () => {
    const lines = [
      'Line 1: Status OK',
      'Line 2: System Operational'
    ];
    const box = ui.drawBox('SYSTEM LOGS', lines, 40, 'cyan');
    
    // Check that box contains double-border unicode characters
    expect(box).toContain('╔');
    expect(box).toContain('╗');
    expect(box).toContain('╚');
    expect(box).toContain('╝');
    expect(box).toContain('║');
    expect(box).toContain('═');
    
    // Check title and content are included
    expect(box).toContain('SYSTEM LOGS');
    expect(box).toContain('Line 1: Status OK');
    expect(box).toContain('Line 2: System Operational');
  });

  test('drawTable() creates an aligned bordered table', () => {
    const headers = ['AGENT', 'STATUS', 'TASK'];
    const rows = [
      ['fe-agent', 'ACTIVE', 'Layout review'],
      ['be-agent', 'IDLE', 'Database sync']
    ];
    const widths = [10, 8, 15];
    
    const table = ui.drawTable(headers, rows, widths, 'green');
    
    expect(table).toContain('fe-agent');
    expect(table).toContain('ACTIVE');
    expect(table).toContain('Layout review');
    expect(table).toContain('be-agent');
    expect(table).toContain('IDLE');
    expect(table).toContain('Database sync');
    
    // Check grid layout borders
    expect(table).toContain('┼');
    expect(table).toContain('├');
    expect(table).toContain('┤');
  });

  test('progressBar() produces a stylized progress meter', () => {
    const bar50 = ui.progressBar(50, 20);
    const bar100 = ui.progressBar(100, 20);
    
    // Check percentage numbers
    expect(bar50).toContain('50%');
    expect(bar100).toContain('100%');
    
    // Check blocks representation
    expect(bar50).toContain('██████████░░░░░░░░░░');
    expect(bar100).toContain('████████████████████');
  });
});
