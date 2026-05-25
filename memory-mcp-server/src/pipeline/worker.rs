use crossbeam_channel::Receiver;
use std::path::PathBuf;
use tokio::sync::mpsc::Sender as TokioSender;
use tracing::{error, info, warn};

use crate::db::{ChunkPayload, DbMessage};

pub enum WorkerMessage {
    ProcessFile(PathBuf),
}

pub fn start_worker_pool(rx: Receiver<WorkerMessage>, db_tx: TokioSender<DbMessage>) {
    // Spawn a dedicated dispatcher thread so we don't block Tokio.
    std::thread::spawn(move || {
        info!("Worker pool dispatcher started.");
        while let Ok(msg) = rx.recv() {
            let db_tx_clone = db_tx.clone();

            rayon::spawn(move || match msg {
                WorkerMessage::ProcessFile(path) => {
                    process_file(path, db_tx_clone);
                }
            });
        }
    });
}

fn chunk_rust_file(content: &str) -> Vec<(u32, u32, String)> {
    let mut parser = tree_sitter::Parser::new();
    let language = tree_sitter_rust::language();
    parser.set_language(&language.into()).expect("Error loading Rust grammar");

    let tree = parser.parse(content, None).unwrap();
    let mut cursor = tree.walk();
    let mut chunks = Vec::new();

    // Walk the AST and extract logical blocks (functions, impls, structs)
    for child in tree.root_node().children(&mut cursor) {
        let kind = child.kind();
        if kind == "function_item" 
            || kind == "impl_item" 
            || kind == "struct_item" 
            || kind == "enum_item" 
            || kind == "trait_item" 
        {
            let start_line = child.start_position().row as u32 + 1;
            let end_line = child.end_position().row as u32 + 1;
            let chunk_content = &content[child.start_byte()..child.end_byte()];
            chunks.push((start_line, end_line, chunk_content.to_string()));
        }
    }
    
    // Fallback: If no top-level struct/function found, chunk the whole file
    if chunks.is_empty() {
        let lines_count = content.lines().count().max(1) as u32;
        chunks.push((1, lines_count, content.to_string()));
    }
    
    chunks
}

fn embed_text(_text: &str) -> Vec<f32> {
    // NOTE: Real implementation would:
    // 1. `Tokenizer::from_file("tokenizer.json")`
    // 2. Create tensors for `input_ids` and `attention_mask`
    // 3. Call `ort::Session::run()`
    // 4. Mean-pool the last hidden states to get the embedding.
    // Since we don't bundle an ONNX model file in this repo yet, we stub the embedding output.
    vec![0.1_f32; 384] // Simulated bge-small output
}

fn process_file(path: PathBuf, db_tx: TokioSender<DbMessage>) {
    // Only process .rs files for now as a proof of concept
    if path.extension().and_then(|s| s.to_str()) != Some("rs") {
        return;
    }

    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            warn!("Failed to read file {:?}: {}", path, e);
            return;
        }
    };

    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    let content_hash = format!("{:x}", hasher.finish());

    let metadata = match std::fs::metadata(&path) {
        Ok(m) => m,
        Err(_) => return,
    };

    let modified = metadata
        .modified()
        .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    // Use tree-sitter to break file into semantic chunks
    let extracted_chunks = chunk_rust_file(&content);
    
    let mut payload_chunks = Vec::new();
    for (start, end, text) in extracted_chunks {
        let embedding = embed_text(&text);
        payload_chunks.push(ChunkPayload {
            start_line: start,
            end_line: end,
            content: text,
            embedding,
            ast_edges: vec![], // In full version, we'd extract imports/calls from Tree-sitter here
        });
    }

    // Send the extracted data to the single DbWriter thread
    if let Err(e) = db_tx.blocking_send(DbMessage::UpsertFile {
        path: path.to_string_lossy().to_string(),
        content_hash,
        last_modified: modified,
        chunks: payload_chunks,
    }) {
        error!("Worker failed to send DbMessage: {}", e);
    } else {
        info!("Tree-sitter chunked and queued DB upsert for {:?}", path);
    }
}
