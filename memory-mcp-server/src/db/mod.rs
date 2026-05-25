pub mod schema;
pub mod writer;

pub use writer::{start_db_writer_thread, AstEdgePayload, ChunkPayload, DbMessage};

use r2d2_sqlite::SqliteConnectionManager;

pub type DbPool = r2d2::Pool<SqliteConnectionManager>;

pub fn create_read_pool(db_path: &std::path::Path) -> DbPool {
    let manager = SqliteConnectionManager::file(db_path).with_init(|c| {
        c.execute_batch("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;")
    });
    r2d2::Pool::builder()
        .max_size(10) // Allow up to 10 concurrent reader tasks
        .build(manager)
        .expect("Failed to create r2d2 sqlite pool")
}
