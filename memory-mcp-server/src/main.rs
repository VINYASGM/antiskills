mod actors;
mod db;
mod mcp;
mod pipeline;

use std::path::PathBuf;
use tracing::info;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging, but default to stderr so we don't corrupt JSON-RPC over stdout
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_writer(std::io::stderr)
        .init();

    info!("Starting Memory MCP Server...");

    // Setup working directories
    let cwd = std::env::current_dir()?;
    let agent_dir = cwd.join(".agent");
    if !agent_dir.exists() {
        std::fs::create_dir_all(&agent_dir)?;
    }
    let db_path = agent_dir.join("memory.sqlite");

    // 1. Initialize SQLite Read Pool
    let read_pool = db::create_read_pool(&db_path);

    // 2. Initialize Channels
    // Channel from Watcher to Coordinator (Tokio Async)
    let (watcher_tx, watcher_rx) = tokio::sync::mpsc::channel(1000);
    // Channel from Coordinator/MCP to WorkerPool (Crossbeam Sync/MPMC)
    let (worker_tx, worker_rx) = crossbeam_channel::unbounded();
    // Channel from WorkerPool/MCP to DbWriter (Tokio Async)
    let (db_tx, db_rx) = tokio::sync::mpsc::channel(1000);

    // 3. Start Actors
    // DbWriter
    db::start_db_writer_thread(db_path.clone(), db_rx);

    // WorkerPool (Rayon Dispatcher)
    pipeline::start_worker_pool(worker_rx, db_tx.clone());

    // FileWatcher
    let _watcher = actors::start_file_watcher(&cwd, watcher_tx)?;

    // MCP Server (JSON-RPC)
    mcp::start_mcp_server(read_pool, db_tx.clone(), worker_tx.clone()).await;

    // Coordinator (Tokio Loop)
    // Run this on the main thread so the process doesn't exit
    actors::start_coordinator(watcher_rx, worker_tx, db_tx).await;

    Ok(())
}
