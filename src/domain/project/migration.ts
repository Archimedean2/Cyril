import { CyrilProject, CyrilFile } from './types';
import { createDefaultProject, SCHEMA_VERSION } from './defaults';

// ─── Document node migration ──────────────────────────────────────────────────

const DEFAULT_LYRIC_LINE_ATTRS = {
  delivery: 'sung',
  rhymeGroup: null,
  lineType: 'lyric',
  meta: { alternates: [], prosody: null, chords: [] },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateDocNode(node: any): any {
  if (!node || typeof node !== 'object') return node;

  // Migrate old speakerLine node type → lyricLine with lineType: 'speaker'
  if (node.type === 'speakerLine') {
    const { speaker, id, ...restAttrs } = node.attrs || {};
    const content = node.content?.length
      ? node.content
      : speaker
        ? [{ type: 'text', text: speaker }]
        : [];
    return migrateDocNode({
      ...node,
      type: 'lyricLine',
      attrs: {
        ...DEFAULT_LYRIC_LINE_ATTRS,
        ...restAttrs,
        id: id || '',
        lineType: 'speaker',
      },
      content,
    });
  }

  // Migrate old stageDirection node type → lyricLine with lineType: 'stageDirection'
  if (node.type === 'stageDirection') {
    const { text, id, ...restAttrs } = node.attrs || {};
    const content = node.content?.length
      ? node.content
      : text
        ? [{ type: 'text', text }]
        : [];
    return migrateDocNode({
      ...node,
      type: 'lyricLine',
      attrs: {
        ...DEFAULT_LYRIC_LINE_ATTRS,
        ...restAttrs,
        id: id || '',
        lineType: 'stageDirection',
      },
      content,
    });
  }

  // Recurse into content array
  if (Array.isArray(node.content)) {
    return { ...node, content: node.content.map(migrateDocNode) };
  }

  return node;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateDraftDoc(doc: any): any {
  if (!doc) return doc;
  return migrateDocNode(doc);
}

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
    concurrentLayout: projectData.exportSettings?.concurrentLayout ?? 'squash',
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
          showStressMarks: false,
        };
        
        return {
          ...draft,
          draftSettings: {
            ...defaultDraftSettings,
            ...draft.draftSettings,
          },
          doc: draft.doc ? migrateDraftDoc(draft.doc) : draft.doc,
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
