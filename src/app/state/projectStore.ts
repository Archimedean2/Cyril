import { create } from 'zustand';
import { CyrilFile, ExportSettings } from '../../domain/project/types';
import { createDraft, DuplicationMode } from '../../domain/project/drafts';
import { openProject, saveProject, createNewProject, duplicateProject, tryReopenLastProject } from '../../persistence/fileSystem/fileManager';
import { importFromShareBlob } from '../../domain/share/shareService';

export type WorkspaceType = 'brief' | 'structure' | 'hookLab' | 'vocabularyWorld';
export type ActiveView = { type: 'workspace'; workspace: WorkspaceType } | { type: 'draft'; draftId: string };

interface ProjectState {
  isProjectLoaded: boolean;
  currentProject: CyrilFile | null;
  error: string | null;
  isInitializing: boolean;
  
  // UI State
  activeView: ActiveView;
  
  // Actions
  initApp: () => Promise<void>;
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
  setDraftMode: (draftId: string, mode: import('../../domain/project/types').DraftMode) => void;
  
  // Draft Content Actions
  updateDraftDoc: (draftId: string, doc: import('../../domain/project/types').DraftDocument) => void;

  // Inventory Actions
  updateDraftInventory: (draftId: string, inventoryDoc: import('../../domain/project/types').RichTextDocument) => void;
  
  // Export Settings Actions
  updateExportSetting: (settingKey: keyof ExportSettings, value: boolean | string) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;

  // Share Actions
  importShare: (shareBlob: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  isProjectLoaded: false,
  currentProject: null,
  error: null,
  isInitializing: true,
  activeView: { type: 'draft', draftId: '' }, // Will be set properly when project loads

  initApp: async () => {
    // Try to reopen the last project first
    const lastProject = await tryReopenLastProject();
    if (lastProject) {
      set({
        currentProject: lastProject,
        isProjectLoaded: true,
        isInitializing: false,
        error: null,
        activeView: { type: 'draft', draftId: lastProject.project.activeDraftId || lastProject.project.drafts[0]?.id || '' }
      });
      return;
    }
    
    // No previous project or couldn't reopen - create a new one
    const newProj = createNewProject();
    set({
      currentProject: newProj,
      isProjectLoaded: true,
      isInitializing: false,
      error: null,
      activeView: { type: 'draft', draftId: newProj.project.drafts[0]?.id || '' }
    });
  },

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
      if (file) {
        set({ 
          currentProject: file, 
          isProjectLoaded: true, 
          error: null,
          activeView: { type: 'draft', draftId: file.project.activeDraftId || file.project.drafts[0]?.id || '' }
        });
      }
      // If null, user cancelled - silently ignore, keep current state
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

  setDraftMode: (draftId: string, mode: import('../../domain/project/types').DraftMode) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const draftIndex = currentProject.project.drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return;

    const draft = currentProject.project.drafts[draftIndex];
    const newDrafts = [...currentProject.project.drafts];
    
    newDrafts[draftIndex] = {
      ...draft,
      mode,
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

  updateDraftInventory: (draftId: string, inventoryDoc: import('../../domain/project/types').RichTextDocument) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const draftIndex = currentProject.project.drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return;

    const draft = currentProject.project.drafts[draftIndex];
    const newDrafts = [...currentProject.project.drafts];
    
    newDrafts[draftIndex] = {
      ...draft,
      inventory: {
        type: 'inventory',
        doc: inventoryDoc
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

  updateDraftDoc: (draftId: string, doc: import('../../domain/project/types').DraftDocument) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const draftIndex = currentProject.project.drafts.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return;

    const draft = currentProject.project.drafts[draftIndex];
    const newDrafts = [...currentProject.project.drafts];
    newDrafts[draftIndex] = {
      ...draft,
      doc,
      updatedAt: new Date().toISOString(),
    };

    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          drafts: newDrafts,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  },

  setActiveView: (view: ActiveView) => set({ activeView: view }),

  updateExportSetting: (settingKey: keyof ExportSettings, value: boolean | string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          exportSettings: {
            ...currentProject.project.exportSettings,
            [settingKey]: value,
          },
          updatedAt: new Date().toISOString(),
        }
      }
    });
  },

  updateExportSettings: (settings: Partial<ExportSettings>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          exportSettings: {
            ...currentProject.project.exportSettings,
            ...settings,
          },
          updatedAt: new Date().toISOString(),
        }
      }
    });
  },

  importShare: (shareBlob: string) => {
    const result = importFromShareBlob(shareBlob);
    if (!result.success || !result.file) {
      set({ error: result.error || 'Failed to import share' });
      return;
    }
    set({
      currentProject: result.file,
      isProjectLoaded: true,
      error: null,
      activeView: { type: 'draft', draftId: result.file.project.activeDraftId || result.file.project.drafts[0]?.id || '' }
    });
  },
}));
