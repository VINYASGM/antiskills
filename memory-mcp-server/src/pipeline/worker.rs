use crossbeam_channel::Receiver;
use std::path::PathBuf;
use std::sync::OnceLock;
use tokio::sync::mpsc::Sender as TokioSender;
use tracing::{error, info, warn};
use tokenizers::Tokenizer;
use ort::session::Session;

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

static TOKENIZER: OnceLock<Option<Tokenizer>> = OnceLock::new();
static ONNX_SESSION: OnceLock<Option<Session>> = OnceLock::new();

fn get_tokenizer() -> Option<&'static Tokenizer> {
    TOKENIZER.get_or_init(|| {
        let current_dir = std::env::current_dir().unwrap_or_default();
        let paths = [
            current_dir.join("memory-mcp-server/models/tokenizer.json"),
            current_dir.join("models/tokenizer.json"),
            PathBuf::from("memory-mcp-server/models/tokenizer.json"),
            PathBuf::from("models/tokenizer.json"),
        ];
        for path in &paths {
            if path.exists() {
                if let Ok(tok) = Tokenizer::from_file(path) {
                    info!("Successfully loaded tokenizer from {:?}", path);
                    return Some(tok);
                }
            }
        }
        warn!("Failed to load tokenizer from any expected path");
        None
    }).as_ref()
}

fn get_session() -> Option<&'static Session> {
    ONNX_SESSION.get_or_init(|| {
        let current_dir = std::env::current_dir().unwrap_or_default();
        let paths = [
            current_dir.join("memory-mcp-server/models/bge-small-en-v1.5.onnx"),
            current_dir.join("models/bge-small-en-v1.5.onnx"),
            PathBuf::from("memory-mcp-server/models/bge-small-en-v1.5.onnx"),
            PathBuf::from("models/bge-small-en-v1.5.onnx"),
        ];
        for path in &paths {
            if path.exists() {
                if let Ok(session) = Session::builder()
                    .unwrap()
                    .commit_from_file(path)
                {
                    info!("Successfully loaded ONNX session from {:?}", path);
                    return Some(session);
                }
            }
        }
        warn!("Failed to load ONNX session from any expected path");
        None
    }).as_ref()
}

fn embed_text(text: &str) -> Vec<f32> {
    let tokenizer = match get_tokenizer() {
        Some(t) => t,
        None => return vec![0.1_f32; 384],
    };
    let session = match get_session() {
        Some(s) => s,
        None => return vec![0.1_f32; 384],
    };

    let run_inference = || -> anyhow::Result<Vec<f32>> {
        let encoding = tokenizer.encode(text, true).map_err(|e| anyhow::anyhow!(e))?;
        let input_ids: Vec<i64> = encoding.get_ids().iter().map(|&x| x as i64).collect();
        let attention_mask: Vec<i64> = encoding.get_attention_mask().iter().map(|&x| x as i64).collect();
        let token_type_ids: Vec<i64> = encoding.get_type_ids().iter().map(|&x| x as i64).collect();

        let seq_len = input_ids.len();
        if seq_len == 0 {
            return Ok(vec![0.1_f32; 384]);
        }

        let input_ids_arr = ndarray::Array2::from_shape_vec((1, seq_len), input_ids)?;
        let attention_mask_arr = ndarray::Array2::from_shape_vec((1, seq_len), attention_mask)?;
        let token_type_ids_arr = ndarray::Array2::from_shape_vec((1, seq_len), token_type_ids)?;

        let outputs = session.run(ort::inputs![
            "input_ids" => input_ids_arr,
            "attention_mask" => attention_mask_arr,
            "token_type_ids" => token_type_ids_arr,
        ]?)?;

        let last_hidden_state = outputs.get("last_hidden_state")
            .or_else(|| outputs.iter().next().map(|(_, v)| v))
            .ok_or_else(|| anyhow::anyhow!("No outputs found"))?;

        let tensor_ref = last_hidden_state.try_extract_tensor::<f32>()?;
        let shape = tensor_ref.shape();
        if shape.len() != 3 {
            return Err(anyhow::anyhow!("Expected 3D tensor, got shape {:?}", shape));
        }
        let sequence_len = shape[1];
        let hidden_dim = shape[2];

        let view3d = tensor_ref.into_dimensionality::<ndarray::Ix3>()?;
        let mut embedding = vec![0.0_f32; hidden_dim];
        for seq_idx in 0..sequence_len {
            for dim_idx in 0..hidden_dim {
                embedding[dim_idx] += view3d[[0, seq_idx, dim_idx]];
            }
        }

        for val in &mut embedding {
            *val /= sequence_len as f32;
        }

        Ok(embedding)
    };

    match run_inference() {
        Ok(emb) => emb,
        Err(e) => {
            warn!("ONNX inference failed: {}", e);
            vec![0.1_f32; 384]
        }
    }
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
