import json
import subprocess
import time

def send_rpc_request(process, method, params=None):
    req = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
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
    print("Starting MCP Server process...")
    # Note: We run using `cargo run` for testing. In production, run the compiled binary.
    process = subprocess.Popen(
        ["cargo", "run", "--release", "--quiet"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, # Keep stderr separate to avoid corrupting JSON stdout
        text=True
    )
    
    # Give it a second to boot up
    time.sleep(2)
    
    print("\n--- 1. Testing initialize ---")
    res = send_rpc_request(process, "initialize")
    print(json.dumps(res, indent=2))
    
    print("\n--- 2. Testing tools/list ---")
    res = send_rpc_request(process, "tools/list")
    print(json.dumps(res, indent=2))
    
    print("\n--- 3. Testing deep_query tool ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "deep_query",
        "arguments": {
            "intent": "How does the SQLite writer loop work?",
            "include_dependencies": True
        }
    })
    print(json.dumps(res, indent=2))
    
    print("\n--- 4. Testing record_event tool ---")
    res = send_rpc_request(process, "tools/call", {
        "name": "record_event",
        "arguments": {
            "action": "Ran Python integration test",
            "result": "Tests passed successfully"
        }
    })
    print(json.dumps(res, indent=2))

    # Clean up
    process.terminate()

if __name__ == "__main__":
    main()
