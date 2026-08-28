import { useProjectStore } from '../app/state/projectStore';
import { useSaveStatusStore } from '../app/state/saveStatusStore';
import { hasFileHandle, saveProject } from './fileSystem/fileManager';

let timer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let saving = false;
let savedTimer: ReturnType<typeof setTimeout> | null = null;

const DEBOUNCE_MS = 3000;
const SAVED_DISPLAY_MS = 2000;

async function flush() {
  const state = useProjectStore.getState();
  const project = state.currentProject;
  if (!project) return;
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
}

export { DEBOUNCE_MS };
