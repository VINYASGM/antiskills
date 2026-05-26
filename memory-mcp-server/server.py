import sys
import json
import traceback
import time
from graph import MemoryGraph
from compress import trigger_compression

def log_debug(msg):
    sys.stderr.write(f"[DEBUG] {msg}\n")
    sys.stderr.flush()

class McpServer:
    def __init__(self):
        self.graph = MemoryGraph()

    def list_tools(self):
        return {
            "tools": [
                {
                    "name": "add_memory_node",
                    "description": "Inserts or updates a memory node in the DuckDB memory graph",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "node_id": { "type": "string", "description": "Unique bead ID (e.g. bd-0042)" },
                            "node_type": { "type": "string", "description": "Type: architectural_decision, requirement, task_state, bug_discovery" },
                            "title": { "type": "string", "description": "Short description title" },
                            "summary": { "type": "string", "description": "Detailed bead description content" }
                        },
                        "required": ["node_id", "node_type", "title", "summary"]
                    }
                },
                {
                    "name": "add_memory_edge",
                    "description": "Creates a directed semantic edge between two graph nodes",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "source_id": { "type": "string" },
                            "target_id": { "type": "string" },
                            "relation_type": { "type": "string", "description": "Relation name (e.g. depends_on, supersedes)" }
                        },
                        "required": ["source_id", "target_id", "relation_type"]
                    }
                },
                {
                    "name": "query_memory_graph",
                    "description": "Performs modular BFS traversal around a starting node up to specified depth",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "node_id": { "type": "string" },
                            "depth": { "type": "integer", "default": 1 }
                        },
                        "required": ["node_id"]
                    }
                },
                {
                    "name": "compress_episodic_memory",
                    "description": "Aggregates, summarizes, and prunes older task clusters via NetworkX modularity detection",
                    "inputSchema": {
                        "type": "object",
                        "properties": {}
                    }
                }
            ]
        }

    def call_tool(self, name, arguments):
        log_debug(f"Calling tool: {name} with args: {arguments}")
        
        if name == "add_memory_node":
            node_id = arguments["node_id"]
            node_type = arguments["node_type"]
            title = arguments["title"]
            summary = arguments["summary"]
            timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            
            self.graph.add_node(node_id, node_type, title, summary, timestamp)
            return {"content": [{"type": "text", "text": f"Successfully indexed node '{node_id}' in memory graph."}]}
            
        elif name == "add_memory_edge":
            source_id = arguments["source_id"]
            target_id = arguments["target_id"]
            relation = arguments["relation_type"]
            
            self.graph.add_edge(source_id, target_id, relation)
            return {"content": [{"type": "text", "text": f"Successfully created edge: {source_id} --({relation})--> {target_id}."}]}
            
        elif name == "query_memory_graph":
            node_id = arguments["node_id"]
            depth = arguments.get("depth", 1)
            
            res = self.graph.query_dependencies(node_id, depth)
            return {"content": [{"type": "text", "text": json.dumps(res, indent=2)}]}
            
        elif name == "compress_episodic_memory":
            consolidated_ids = trigger_compression(self.graph)
            return {
                "content": [
                    {
                        "type": "text", 
                        "text": f"Modularity compression triggered. Created consolidated nodes: {consolidated_ids}"
                    }
                ]
            }
        else:
            raise ValueError(f"Tool not found: {name}")

    def run(self):
        log_debug("Starting Python Memory MCP Server...")
        for line in sys.stdin:
            if not line.strip():
                continue
            try:
                req = json.loads(line)
                method = req.get("method")
                req_id = req.get("id")
                
                log_debug(f"Request received: {method}")
                
                if method == "initialize":
                    res = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": { "tools": {} },
                            "serverInfo": { "name": "python-memory-mcp", "version": "1.0.0" }
                        }
                    }
                elif method == "tools/list":
                    res = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": self.list_tools()
                    }
                elif method == "tools/call":
                    params = req.get("params", {})
                    name = params.get("name")
                    arguments = params.get("arguments", {})
                    
                    try:
                        result = self.call_tool(name, arguments)
                        res = {
                            "jsonrpc": "2.0",
                            "id": req_id,
                            "result": result
                        }
                    except Exception as e:
                        res = {
                            "jsonrpc": "2.0",
                            "id": req_id,
                            "error": {
                                "code": -32603,
                                "message": str(e),
                                "data": traceback.format_exc()
                            }
                        }
                else:
                    res = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "error": {
                            "code": -32601,
                            "message": f"Method not found: {method}"
                        }
                    }
                
                sys.stdout.write(json.dumps(res) + "\n")
                sys.stdout.flush()
                
            except Exception as e:
                log_debug(f"CRITICAL server error: {e}")
                log_debug(traceback.format_exc())

if __name__ == "__main__":
    server = McpServer()
    server.run()
