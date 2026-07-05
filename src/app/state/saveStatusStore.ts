import { create } from 'zustand';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface SaveStatusState {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
