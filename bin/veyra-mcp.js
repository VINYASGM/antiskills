const readline = require('node:readline');
const beadsDB = require('./db');

function formatStatusTable(beads) {
  let out = '';
  out += '\n\x1b[1m\x1b[36m=== Live Active Task Progress ===\x1b[0m\n\n';
  const colWidths = { id: 10, status: 15, author: 15, claimed: 15, title: 30 };
  const header = `| ${'ID'.padEnd(colWidths.id)} | ${'Status'.padEnd(colWidths.status)} | ${'Author'.padEnd(colWidths.author)} | ${'Claimed By'.padEnd(colWidths.claimed)} | ${'Title'.padEnd(colWidths.title)} |`;
  const separator = `+-${'-'.repeat(colWidths.id)}-+-${'-'.repeat(colWidths.status)}-+-${'-'.repeat(colWidths.author)}-+-${'-'.repeat(colWidths.claimed)}-+-${'-'.repeat(colWidths.title)}-+`;
  
  out += separator + '\n';
  out += header + '\n';
  out += separator + '\n';
  
  for (const bead of beads) {
    let statusColor = '\x1b[0m';
    if (bead.status === 'open') statusColor = '\x1b[32m';
    else if (bead.status === 'claimed') statusColor = '\x1b[33m';
    else if (bead.status === 'in_progress') statusColor = '\x1b[35m';
    else if (bead.status === 'resolved') statusColor = '\x1b[34m';
    else if (bead.status === 'failed') statusColor = '\x1b[31m';
    
    const idStr = bead.id.padEnd(colWidths.id);
    const rawStatus = bead.status || '';
    const paddedStatus = rawStatus.padEnd(colWidths.status);
    const coloredStatus = statusColor + paddedStatus + '\x1b[0m';
    const authorStr = (bead.author || 'system').padEnd(colWidths.author);
    const claimedStr = (bead.claimed_by || 'None').padEnd(colWidths.claimed);
    const titleStr = ((bead.title || '').length > colWidths.title ? (bead.title || '').slice(0, colWidths.title - 3) + '...' : (bead.title || '')).padEnd(colWidths.title);
    
    out += `| ${idStr} | ${coloredStatus} | ${authorStr} | ${claimedStr} | ${titleStr} |\n`;
  }
  out += separator + '\n\n';
  return out;
}

function getToolsList() {
  return [
    {
      name: "get_status",
      description: "Retrieves the current status summary of beads.",
      inputSchema: {
        type: "object",
        properties: {
          json: {
            type: "boolean",
            description: "If true, returns status as a structured JSON string instead of text table formatting."
          }
        }
      }
    },
    {
      name: "create_bead",
      description: "Creates a new bead.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title of the bead."
          },
          description: {
            type: "string",
            description: "The description of the bead."
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags associated with the bead."
          },
          dependencies: {
            type: "array",
            items: { type: "string" },
            description: "List of dependent bead IDs."
          }
        },
        required: ["title"]
      }
    },
    {
      name: "list_beads",
      description: "Lists all beads currently in the database.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "update_bead",
      description: "Updates a bead's fields.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the bead to update (e.g. bd-uuid)."
          },
          status: {
            type: "string",
            enum: ["open", "claimed", "in_progress", "resolved", "failed"],
            description: "New status for the bead."
          },
          title: {
            type: "string",
            description: "New title for the bead."
          },
          description: {
            type: "string",
            description: "New description for the bead."
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "New tags list."
          },
          dependencies: {
            type: "array",
            items: { type: "string" },
            description: "New dependencies list."
          },
          claimed_by: {
            type: "string",
            description: "Agent ID that claims the bead, or null."
          },
          claimed_at: {
            type: "string",
            description: "ISO timestamp when claimed, or null."
          },
          evidence: {
            type: "string",
            description: "Evidence or resolution details, or null."
          }
        },
        required: ["id"]
      }
    }
  ];
}

