import { create } from 'zustand';

interface ProjectState {
  isProjectLoaded: boolean;
  setIsProjectLoaded: (loaded: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  isProjectLoaded: false,
  setIsProjectLoaded: (loaded) => set({ isProjectLoaded: loaded }),
}));
