import { v4 as uuidv4 } from 'uuid';
import { Draft, DraftSettings } from './types';
import { generateId } from './defaults';

function makeLyricLineJSON() {
  return {
    type: 'lyricLine' as const,
    attrs: {
      id: generateId('line'),
      delivery: 'sung',
      rhymeGroup: null,
      meta: { alternates: [], prosody: null, chords: [] },
    },
  };
}

export type DuplicationMode = 'blank' | 'text' | 'inventory' | 'both';

export function createDefaultDraftSettings(): DraftSettings {
  return {
    showChords: true,
    showSectionLabels: true,
    showSpeakerLabels: true,
    showStageDirections: true,
    showSummaries: true,
    showSyllableCounts: false,
    showStressMarks: false,
  };
}

export function createDraft(name: string, sourceDraft?: Draft, mode: DuplicationMode = 'blank'): Draft {
  const newId = uuidv4();
  const now = new Date().toISOString();

  // Create a clean base draft
  const newDraft: Draft = {
    id: newId,
    name,
    createdAt: now,
    updatedAt: now,
    mode: sourceDraft?.mode || 'lyrics',
    doc: {
      type: 'doc',
      content: []
    },
    inventory: {
      type: 'inventory',
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      }
    },
    draftSettings: sourceDraft ? { ...sourceDraft.draftSettings } : createDefaultDraftSettings()
  };

  if (mode === 'blank' || !sourceDraft) {
    newDraft.doc.content = [makeLyricLineJSON()] as any;
    return newDraft;
  }

  if (mode === 'text' || mode === 'both') {
    // Deep clone text doc
    newDraft.doc = JSON.parse(JSON.stringify(sourceDraft.doc));
    
    // Note: In Stage 4 we will need to walk the AST and regenerate IDs for:
    // - Section blocks
    // - Lyric lines
    // - Alternates
    // - Chord markers
  } else {
    newDraft.doc.content = [makeLyricLineJSON()] as any;
  }

  if (mode === 'inventory' || mode === 'both') {
    // Deep clone inventory
    newDraft.inventory = JSON.parse(JSON.stringify(sourceDraft.inventory));
  }

  return newDraft;
}
