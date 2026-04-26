/**
 * Share encoder / decoder
 * Converts a Cyril active draft into a compact base64 share blob
 * and back into a project.
 */

import { Draft, CyrilFile, DraftDocument, InventoryDocument, DraftSettings } from '../project/types';
import { createDefaultProject, createCyrilFile, generateId } from '../project/defaults';

export const SHARE_PREFIX = 'cyril-share:';
export const SHARE_VERSION = '1';

interface SharePayload {
  v: string;
  title: string;
  draft: Draft;
}

/**
 * Encode a draft into a compact base64 share blob.
 */
export function encodeShareDraft(projectTitle: string, draft: Draft): string {
  const payload: SharePayload = {
    v: SHARE_VERSION,
    title: projectTitle,
    draft,
  };
  const json = JSON.stringify(payload);
  // Use utf8-safe base64 encoding
  const base64 = typeof window !== 'undefined'
    ? window.btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    : Buffer.from(json).toString('base64');
  return `${SHARE_PREFIX}${base64}`;
}

/**
 * Decode a share blob back into a SharePayload.
 * Returns null if the input is not a valid share blob.
 */
export function decodeShareBlob(blob: string): SharePayload | null {
  const trimmed = blob.trim();
  if (!trimmed.startsWith(SHARE_PREFIX)) {
    return null;
  }
  const base64 = trimmed.slice(SHARE_PREFIX.length);
  try {
    const json = typeof window !== 'undefined'
      ? decodeURIComponent(Array.from(window.atob(base64)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''))
      : Buffer.from(base64, 'base64').toString('utf8');
    const payload = JSON.parse(json) as SharePayload;
    if (!payload || payload.v !== SHARE_VERSION || !payload.draft || !payload.title) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Build a new CyrilFile from a share payload.
 * The imported draft gets a new ID to avoid collisions.
 */
export function buildProjectFromShare(payload: SharePayload): CyrilFile {
  const project = createDefaultProject(payload.title);
  const importedDraft: Draft = {
    ...payload.draft,
    id: generateId('draft'),
    name: payload.draft.name || 'Imported Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Ensure doc and inventory have proper types
  if (!importedDraft.doc || !importedDraft.doc.content) {
    importedDraft.doc = { type: 'doc', content: [] } as DraftDocument;
  }
  if (!importedDraft.inventory) {
    importedDraft.inventory = { type: 'inventory', doc: { type: 'doc', content: [] } } as InventoryDocument;
  }
  if (!importedDraft.draftSettings) {
    importedDraft.draftSettings = {
      showChords: true,
      showSectionLabels: true,
      showSpeakerLabels: true,
      showStageDirections: true,
      showSummaries: true,
      showSyllableCounts: false,
      showStressMarks: false,
    } as DraftSettings;
  }

  project.drafts = [importedDraft];
  project.activeDraftId = importedDraft.id;

  return createCyrilFile(project);
}

/**
 * Validate whether a string looks like a Cyril share blob.
 */
export function isShareBlob(value: string): boolean {
  return decodeShareBlob(value) !== null;
}
