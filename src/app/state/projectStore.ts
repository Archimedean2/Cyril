import { create } from 'zustand';
import { CyrilFile, ExportSettings } from '../../domain/project/types';
import { createDraft, DuplicationMode } from '../../domain/project/drafts';
import {
  openProject,
  saveProject,
  createNewProject,
  duplicateProject,
  tryReopenLastProject,
  hasPendingPermissionRequest,
  getPendingPermissionFileName,
  regrantFilePermission,
} from '../../persistence/fileSystem/fileManager';
import { readRecoverySnapshot, clearRecoverySnapshot } from '../../persistence/indexeddb/recoveryStore';
import { importFromShareBlob } from '../../domain/share/shareService';

export type WorkspaceType = 'brief' | 'structure' | 'hookLab' | 'vocabularyWorld';
export type ActiveView = { type: 'workspace'; workspace: WorkspaceType } | { type: 'draft'; draftId: string };

interface ProjectState {
  isProjectLoaded: boolean;
  currentProject: CyrilFile | null;
  error: string | null;
  isInitializing: boolean;

  // A pending local recovery snapshot (HARDENING §H2 / C-04): set when app init finds a
  // snapshot newer than whatever was opened (or nothing was opened at all). Non-null means
  // "offer recovery" — the UI should ask the user to accept or decline it.
  recoverySnapshot: CyrilFile | null;
  acceptRecovery: () => void;
  declineRecovery: () => void;

  // BACKLOG C-29: the name of a file whose stored handle lost write permission
  // (`NotAllowedError`), kept by fileManager rather than discarded. Non-null means the
  // top-of-editor banner should offer to re-grant it. `regrantPermission` fires
  // `requestPermission` from the banner's own click (a user gesture is required).
  permissionLockedFileName: string | null;
  regrantPermission: () => Promise<void>;

  // UI State
  activeView: ActiveView;
  
  // Actions
  initApp: () => Promise<void>;
  createProject: (title?: string) => void;
  openProject: () => Promise<void>;
  // Resolve `true` if the save actually wrote to disk, `false` if it was cancelled
  // without error (picker dismissed, or the user declined to overwrite a file that
  // changed outside Cyril — HARDENING §H6 / C-07). Rethrows genuine failures after
  // recording `error`, so callers (the save-status indicator) can react honestly.
  saveProject: () => Promise<boolean>;
  saveProjectAs: () => Promise<boolean>;
  renameProject: (newTitle: string) => void;
  duplicateProject: (newTitle: string) => void;
  closeProject: () => void;
  clearError: () => void;
  
  // Draft Actions
  addDraft: (name: string, sourceDraftId?: string, mode?: import('../../domain/project/drafts').DuplicationMode) => void;
  deleteDraft: (draftId: string) => void;
  renameDraft: (draftId: string, newName: string) => void;
  
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
  recoverySnapshot: null,
  permissionLockedFileName: null,
  activeView: { type: 'draft', draftId: '' }, // Will be set properly when project loads

  initApp: async () => {
    // Try to reopen the last project first
    const lastProject = await tryReopenLastProject();

    // If that failed specifically because the stored handle lost write permission (not
    // because the file is gone/corrupt), fileManager keeps it and flags it here — the
    // banner (C-29) offers a one-click re-grant instead of forcing `Open` again.
    const permissionLockedFileName = hasPendingPermissionRequest() ? getPendingPermissionFileName() : null;

    // Then check for a local recovery snapshot (HARDENING §H2 / C-04) — best-effort, so a
    // storage failure here just means "no snapshot", never a thrown init error.
    const snapshot = await readRecoverySnapshot().catch(() => null);

    if (snapshot) {
      // A snapshot from a different project than the one just reopened is stale (e.g. left
      // over from a project that was open earlier, before the user switched files) — treat
      // it as irrelevant to *this* file rather than offering to recover the wrong project.
      const isSameProject = !lastProject || snapshot.file.project.id === lastProject.project.id;
      const isNewer = isSameProject && (!lastProject || snapshot.file.project.updatedAt > lastProject.project.updatedAt);

      if (isNewer) {
        set({
          currentProject: lastProject,
          isProjectLoaded: !!lastProject,
          isInitializing: false,
          error: null,
          recoverySnapshot: snapshot.file,
          permissionLockedFileName,
          activeView: lastProject
            ? { type: 'draft', draftId: lastProject.project.activeDraftId || lastProject.project.drafts[0]?.id || '' }
            : { type: 'draft', draftId: '' }
        });
        return;
      }

      // Stale relative to what's on disk (or belongs to a different project) — discard
      // quietly rather than asking the user about work that's already superseded.
      await clearRecoverySnapshot();
    }

    if (lastProject) {
      set({
        currentProject: lastProject,
        isProjectLoaded: true,
        isInitializing: false,
        error: null,
        recoverySnapshot: null,
        permissionLockedFileName,
        activeView: { type: 'draft', draftId: lastProject.project.activeDraftId || lastProject.project.drafts[0]?.id || '' }
      });
      return;
    }

    // No previous project or couldn't reopen - just initialize without creating a project
    // User will need to manually create a project
    set({
      currentProject: null,
      isProjectLoaded: false,
      isInitializing: false,
      error: null,
      recoverySnapshot: null,
      permissionLockedFileName,
      activeView: { type: 'draft', draftId: '' }
    });
  },

