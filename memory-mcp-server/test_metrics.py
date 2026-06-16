import os
import tempfile
import pytest
from graph import MemoryGraph

def test_get_god_nodes():
    # Create a MemoryGraph in a temporary database file path
    fd, db_path = tempfile.mkstemp(suffix=".duckdb")
    os.close(fd)
    if os.path.exists(db_path):
        os.remove(db_path)
    
    try:
        graph = MemoryGraph(db_path=db_path)
        
        # Add a node that will act as a "God Node" (highly connected)
        graph.add_node("core_logic.py", "source_file", "Core Logic", "Central system engine", "")
        # Add normal nodes
        graph.add_node("helper.js", "source_file", "Helper functions", "JS utilities", "")
        graph.add_node("database.sql", "database_schema", "Database Schema", "SQL definitions", "")
        # Add stub, mock, and builtin nodes that should be filtered out
        graph.add_node("mock_auth.py", "source_file", "Mock Auth", "Auth mock", "")
        graph.add_node("test_utils.py", "source_file", "Test Utils", "Utilities for test", "")
        graph.add_node("some_stub", "stub", "Stub Node", "Implicit stub", "")
        
        # Create edges to core_logic.py (in-degree = 2)
        graph.add_edge("helper.js", "core_logic.py", "calls")
        graph.add_edge("database.sql", "core_logic.py", "queries")
        
        # Create edge to mock (should not count since mock is filtered)
        graph.add_edge("core_logic.py", "mock_auth.py", "uses")
        
        god_nodes = graph.get_god_nodes(limit=5)
        
        # Check filtered: stub, mock, test_utils must not be in the results
        node_ids = [n["node_id"] for n in god_nodes]
        assert "core_logic.py" in node_ids
        assert "helper.js" in node_ids
        assert "database.sql" in node_ids
        assert "mock_auth.py" not in node_ids
        assert "test_utils.py" not in node_ids
        assert "some_stub" not in node_ids
        
        # core_logic.py has higher in-degree centrality than helper/database
        assert god_nodes[0]["node_id"] == "core_logic.py"
        assert god_nodes[0]["pagerank"] > 0
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)

def test_get_surprising_connections():
    fd, db_path = tempfile.mkstemp(suffix=".duckdb")
    os.close(fd)
    if os.path.exists(db_path):
        os.remove(db_path)
        
    try:
        graph = MemoryGraph(db_path=db_path)
        
        # Add files in different languages
        graph.add_node("app.py", "source_file", "Python application", "Python entry point", "")
        graph.add_node("ui.js", "source_file", "JS frontend", "React frontend code", "")
        graph.add_node("schema.sql", "database_schema", "SQL schema", "SQL db code", "")
        
        # Py to JS (language crossing)
        graph.add_edge("app.py", "ui.js", "sends_events_to")
        # Py to SQL (language crossing)
        graph.add_edge("app.py", "schema.sql", "queries")
        
        surprising = graph.get_surprising_connections()
        assert len(surprising) > 0
        
        # Check that language crossing flag is true
        crossing_edges = [edge for edge in surprising if edge["is_language_crossing"]]
        assert len(crossing_edges) > 0
        
        edge_sources = [edge["source"] for edge in crossing_edges]
        assert "app.py" in edge_sources
    finally:
        if os.path.exists(db_path):
            os.remove(db_path)
