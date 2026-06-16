import os
import duckdb
import networkx as nx

class MemoryGraph:
    def __init__(self, db_path=None):
        if db_path is None:
            # Place in .agent/ memory storage
            cwd = os.getcwd()
            agent_dir = os.path.join(cwd, ".agent")
            if not os.path.exists(agent_dir):
                os.makedirs(agent_dir)
            db_path = os.path.join(agent_dir, "memory_graph.duckdb")
        
        self.db_path = db_path
        self.conn = duckdb.connect(self.db_path)
        self._init_tables()
        self.nx_graph = nx.DiGraph()
        self._sync_nx_graph()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS nodes (
                id VARCHAR PRIMARY KEY,
                type VARCHAR,
                title VARCHAR,
                summary VARCHAR,
                timestamp VARCHAR
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS edges (
                source VARCHAR,
                target VARCHAR,
                relation VARCHAR,
                PRIMARY KEY (source, target, relation)
            )
        """)

    def _sync_nx_graph(self):
        self.nx_graph.clear()
        
        # Load nodes
        nodes_df = self.conn.execute("SELECT id, type, title, summary, timestamp FROM nodes").df()
        for _, row in nodes_df.iterrows():
            self.nx_graph.add_node(
                row['id'],
                type=row['type'],
                title=row['title'],
                summary=row['summary'],
                timestamp=row['timestamp']
            )
            
        # Load edges
        edges_df = self.conn.execute("SELECT source, target, relation FROM edges").df()
        for _, row in edges_df.iterrows():
            self.nx_graph.add_edge(
                row['source'],
                row['target'],
                relation=row['relation']
            )

    def add_node(self, node_id, node_type, title, summary, timestamp):
        self.conn.execute("""
            INSERT OR REPLACE INTO nodes (id, type, title, summary, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (node_id, node_type, title, summary, timestamp))
        self.nx_graph.add_node(
            node_id,
            type=node_type,
            title=title,
            summary=summary,
            timestamp=timestamp
        )

    def add_edge(self, source_id, target_id, relation_type):
        # Verify both nodes exist in DuckDB, if not, create stubs
        res_source = self.conn.execute("SELECT COUNT(*) FROM nodes WHERE id = ?", (source_id,)).fetchone()[0]
        if res_source == 0:
            self.add_node(source_id, "stub", "Stub Node", "Implicitly created reference", "")
            
        res_target = self.conn.execute("SELECT COUNT(*) FROM nodes WHERE id = ?", (target_id,)).fetchone()[0]
        if res_target == 0:
            self.add_node(target_id, "stub", "Stub Node", "Implicitly created reference", "")

        self.conn.execute("""
            INSERT OR REPLACE INTO edges (source, target, relation)
            VALUES (?, ?, ?)
        """, (source_id, target_id, relation_type))
        self.nx_graph.add_edge(source_id, target_id, relation=relation_type)

    def get_node(self, node_id):
        if node_id in self.nx_graph:
            return self.nx_graph.nodes[node_id]
        return None

    def query_dependencies(self, node_id, depth=1):
        if node_id not in self.nx_graph:
            return {"nodes": [], "edges": []}
            
        # Traverse graph BFS up to depth
        visited_nodes = {node_id}
        queue = [(node_id, 0)]
        edges = []
        
        while queue:
            curr, curr_depth = queue.pop(0)
            if curr_depth >= depth:
                continue
                
            # Successors (dependencies)
            for neighbor in self.nx_graph.successors(curr):
                edge_data = self.nx_graph.edges[curr, neighbor]
                edges.append({
                    "source": curr,
                    "target": neighbor,
                    "relation": edge_data.get("relation", "depends_on")
                })
                if neighbor not in visited_nodes:
                    visited_nodes.add(neighbor)
                    queue.append((neighbor, curr_depth + 1))
                    
            # Predecessors (dependents)
            for neighbor in self.nx_graph.predecessors(curr):
                edge_data = self.nx_graph.edges[neighbor, curr]
                edges.append({
                    "source": neighbor,
                    "target": curr,
                    "relation": edge_data.get("relation", "depends_on")
                })
                if neighbor not in visited_nodes:
                    visited_nodes.add(neighbor)
                    queue.append((neighbor, curr_depth + 1))
                    
        nodes_info = []
        for n_id in visited_nodes:
            n_data = self.nx_graph.nodes[n_id]
            nodes_info.append({
                "id": n_id,
                "type": n_data.get("type"),
                "title": n_data.get("title"),
                "summary": n_data.get("summary"),
                "timestamp": n_data.get("timestamp")
            })
            
        return {"nodes": nodes_info, "edges": edges}
        
    def get_all_nodes(self):
        nodes = []
        for n_id in self.nx_graph.nodes:
            n_data = self.nx_graph.nodes[n_id]
            nodes.append({
                "id": n_id,
                "type": n_data.get("type"),
                "title": n_data.get("title"),
                "summary": n_data.get("summary"),
                "timestamp": n_data.get("timestamp")
            })
        return nodes
        
    def remove_nodes(self, node_ids):
        if not node_ids:
            return
        node_ids_list = list(node_ids)
        placeholders = ",".join(["?"] * len(node_ids_list))
        self.conn.execute(f"DELETE FROM nodes WHERE id IN ({placeholders})", node_ids_list)
        self.conn.execute(
            f"DELETE FROM edges WHERE source IN ({placeholders}) OR target IN ({placeholders})",
            node_ids_list + node_ids_list
        )
        self._sync_nx_graph()

    def get_god_nodes(self, limit=10):
        # Filter stubs, mocks, and builtins
        filtered_nodes = [
            node for node, data in self.nx_graph.nodes(data=True)
            if data.get('type') != 'stub'
            and not any(term in node.lower() for term in ['mock', 'stub', 'test_utils', 'builtin'])
        ]
        subgraph = self.nx_graph.subgraph(filtered_nodes)
        
        if len(subgraph) < 2:
            results = []
            for node in filtered_nodes:
                n_data = self.nx_graph.nodes[node]
                results.append({
                    "node_id": node,
                    "pagerank": 0.0,
                    "title": n_data.get("title", "Untitled"),
                    "summary": n_data.get("summary", "")
                })
            return results[:limit]

        pagerank_scores = nx.pagerank(subgraph)
        
        results = []
        for node in filtered_nodes:
            n_data = self.nx_graph.nodes[node]
            results.append({
                "node_id": node,
                "pagerank": float(pagerank_scores.get(node, 0.0)),
                "title": n_data.get("title", "Untitled"),
                "summary": n_data.get("summary", "")
            })
        
        results.sort(key=lambda x: x["pagerank"], reverse=True)
        return results[:limit]

    def calculate_degree_centrality(self, top_n=10):
        return self.get_god_nodes(limit=top_n)

    def get_surprising_connections(self, limit=10):
        g = self.nx_graph.to_undirected()
        if len(g.nodes) < 2:
            return []
            
        from networkx.algorithms import community
        try:
            communities = list(community.louvain_communities(g))
        except Exception:
            try:
                communities = list(community.label_propagation_communities(g))
            except Exception:
                communities = list(nx.connected_components(g))
            
        node_to_community = {}
        for i, comm in enumerate(communities):
            for node in comm:
                node_to_community[node] = i

        def get_language(node_id):
            _, ext = os.path.splitext(node_id.lower())
            if ext in ['.js', '.jsx', '.ts', '.tsx']:
                return 'javascript/typescript'
            elif ext == '.py':
                return 'python'
            elif ext == '.rs':
                return 'rust'
            elif ext == '.go':
                return 'go'
            elif ext in ['.sql', '.db']:
                return 'sql'
            elif ext in ['.cls', '.apex']:
                return 'apex'
            return 'unknown'

        surprising_edges = []
        for u, v, data in self.nx_graph.edges(data=True):
            u_comm = node_to_community.get(u)
            v_comm = node_to_community.get(v)
            u_lang = get_language(u)
            v_lang = get_language(v)
            
            is_community_crossing = (u_comm is not None and v_comm is not None and u_comm != v_comm)
            is_language_crossing = (u_lang != 'unknown' and v_lang != 'unknown' and u_lang != v_lang)
            
            if is_community_crossing or is_language_crossing:
                surprising_edges.append({
                    "source": u,
                    "target": v,
                    "relation": data.get("relation", "depends_on"),
                    "is_community_crossing": is_community_crossing,
                    "is_language_crossing": is_language_crossing,
                    "source_lang": u_lang,
                    "target_lang": v_lang,
                    "source_community": u_comm,
                    "target_community": v_comm
                })
                
        return surprising_edges[:limit]
