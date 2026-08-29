import { useSaveStatusStore, SaveStatus } from '../app/state/saveStatusStore';

// Per HARDENING_PERSISTENCE.md §H3: unsaved changes are represented by the save
// status being 'unsaved' (edits pending, not yet written), 'saving' (a write is
// currently in flight), 'local-only' (durably snapshotted to IndexedDB, but no file on
// disk reflects it — see C-06 / saveStatusStore.ts), or 'error' (a write attempt failed
// — e.g. permission was denied). All four mean there is no file on disk that reflects
// the current in-memory project, so the tab should warn before closing.
//
// C-30: 'saving' is included deliberately. A tab closed mid-write previously got no
// warning at all. The cost of a false positive here — a spurious dialog in the
// sub-second window a write is normally in flight — is far smaller than the cost of
// a false negative: losing the write that was interrupted.
//
// C-06: 'local-only' is included too. It's safer than plain 'unsaved' (the content is
// durably snapshotted locally), but that snapshot is scoped to this browser/device — a
// closed tab is still one file short of the durability a real save on disk gives.
const DIRTY_STATUSES: ReadonlySet<SaveStatus> = new Set(['unsaved', 'saving', 'local-only', 'error']);

function isDirty(status: SaveStatus): boolean {
  return DIRTY_STATUSES.has(status);
}

function handleBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
  // Legacy but still required by most browsers to show the "leave site?" prompt.
  event.returnValue = true as unknown as string;
}

let registered = false;
let unsubscribe: (() => void) | null = null;

function syncGuard(status: SaveStatus): void {
  const dirty = isDirty(status);
  if (dirty && !registered) {
    window.addEventListener('beforeunload', handleBeforeUnload);
    registered = true;
  } else if (!dirty && registered) {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    registered = false;
  }
}

/**
 * Starts watching `saveStatusStore` and keeps a `beforeunload` warning registered
 * for as long as the project has no file on disk reflecting it (status 'unsaved',
 * 'saving', 'local-only', or 'error'). Safe to call multiple times; returns
 * `stopBeforeUnloadGuard`.
 */
export function startBeforeUnloadGuard(): () => void {
  if (!unsubscribe) {
    syncGuard(useSaveStatusStore.getState().status);
    unsubscribe = useSaveStatusStore.subscribe((state) => syncGuard(state.status));
  }
  return stopBeforeUnloadGuard;
}

export function stopBeforeUnloadGuard(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (registered) {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    registered = false;
  }
}

/** Test/introspection helper: is the guard currently registered on `window`? */
export function isBeforeUnloadGuardActive(): boolean {
  return registered;
}
