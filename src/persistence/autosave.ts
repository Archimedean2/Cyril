import { useProjectStore } from '../app/state/projectStore';
import { hasFileHandle, saveProject } from './fileSystem/fileManager';

let timer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let saving = false;

const DEBOUNCE_MS = 3000;

async function flush() {
  const state = useProjectStore.getState();
  const project = state.currentProject;
  if (!project) return;
  if (!project.project.projectSettings.autosave) return;
  if (!hasFileHandle()) return;
  if (saving) return;

  saving = true;
  try {
    await saveProject(project, false);
  } catch {
    // Autosave failures are silent — the user can still save manually.
    // A visible save-status indicator (Phase 3) will surface these.
  } finally {
    saving = false;
  }
}

function scheduleFlush() {
  if (timer !== null) clearTimeout(timer);
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
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export { DEBOUNCE_MS };
