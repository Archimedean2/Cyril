import { create } from 'zustand';

/**
 * `local-only` (C-06 / HARDENING §H7): the in-memory project has been durably written to
 * the local IndexedDB recovery snapshot (HARDENING §H2 / C-04), but there is no file on
 * disk to write to — either the project has never been manually saved, or it has no file
 * handle. This is deliberately distinct from `saved`, which means a real file on disk
 * reflects the current state: the save indicator must never claim `saved` (or a clean
 * `idle`) when that isn't true.
 */
export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'local-only' | 'error';

interface SaveStatusState {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
