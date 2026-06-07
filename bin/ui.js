/**
 * 🎨 Procedural Terminal UI Styling Framework
 * Lightweight, high-performance visual helper functions using standard ANSI escape sequences.
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Strips ANSI escape codes to calculate true string length.
 */
function stripAnsi(str) {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

/**
 * Draws a beautiful double-bordered box in the terminal.
 */
function drawBox(title, content, width = 60, themeColor = 'cyan') {
  const color = colors[themeColor] || colors.cyan;
  const reset = colors.reset;
  const dim = colors.dim;

  const titleLen = stripAnsi(title).length;
  const topBarLength = width - titleLen - 4; // 2 for corners, 2 for spaces
  const topBarLeft = Math.floor(topBarLength / 2);
  const topBarRight = topBarLength - topBarLeft;

  let result = color + '╔' + '═'.repeat(topBarLeft) + ' ' + colors.bright + title + reset + color + ' ' + '═'.repeat(topBarRight) + '╗' + reset + '\n';

  for (const line of content) {
    const rawLine = stripAnsi(line);
    let formattedLine = line;

    if (rawLine.length > width - 4) {
      formattedLine = rawLine.substring(0, width - 7) + '...';
    }

    const padding = (width - 4) - stripAnsi(formattedLine).length;
    result += color + '║ ' + reset + formattedLine + ' '.repeat(padding) + color + ' ║' + reset + '\n';
  }

  result += color + '╚' + '═'.repeat(width - 2) + '╝' + reset;
  return result;
}

/**
 * Draws a gorgeous bordered table.
 */
function drawTable(headers, rows, widths, themeColor = 'green') {
  const color = colors[themeColor] || colors.green;
  const reset = colors.reset;
  const bright = colors.bright;

  // Header separator
  let sep = color + '├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤' + reset + '\n';

  // Render headers
  let table = color + '┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐' + reset + '\n';
  table += color + '│' + reset;
  headers.forEach((h, idx) => {
    const w = widths[idx];
    const pad = Math.max(0, w - stripAnsi(h).length);
    table += ' ' + bright + h + ' '.repeat(pad) + reset + color + ' │' + reset;
  });
  table += '\n' + sep;

  // Render rows
  rows.forEach((row, rowIdx) => {
    table += color + '│' + reset;
    row.forEach((val, idx) => {
      const w = widths[idx];
      let displayVal = String(val);
      const plainLen = stripAnsi(displayVal).length;
      if (plainLen > w) {
        const limit = w > 3 ? w - 3 : w;
        const suffix = w > 3 ? '...' : '';
        if (!displayVal.includes('\u001b')) {
          displayVal = displayVal.slice(0, limit) + suffix;
        } else {
          const stripped = stripAnsi(displayVal);
          displayVal = stripped.slice(0, limit) + suffix;
        }
      }
      const pad = Math.max(0, w - stripAnsi(displayVal).length);
      table += ' ' + displayVal + ' '.repeat(pad) + color + ' │' + reset;
    });
    table += '\n';

    if (rowIdx < rows.length - 1) {
      table += sep;
    }
  });

  table += color + '└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘' + reset;
  return table;
}

/**
 * Generates an aesthetic progress bar.
 */
function progressBar(percent, width = 30) {
  const pct = Math.max(0, Math.min(100, percent));
  const filledLength = Math.round((pct / 100) * width);
  const emptyLength = width - filledLength;

  const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  return `${bar}  ${colors.bright}${pct}%${colors.reset}`;
}

module.exports = {
  colors,
  stripAnsi,
  drawBox,
  drawTable,
  progressBar
};
