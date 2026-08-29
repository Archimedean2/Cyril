import { CyrilFile, CyrilProject } from '../../domain/project/types';
import { createDefaultProject, createCyrilFile, generateId } from '../../domain/project/defaults';
import { serializeProject, deserializeProject } from '../serializers/projectSerializer';

// File System Access API approach
// Fallback: local download / input[type=file]

let fileHandle: FileSystemFileHandle | null = null;

// Per HARDENING_PERSISTENCE.md §H6 / C-07: the `lastModified` of `fileHandle`'s underlying
// file as of the last time Cyril read or wrote it. `null` means "no baseline to compare
// against" (no handle yet, or a handle just picked via Open/Save As). Used by `saveProject`
// to detect a file that changed on disk outside Cyril since it was last read, so a manual
// overwrite can warn instead of silently clobbering it.
let lastKnownModified: number | null = null;

// Per BACKLOG C-29: set when `tryReopenLastProject` finds a stored handle whose permission
// has been lost (`NotAllowedError`) rather than cleared it, so a later user gesture can
// still reconnect it without going through `Open` again. `null` means there's nothing
// waiting on a re-grant.
let pendingPermissionHandle: FileSystemFileHandle | null = null;

/**
 * Thrown when `saveProject` detects the target file changed on disk since Cyril last read
 * or wrote it, and — given a user gesture to ask with — the user declined to overwrite it
 * anyway. Callers should treat this like a cancelled save (no error to surface), not a
 * genuine failure.
 */
export class ExternalChangeCancelledError extends Error {
  constructor() {
    super('Save cancelled: the file changed outside Cyril and the user chose not to overwrite it.');
    this.name = 'ExternalChangeCancelledError';
  }
}

/**
 * Default `confirmOverwrite` for `SaveProjectOptions`: a plain `window.confirm`. Exposed as
 * an option so tests (and, if needed, a nicer in-app dialog later) can override it without
 * stubbing the global.
 */
function defaultConfirmOverwrite(fileName: string): boolean {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return false;
  return window.confirm(
    `"${fileName}" changed outside Cyril since it was last opened here. Overwrite it with what's in Cyril now?`
  );
}

// Per HARDENING_PERSISTENCE.md §H4 / BACKLOG C-05: Firefox and Safari (as of this writing)
// don't implement the File System Access API at all — `showOpenFilePicker`/
// `showSaveFilePicker` are simply undefined. Rather than throwing there, Open falls back to
// a hidden `<input type="file">` and Save falls back to a Blob download. Neither fallback
// path ever yields a `FileSystemFileHandle`, so `hasFileHandle()` stays permanently false in
// this mode: autosave-to-disk is genuinely impossible here, which is exactly what the C-04
// recovery snapshot and the C-06 'local-only' status are for.

/** Whether this browser supports the File System Access API pickers Cyril otherwise uses. */
export function isFileSystemAccessSupported(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

function suggestedFileName(title: string): string {
  return `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.cyril`;
}

/**
 * Fallback for `openProject` when `showOpenFilePicker` doesn't exist: a hidden
 * `input[type=file]`. Resolves the picked `File`, or `null` if the user cancelled (best
 * effort — not every browser fires a `cancel` event on this element, so a dismissed picker
 * with no such event will simply never resolve, matching the "no throw, ever" contract
 * rather than hanging the caller in an error state).
 */
function pickFileFallback(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cyril';
    input.style.display = 'none';

    const cleanup = () => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      document.body.removeChild(input);
    };
    const onChange = () => {
      const file = input.files?.[0] ?? null;
      cleanup();
      resolve(file);
    };
    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Fallback for `saveProject` when `showSaveFilePicker` doesn't exist: downloads `content` as
 * a `.cyril` file via a throwaway `<a download>` link. There is no way to detect whether the
 * user actually kept the download, and no handle results from it — Cyril treats the download
 * itself as "handled" and leans on the recovery snapshot for real durability in this mode.
 */
function downloadCyrilFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const LAST_PROJECT_KEY = 'cyril-last-project-name';
const HANDLE_DB_NAME = 'cyril-file-handles';
const HANDLE_STORE_NAME = 'handles';
const HANDLE_KEY = 'last-project-handle';

// Simple IndexedDB wrapper for storing file handles
async function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    };
  });
}

