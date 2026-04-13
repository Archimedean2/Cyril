import { create } from 'zustand';
import { CyrilFile } from '../../domain/project/types';
import { openProject, saveProject, createNewProject, duplicateProject } from '../../persistence/fileSystem/fileManager';

interface ProjectState {
  isProjectLoaded: boolean;
  currentProject: CyrilFile | null;
  error: string | null;
  
  // Actions
  createProject: (title?: string) => void;
  openProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: () => Promise<void>;
  renameProject: (newTitle: string) => void;
  duplicateProject: (newTitle: string) => void;
  closeProject: () => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  isProjectLoaded: false,
  currentProject: null,
  error: null,

  createProject: (title?: string) => {
    const newProj = createNewProject(title);
    set({ currentProject: newProj, isProjectLoaded: true, error: null });
  },

  openProject: async () => {
    try {
      const file = await openProject();
      set({ currentProject: file, isProjectLoaded: true, error: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  saveProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    try {
      await saveProject(currentProject, false);
      // Re-set to trigger re-renders if updatedAt changed
      set({ currentProject: { ...currentProject } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  saveProjectAs: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    
    try {
      await saveProject(currentProject, true);
      set({ currentProject: { ...currentProject } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  renameProject: (newTitle: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          title: newTitle,
          updatedAt: new Date().toISOString(),
        }
      }
    });
  },

  duplicateProject: (newTitle: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const duplicated = duplicateProject(currentProject, newTitle);
    set({ currentProject: duplicated, isProjectLoaded: true, error: null });
  },

  closeProject: () => {
    set({ currentProject: null, isProjectLoaded: false, error: null });
  },

  clearError: () => set({ error: null })
}));
