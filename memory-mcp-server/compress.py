import networkx as nx
from networkx.algorithms import community

def find_task_clusters(mg):
    """
    Identifies clusters of related memory nodes using modularity-based communities.
    """
    g = mg.nx_graph.to_undirected()
    if len(g.nodes) < 2:
        return []
        
    try:
        # Detect communities/clusters using NetworkX label propagation
        communities_generator = community.label_propagation_communities(g)
        return [list(c) for c in communities_generator]
    except Exception:
        # Fallback to connected components if label propagation fails
        return [list(c) for c in nx.connected_components(g)]

def compress_cluster(mg, cluster_nodes):
    """
    Compresses a cluster of older completed memory nodes into a single consolidated bead.
    """
    # Filter for nodes that are old (usually have closed, resolved or archived context)
    compressive_nodes = []
    retained_nodes = []
    
    for node_id in cluster_nodes:
        n_data = mg.get_node(node_id)
        if not n_data:
            continue
        
        # Consider closed or stub nodes compressible
        n_type = n_data.get("type", "")
        summary = n_data.get("summary", "").lower()
        if n_type == "stub" or "resolved" in summary or "complete" in summary or "closed" in summary:
            compressive_nodes.append(node_id)
        else:
            retained_nodes.append(node_id)
            
    # Need at least 2 compressible nodes to justify compression
    if len(compressive_nodes) < 2:
        return None
        
    # Aggregate summaries
    summaries = []
    for node_id in compressive_nodes:
        n_data = mg.get_node(node_id)
        summaries.append(f"[{node_id}] {n_data.get('title')}: {n_data.get('summary')}")
        
    aggregated_summary = "Consolidated background history:\n" + "\n".join(summaries)
    
    # Generate new consolidated node id
    consolidated_id = f"bd-consolidated-{compressive_nodes[0]}"
    
    # Create the consolidated node
    mg.add_node(
        consolidated_id,
        "requirement",
        f"Consolidated History of {len(compressive_nodes)} Tasks",
        aggregated_summary,
        "2026-05-26T16:00:00Z"
    )
    
    # Reroute edges
    # Any edge from external nodes to any node in compressive_nodes now points to consolidated_id
    # Any edge from any node in compressive_nodes to external nodes now originates from consolidated_id
    for node_id in compressive_nodes:
        # Outgoing edges (successors)
        for neighbor in list(mg.nx_graph.successors(node_id)):
            if neighbor not in compressive_nodes:
                relation = mg.nx_graph.edges[node_id, neighbor].get("relation", "depends_on")
                mg.add_edge(consolidated_id, neighbor, relation)
                
        # Incoming edges (predecessors)
        for neighbor in list(mg.nx_graph.predecessors(node_id)):
            if neighbor not in compressive_nodes:
                relation = mg.nx_graph.edges[neighbor, node_id].get("relation", "depends_on")
                mg.add_edge(neighbor, consolidated_id, relation)
                
    # Remove original compressed nodes from DB and NetworkX graph
    mg.remove_nodes(compressive_nodes)
    return consolidated_id

def trigger_compression(mg):
    clusters = find_task_clusters(mg)
    consolidated_ids = []
    
    for cluster in clusters:
        res = compress_cluster(mg, cluster)
        if res:
            consolidated_ids.append(res)
            
    return consolidated_ids
