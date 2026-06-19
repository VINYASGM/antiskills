const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { Readable, Writable } = require('node:stream');

function createTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'veyra-mcp-test-'));
  fs.mkdirSync(path.join(dir, 'memory', 'beads'), { recursive: true });
  return dir;
}

function cleanupTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {}
}

describe('Model Context Protocol (MCP) Server Integration Tests', () => {
  let originalCwd;
  let tmpDir;
  let db;
  let mcp;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = createTempProject();
    process.chdir(tmpDir);

    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    db = require('../../bin/db.js');

    const mcpPath = require.resolve('../../bin/veyra-mcp.js');
    delete require.cache[mcpPath];
    mcp = require('../../bin/veyra-mcp.js');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tmpDir);

    const dbPath = require.resolve('../../bin/db.js');
    delete require.cache[dbPath];
    const mcpPath = require.resolve('../../bin/veyra-mcp.js');
    delete require.cache[mcpPath];
  });

  async function sendRequests(requests) {
    const input = new Readable({
      read() {}
    });
    
    const outputLines = [];
    const output = new Writable({
      write(chunk, encoding, callback) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        outputLines.push(...lines);
        callback();
      }
    });

    mcp.startServer(input, output);

    for (const req of requests) {
      input.push(JSON.stringify(req) + '\n');
    }
    input.push(null);

    await new Promise(resolve => setTimeout(resolve, 50));

    return outputLines.map(line => JSON.parse(line));
  }

  test('verifies initialize handshake', async () => {
    const responses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" }
        },
        id: 1
      }
    ]);

    expect(responses).toHaveLength(1);
    expect(responses[0]).toEqual({
      jsonrpc: "2.0",
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "veyra-mcp",
          version: "1.0.0"
        }
      },
      id: 1
    });
  });

  test('verifies tools/list returns correct tools schema', async () => {
    const responses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: 2
      }
    ]);

    expect(responses).toHaveLength(1);
    const result = responses[0].result;
    expect(result).toBeDefined();
    expect(result.tools).toHaveLength(4);

    const toolNames = result.tools.map(t => t.name);
    expect(toolNames).toContain('get_status');
    expect(toolNames).toContain('create_bead');
    expect(toolNames).toContain('list_beads');
    expect(toolNames).toContain('update_bead');

    const getStatusTool = result.tools.find(t => t.name === 'get_status');
    expect(getStatusTool.inputSchema.properties.json).toBeDefined();

    const createBeadTool = result.tools.find(t => t.name === 'create_bead');
    expect(createBeadTool.inputSchema.required).toContain('title');
  });

  test('verifies create_bead, list_beads, get_status and update_bead tools/call flow', async () => {
    // 1. Create a bead via tools/call
    const createResponses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "create_bead",
          arguments: {
            title: "Test Bead",
            description: "Detailed description",
            tags: ["integration", "test"],
            dependencies: []
          }
        },
        id: 10
      }
    ]);

    expect(createResponses).toHaveLength(1);
    const content = createResponses[0].result.content;
    expect(content).toBeDefined();
    expect(content[0].type).toBe("text");
    expect(content[0].text).toContain("Created bead bd-");

    // Extract bead ID
    const beadId = content[0].text.replace("Created bead ", "").replace(".", "");

    // Verify it exists in the database
    const beadsBefore = db.getAll();
    expect(beadsBefore).toHaveLength(1);
    expect(beadsBefore[0].id).toBe(beadId);
    expect(beadsBefore[0].title).toBe("Test Bead");
    expect(beadsBefore[0].description).toBe("Detailed description");
    expect(beadsBefore[0].tags).toEqual(["integration", "test"]);

    // 2. List beads via tools/call
    const listResponses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "list_beads",
          arguments: {}
        },
        id: 11
      }
    ]);

    expect(listResponses).toHaveLength(1);
    const listBeadsText = listResponses[0].result.content[0].text;
    const beadsList = JSON.parse(listBeadsText);
    expect(beadsList).toHaveLength(1);
    expect(beadsList[0].id).toBe(beadId);

    // 3. Get status via tools/call (json output)
    const statusJsonResponses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_status",
          arguments: { json: true }
        },
        id: 12
      }
    ]);

    expect(statusJsonResponses).toHaveLength(1);
    const statusJsonText = statusJsonResponses[0].result.content[0].text;
    const statusBeads = JSON.parse(statusJsonText);
    expect(statusBeads).toHaveLength(1);
    expect(statusBeads[0].id).toBe(beadId);

    // 4. Get status via tools/call (table text output)
    const statusTableResponses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "get_status",
          arguments: {}
        },
        id: 13
      }
    ]);

    expect(statusTableResponses).toHaveLength(1);
    const statusTableText = statusTableResponses[0].result.content[0].text;
    expect(statusTableText).toContain("Live Active Task Progress");
    expect(statusTableText).toContain(beadId);
    expect(statusTableText).toContain("Test Bead");

    // 5. Update bead via tools/call
    const updateResponses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "update_bead",
          arguments: {
            id: beadId,
            status: "in_progress",
            description: "Updated description",
            claimed_by: "agent-1",
            claimed_at: new Date().toISOString()
          }
        },
        id: 14
      }
    ]);

    expect(updateResponses).toHaveLength(1);
    expect(updateResponses[0].result.content[0].text).toBe(`Updated bead ${beadId}.`);

    // Verify update in database
    const beadAfter = db.get(beadId);
    expect(beadAfter.status).toBe("in_progress");
    expect(beadAfter.description).toBe("Updated description");
    expect(beadAfter.claimed_by).toBe("agent-1");
  });

  test('verifies notifications are handled silently without response', async () => {
    const responses = await sendRequests([
      {
        jsonrpc: "2.0",
        method: "notifications/initialized"
      }
    ]);

    expect(responses).toHaveLength(0);
  });
});
