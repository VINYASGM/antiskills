use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use tokio::sync::mpsc;
use tracing::{info, warn};

pub enum WatcherMessage {
    Changed(std::path::PathBuf),
    Deleted(std::path::PathBuf),
}

pub fn start_file_watcher(
    watch_path: &Path,
    tx: mpsc::Sender<WatcherMessage>,
) -> notify::Result<RecommendedWatcher> {
    let tx_clone = tx.clone();

    // Use a standard sync channel to receive notify callbacks
    let (sync_tx, sync_rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: notify::Result<Event>| {
            if let Ok(event) = res {
                let _ = sync_tx.send(event);
            }
        },
        Config::default(),
    )?;

    watcher.watch(watch_path, RecursiveMode::Recursive)?;
    info!("Started watching {:?}", watch_path);

    // Spawn a blocking task to bridge the sync events into our async mpsc channel
    tokio::task::spawn_blocking(move || {
        while let Ok(event) = sync_rx.recv() {
            match event.kind {
                notify::EventKind::Modify(_) | notify::EventKind::Create(_) => {
                    for path in event.paths {
                        let _ = tx_clone.blocking_send(WatcherMessage::Changed(path));
                    }
                }
                notify::EventKind::Remove(_) => {
                    for path in event.paths {
                        let _ = tx_clone.blocking_send(WatcherMessage::Deleted(path));
                    }
                }
                _ => {}
            }
        }
        warn!("File watcher bridge thread exiting.");
    });

    Ok(watcher)
}
