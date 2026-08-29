import { Character, CyrilProject, CyrilFile } from './types';
import { createDefaultProject, generateId, SCHEMA_VERSION } from './defaults';
import { CHARACTER_COLOR_ORDER, createCharacter, findCharacterByName } from './characters';

// ─── Document node migration ──────────────────────────────────────────────────

const DEFAULT_LYRIC_LINE_ATTRS = {
  rhymeGroup: null,
  lineType: 'lyric',
  meta: { alternates: [], prosody: null, chords: [] },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateDocNode(node: any): any {
  if (!node || typeof node !== 'object') return node;

  // C-10: `delivery` was a removed cosmetic-only lyricLine attribute (sung |
  // spoken, purely italicised spoken lines). Drop it wherever a legacy
  // project still carries it — a silent no-op, not an error.
  if (node.attrs && Object.prototype.hasOwnProperty.call(node.attrs, 'delivery')) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { delivery, ...restAttrs } = node.attrs;
    node = { ...node, attrs: restAttrs };
  }

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

// ─── Character registry derivation (C-20) ─────────────────────────────────────
//
// Projects saved before the character registry existed have no `characters`
// array, but their speaker lines/columns already carry character *identity*
// as plain text. On load, derive a registry from those distinct names (in
// order of first appearance) rather than starting the writer with an empty
// list they'd have to rebuild by hand — no data loss, nothing to redo.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPlainText(content: any[] | undefined): string {
  if (!Array.isArray(content)) return '';
  return content.map((n) => (n?.type === 'text' && typeof n.text === 'string' ? n.text : '')).join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectSpeakerNames(node: any, names: string[], seen: Set<string>): void {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'lyricLine' && node.attrs?.lineType === 'speaker') {
    const name = extractPlainText(node.content).trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }

  if (node.type === 'speakerColumn') {
    const name = String(node.attrs?.speakerName || '').trim();
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) collectSpeakerNames(child, names, seen);
  }
}

// Backfills `characterId` onto speaker lines/columns that match a registry
// entry by name but don't carry the link yet. Never overwrites an existing
// `characterId`, and never touches lines that don't match anything (an
// unmatched name just keeps rendering with the default, un-linked treatment).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assignCharacterIds(node: any, characters: Character[]): any {
  if (!node || typeof node !== 'object') return node;

  let updated = node;

  if (node.type === 'lyricLine' && node.attrs?.lineType === 'speaker' && !node.attrs?.characterId) {
    const name = extractPlainText(node.content).trim();
    const match = name ? findCharacterByName(characters, name) : undefined;
    if (match) {
      updated = { ...updated, attrs: { ...updated.attrs, characterId: match.id } };
    }
  }

  if (node.type === 'speakerColumn' && !node.attrs?.characterId) {
    const name = String(node.attrs?.speakerName || '').trim();
    const match = name ? findCharacterByName(characters, name) : undefined;
    if (match) {
      updated = { ...updated, attrs: { ...updated.attrs, characterId: match.id } };
    }
  }

  if (Array.isArray(updated.content)) {
    updated = { ...updated, content: updated.content.map((child: unknown) => assignCharacterIds(child, characters)) };
  }

  return updated;
}

/**
 * Normalizes a raw `characters` array (present or absent) into a valid
 * `Character[]`, deriving entries from existing speaker names when the
 * project predates the registry.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCharacters(projectData: any, migratedDrafts: any[]): Character[] {
  if (Array.isArray(projectData.characters)) {
    // Preserve existing entries (including any unknown fields) rather than
    // deriving fresh ones — an explicit registry is the source of truth.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return projectData.characters.map((c: any) => ({
      ...c,
      id: typeof c?.id === 'string' && c.id ? c.id : generateId('character'),
      name: typeof c?.name === 'string' ? c.name : 'Character',
      color: CHARACTER_COLOR_ORDER.includes(c?.color) ? c.color : 'blue',
    }));
  }

  const names: string[] = [];
  const seen = new Set<string>();
  for (const draft of migratedDrafts) {
    if (draft?.doc) collectSpeakerNames(draft.doc, names, seen);
  }

  const characters: Character[] = [];
  for (const name of names) {
    characters.push(createCharacter(name, characters));
  }
  return characters;
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

  // Character registry (C-20): preserve an existing registry, or derive one
  // from distinct speaker names/columns already present in the (now
  // migrated) drafts — see `migrateCharacters` above and
  // `docs/engineering/DATA_MODEL.md`.
  const characters = migrateCharacters(projectData, drafts);

  // Backfill `characterId` onto every speaker line/column that matches a
  // registry entry by name but doesn't carry the link yet. Runs whether the
  // registry was derived just now or already existed — either way, existing
  // content should read as linked rather than "unregistered".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const draftsWithCharacterIds = drafts.map((draft: any) => ({
    ...draft,
    doc: draft.doc ? assignCharacterIds(draft.doc, characters) : draft.doc,
  }));

  const migratedProject: CyrilProject = {
    ...defaultProj,
    ...projectData, // Overwrite defaults with actual data
    workspaces,     // Override with safely merged nested objects
    displaySettings,
    exportSettings,
    projectSettings,
    drafts: draftsWithCharacterIds,
    characters,
  };

  return {
    schemaVersion: SCHEMA_VERSION,
    project: migratedProject,
  };
}
