import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;
let originalWindowOpen: typeof window.open | undefined;

beforeAll(() => {
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = () => 'blob:mock';
  URL.revokeObjectURL = () => {};

  // Mock window.open for print tests (JSDOM doesn't implement it)
  originalWindowOpen = window.open;
  window.open = vi.fn(() => ({
    document: {
      write: vi.fn(),
      close: vi.fn(),
      readyState: 'complete',
    },
    onload: null,
    print: vi.fn(),
  })) as unknown as typeof window.open;
});

afterAll(() => {
  if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
  if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
  if (originalWindowOpen) window.open = originalWindowOpen;
});
import { buildExportableDraft, selectActiveDraft } from '../../../src/domain/export/exportSelectors';
import { getExportableDraft, getMarkdownPreview, exportToMarkdown, exportToPrint } from '../../../src/domain/export/exportService';
import { CyrilFile } from '../../../src/domain/project/types';
import { createDefaultProject } from '../../../src/domain/project/defaults';

function makeProjectFile(overrides: Partial<CyrilFile> = {}): CyrilFile {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  // Give the draft some structured content with unified lyricLine nodes
  draft.doc = {
    type: 'doc',
    content: [
      {
        type: 'sectionBlock',
        attrs: {
          id: 'sec-1',
          sectionType: 'verse',
          label: 'Verse 1',
          summary: 'Opening',
          color: null,
        },
        content: [
          {
            type: 'lyricLine',
            attrs: { id: 'line-1', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
            content: [{ type: 'text', text: 'First lyric line' }],
          },
          {
            type: 'lyricLine',
            attrs: { id: 'line-2', delivery: 'sung', rhymeGroup: null, lineType: 'speaker', meta: { alternates: [], prosody: null, chords: [] } },
            content: [{ type: 'text', text: 'WOODY' }],
          },
          {
            type: 'lyricLine',
            attrs: { id: 'line-3', delivery: 'sung', rhymeGroup: null, lineType: 'stageDirection', meta: { alternates: [], prosody: null, chords: [] } },
            content: [{ type: 'text', text: 'looks around' }],
          },
          {
            type: 'lyricLine',
            attrs: { id: 'line-4', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [{ id: 'chord-1', symbol: 'C', position: { anchorType: 'char', charOffset: 0, bias: 'before' } }] } },
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      },
    ],
  };

  return {
    schemaVersion: 'cyril-1.0',
    project: {
      ...project,
      activeDraftId: draft.id,
    },
    ...overrides,
  };
}

describe('Export Integration', () => {
  it('T-11.05: Export flow reads canonical project data rather than live DOM state', () => {
    const cyrilFile = makeProjectFile();
    const draft = selectActiveDraft(cyrilFile, cyrilFile.project.activeDraftId);
    expect(draft).not.toBeNull();
    expect(draft!.name).toBe('Draft 1');

    const exportable = getExportableDraft(cyrilFile, cyrilFile.project.activeDraftId);
    expect(exportable).not.toBeNull();
    expect(exportable!.projectTitle).toBe('Test Song');
    expect(exportable!.sections.length).toBeGreaterThanOrEqual(1);
    expect(exportable!.sections[0].lines.length).toBeGreaterThan(0);
  });

  it('T-11.06: Export settings persist and are applied correctly', () => {
    const cyrilFile = makeProjectFile();

    // Default settings include everything
    const exportableAll = buildExportableDraft(
      cyrilFile,
      cyrilFile.project.drafts[0],
      {
        includeSectionLabels: true,
        includeSpeakerLabels: true,
        includeStageDirections: true,
        includeChords: true,
        pageDensity: 'normal',
        concurrentLayout: 'squash',
      }
    );

    expect(exportableAll.sections[0].label).toBe('Verse 1');
    expect(exportableAll.sections[0].lines.some(l => l.type === 'speaker')).toBe(true);
    expect(exportableAll.sections[0].lines.some(l => l.type === 'stageDirection')).toBe(true);
    expect(exportableAll.sections[0].lines.some(l => l.type === 'lyric' && l.chords)).toBe(true);

    // Exclude speakers and stage directions
    const exportableFiltered = buildExportableDraft(
      cyrilFile,
      cyrilFile.project.drafts[0],
      {
        includeSectionLabels: true,
        includeSpeakerLabels: false,
        includeStageDirections: false,
        includeChords: false,
        pageDensity: 'normal',
        concurrentLayout: 'squash',
      }
    );

    expect(exportableFiltered.sections[0].lines.some(l => l.type === 'speaker')).toBe(false);
    expect(exportableFiltered.sections[0].lines.some(l => l.type === 'stageDirection')).toBe(false);
    expect(exportableFiltered.sections[0].lines.some(l => l.type === 'lyric' && l.chords)).toBe(false);
  });

  it('markdown preview includes lyrics and metadata', () => {
    const cyrilFile = makeProjectFile();
    const markdown = getMarkdownPreview(cyrilFile, cyrilFile.project.activeDraftId);
    expect(markdown).not.toBeNull();
    expect(markdown).toContain('# Test Song');
    expect(markdown).toContain('First lyric line');
  });

  it('exportToMarkdown returns true when active draft exists', () => {
    const cyrilFile = makeProjectFile();
    const result = exportToMarkdown(cyrilFile, cyrilFile.project.activeDraftId);
    expect(result).toBe(true);
  });

  it('exportToMarkdown returns false when no active draft', () => {
    const cyrilFile = makeProjectFile();
    const result = exportToMarkdown(cyrilFile, null);
    expect(result).toBe(false);
  });

  it('exportToPrint returns true when active draft exists', () => {
    const cyrilFile = makeProjectFile();
    const result = exportToPrint(cyrilFile, cyrilFile.project.activeDraftId);
    expect(result).toBe(true);
  });

  it('exportToPrint returns false when no active draft', () => {
    const cyrilFile = makeProjectFile();
    const result = exportToPrint(cyrilFile, null);
    expect(result).toBe(false);
  });
});
