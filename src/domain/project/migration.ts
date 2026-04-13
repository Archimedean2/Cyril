import { CyrilProject, CyrilFile } from './types';
import { createDefaultProject, SCHEMA_VERSION } from './defaults';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateProject(data: any): CyrilFile {
  // If no schema version, or it's empty, assume it's a raw project or invalid
  const projectData = data.project || data;
  
  // Start with a fresh default project to ensure all required fields exist
  const defaultProj = createDefaultProject(projectData.title || 'Untitled Song');
  
  // Merge workspaces (preserving existing content if present)
  const workspaces = {
    brief: { ...defaultProj.workspaces.brief, ...projectData.workspaces?.brief },
    structure: { ...defaultProj.workspaces.structure, ...projectData.workspaces?.structure },
    hookLab: { ...defaultProj.workspaces.hookLab, ...projectData.workspaces?.hookLab },
    vocabularyWorld: { ...defaultProj.workspaces.vocabularyWorld, ...projectData.workspaces?.vocabularyWorld },
  };

  // Merge display settings
  const displaySettings = {
    ...defaultProj.displaySettings,
    ...projectData.displaySettings,
  };

  // Merge export settings
  const exportSettings = {
    ...defaultProj.exportSettings,
    ...projectData.exportSettings,
  };

  // Merge project settings
  const projectSettings = {
    ...defaultProj.projectSettings,
    ...projectData.projectSettings,
  };

  // Map drafts to ensure they have all required fields (especially draftSettings)
  const drafts = Array.isArray(projectData.drafts) 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? projectData.drafts.map((draft: any) => {
        const defaultDraftSettings = {
          showChords: true,
          showSectionLabels: true,
          showSpeakerLabels: true,
          showStageDirections: true,
          showSummaries: true,
          showSyllableCounts: false,
        };
        
        return {
          ...draft,
          draftSettings: {
            ...defaultDraftSettings,
            ...draft.draftSettings,
          }
        };
      })
    : [];

  const migratedProject: CyrilProject = {
    ...defaultProj,
    ...projectData, // Overwrite defaults with actual data
    workspaces,     // Override with safely merged nested objects
    displaySettings,
    exportSettings,
    projectSettings,
    drafts,
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    project: migratedProject,
  };
}
