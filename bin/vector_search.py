import sys
import os
import json
import re
from collections import Counter
import math

def tokenize(text):
    return re.findall(r'\w+', text.lower())

def compute_tf(text):
    tokens = tokenize(text)
    tf = Counter(tokens)
    total = len(tokens)
    if total == 0:
        return {}
    return {k: v / total for k, v in tf.items()}

def compute_idf(docs):
    n = len(docs)
    idf = {}
    all_words = set(word for doc in docs for word in doc)
    for word in all_words:
        cnt = sum(1 for doc in docs if word in doc)
        idf[word] = math.log((1 + n) / (1 + cnt)) + 1
    return idf

def compute_tfidf(tf, idf):
    tfidf = {}
    for word, val in tf.items():
        tfidf[word] = val * idf.get(word, 0.0)
    return tfidf

def cosine_similarity(v1, v2):
    common = set(v1.keys()) & set(v2.keys())
    numerator = sum(v1[w] * v2[w] for w in common)
    sum1 = sum(val**2 for val in v1.values())
    sum2 = sum(val**2 for val in v2.values())
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    if not denominator:
        return 0.0
    return numerator / denominator

def run_onnx_search(query):
    # Try all imports
    import onnxruntime as ort
    from tokenizers import Tokenizer
    import numpy as np
    import sqlite3
    
    # Try to locate files
    cwd = os.getcwd()
    model_paths = [
        os.path.join(cwd, 'memory-mcp-server', 'models', 'bge-small-en-v1.5.onnx'),
        os.path.join(os.path.dirname(__file__), 'memory-mcp-server', 'models', 'bge-small-en-v1.5.onnx'),
        os.path.join(os.path.dirname(__file__), '..', 'memory-mcp-server', 'models', 'bge-small-en-v1.5.onnx'),
    ]
    tok_paths = [
        os.path.join(cwd, 'memory-mcp-server', 'models', 'tokenizer.json'),
        os.path.join(os.path.dirname(__file__), 'memory-mcp-server', 'models', 'tokenizer.json'),
        os.path.join(os.path.dirname(__file__), '..', 'memory-mcp-server', 'models', 'tokenizer.json'),
    ]
    model_path = next((p for p in model_paths if os.path.exists(p)), None)
    tok_path = next((p for p in tok_paths if os.path.exists(p)), None)
    
    if not model_path or not tok_path:
        raise Exception("Model or tokenizer file not found")
        
    db_paths = [
        os.path.join(cwd, '.agent', 'memory.sqlite'),
        os.path.join(os.path.dirname(__file__), '.agent', 'memory.sqlite'),
        os.path.join(os.path.dirname(__file__), '..', '.agent', 'memory.sqlite'),
    ]
    db_path = next((p for p in db_paths if os.path.exists(p)), None)
    if not db_path:
        raise Exception("Database file not found")

    # Load tokenizer & session
    tokenizer = Tokenizer.from_file(tok_path)
    session = ort.InferenceSession(model_path)

    # Generate query embedding
    encoded = tokenizer.encode(query)
    input_ids = encoded.ids
    attention_mask = encoded.attention_mask
    type_ids = encoded.type_ids
    
    input_ids_arr = np.array([input_ids], dtype=np.int64)
    attention_mask_arr = np.array([attention_mask], dtype=np.int64)
    type_ids_arr = np.array([type_ids], dtype=np.int64)
    
    inputs = {
        'input_ids': input_ids_arr,
        'attention_mask': attention_mask_arr,
        'token_type_ids': type_ids_arr
    }
    
    outputs = session.run(None, inputs)
    last_hidden_state = outputs[0]
    
    if last_hidden_state.shape[1] == 0:
        query_emb = np.zeros(384, dtype=np.float32)
    else:
        query_emb = np.mean(last_hidden_state, axis=1)[0]

    # Query sqlite
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT f.path, c.content, v.embedding
            FROM files f
            JOIN chunks c ON f.id = c.file_id
            JOIN vec_chunks v ON c.id = v.chunk_id
        """)
        rows = cursor.fetchall()
    finally:
        conn.close()

    if not rows:
        raise Exception("No vectorized chunks found in database")

    # Calculate cosine similarity and aggregate
    file_best_scores = {}
    for fp, content, emb_blob in rows:
        chunk_emb = np.frombuffer(emb_blob, dtype=np.float32)
        if len(chunk_emb) != 384:
            continue
        
        # Cosine similarity
        dot = np.dot(query_emb, chunk_emb)
        norm1 = np.linalg.norm(query_emb)
        norm2 = np.linalg.norm(chunk_emb)
        sim = float(dot / (norm1 * norm2)) if (norm1 > 0 and norm2 > 0) else 0.0
        
        # Normalize relative path
        rel_path = os.path.relpath(fp, os.getcwd()).replace("\\", "/")
        
        if rel_path not in file_best_scores or sim > file_best_scores[rel_path]:
            file_best_scores[rel_path] = sim

    # Convert to scaled scores (0-10) and sort
    results = {}
    for rel_path, sim in file_best_scores.items():
        if sim > 0.0:
            results[rel_path] = round(sim * 10, 2)

    sorted_res = dict(sorted(results.items(), key=lambda item: item[1], reverse=True)[:25])
    return sorted_res

def main():
    if len(sys.argv) < 2:
        print(json.dumps({}))
        return

    query = sys.argv[1]
    
    try:
        results = run_onnx_search(query)
        print(json.dumps(results))
        return
    except Exception as e:
        if os.environ.get("VEYRA_VECTOR_SEARCH_VERBOSE") == "1":
            sys.stderr.write(f"ONNX search failed, falling back to TF-IDF: {str(e)}\n")
    
    # Discover files for TF-IDF fallback
    exclude_dirs = {'node_modules', '.git', 'dist', 'build', '.next', 'scratch', 'memory', '.agent'}
    extensions = {'.ts', '.tsx', '.js', '.jsx', '.css', '.json'}
    
    docs = {}
    doc_tokens = []
    file_paths = []
    
    for root, dirs, files in os.walk(os.getcwd()):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in extensions:
                fp = os.path.join(root, file)
                try:
                    with open(fp, 'r', encoding='utf-8') as f:
                        content = f.read()
                        tokens = tokenize(content)
                        docs[fp] = tokens
                        doc_tokens.append(set(tokens))
                        file_paths.append(fp)
                except Exception:
                    pass

    if not docs:
        print(json.dumps({}))
        return

    # Compute IDF
    idf = compute_idf(doc_tokens)
    
    # Compute TF-IDF for query
    query_tf = compute_tf(query)
    query_vector = compute_tfidf(query_tf, idf)
    
    results = {}
    for fp, tokens in docs.items():
        doc_tf = compute_tf(" ".join(tokens))
        doc_vector = compute_tfidf(doc_tf, idf)
        sim = cosine_similarity(query_vector, doc_vector)
        if sim > 0.0:
            rel_path = os.path.relpath(fp, os.getcwd()).replace("\\", "/")
            results[rel_path] = round(sim * 10, 2) # scale score to 0-10

    # Sort results
    sorted_res = dict(sorted(results.items(), key=lambda item: item[1], reverse=True)[:25])
    print(json.dumps(sorted_res))

if __name__ == '__main__':
    main()