async function handleToolCall(params) {
  const { name, arguments: args } = params;

  // Always sync before handling any tool call
  beadsDB.sync();

  let textResult = "";

  switch (name) {
    case 'get_status': {
      const isJson = args && (args.json === true || args.JSON === true);
      const beads = beadsDB.getAll();
      if (isJson) {
        textResult = JSON.stringify(beads, null, 2);
      } else {
        textResult = formatStatusTable(beads);
      }
      break;
    }
    case 'create_bead': {
      if (!args || !args.title) {
        throw new Error("Missing required argument: title");
      }
      const title = args.title;
      const description = args.description || "";
      const tags = args.tags || [];
      const dependencies = args.dependencies || [];
      
      const id = beadsDB.create({
        type: 'task_state',
        status: 'open',
        title,
        description,
        author: 'system',
        timestamp: new Date().toISOString(),
        tags,
        dependencies
      });
      beadsDB.sync();
      textResult = `Created bead ${id}.`;
      break;
    }
    case 'list_beads': {
      const beads = beadsDB.getAll();
      textResult = JSON.stringify(beads, null, 2);
      break;
    }
    case 'update_bead': {
      if (!args || !args.id) {
        throw new Error("Missing required argument: id");
      }
      const id = args.id;
      const existing = beadsDB.get(id);
      if (!existing) {
        throw new Error(`Bead '${id}' not found.`);
      }

      const updates = {};
      if (args.status !== undefined) updates.status = args.status;
      if (args.title !== undefined) updates.title = args.title;
      if (args.description !== undefined) updates.description = args.description;
      if (args.tags !== undefined) updates.tags = args.tags;
      if (args.dependencies !== undefined) updates.dependencies = args.dependencies;
      if (args.claimed_by !== undefined) updates.claimed_by = args.claimed_by;
      if (args.claimed_at !== undefined) updates.claimed_at = args.claimed_at;
      if (args.evidence !== undefined) updates.evidence = args.evidence;

      beadsDB._writeToJSON(id, updates);
      beadsDB.sync();
      textResult = `Updated bead ${id}.`;
      break;
    }
    default: {
      throw new Error(`Tool not found: ${name}`);
    }
  }

  return {
    content: [
      {
        type: "text",
        text: textResult
      }
    ]
  };
}

function startServer(input = process.stdin, output = process.stdout) {
  function sendResult(id, result) {
    const response = {
      jsonrpc: "2.0",
      result,
      id
    };
    output.write(JSON.stringify(response) + '\n');
  }

  function sendError(id, code, message) {
    const response = {
      jsonrpc: "2.0",
      error: {
        code,
        message
      },
      id
    };
    output.write(JSON.stringify(response) + '\n');
  }

  const rl = readline.createInterface({
    input,
    output,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let request;
    try {
      request = JSON.parse(line);
    } catch (err) {
      sendError(null, -32700, "Parse error: " + err.message);
      return;
    }

    const { jsonrpc, method, params, id } = request;
    const isNotification = id === undefined;

    if (jsonrpc !== "2.0") {
      if (!isNotification) {
        sendError(id, -32600, "Invalid Request: jsonrpc version must be 2.0");
      }
      return;
    }

    try {
      let result;
      switch (method) {
        case 'initialize': {
          result = {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: "veyra-mcp",
              version: "1.0.0"
            }
          };
          break;
        }
        case 'tools/list': {
          result = {
            tools: getToolsList()
          };
          break;
        }
        case 'tools/call': {
          result = await handleToolCall(params);
          break;
        }
        default: {
          if (!isNotification) {
            sendError(id, -32601, `Method not found: ${method}`);
          }
          return;
        }
      }

      if (!isNotification) {
        sendResult(id, result);
      }
    } catch (err) {
      if (!isNotification) {
        sendError(id, -32603, err.message);
      }
    }
  });
}

module.exports = {
  startServer,
  formatStatusTable,
  getToolsList,
  handleToolCall
};

if (require.main === module) {
  startServer();
}