  regrantPermission: async () => {
    // Must be called directly from the banner's own click handler — `requestPermission`
    // requires an active user gesture (BACKLOG C-29).
    const file = await regrantFilePermission();
    const stillPending = hasPendingPermissionRequest();

    if (file) {
      const { currentProject } = get();
      if (!currentProject) {
        // Nothing was loaded any other way (e.g. no recovery snapshot existed) — adopt the
        // freshly reconnected file.
        set({
          currentProject: file,
          isProjectLoaded: true,
          error: null,
          permissionLockedFileName: null,
          activeView: { type: 'draft', draftId: file.project.activeDraftId || file.project.drafts[0]?.id || '' }
        });
      } else {
        // A project is already loaded (e.g. recovered from the local snapshot) — keep its
        // in-memory state; the reconnected handle is already wired up for future saves.
        set({ permissionLockedFileName: null });
      }
      return;
    }

    if (!stillPending) {
      // fileManager gave up on this handle (the file turned out to be gone/corrupt) —
      // nothing left to reconnect to; the user's normal fallback is `Open`.
      set({ permissionLockedFileName: null });
    }
    // Otherwise still pending (permission declined again) — leave the banner up so the
    // user can retry.
  },

  acceptRecovery: () => {
    const { recoverySnapshot } = get();
    if (!recoverySnapshot) return;
    set({
      currentProject: recoverySnapshot,
      isProjectLoaded: true,
      isInitializing: false,
      error: null,
      recoverySnapshot: null,
      activeView: {
        type: 'draft',
        draftId: recoverySnapshot.project.activeDraftId || recoverySnapshot.project.drafts[0]?.id || ''
      }
    });
  },

  declineRecovery: () => {
    clearRecoverySnapshot();
    set({ recoverySnapshot: null });
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
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  saveProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return false;

    try {
      const wrote = await saveProject(currentProject, false);
      if (wrote) {
        // Re-set to trigger re-renders if updatedAt changed
        set({ currentProject: { ...currentProject } });
      }
      return wrote;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  saveProjectAs: async () => {
    const { currentProject } = get();
    if (!currentProject) return false;

    try {
      const wrote = await saveProject(currentProject, true);
      if (wrote) {
        set({ currentProject: { ...currentProject } });
      }
      return wrote;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : String(err) });
      throw err;
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

  renameDraft: (draftId: string, newName: string) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({
      currentProject: {
        ...currentProject,
        project: {
          ...currentProject.project,
          drafts: currentProject.project.drafts.map(d =>
            d.id === draftId ? { ...d, name: newName, updatedAt: new Date().toISOString() } : d
          ),
          updatedAt: new Date().toISOString(),
        }
      }
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

    // Keep showChords in sync with mode: on when entering chord mode, off when leaving
    const newDraftSettings = mode === 'lyricsWithChords'
      ? { ...draft.draftSettings, showChords: true }
      : { ...draft.draftSettings, showChords: false };

    newDrafts[draftIndex] = {
      ...draft,
      mode,
      draftSettings: newDraftSettings,
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
