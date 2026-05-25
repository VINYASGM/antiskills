use rusqlite::Connection;
use tokio::sync::mpsc;
use tracing::{error, info};

pub enum DbMessage {
    UpsertFile {
        path: String,
        content_hash: String,
        last_modified: i64,
        chunks: Vec<ChunkPayload>,
    },
    DeleteFile {
        path: String,
    },
    RecordEvent {
        timestamp: i64,
        tool_name: String,
        input_payload: String,
        output_summary: String,
    },
}

pub struct ChunkPayload {
    pub start_line: u32,
    pub end_line: u32,
    pub content: String,
    pub embedding: Vec<f32>,
    pub ast_edges: Vec<AstEdgePayload>,
}

pub struct AstEdgePayload {
    pub target_path: String,
    pub relationship_type: String,
}

pub fn start_db_writer_thread(db_path: std::path::PathBuf, mut rx: mpsc::Receiver<DbMessage>) {
    std::thread::spawn(move || {
        let mut conn = Connection::open(&db_path).expect("Failed to open writer connection");
        super::schema::initialize_db(&conn).expect("Failed to init schema");
        info!("DbWriter thread started.");

        while let Some(msg) = rx.blocking_recv() {
            match msg {
                DbMessage::UpsertFile { path, content_hash, last_modified, chunks } => {
                    if let Err(e) = handle_upsert(&mut conn, &path, &content_hash, last_modified, chunks) {
                        error!("Failed to upsert file {}: {}", path, e);
                    }
                }
                DbMessage::DeleteFile { path } => {
                    let _ = conn.execute("DELETE FROM files WHERE path = ?1", [&path]);
                }
                DbMessage::RecordEvent { timestamp, tool_name, input_payload, output_summary } => {
                    let _ = conn.execute(
                        "INSERT INTO events (timestamp, tool_name, input_payload, output_summary) VALUES (?1, ?2, ?3, ?4)",
                        (timestamp, tool_name, input_payload, output_summary),
                    );
                }
            }
        }
    });
}

fn handle_upsert(
    conn: &mut Connection,
    path: &str,
    hash: &str,
    modified: i64,
    chunks: Vec<ChunkPayload>,
) -> rusqlite::Result<()> {
    let tx = conn.transaction()?;

    // Using ON DELETE CASCADE, removing the file drops old chunks and vectors
    tx.execute("DELETE FROM files WHERE path = ?1", [path])?;

    tx.execute(
        "INSERT INTO files (path, content_hash, last_modified) VALUES (?1, ?2, ?3)",
        (path, hash, modified),
    )?;
    let file_id = tx.last_insert_rowid();

    for chunk in chunks {
        tx.execute(
            "INSERT INTO chunks (file_id, start_line, end_line, content) VALUES (?1, ?2, ?3, ?4)",
            (file_id, chunk.start_line, chunk.end_line, &chunk.content),
        )?;
        let chunk_id = tx.last_insert_rowid();

        // Convert f32 slice to byte vector for BLOB storage
        let blob_bytes: Vec<u8> = chunk
            .embedding
            .iter()
            .flat_map(|f| f.to_le_bytes())
            .collect();
            
        tx.execute(
            "INSERT INTO vec_chunks (chunk_id, embedding) VALUES (?1, ?2)",
            (chunk_id, blob_bytes),
        )?;

        for edge in chunk.ast_edges {
            tx.execute(
                "INSERT INTO ast_edges (source_chunk_id, target_path, relationship_type) VALUES (?1, ?2, ?3)",
                (chunk_id, edge.target_path, edge.relationship_type),
            )?;
        }
    }

    tx.commit()
}