async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // IndexedDB storage failed - fall back to localStorage name only
  }
}

async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readonly');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

async function clearStoredFileHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Reopens the last project's stored file handle, if any.
 *
 * Per HARDENING_PERSISTENCE.md §H5, this distinguishes *permission lost* from
 * *file gone/corrupt*:
 * - If reading the handle fails with `NotAllowedError` (permission was revoked since
 *   last session — persisted handles don't carry their grant across restarts in every
 *   browser), the stored handle is kept: it may still be valid once permission is
 *   re-granted, so there's no reason to force the user through "Open" again.
 * - Any other failure — the file was moved/deleted (`NotFoundError`), or its content is
 *   corrupt/truncated/wrong-schema (`deserializeProject` throws) — means the stored
 *   reference is no longer useful, so it's cleared. This never touches the file itself;
 *   only Cyril's own bookkeeping of "which file to reopen" is cleared.
 */
export async function tryReopenLastProject(): Promise<CyrilFile | null> {
  const storedHandle = await getStoredFileHandle();
  if (!storedHandle) return null;

  let file: File;
  try {
    file = await storedHandle.getFile();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      // Permission was revoked, not lost/corrupt — keep the handle so a future
      // reopen (once permission is re-granted) can still succeed. Remember it so the
      // UI can offer a re-grant affordance (C-29) without sending the user through
      // `Open` again.
      pendingPermissionHandle = storedHandle;
      return null;
    }
    // File moved/deleted, or another unrecoverable error opening the handle.
    await clearStoredFileHandle();
    localStorage.removeItem(LAST_PROJECT_KEY);
    return null;
  }

  try {
    const contents = await file.text();
    const project = deserializeProject(contents);
    fileHandle = storedHandle;
    lastKnownModified = file.lastModified ?? null;
    pendingPermissionHandle = null;
    return project;
  } catch {
    // Content is corrupt/truncated/wrong-schema (or a newer, unsupported schema) — the
    // source file itself is untouched, but the auto-reopen reference isn't useful until
    // the user fixes or replaces it via Open.
    await clearStoredFileHandle();
    localStorage.removeItem(LAST_PROJECT_KEY);
    return null;
  }
}

/** Whether a stored file handle is waiting on its permission being re-granted (C-29). */
export function hasPendingPermissionRequest(): boolean {
  return pendingPermissionHandle !== null;
}

/** The name of the file waiting on a permission re-grant, if any — for banner copy. */
export function getPendingPermissionFileName(): string | null {
  return pendingPermissionHandle?.name ?? null;
}

/**
 * Re-requests permission on the handle `tryReopenLastProject` kept after a `NotAllowedError`
 * (BACKLOG C-29). Must be called from a user gesture (a click handler) — `requestPermission`
 * requires one.
 *
 * Resolves the reopened project if permission is granted and the file still reads/parses
 * cleanly — the caller decides whether to use that content (a project already loaded some
 * other way, e.g. from a recovery snapshot, should generally keep its own in-memory state
 * and just benefit from the handle being reconnected for future saves). Resolves `null`
 * if permission is still not granted (the pending handle is kept for another attempt) or if
 * the file turned out to be gone/corrupt in the meantime (the pending handle is cleared,
 * same as `tryReopenLastProject`'s own gone/corrupt handling — there's nothing left to
 * reconnect to, so the user falls back to `Open`).
 */
