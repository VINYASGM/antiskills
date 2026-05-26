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

def main():
    if len(sys.argv) < 2:
        print(json.dumps({}))
        return

    query = sys.argv[1]
    
    # Discover files
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
