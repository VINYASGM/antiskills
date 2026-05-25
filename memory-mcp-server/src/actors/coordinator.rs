use std::collections::HashMap;
use std::path::PathBuf;
use std::time::{Duration, Instant};
use tokio::sync::mpsc;
use tracing::info;

use crate::actors::watcher::WatcherMessage;
use crate::pipeline::worker::WorkerMessage;

pub async fn start_coordinator(
    mut rx: mpsc::Receiver<WatcherMessage>,
    worker_tx: crossbeam_channel::Sender<WorkerMessage>,
    db_tx: tokio::sync::mpsc::Sender<crate::db::DbMessage>,
) {
    let debounce_duration = Duration::from_millis(500);
    let mut pending_changes: HashMap<PathBuf, Instant> = HashMap::new();

    let mut interval = tokio::time::interval(Duration::from_millis(100));
    info!("Coordinator actor started.");

    loop {
        tokio::select! {
            Some(msg) = rx.recv() => {
                match msg {
                    WatcherMessage::Changed(path) => {
                        pending_changes.insert(path, Instant::now());
                    }
                    WatcherMessage::Deleted(path) => {
                        pending_changes.remove(&path);
                        info!("Coordinator forwarding Delete for {:?}", path);
                        let _ = db_tx.send(crate::db::DbMessage::DeleteFile {
                            path: path.to_string_lossy().to_string()
                        }).await;
                    }
                }
            }
            _ = interval.tick() => {
                let now = Instant::now();
                let mut to_process = Vec::new();
                
                for (path, time) in pending_changes.iter() {
                    if now.duration_since(*time) >= debounce_duration {
                        to_process.push(path.clone());
                    }
                }

                for path in to_process {
                    pending_changes.remove(&path);
                    info!("Coordinator sending {:?} to WorkerPool for processing", path);
                    let _ = worker_tx.send(WorkerMessage::ProcessFile(path));
                }
            }
        }
    }
}
