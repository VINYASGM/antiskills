import os
import tempfile
import pytest
from graph import MemoryGraph

def create_temp_db():
    fd, db_path = tempfile.mkstemp(suffix=".duckdb")
    os.close(fd)
    if os.path.exists(db_path):
        os.remove(db_path)
    return db_path

def cleanup_db(db_path):
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass

def test_empty_graph():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        # Empty graph centrality
        god = graph.get_god_nodes()
        assert god == []
        
        # Empty graph surprising connections
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        cleanup_db(db_path)

def test_single_isolated_node():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("lone_node.py", "source_file", "Lone", "No connections", "")
        
        # Centrality check on single node
        god = graph.get_god_nodes()
        assert len(god) == 1
        assert god[0]["node_id"] == "lone_node.py"
        assert god[0]["pagerank"] == 0.0
        assert god[0]["pagerank"] == 0.0
        
        # Surprising connections on single node (less than 2 nodes, should return empty list)
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        cleanup_db(db_path)

def test_multiple_isolated_nodes():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        for i in range(5):
            graph.add_node(f"node_{i}.js", "source_file", f"Node {i}", "Isolated", "")
            
        god = graph.get_god_nodes()
        assert len(god) == 5
        for n in god:
            assert abs(n["pagerank"] - 0.2) < 1e-4
            
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        cleanup_db(db_path)

def test_disconnected_subgraphs():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        # Component 1 (Python)
        graph.add_node("a.py", "source_file", "A", "", "")
        graph.add_node("b.py", "source_file", "B", "", "")
        graph.add_edge("a.py", "b.py", "calls")
        
        # Component 2 (JavaScript)
        graph.add_node("c.js", "source_file", "C", "", "")
        graph.add_node("d.js", "source_file", "D", "", "")
        graph.add_edge("c.js", "d.js", "imports")
        
        # Isolated node E (Rust)
        graph.add_node("e.rs", "source_file", "E", "", "")
        
        god = graph.get_god_nodes()
        # Should contain all 5 nodes since none are filtered stubs/mocks
        assert len(god) == 5
        
        # Centrality counts in subgraph:
        # subgraph has 5 nodes. For centrality, degree/4 is used.
        # "b.py" has 1 in-edge (from a.py). In-centrality of b.py = 1/4 = 0.25.
        # "d.js" has 1 in-edge (from c.js). In-centrality of d.js = 1/4 = 0.25.
        # Others have 0.0 in-centrality.
        b_node = next(x for x in god if x["node_id"] == "b.py")
        d_node = next(x for x in god if x["node_id"] == "d.js")
        a_node = next(x for x in god if x["node_id"] == "a.py")
        c_node = next(x for x in god if x["node_id"] == "c.js")
        assert b_node["pagerank"] > a_node["pagerank"]
        assert d_node["pagerank"] > c_node["pagerank"]
        
        # Out centrality: a.py and c.js should have 1/4 = 0.25.
        a_node = next(x for x in god if x["node_id"] == "a.py")

        
        # Let's test surprising connections (should be empty since no edges cross components, and no language-crossing edges exist)
        surprising = graph.get_surprising_connections()
        # Wait, are there crossing edges?
        # a.py -> b.py (both py, same component)
        # c.js -> d.js (both js, same component)
        # No crossing edges!
        assert surprising == []
    finally:
        cleanup_db(db_path)

def test_self_loops():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("self.py", "source_file", "Self", "", "")
        graph.add_node("other.py", "source_file", "Other", "", "")
        graph.add_edge("self.py", "self.py", "loops")
        graph.add_edge("self.py", "other.py", "calls")
        
        god = graph.get_god_nodes()
        assert len(god) == 2
        # self.py out-centrality: self -> self and self -> other
        # NetworkX out_degree_centrality: self has out_degree=2. Centrality = 2/1 = 2.0 (networkx allows > 1 for self loops)
        self_node = next(x for x in god if x["node_id"] == "self.py")
        assert self_node["pagerank"] > 0
    finally:
        cleanup_db(db_path)

def test_multilingual_crossing_connections():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        # Add various languages
        graph.add_node("app.py", "source_file", "Python App", "", "")
        graph.add_node("db.sql", "source_file", "SQL Database", "", "")
        graph.add_node("controller.cls", "source_file", "Apex Controller", "", "")
        graph.add_node("wasm.go", "source_file", "Go WASM", "", "")
        graph.add_node("lib.rs", "source_file", "Rust library", "", "")
        graph.add_node("ui.tsx", "source_file", "React UI", "", "")
        graph.add_node("unknown_file", "source_file", "Unknown file type", "", "")
        
        # Add crossing connections
        graph.add_edge("app.py", "db.sql", "queries") # Py -> SQL (crossing)
        graph.add_edge("ui.tsx", "wasm.go", "invokes") # TSX -> Go (crossing)
        graph.add_edge("wasm.go", "lib.rs", "calls") # Go -> Rust (crossing)
        graph.add_edge("lib.rs", "unknown_file", "uses") # Rust -> Unknown (crossing)
        
        surprising = graph.get_surprising_connections()
        assert len(surprising) > 0
        
        # Verify language crossing details
        py_sql_edge = next(x for x in surprising if x["source"] == "app.py" and x["target"] == "db.sql")
        assert py_sql_edge["is_language_crossing"] is True
        assert py_sql_edge["source_lang"] == "python"
        assert py_sql_edge["target_lang"] == "sql"
        
        go_rs_edge = next(x for x in surprising if x["source"] == "wasm.go" and x["target"] == "lib.rs")
        assert go_rs_edge["is_language_crossing"] is True
        assert go_rs_edge["source_lang"] == "go"
        assert go_rs_edge["target_lang"] == "rust"
    finally:
        cleanup_db(db_path)
