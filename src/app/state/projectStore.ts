import { create } from 'zustand';
import { CyrilFile } from '../../domain/project/types';
import { createDraft, DuplicationMode } from '../../domain/project/drafts';
import { openProject, saveProject, createNewProject, duplicateProject } from '../../persistence/fileSystem/fileManager';

export type WorkspaceType = 'brief' | 'structure' | 'hookLab' | 'vocabularyWorld';
export type ActiveView = { type: 'workspace'; workspace: WorkspaceType } | { type: 'draft'; draftId: string };

interface ProjectState {
  isProjectLoaded: boolean;
  currentProject: CyrilFile | null;
  error: string | null;
  
  // UI State
  activeView: ActiveView;
  
  // Actions
  createProject: (title?: string) => void;
  openProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: () => Promise<void>;
  renameProject: (newTitle: string) => void;
  duplicateProject: (newTitle: string) => void;
  closeProject: () => void;
  clearError: () => void;
  
  // Draft Actions
  addDraft: (name: string, sourceDraftId?: string, mode?: import('../../domain/project/drafts').DuplicationMode) => void;
  deleteDraft: (draftId: string) => void;
  
  // Navigation Actions
  setActiveView: (view: ActiveView) => void;
  
  // Settings Actions
  toggleDraftSetting: (draftId: string, settingKey: keyof import('../../domain/project/types').DraftSettings) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  isProjectLoaded: false,
  currentProject: null,
  error: null,
  activeView: { type: 'draft', draftId: '' }, // Will be set properly when project loads

  createProject: (title?: string) => {
    const newProj = createNewProject(title);
    set({ 
      currentProject: newProj, 
      isProjectLoaded: true, 
      error: null,
      activeView: { type: 'draft', draftId: newProj.project.drafts[0]?.id || '' }
    });
  },

  openProject: async () => {
    try {
      const file = await openProject();
      set({ 
        currentProject: file, 
        isProjectLoaded: true, 
        error: null,
        activeView: { type: 'draft', draftId: file.project.activeDraftId || file.project.drafts[0]?.id || '' }
      });
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
    set({ 
      currentProject: duplicated, 
      isProjectLoaded: true, 
      error: null,
      activeView: { type: 'draft', draftId: duplicated.project.activeDraftId || '' }
    });
  },

  closeProject: () => {
    set({ 
      currentProject: null, 
      isProjectLoaded: false, 
      error: null,
      activeView: { type: 'draft', draftId: '' }
    });
  },

  clearError: () => set({ error: null }),
  
  addDraft: (name: string, sourceDraftId?: string, mode?: DuplicationMode) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const sourceDraft = sourceDraftId 
      ? currentProject.project.drafts.find(d => d.id === sourceDraftId)
      : undefined;

    const newDraft = createDraft(name, sourceDraft, mode);
    
    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          drafts: [...currentProject.project.drafts, newDraft],
          updatedAt: new Date().toISOString()
        }
      },
      activeView: { type: 'draft', draftId: newDraft.id }
    });
  },

  deleteDraft: (draftId: string) => {
    const { currentProject, activeView } = get();
    if (!currentProject) return;
    
    // Cannot delete the last draft
    if (currentProject.project.drafts.length <= 1) return;
    
    const newDrafts = currentProject.project.drafts.filter(d => d.id !== draftId);
    
    // If we're deleting the active draft, switch to another one
    let newActiveView = activeView;
    if (activeView.type === 'draft' && activeView.draftId === draftId) {
      newActiveView = { type: 'draft', draftId: newDrafts[0].id };
    }
    
    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          drafts: newDrafts,
          updatedAt: new Date().toISOString()
        }
      },
      activeView: newActiveView
    });
  },

  toggleDraftSetting: (draftId: string, settingKey: keyof import('../../domain/project/types').DraftSettings) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const draftIndex = currentProject.project.drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return;

    const draft = currentProject.project.drafts[draftIndex];
    const newDrafts = [...currentProject.project.drafts];
    
    newDrafts[draftIndex] = {
      ...draft,
      draftSettings: {
        ...draft.draftSettings,
        [settingKey]: !draft.draftSettings[settingKey]
      },
      updatedAt: new Date().toISOString()
    };

    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          drafts: newDrafts,
          updatedAt: new Date().toISOString()
        }
      }
    });
  },

  setActiveView: (view: ActiveView) => set({ activeView: view })
}));
