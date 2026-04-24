import { describe, it, expect } from 'vitest';
import {
  encodeShareDraft,
  decodeShareBlob,
  buildProjectFromShare,
  isShareBlob,
  SHARE_PREFIX,
} from '../../../src/domain/share/shareEncoder';
import { Draft, CyrilFile } from '../../../src/domain/project/types';

function makeDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: 'draft_001',
    name: 'Test Draft',
    createdAt: '2026-04-23T10:00:00.000Z',
    updatedAt: '2026-04-23T10:00:00.000Z',
    mode: 'lyrics',
    doc: { type: 'doc', content: [] },
    inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
    draftSettings: {
      showChords: true,
      showSectionLabels: true,
      showSpeakerLabels: true,
      showStageDirections: true,
      showSummaries: true,
      showSyllableCounts: false,
    },
    ...overrides,
  };
}

describe('Share Encoder/Decoder', () => {
  it('T-12.01: Encodes a draft to a share blob with correct prefix', () => {
    const draft = makeDraft({ name: 'My Draft' });
    const blob = encodeShareDraft('My Song', draft);

    expect(blob.startsWith(SHARE_PREFIX)).toBe(true);
    expect(blob.length).toBeGreaterThan(SHARE_PREFIX.length);
  });

  it('T-12.02: Decodes a valid share blob back to payload', () => {
    const draft = makeDraft({ name: 'Original Draft' });
    const blob = encodeShareDraft('Original Song', draft);

    const payload = decodeShareBlob(blob);

    expect(payload).not.toBeNull();
    expect(payload!.v).toBe('1');
    expect(payload!.title).toBe('Original Song');
    expect(payload!.draft.name).toBe('Original Draft');
  });

  it('T-12.03: Returns null for invalid share blob without prefix', () => {
    const result = decodeShareBlob('not-a-valid-share-blob');
    expect(result).toBeNull();
  });

  it('T-12.04: Returns null for malformed base64 data', () => {
    const result = decodeShareBlob(`${SHARE_PREFIX}!!!invalid!!!`);
    expect(result).toBeNull();
  });

  it('T-12.05: isShareBlob correctly identifies valid share blobs', () => {
    const draft = makeDraft();
    const blob = encodeShareDraft('Song', draft);

    expect(isShareBlob(blob)).toBe(true);
    expect(isShareBlob('random string')).toBe(false);
    expect(isShareBlob('')).toBe(false);
  });

  it('T-12.06: buildProjectFromShare creates valid CyrilFile', () => {
    const draft = makeDraft({
      name: 'Shared Draft',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'sectionBlock',
            attrs: { id: 'sec_001', sectionType: 'verse' },
            content: [],
          },
        ],
      },
    });
    const blob = encodeShareDraft('Shared Song', draft);
    const payload = decodeShareBlob(blob)!;

    const projectFile: CyrilFile = buildProjectFromShare(payload);

    expect(projectFile.schemaVersion).toBeDefined();
    expect(projectFile.project.title).toBe('Shared Song');
    expect(projectFile.project.drafts).toHaveLength(1);
    expect(projectFile.project.drafts[0].name).toBe('Shared Draft');
    expect(projectFile.project.activeDraftId).toBe(projectFile.project.drafts[0].id);
    // Draft ID should be regenerated
    expect(projectFile.project.drafts[0].id).not.toBe('draft_001');
  });

  it('T-12.07: Imported draft preserves doc structure', () => {
    const draft = makeDraft({
      doc: {
        type: 'doc',
        content: [
          {
            type: 'sectionBlock',
            attrs: { id: 'sec_001', sectionType: 'chorus', label: 'Chorus 1' },
            content: [],
          },
        ],
      },
    });
    const blob = encodeShareDraft('Song', draft);
    const payload = decodeShareBlob(blob)!;
    const projectFile = buildProjectFromShare(payload);

    const importedDraft = projectFile.project.drafts[0];
    expect(importedDraft.doc.type).toBe('doc');
    expect(importedDraft.doc.content).toHaveLength(1);
    expect(importedDraft.doc.content[0].type).toBe('sectionBlock');
    expect(importedDraft.doc.content[0].attrs?.label).toBe('Chorus 1');
  });

  it('T-12.08: Imported draft gets new timestamps', () => {
    const draft = makeDraft({
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    const blob = encodeShareDraft('Song', draft);
    const payload = decodeShareBlob(blob)!;
    const projectFile = buildProjectFromShare(payload);

    const importedDraft = projectFile.project.drafts[0];
    expect(importedDraft.createdAt).not.toBe('2020-01-01T00:00:00.000Z');
    expect(importedDraft.updatedAt).not.toBe('2020-01-01T00:00:00.000Z');
    // Should be a valid ISO date
    expect(new Date(importedDraft.createdAt).getTime()).not.toBeNaN();
  });

  it('T-12.09: Handles drafts with chords and metadata', () => {
    const draft = makeDraft({
      mode: 'lyricsWithChords',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'sectionBlock',
            attrs: { id: 'sec_001', sectionType: 'verse' },
            content: [
              {
                type: 'lyricLine',
                attrs: { id: 'line_001', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: {
                  alternates: [],
                  prosody: null,
                  chords: [
                    { id: 'chord_001', symbol: 'C', position: { anchorType: 'char', charOffset: 0, bias: 'before' } },
                  ],
                } },
                content: [{ type: 'text', text: 'Hello world' }],
              },
            ],
          },
        ],
      },
    });

    const blob = encodeShareDraft('Song with Chords', draft);
    const payload = decodeShareBlob(blob)!;
    const projectFile = buildProjectFromShare(payload);

    expect(projectFile.project.drafts[0].mode).toBe('lyricsWithChords');
  });
});
