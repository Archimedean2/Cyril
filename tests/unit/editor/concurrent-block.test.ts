/**
 * Stage 13 — Concurrent Block unit tests
 * Tests cover: squash export, side-by-side export, exportSelectors integration,
 * markdownTransformer output, and printRenderer output.
 */

import { describe, it, expect } from 'vitest';
import { squashConcurrentBlock, buildSideBySideConcurrentBlock } from '../../../src/domain/export/concurrentExport';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { draftToMarkdown } from '../../../src/domain/export/markdownTransformer';
import { renderPrintDocument } from '../../../src/domain/export/printRenderer';
import { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';
import { RichTextNode } from '../../../src/domain/project/types';

// ─── fixtures ─────────────────────────────────────────────────────────────────

function makeLyricLineNode(text: string, chords?: any[]): RichTextNode {
  return {
    type: 'lyricLine',
    attrs: {
      id: `line_${text.replace(/\s/g, '_')}`,
      delivery: 'sung',
      rhymeGroup: null,
      lineType: 'lyric',
      meta: { alternates: [], prosody: null, chords: chords || [] },
    },
    content: text ? [{ type: 'text', text }] : [],
  };
}

function makeSpeakerColumn(speakerName: string, lines: RichTextNode[]): RichTextNode {
  return {
    type: 'speakerColumn',
    attrs: { id: `col_${speakerName}`, speakerName },
    content: lines,
  };
}

function makeConcurrentBlock(columns: RichTextNode[]): RichTextNode {
  return {
    type: 'concurrentBlock',
    attrs: { id: 'concurrent_001' },
    content: columns,
  };
}

const defaultOptions: ResolvedExportOptions = {
  includeSectionLabels: true,
  includeSpeakerLabels: true,
  includeStageDirections: true,
  includeChords: false,
  pageDensity: 'normal',
  concurrentLayout: 'squash',
};

// ─── squash tests ─────────────────────────────────────────────────────────────

describe('squashConcurrentBlock', () => {
  it('T-13.03: produces interleaved lines left-to-right per row', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1'), makeLyricLineNode('A2')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1'), makeLyricLineNode('B2')]),
    ]);

    const lines = squashConcurrentBlock(block, defaultOptions);

    const lyricTexts = lines.filter(l => l.type === 'lyric').map(l => l.content);
    expect(lyricTexts).toEqual(['A1', 'B1', 'A2', 'B2']);
  });

  it('T-13.04: skips empty cells when columns have unequal lengths', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1'), makeLyricLineNode('A2'), makeLyricLineNode('A3')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1'), makeLyricLineNode('B2')]),
    ]);

    const lines = squashConcurrentBlock(block, { ...defaultOptions, includeSpeakerLabels: false });

    const lyricTexts = lines.map(l => l.content);
    // Row 0: A1, B1 | Row 1: A2, B2 | Row 2: A3 (B column has no row 2)
    expect(lyricTexts).toEqual(['A1', 'B1', 'A2', 'B2', 'A3']);
  });

  it('T-13.05: emits speaker labels before each speaker in each row when includeSpeakerLabels=true', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const lines = squashConcurrentBlock(block, defaultOptions);

    expect(lines[0]).toMatchObject({ type: 'speaker', speaker: 'WOODY' });
    expect(lines[1]).toMatchObject({ type: 'lyric', content: 'A1' });
    expect(lines[2]).toMatchObject({ type: 'speaker', speaker: 'BUZZ' });
    expect(lines[3]).toMatchObject({ type: 'lyric', content: 'B1' });
  });

  it('T-13.06: omits speaker labels when includeSpeakerLabels=false', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const lines = squashConcurrentBlock(block, { ...defaultOptions, includeSpeakerLabels: false });

    expect(lines.every(l => l.type !== 'speaker')).toBe(true);
    expect(lines.map(l => l.content)).toEqual(['A1', 'B1']);
  });

  it('does not emit empty lines for blank lyricLine text', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const lines = squashConcurrentBlock(block, { ...defaultOptions, includeSpeakerLabels: false });

    // Empty cell in WOODY column at row 0 should be skipped
    expect(lines.filter(l => l.type === 'lyric').map(l => l.content)).toEqual(['B1']);
  });

  it('preserves chord data on lines when includeChords=true', () => {
    const chords = [{ id: 'c1', symbol: 'G', position: { anchorType: 'char', charOffset: 0, bias: 'before' } }];
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1', chords)]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const lines = squashConcurrentBlock(block, { ...defaultOptions, includeSpeakerLabels: false, includeChords: true });

    const woodyLine = lines.find(l => l.content === 'A1');
    expect(woodyLine?.chords).toHaveLength(1);
    expect(woodyLine?.chords?.[0].symbol).toBe('G');
  });
});

// ─── T-13.01 / T-13.02: node structure ──────────────────────────────────────

describe('T-13.01: concurrentBlock node structure', () => {
  it('has correct type and children', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('A', [makeLyricLineNode('line1')]),
      makeSpeakerColumn('B', [makeLyricLineNode('line2')]),
    ]);

    expect(block.type).toBe('concurrentBlock');
    expect(block.content).toHaveLength(2);
    expect(block.content![0].type).toBe('speakerColumn');
    expect(block.content![0].content![0].type).toBe('lyricLine');
  });
});

describe('T-13.02: speakerColumn attrs', () => {
  it('stores speakerName correctly', () => {
    const col = makeSpeakerColumn('JESSIE', [makeLyricLineNode('yee-haw')]);
    expect(col.attrs?.speakerName).toBe('JESSIE');
  });
});

// ─── T-13.07: buildSideBySideConcurrentBlock ─────────────────────────────────

