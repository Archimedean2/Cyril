import { describe, it, expect, vi } from 'vitest';
import {
  copyShareLink,
  importFromShareBlob,
  importFromClipboard,
} from '../../../src/domain/share/shareService';
import {
  encodeShareDraft,
} from '../../../src/domain/share/shareEncoder';
import { CyrilFile, Draft } from '../../../src/domain/project/types';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

function makeCyrilFileWithDraft(draftOverrides: Partial<Draft> = {}): CyrilFile {
  const project = createDefaultProject('Test Project');
  const draft: Draft = {
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
    ...draftOverrides,
  };
  project.drafts = [draft];
  project.activeDraftId = draft.id;
  return createCyrilFile(project);
}

describe('Share Service Integration', () => {
  describe('copyShareLink', () => {
    it('T-12.10: Returns error when no active draft', async () => {
      const file = makeCyrilFileWithDraft();
      file.project.activeDraftId = 'non-existent-id';

      const result = await copyShareLink(file, 'non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active draft to share');
    });

    it('T-12.11: Returns error when clipboard write fails', async () => {
      const file = makeCyrilFileWithDraft();
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
        writable: true,
        configurable: true,
      });

      const result = await copyShareLink(file, 'draft_001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clipboard access denied or unavailable');

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });

    it('T-12.12: Successfully copies share link to clipboard', async () => {
      const file = makeCyrilFileWithDraft();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const result = await copyShareLink(file, 'draft_001');

      expect(result.success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('cyril-share:'));

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('importFromShareBlob', () => {
    it('T-12.13: Returns error for invalid share format', () => {
      const result = importFromShareBlob('not-a-share-blob');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid share format');
    });

    it('T-12.14: Returns error for malformed share data', () => {
      const result = importFromShareBlob('cyril-share:!!!invalid!!!');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid share format');
    });

    it('T-12.15: Successfully imports valid share blob', () => {
      const file = makeCyrilFileWithDraft({ name: 'Original Draft' });
      // First encode to get a valid blob
      const originalDraft = file.project.drafts[0];
      const blob = encodeShareDraft('Original Project', originalDraft);

      const result = importFromShareBlob(blob);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file!.project.title).toBe('Original Project');
      expect(result.file!.project.drafts[0].name).toBe('Original Draft');
    });

    it('T-12.16: Imported project has new draft ID', () => {
      const file = makeCyrilFileWithDraft();
      const originalDraft = file.project.drafts[0];
      const blob = encodeShareDraft('Project', originalDraft);

      const result = importFromShareBlob(blob);

      expect(result.success).toBe(true);
      expect(result.file!.project.drafts[0].id).not.toBe('draft_001');
      expect(result.file!.project.activeDraftId).toBe(result.file!.project.drafts[0].id);
    });
  });

  describe('importFromClipboard', () => {
    it('T-12.17: Returns error when clipboard read fails', async () => {
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { readText: vi.fn().mockRejectedValue(new Error('Denied')) },
        writable: true,
        configurable: true,
      });

      const result = await importFromClipboard();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clipboard access denied or unavailable');

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });

    it('T-12.18: Successfully imports from clipboard', async () => {
      const file = makeCyrilFileWithDraft({ name: 'Clipboard Draft' });
      const originalDraft = file.project.drafts[0];
      const blob = encodeShareDraft('Clipboard Project', originalDraft);

      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: { readText: vi.fn().mockResolvedValue(blob) },
        writable: true,
        configurable: true,
      });

      const result = await importFromClipboard();

      expect(result.success).toBe(true);
      expect(result.file!.project.title).toBe('Clipboard Project');

      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });
  });
});
