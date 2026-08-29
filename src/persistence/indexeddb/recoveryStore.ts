/**
 * Local recovery snapshot store (HARDENING_PERSISTENCE.md §H2 / BACKLOG C-04).
 *
 * A project that has never been manually saved to disk — or whose autosave has no file
 * handle to write to — currently has zero durability: close the tab and the work is gone.
 * This module keeps a best-effort, full snapshot of `currentProject` in IndexedDB on the
 * same debounce as autosave, regardless of whether a file handle exists or the autosave
 * setting is on.
 *
 * This is intentionally a single-slot store (key `'current'`): Cyril edits one project at
 * a time, so a new project simply overwrites the previous snapshot. See
 * `docs/engineering/DATA_MODEL.md` ("Local Recovery Snapshot") for the documented schema.
 */

import { CyrilFile } from '../../domain/project/types';

const DB_NAME = 'cyril-recovery';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'current';

export interface RecoverySnapshot {
  /** The full in-memory project as of the last debounced snapshot write. */
  file: CyrilFile;
  /** ISO 8601 timestamp of when this snapshot was captured (distinct from `file.project.updatedAt`). */
  savedAt: string;
}

async function openRecoveryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Writes a full recovery snapshot of the given project to IndexedDB, regardless of
 * whether a file handle exists or the autosave setting is on.
 *
 * Degrades gracefully: if IndexedDB is unavailable or the write fails (private browsing,
 * quota exceeded, another storage failure) this resolves `false` rather than throwing. The
 * recovery snapshot is a best-effort safety net, never a hard requirement for the app to
 * function — but callers that use it as the durability floor for the save-status indicator
 * (C-06 / HARDENING §H7) need to know whether it actually landed, so this reports success.
 */
export async function writeRecoverySnapshot(file: CyrilFile): Promise<boolean> {
  try {
    const db = await openRecoveryDB();
    const snapshot: RecoverySnapshot = { file, savedAt: new Date().toISOString() };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(snapshot, SNAPSHOT_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
    return true;
  } catch {
    // IndexedDB unavailable, quota exceeded, or another storage failure — the recovery
    // snapshot is a best-effort safety net, never a hard requirement.
    return false;
  }
}

/**
 * Reads the current recovery snapshot, if any. Degrades gracefully to `null` when
 * IndexedDB is unavailable or the read fails, rather than throwing.
 */
export async function readRecoverySnapshot(): Promise<RecoverySnapshot | null> {
  try {
    const db = await openRecoveryDB();
    const snapshot = await new Promise<RecoverySnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(SNAPSHOT_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Clears the current recovery snapshot (e.g. after the user declines a recovery offer, or
 * once its content is durably superseded). Best-effort: swallows storage errors.
 */
export async function clearRecoverySnapshot(): Promise<void> {
  try {
    const db = await openRecoveryDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(SNAPSHOT_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // Best-effort cleanup only.
  }
}