describe('T-13.07: buildSideBySideConcurrentBlock', () => {
  it('returns correct column and line structure', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1'), makeLyricLineNode('A2')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const result = buildSideBySideConcurrentBlock(block, defaultOptions);

    expect(result.type).toBe('concurrent');
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].speakerName).toBe('WOODY');
    expect(result.columns[0].lines).toHaveLength(2);
    expect(result.columns[1].speakerName).toBe('BUZZ');
    expect(result.columns[1].lines).toHaveLength(1);
    expect(result.columns[1].lines[0].content).toBe('B1');
  });
});

// ─── T-13.08 / T-13.09: exportSelectors ──────────────────────────────────────

function makeMinimalProjectFile(draftContent: RichTextNode[]) {
  return {
    schemaVersion: '1.0.0',
    project: {
      id: 'proj_test',
      title: 'Test Song',
      subtitle: '',
      writers: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      workspaces: {
        brief: { doc: { type: 'doc', content: [] } },
        structure: { doc: { type: 'doc', content: [] } },
        hookLab: { doc: { type: 'doc', content: [] } },
        vocabularyWorld: { doc: { type: 'doc', content: [] } },
      },
      drafts: [
        {
          id: 'draft_001',
          name: 'Draft 1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: { type: 'doc', content: draftContent },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {
            showChords: false, showSectionLabels: true, showSpeakerLabels: true,
            showStageDirections: true, showSummaries: true, showSyllableCounts: false,
          },
        },
      ],
      activeDraftId: 'draft_001',
      displaySettings: {
        defaultShowChords: false, defaultShowSectionLabels: true, defaultShowSpeakerLabels: true,
        defaultShowStageDirections: true, defaultShowSummaries: true, defaultShowSyllableCounts: false,
        rhymeColorMode: 'off',
      },
      exportSettings: {
        includeSectionLabels: true, includeSpeakerLabels: true, includeStageDirections: true,
        includeChords: false, fontPreset: 'default', pageDensity: 'normal', concurrentLayout: 'squash',
      },
      projectSettings: { autosave: true, preferredExportMode: 'lyricsOnly' },
    },
  } as any;
}

describe('T-13.08: exportSelectors — top-level concurrentBlock squash', () => {
  it('produces interleaved lines as a synthetic concurrent section', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const projectFile = makeMinimalProjectFile([block]);
    const draft = projectFile.project.drafts[0];

    const result = buildExportableDraft(projectFile, draft, defaultOptions);

    expect(result.sections).toHaveLength(1);
    const section = result.sections[0];
    expect(section.sectionType).toBe('concurrent');
    const lyricLines = section.lines.filter(l => l.type === 'lyric');
    expect(lyricLines.map(l => l.content)).toEqual(['A1', 'B1']);
  });
});

describe('T-13.09: exportSelectors — concurrentBlock inside sectionBlock squash', () => {
  it('squashes concurrent block into section lines', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);
    const section: RichTextNode = {
      type: 'sectionBlock',
      attrs: { id: 'sec_001', sectionType: 'verse', label: 'Verse 1' },
      content: [block],
    };

    const projectFile = makeMinimalProjectFile([section]);
    const draft = projectFile.project.drafts[0];

    const result = buildExportableDraft(projectFile, draft, defaultOptions);

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].sectionType).toBe('verse');
    const lyricLines = result.sections[0].lines.filter(l => l.type === 'lyric');
    expect(lyricLines.map(l => l.content)).toEqual(['A1', 'B1']);
  });
});

// ─── T-13.10: markdownTransformer ────────────────────────────────────────────

describe('T-13.10: markdownTransformer squashes concurrent sections', () => {
  it('does not emit a section header for concurrent sections', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const projectFile = makeMinimalProjectFile([block]);
    const draft = projectFile.project.drafts[0];
    const exportable = buildExportableDraft(projectFile, draft, { ...defaultOptions, includeSpeakerLabels: false });
    const md = draftToMarkdown(exportable);

    expect(md).toContain('A1');
    expect(md).toContain('B1');
    expect(md).not.toContain('## Concurrent');
    expect(md).not.toContain('## concurrent');
  });

  it('includes speaker labels in markdown when enabled', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const projectFile = makeMinimalProjectFile([block]);
    const draft = projectFile.project.drafts[0];
    const exportable = buildExportableDraft(projectFile, draft, defaultOptions);
    const md = draftToMarkdown(exportable);

    expect(md).toContain('**WOODY**');
    expect(md).toContain('**BUZZ**');
  });
});

// ─── T-13.11: printRenderer side-by-side ─────────────────────────────────────

describe('T-13.11: printRenderer side-by-side concurrent layout', () => {
  it('renders concurrent-block-print with column structure', () => {
    const block = makeConcurrentBlock([
      makeSpeakerColumn('WOODY', [makeLyricLineNode('A1')]),
      makeSpeakerColumn('BUZZ', [makeLyricLineNode('B1')]),
    ]);

    const projectFile = makeMinimalProjectFile([block]);
    const draft = projectFile.project.drafts[0];
    const sideBySideOptions: ResolvedExportOptions = {
      ...defaultOptions,
      concurrentLayout: 'sideBySide',
    };
    const exportable = buildExportableDraft(projectFile, draft, sideBySideOptions);
    const html = renderPrintDocument(exportable, 'normal');

    expect(html).toContain('concurrent-block-print');
    expect(html).toContain('concurrent-col-header');
    expect(html).toContain('WOODY');
    expect(html).toContain('BUZZ');
    expect(html).toContain('A1');
    expect(html).toContain('B1');
  });
});
