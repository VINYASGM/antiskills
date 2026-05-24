# MASTER.md - Claude-mem Setup Design Guidelines & Code Conventions

This document establishes the official design system, user experience guidelines, and programming conventions for the **Claude-mem Setup** background service and verification tool stack, as extracted from the stack requirements in [PRD.md](file:///C:/Users/Vinyas%20G%20M/.gemini/antigravity/scratch/claude-mem-setup/PRD.md).

---

## 🎨 1. Design Aesthetics & Visual Identity

Since the target product runs entirely as a background worker service (`worker-service.cjs`) with terminal-based controls, the design system implements **Terminal Brutalism & High-Contrast Minimalism**. It focuses on utility, clean typographic hierarchies, and immediate visual clarity.

### Color Palette (OLED Dark & High Contrast)
These colors are used in console outputs, CLI dashboards, status reports, and logs.

| Role | Color Name | Hex Code | Purpose / Visual Use |
| :--- | :--- | :--- | :--- |
| **Canvas** | OLED Deep Black | `#000000` | Background of terminal interfaces and log files |
| **Base Text** | High-Contrast White | `#FFFFFF` | Primary text, standard logs, and titles |
| **Info / Action** | Electric Cyan | `#00FFFF` | Command instructions, highlighted keys, and links |
| **Success** | Neon Green | `#39FF14` | Successful connections, loaded plugins, and `"status": "ok"` |
| **Warning** | Sunburst Orange | `#FFAA00` | Process delays, retries, and local storage limits |
| **Error** | Vivid Red | `#FF1493` | Failed connections, file write errors, and system crashes |
| **Muted Info** | Slate Gray | `#64748B` | Timestamp details, debug logs, and tracing parameters |

### Typography
- **Primary Log / Code Font:** Monospaced (e.g., *JetBrains Mono*, *Fira Code*, *Cascadia Code*).
- **Secondary Display / Documentation:** Geometric Sans-serif (e.g., *Inter*, *Outfit*).

---

## 💻 2. Command Line Interface (CLI) & Terminal UX

Every script and tool output must strictly adhere to these P1/P2 critical interaction rules to avoid "user confusion" or "interactive blockages."

### Interactivity & Status Icons
Never use color as the sole indicator of status. Always combine colors with explicit symbols:
*   **[✓] SUCCESS:** `[✓] Memory worker successfully launched on http://localhost:37777` (Neon Green)
*   **[✗] ERROR:** `[✗] Failed to write lockfile at ~/.claude-mem/worker.lock` (Vivid Red)
*   **[!] WARNING:** `[!] High memory consumption detected (>512MB). Retrying...` (Sunburst Orange)
*   **[i] INFO:** `[i] Loading persistent history from local profile...` (Electric Cyan)

### Non-Blocking Console States
- **Loaders:** For operations taking longer than 150ms (e.g., scanning large history dumps), use non-blocking text spinners (`/`, `-`, `\`, `|`) instead of freeze states.
- **Async Execution Warnings:** When launching background services, always display the exact PID and log location:
  ```
  [i] Starting Claude-mem Background Worker...
  [✓] Background process successfully spawned!
      ├── PID: 12488
      └── Log: C:\Users\Vinyas G M\.gemini\antigravity\brain\...\task-18.log
  ```

---

## 🔗 3. HTTP Server & JSON REST API Guidelines

The memory worker service listens on `http://localhost:37777` and communicates using standardized JSON contracts.

### Success Response Contract
Diagnostic and health-check responses must remain clean, predictable, and fully serialized:
```json
{
  "status": "ok",
  "service": "claude-mem",
  "version": "1.0.0",
  "uptime": 3600,
  "connections": {
    "active": true,
    "port": 37777
  },
  "storage": {
    "path": "C:\\Users\\Vinyas G M\\.claude-mem\\",
    "sizeBytes": 20480
  }
}
```

### Standardized Error Payloads
If an endpoint encounters a failure, it must return a standard error schema with proper HTTP status codes:
```json
{
  "status": "error",
  "error": {
    "code": "LOCKFILE_ACQUISITION_FAILED",
    "message": "Another instance of claude-mem is already running on this machine.",
    "severity": "HIGH"
  }
}
```

---

## ⚡ 4. Bun Performance & Process Conventions

To achieve bulletproof stability on Windows with `bun.exe`, write code according to the following conventions:

### Graceful ShutDown Handlers
Always capture process termination events to release resources, delete lockfiles, and exit cleanly:
```javascript
const cleanup = () => {
    console.log("\n[i] Shutting down gracefully...");
    // 1. Release port bindings
    // 2. Remove worker.lock file
    // 3. Flush final memory buffer to local storage
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```

### File System Operations & Security
- **Single Process Lock:** Use a local lockfile (`worker.lock`) in the profile directory to prevent duplicate servers from binding to the same port.
- **Privacy Censorship Filter:** Before saving context or log messages, run a pre-processing regex pipeline to strip credentials, API keys (e.g., `sk-proj-...`), and tokens.

---

## 📋 5. Pre-Delivery Developer QA Checklist

Before shipping any setup helper scripts or launching server configurations:
- [ ] **No Emoji Icons:** Ensure CLI logs use standard symbols (`[✓]`, `[✗]`, `[!]`) instead of emoji icons (`🚀`, `💥`).
- [ ] **Consistent Path Resolving:** Resolve local paths dynamically using absolute system variables (e.g., `$env:USERPROFILE` or `process.env.USERPROFILE`), never hardcode home directories.
- [ ] **Non-Zero Exit Codes:** If a CLI script fails, ensure it calls `process.exit(1)` (or `exit 1` in PowerShell) to notify shell environments correctly.
- [ ] **Uptime & Port Validation:** Verify that port `37777` is available before binding, and return a clean, helpful error if it is blocked.
