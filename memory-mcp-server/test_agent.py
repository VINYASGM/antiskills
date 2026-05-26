import json
import subprocess
import time
import sys
import os

def send_rpc_request(process, method, params=None):
    req = {
        "jsonrpc": "2.0",
        "id": int(time.time() * 1000),
        "method": method,
        "params": params or {}
    }
    req_str = json.dumps(req) + "\n"
    process.stdin.write(req_str)
    process.stdin.flush()
    
    # Read response
    response_str = process.stdout.readline()
    try:
        return json.loads(response_str)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response", "raw": response_str}

def main():
    print("Starting Python MCP Server process...")
    # Get correct directory
    cwd = os.getcwd()
    server_script = os.path.join(cwd, "memory-mcp-server", "server.py")
    
    process = subprocess.Popen(
        ["py", server_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr, # Allow stderr to print to terminal directly for logs
        text=True
    )
    
    # Give it a second to boot up
    time.sleep(1)
    
    print("\n--- 1. Testing initialize ---")
    res = send_rpc_request(process, "initialize")
    print(json.dumps(res, indent=2))
    
    print("\n--- 2. Testing tools/list ---")
    res = send_rpc_request(process, "tools/list")
    print(json.dumps(res, indent=2))
    
    print("\n--- 3. Testing add_memory_node (Node 1) ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "add_memory_node",
        "arguments": {
            "node_id": "bd-0001",
            "node_type": "architectural_decision",
            "title": "Decouple Memory to Python MCP",
            "summary": "Implement decoupled Python DuckDB NetworkX graph memory. (resolved)"
        }
    })
    print(json.dumps(res, indent=2))
    
    print("\n--- 4. Testing add_memory_node (Node 2) ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "add_memory_node",
        "arguments": {
            "node_id": "bd-0002",
            "node_type": "task_state",
            "title": "Verify VFS Patch Merging",
            "summary": "Check that the patch apply logic does not conflict. (closed)"
        }
    })
    print(json.dumps(res, indent=2))

    print("\n--- 5. Testing add_memory_edge (Create Link) ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "add_memory_edge",
        "arguments": {
            "source_id": "bd-0002",
            "target_id": "bd-0001",
            "relation_type": "depends_on"
        }
    })
    print(json.dumps(res, indent=2))
    
    print("\n--- 6. Testing query_memory_graph ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "query_memory_graph",
        "arguments": {
            "node_id": "bd-0002",
            "depth": 1
        }
    })
    print(json.dumps(res, indent=2))

    print("\n--- 7. Testing compress_episodic_memory (Modularity Compression) ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "compress_episodic_memory",
        "arguments": {}
    })
    print(json.dumps(res, indent=2))

    # Clean up
    process.terminate()
    print("\nTest execution finished successfully.")

if __name__ == "__main__":
    main()
