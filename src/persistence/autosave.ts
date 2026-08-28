import { useProjectStore } from '../app/state/projectStore';
import { useSaveStatusStore } from '../app/state/saveStatusStore';
import { hasFileHandle, saveProject } from './fileSystem/fileManager';
import { startBeforeUnloadGuard, stopBeforeUnloadGuard } from './beforeUnloadGuard';
import { writeRecoverySnapshot } from './indexeddb/recoveryStore';

let timer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let saving = false;
let savedTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 3000;
const SAVED_DISPLAY_MS = 2000;

async function flush() {
  // Read live state at flush time (not whatever triggered `scheduleFlush`) so a draft
  // switch — or any other edit — that happens while the debounce is pending is always
  // reflected in what gets written; nothing here captures a stale closure over one draft.
  const state = useProjectStore.getState();
  const project = state.currentProject;
  if (!project) return;

  // Regardless of file handle or the autosave setting, keep a local recovery snapshot
  // current on every debounce tick (HARDENING_PERSISTENCE.md §H2 / C-04). This is the
  // durability floor for a project that has never been saved to disk — autosave-to-file
  // below this point still requires a handle and the autosave setting, but this doesn't.
  await writeRecoverySnapshot(project);

  if (!project.project.projectSettings.autosave) return;
  if (!hasFileHandle()) return;
  if (saving) return;

  saving = true;
  useSaveStatusStore.getState().setStatus('saving');
  try {
    // Autosave runs on a timer with no user gesture, so it must never attempt to
    // (re-)request write permission — a non-granted handle should fail the save.
    await saveProject(project, false, { allowPermissionPrompt: false });
    useSaveStatusStore.getState().setStatus('saved');
    if (savedTimer !== null) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      savedTimer = null;
      const current = useSaveStatusStore.getState().status;
      if (current === 'saved') {
        useSaveStatusStore.getState().setStatus('idle');
      }
    }, SAVED_DISPLAY_MS);
  } catch {
    useSaveStatusStore.getState().setStatus('error');
  } finally {
    saving = false;
  }
}

function scheduleFlush() {
  if (timer !== null) clearTimeout(timer);
  useSaveStatusStore.getState().setStatus('unsaved');
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, DEBOUNCE_MS);
}

export function startAutosave(): () => void {
  // The beforeunload guard tracks saveStatusStore, which is only kept up to date
  // while autosave is running; start/stop it alongside autosave (C-03).
  startBeforeUnloadGuard();

  if (unsubscribe) return unsubscribe;

  unsubscribe = useProjectStore.subscribe((state, prev) => {
    if (state.currentProject === prev.currentProject) return;
    if (!state.currentProject) return;
    scheduleFlush();
  });

  return stopAutosave;
}

export function stopAutosave(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  if (savedTimer !== null) {
    clearTimeout(savedTimer);
    savedTimer = null;
  }
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  stopBeforeUnloadGuard();
}

export { DEBOUNCE_MS };