export async function regrantFilePermission(): Promise<CyrilFile | null> {
  const handle = pendingPermissionHandle;
  if (!handle) return null;

  const permission = await handle.requestPermission({ mode: 'readwrite' });
  if (permission !== 'granted') {
    // Still not granted — leave the pending handle in place so the banner can be tried
    // again later.
    return null;
  }

  try {
    const file = await handle.getFile();
    const contents = await file.text();
    const project = deserializeProject(contents);
    fileHandle = handle;
    lastKnownModified = file.lastModified ?? null;
    pendingPermissionHandle = null;
    return project;
  } catch {
    // Permission came back, but the file itself is gone/corrupt in the meantime — nothing
    // left to reconnect to.
    await clearStoredFileHandle();
    localStorage.removeItem(LAST_PROJECT_KEY);
    pendingPermissionHandle = null;
    return null;
  }
}

export async function openProject(): Promise<CyrilFile | null> {
  try {
    if (!('showOpenFilePicker' in window)) {
      // HARDENING §H4 / C-05: no File System Access API — fall back to a hidden file
      // input. There's no handle to keep here, so `hasFileHandle()` stays false and
      // future saves fall back too (downloads); the caller's normal "corrupt/wrong file"
      // handling below still applies to whatever comes back.
      const file = await pickFileFallback();
      if (!file) return null;
      const contents = await file.text();
      return deserializeProject(contents);
    }

    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Cyril Project Files',
          accept: {
            'application/json': ['.cyril'],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    });
    
    fileHandle = handle;
    localStorage.setItem(LAST_PROJECT_KEY, handle.name);
    await storeFileHandle(handle);
    const file = await handle.getFile();
    lastKnownModified = file.lastModified ?? null;
    // The user just explicitly picked a file via Open — any earlier permission-lock
    // banner (C-29) was about a different file and no longer applies.
    pendingPermissionHandle = null;
    const contents = await file.text();
    return deserializeProject(contents);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // User cancelled picker - return null gracefully
      return null;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to open project: ${message}`);
  }
}

export function clearLastProject(): void {
  localStorage.removeItem(LAST_PROJECT_KEY);
}

export function getLastProjectName(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

/**
 * Saves `fileContent` to disk.
 *
 * Resolves `true` if the write actually happened, `false` if the save was cancelled
 * without error (the user dismissed the Save/Save As picker, or — per HARDENING §H6 / C-07
 * — declined to overwrite a file that changed outside Cyril). Rejects for genuine failures
 * (permission denied, an autosave that detected an external change with no gesture to ask
 * with, disk errors, etc.) so callers can tell "nothing happened, on purpose" apart from
 * "this failed".
 */
export async function saveProject(
  fileContent: CyrilFile,
  isSaveAs: boolean = false,
  options?: SaveProjectOptions
): Promise<boolean> {
  const allowPermissionPrompt = options?.allowPermissionPrompt ?? true;
  const confirmOverwrite = options?.confirmOverwrite ?? defaultConfirmOverwrite;
  try {
    // Refresh updated timestamp
    fileContent.project.updatedAt = new Date().toISOString();

    const serializedData = serializeProject(fileContent);

    const isNewHandle = isSaveAs || !fileHandle;
    if (isNewHandle) {
      if (!('showSaveFilePicker' in window)) {
        // HARDENING §H4 / C-05: no File System Access API and no existing handle to reuse
        // (a genuinely new save, or an explicit Save As) — fall back to downloading a
        // fresh copy instead of throwing. There's no in-place file to overwrite and no
        // handle results from this, so auto-save-to-disk stays impossible in this mode,
        // which the C-04 recovery snapshot and C-06 'local-only' status already account
        // for. (An *existing* handle, reached only via the API in the first place, never
        // needs the picker itself to still exist just to keep writing through it.)
        downloadCyrilFile(serializedData, suggestedFileName(fileContent.project.title));
        return true;
      }

      fileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedFileName(fileContent.project.title),
        types: [
          {
            description: 'Cyril Project File',
            accept: { 'application/json': ['.cyril'] },
          },
        ],
      });
      localStorage.setItem(LAST_PROJECT_KEY, fileHandle.name);
      await storeFileHandle(fileHandle);
      // A freshly picked handle has no baseline to compare against yet.
      lastKnownModified = null;
    }

    await ensureWritePermission(fileHandle!, allowPermissionPrompt);

    // HARDENING §H6 / C-07: if we have a baseline `lastModified` for this file (i.e. it
    // wasn't just picked above) and the file on disk has changed since, something outside
    // Cyril touched it — writing now would silently clobber that change.
    if (!isNewHandle && lastKnownModified !== null) {
      const currentFile = await fileHandle!.getFile();
      if (currentFile.lastModified !== lastKnownModified) {
        if (!allowPermissionPrompt) {
          // Autosave: no user gesture available to ask with. Never silently overwrite —
          // fail loudly so the caller (autosave.ts) surfaces status 'error'.
          throw new Error(
            `"${fileHandle!.name}" changed outside Cyril since it was last read. Autosave will not overwrite it.`
          );
        }
        const proceed = await confirmOverwrite(fileHandle!.name);
        if (!proceed) {
          throw new ExternalChangeCancelledError();
        }
      }
    }

    const writable = await fileHandle!.createWritable();
    await writable.write(serializedData);
    await writable.close();

    // Refresh the baseline to the file we just wrote, so the *next* save compares against
    // what Cyril itself just put on disk, not the pre-write state.
    const writtenFile = await fileHandle!.getFile();
    lastKnownModified = writtenFile.lastModified ?? null;
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // User cancelled the Save/Save As picker.
      return false;
    }
    if (error instanceof ExternalChangeCancelledError) {
      // User declined to overwrite a file that changed outside Cyril.
      return false;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save project: ${message}`);
  }
}

