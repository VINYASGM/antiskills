use rusqlite::Connection;

pub fn initialize_db(conn: &Connection) -> rusqlite::Result<()> {
    // Enable WAL mode for better concurrency (readers don't block writers)
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;"
    )?;

    // Core tables
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            content_hash TEXT NOT NULL,
            last_modified INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            start_line INTEGER NOT NULL,
            end_line INTEGER NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ast_edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_chunk_id INTEGER NOT NULL,
            target_path TEXT NOT NULL,
            relationship_type TEXT NOT NULL,
            FOREIGN KEY(source_chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            tool_name TEXT NOT NULL,
            input_payload TEXT NOT NULL,
            output_summary TEXT NOT NULL
        );
        "
    )?;

    // For simplicity, without compiling the sqlite-vec C extension directly into this prototype, 
    // we store vectors as a f32 BLOB and will perform cosine similarity inside the app, 
    // or load the extension dynamically if provided.
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vec_chunks (
            chunk_id INTEGER PRIMARY KEY,
            embedding BLOB NOT NULL,
            FOREIGN KEY(chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
        );
        "
    )?;

    Ok(())
}
