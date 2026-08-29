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
import {
  getExportableDraft,
  getExportableDraftForProfile,
  getMarkdownPreview,
  getPrintPreviewHtml,
  exportToMarkdown,
  exportToPrint,
} from '../../../src/domain/export/exportService';
import { CyrilFile } from '../../../src/domain/project/types';
import { createDefaultProject } from '../../../src/domain/project/defaults';
import { validateCyrilFile } from '../../../src/domain/project/validation';

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

  it('T-11.12: Chosen print profile and options survive save/load (schema round-trip)', () => {
    const cyrilFile = makeProjectFile();
    cyrilFile.project.exportSettings.printProfile = 'libretto';
    cyrilFile.project.exportSettings.includeSectionLabels = false;
    cyrilFile.project.exportSettings.pageDensity = 'compact';

    // Simulate save-to-disk-and-reload: JSON round trip through the same
    // validator used on file load (ExportSettingsSchema is `.passthrough()`,
    // so the unrecognised-by-schema `printProfile` field is preserved).
    const serialized = JSON.stringify(cyrilFile);
    const reloaded = validateCyrilFile(JSON.parse(serialized)) as unknown as CyrilFile;

    expect(reloaded.project.exportSettings.printProfile).toBe('libretto');
    expect(reloaded.project.exportSettings.includeSectionLabels).toBe(false);
    expect(reloaded.project.exportSettings.pageDensity).toBe('compact');

    // And the reloaded settings actually drive export output.
    const html = getPrintPreviewHtml(reloaded, reloaded.project.activeDraftId);
    expect(html).toContain('data-print-profile="libretto"');
  });

  it('T-11.13: Export dialog data path can preview each profile before printing (no window opened)', () => {
    const cyrilFile = makeProjectFile();
    for (const profile of ['lyricSheet', 'chordSheet', 'libretto', 'annotated'] as const) {
      const html = getPrintPreviewHtml(cyrilFile, cyrilFile.project.activeDraftId, profile);
      expect(html).not.toBeNull();
      expect(html).toContain(`data-print-profile="${profile}"`);
    }
  });

  it('the four print profiles produce visibly different output from the same canonical draft', () => {
    const cyrilFile = makeProjectFile();
    const outputs = (['lyricSheet', 'chordSheet', 'libretto', 'annotated'] as const).map(profile =>
      getPrintPreviewHtml(cyrilFile, cyrilFile.project.activeDraftId, profile)
    );
    expect(new Set(outputs).size).toBe(outputs.length);

    // Spot-check the specific differences DESIGN_PROPOSAL §7 promises.
    // (Match the quoted class attribute, not the CSS rule in <style> —
    // every profile's stylesheet defines all classes; only the body differs.)
    const [lyricSheet, chordSheet, libretto] = outputs;
    expect(chordSheet).toContain('class="chord-row"');
    expect(lyricSheet).not.toContain('class="chord-row"');
    expect(libretto).toContain('class="libretto-character"');
    expect(lyricSheet).not.toContain('class="libretto-character"');
  });

  it('T-11.17: Only the active alternate is exported in the main line; other alternates surface only in the Annotated profile margin', () => {
    const cyrilFile = makeProjectFile();
    const draft = cyrilFile.project.drafts[0];
    const section = draft.doc.content![0];
    const lyricWithAlt = section.content!.find(n => n.attrs?.id === 'line-4')!;
    const existingAttrs = lyricWithAlt.attrs as Record<string, unknown>;
    lyricWithAlt.attrs = {
      ...existingAttrs,
      meta: {
        ...(existingAttrs.meta as Record<string, unknown>),
        alternates: [
          { id: 'alt-1', label: 'Alt 1', doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goodbye world' }] }] }, isActive: false },
        ],
      },
    };

    // Lyric sheet: active text only, no trace of the alternate.
    const lyricSheet = getExportableDraftForProfile(cyrilFile, cyrilFile.project.activeDraftId, 'lyricSheet');
    const lyricLine = lyricSheet!.sections[0].lines.find(l => l.content === 'Hello world');
    expect(lyricLine).toBeDefined();
    expect(lyricLine!.alternates).toBeUndefined();
    expect(JSON.stringify(lyricSheet)).not.toContain('Goodbye world');

    // Annotated: active text is still the main line, but the alternate is attached for the margin.
    const annotated = getExportableDraftForProfile(cyrilFile, cyrilFile.project.activeDraftId, 'annotated');
    const annotatedLine = annotated!.sections[0].lines.find(l => l.content === 'Hello world');
    expect(annotatedLine).toBeDefined();
    expect(annotatedLine!.alternates).toEqual([{ id: 'alt-1', label: 'Alt 1', text: 'Goodbye world' }]);
  });

  it('T-11.18: Printing is independent of the editor\'s view toggles (draftSettings) — only export settings govern output', () => {
    const cyrilFile = makeProjectFile();
    // Hide chords and section labels in the *editor view* — this must have
    // no effect on what gets exported; only ResolvedExportOptions (built
    // from ExportSettings, not DraftSettings) governs print output.
    cyrilFile.project.drafts[0].draftSettings = {
      ...cyrilFile.project.drafts[0].draftSettings,
      showChords: false,
      showSectionLabels: false,
    };

    const html = getPrintPreviewHtml(cyrilFile, cyrilFile.project.activeDraftId, 'chordSheet');
    expect(html).toContain('chord-row');
    expect(html).toContain('Verse 1');
  });

  it('T-11.15: exportToPrint on an empty draft does not throw, for every profile', () => {
    const cyrilFile = makeProjectFile();
    cyrilFile.project.drafts[0].doc = { type: 'doc', content: [] };

    for (const profile of ['lyricSheet', 'chordSheet', 'libretto', 'annotated'] as const) {
      expect(() => exportToPrint(cyrilFile, cyrilFile.project.activeDraftId, profile)).not.toThrow();
      const html = getPrintPreviewHtml(cyrilFile, cyrilFile.project.activeDraftId, profile);
      expect(html).toContain('print-empty');
    }
  });
});
