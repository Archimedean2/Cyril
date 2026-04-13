import { v4 as uuidv4 } from 'uuid';
import { CyrilProject, CyrilFile, DraftSettings } from './types';

export const SCHEMA_VERSION = '1.0.0';

export function generateId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
}

export const defaultDraftSettings: DraftSettings = {
  showSectionLabels: true,
  showSpeakerLabels: true,
  showStageDirections: true,
  showChords: false,
  showSyllableCounts: false,
  showSummaries: true,
};

export function createDefaultProject(title: string = 'Untitled Song'): CyrilProject {
  const now = new Date().toISOString();
  
  return {
    id: generateId('proj'),
    title,
    subtitle: '',
    writers: [],
    createdAt: now,
    updatedAt: now,
    workspaces: {
      brief: { doc: { type: 'doc', content: [] } },
      structure: { doc: { type: 'doc', content: [] } },
      hookLab: { doc: { type: 'doc', content: [] } },
      vocabularyWorld: { doc: { type: 'doc', content: [] } },
    },
    drafts: [
      {
        id: generateId('draft'),
        name: 'Draft 1',
        createdAt: now,
        updatedAt: now,
        mode: 'lyrics',
        doc: { type: 'doc', content: [{ type: 'paragraph' }] } as any,
        inventory: { type: 'inventory', doc: { type: 'doc', content: [{ type: 'paragraph' }] } } as any,
        draftSettings: defaultDraftSettings,
      }
    ],
    activeDraftId: null,
    displaySettings: {
      defaultShowChords: true,
      defaultShowSectionLabels: true,
      defaultShowSpeakerLabels: true,
      defaultShowStageDirections: true,
      defaultShowSummaries: true,
      defaultShowSyllableCounts: false,
      rhymeColorMode: 'off',
    },
    exportSettings: {
      includeSectionLabels: true,
      includeSpeakerLabels: true,
      includeStageDirections: true,
      includeChords: false,
      fontPreset: 'default',
      pageDensity: 'normal',
    },
    projectSettings: {
      autosave: true,
      preferredExportMode: 'lyricsOnly',
    },
  };
}

export function createCyrilFile(project: CyrilProject): CyrilFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    project,
  };
}
