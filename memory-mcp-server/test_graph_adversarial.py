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

def test_sql_injection_in_remove_nodes():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        unsafe_id = "test'file.py"
        safe_id = "safe_file.py"
        graph.add_node(unsafe_id, "source_file", "Title", "Summary", "")
        graph.add_node(safe_id, "source_file", "Title Safe", "Summary Safe", "")
        
        # This should succeed and NOT raise any exception
        graph.remove_nodes([unsafe_id, "nonexistent' OR '1'='1"])
        
        # Verify unsafe_id is deleted, but safe_id remains
        assert graph.get_node(unsafe_id) is None
        assert graph.get_node(safe_id) is not None
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_god_nodes_empty_graph():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        god_nodes = graph.get_god_nodes(limit=10)
        assert god_nodes == []
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_god_nodes_single_node():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("only_one.py", "source_file", "Title", "Summary", "")
        god_nodes = graph.get_god_nodes(limit=10)
        assert len(god_nodes) == 1
        assert god_nodes[0]["node_id"] == "only_one.py"
        assert god_nodes[0]["in_centrality"] == 0.0
        assert god_nodes[0]["out_centrality"] == 0.0
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_god_nodes_isolated_nodes():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("a.py", "source_file", "Title A", "Summary A", "")
        graph.add_node("b.py", "source_file", "Title B", "Summary B", "")
        graph.add_node("c.js", "source_file", "Title C", "Summary C", "")
        god_nodes = graph.get_god_nodes(limit=10)
        assert len(god_nodes) == 3
        for node in god_nodes:
            assert node["in_centrality"] == 0.0
            assert node["out_centrality"] == 0.0
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_surprising_connections_empty_graph():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_surprising_connections_single_node():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("a.py", "source_file", "Title A", "Summary A", "")
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_surprising_connections_isolated_nodes():
    db_path = create_temp_db()
    try:
        graph = MemoryGraph(db_path=db_path)
        graph.add_node("a.py", "source_file", "Title A", "Summary A", "")
        graph.add_node("b.js", "source_file", "Title B", "Summary B", "")
        surprising = graph.get_surprising_connections()
        assert surprising == []
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