/**
 * Ensures the given handle has 'readwrite' permission before a write is attempted.
 *
 * `requestPermission` requires an active user gesture, so it can only be invoked from a
 * manual Save (`allowPermissionPrompt: true`, the default). Autosave runs on a timer with
 * no gesture, so it must pass `allowPermissionPrompt: false` — on anything less than
 * 'granted' this throws instead of prompting, so the caller can surface a save error
 * rather than silently (or invisibly) failing.
 */
async function ensureWritePermission(handle: FileSystemFileHandle, allowPermissionPrompt: boolean): Promise<void> {
  let permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission === 'granted') return;

  if (allowPermissionPrompt) {
    permission = await handle.requestPermission({ mode: 'readwrite' });
  }

  if (permission !== 'granted') {
    throw new Error('Permission to write this file was not granted. Use Save to grant access again.');
  }
}

export interface SaveProjectOptions {
  /**
   * Whether a non-granted permission may be escalated with `requestPermission` (needs a
   * user gesture). Defaults to `true` for manual Save/Save As. Autosave must pass `false`.
   */
  allowPermissionPrompt?: boolean;
  /**
   * Invoked when `saveProject` detects the target file changed on disk outside Cyril since
   * it was last read (HARDENING §H6 / C-07). Return (or resolve) `true` to overwrite it
   * anyway, `false` to cancel. Only ever called when a user gesture is available (manual
   * Save/Save As — `allowPermissionPrompt: true`); autosave never calls this, it fails
   * instead. Defaults to a plain `window.confirm`; override for tests or a nicer dialog.
   */
  confirmOverwrite?: (fileName: string) => boolean | Promise<boolean>;
}

export function hasFileHandle(): boolean {
  return fileHandle !== null;
}

export function createNewProject(title?: string, keepHandle = false): CyrilFile {
  if (!keepHandle) {
    fileHandle = null; // Clear old handle
    lastKnownModified = null;
    // Starting fresh makes any pending permission re-grant (C-29) for a previous file moot.
    pendingPermissionHandle = null;
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
  const project = createDefaultProject(title);
  return createCyrilFile(project);
}

export function duplicateProject(existingFile: CyrilFile, newTitle: string): CyrilFile {
  fileHandle = null; // Treat as a new unsaved file
  lastKnownModified = null;
  pendingPermissionHandle = null;

  const newProject: CyrilProject = {
    ...existingFile.project,
    id: generateId('proj'),
    title: newTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return createCyrilFile(newProject);
}
