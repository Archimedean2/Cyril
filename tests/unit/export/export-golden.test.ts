/**
 * Golden-file (snapshot) tests for the export layer.
 *
 * Captures the entire output of the export pipeline so any change to it is
 * visible. This class of test prevented D-02 ("lyrics outside a section block
 * never exported"), which passed every unit test despite shipping an empty
 * document for an ordinary song.
 *
 * Three fixture drafts exercise the full range:
 * 1. sectionedDraft: rich case with sections, concurrent blocks, chords, alternates
 * 2. unsectionedDraft: the D-02 shape — bare top-level lyricLine nodes (app default)
 * 3. emptyDraft: edge case — no content at all
 */

import { describe, it, expect } from 'vitest';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { renderPrintDocument } from '../../../src/domain/export/printRenderer';
import { draftToMarkdown } from '../../../src/domain/export/markdownTransformer';
import { resolvePrintOptions } from '../../../src/domain/export/printProfiles';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { createDraft } from '../../../src/domain/project/drafts';
import type { ExportSettings } from '../../../src/domain/project/types';
import type { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';

/**
 * Extract body content from rendered HTML to avoid snapshot noise from
 * the identical <style> block that appears in every profile's output.
 */
function extractBodyContent(html: string): string {
  const match = html.match(/<body[\s\S]*?<\/body>/i);
  return match ? match[0] : html;
}

/**
 * Build fixture drafts using the app's own factories where possible
 */
function buildFixtures() {
  // Shared export options
  const defaultExportSettings: ExportSettings = {
    includeSectionLabels: true,
    includeSpeakerLabels: true,
    includeStageDirections: true,
    includeChords: false,
    fontPreset: 'default',
    pageDensity: 'normal',
    concurrentLayout: 'squash',
  };

  // ============= UNSECTIONED DRAFT (D-02 shape, most important) =============
  // A new draft starts as bare `lyricLine` nodes with no `sectionBlock`.
  // This is what `createDraft()` produces and what the app ships by default.
  const unsectionedDraft = createDraft('Bare Lyrics Draft');
  // Clear the default single line and add test content
  unsectionedDraft.doc.content = [
    {
      type: 'lyricLine',
      attrs: { lineType: 'speaker', id: 'line_1', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
      content: [{ type: 'text', text: 'MARIA' }],
    },
    {
      type: 'lyricLine',
      attrs: { lineType: 'lyric', id: 'line_2', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
      content: [{ type: 'text', text: 'The hills are alive with the sound of music' }],
    },
    {
      type: 'lyricLine',
      attrs: { lineType: 'lyric', id: 'line_3', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
      content: [{ type: 'text', text: 'With songs they have sung for a thousand years' }],
    },
  ];

  // ============= EMPTY DRAFT =============
  const emptyDraft = createDraft('Empty Draft');
  emptyDraft.doc.content = [];

  // ============= SECTIONED DRAFT (rich case) =============
  // A verse section with speaker, lyric lines, stage direction, and chords
  const sectionedDraft = createDraft('Full-Featured Draft');
  sectionedDraft.doc.content = [
    // Verse section
    {
      type: 'sectionBlock',
      attrs: {
        id: 'section_1',
        sectionType: 'verse',
        label: 'Verse 1',
        summary: 'The Sound of Music intro verse',
      },
      content: [
        {
          type: 'lyricLine',
          attrs: { lineType: 'speaker', id: 'line_v1_1', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'MARIA' }],
        },
        {
          type: 'lyricLine',
          attrs: {
            lineType: 'lyric',
            id: 'line_v1_2',
            rhymeGroup: null,
            meta: {
              alternates: [
                {
                  id: 'alt_1',
                  label: 'Version 2',
                  isActive: false,
                  doc: {
                    type: 'doc',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The mountains are singing' }] }],
                  },
                },
              ],
              prosody: null,
              chords: [
                { symbol: 'C', position: { charOffset: 4 } },
                { symbol: 'G', position: { charOffset: 10 } },
              ],
            },
          },
          content: [{ type: 'text', text: 'The hills are alive' }],
        },
        {
          type: 'lyricLine',
          attrs: { lineType: 'lyric', id: 'line_v1_3', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'With songs they have sung for a thousand years' }],
        },
        {
          type: 'lyricLine',
          attrs: { lineType: 'stageDirection', id: 'line_v1_4', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: '(twirling in the mountains)' }],
        },
      ],
    },
    // Chorus section
    {
      type: 'sectionBlock',
      attrs: {
        id: 'section_2',
        sectionType: 'chorus',
        label: 'Chorus',
        summary: undefined,
      },
      content: [
        {
          type: 'lyricLine',
          attrs: { lineType: 'lyric', id: 'line_c1_1', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'My heart wants to sing every song it hears' }],
        },
        {
          type: 'lyricLine',
          attrs: { lineType: 'lyric', id: 'line_c1_2', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'My heart wants to beat like the wings of the birds' }],
        },
      ],
    },
    // Concurrent block
    {
      type: 'concurrentBlock',
      attrs: { id: 'concurrent_1', speakerColumns: ['MARIA', 'CAPTAIN'] },
      content: [
        {
          type: 'speakerColumn',
          attrs: { speakerName: 'MARIA', characterId: 'char_1' },
          content: [
            {
              type: 'lyricLine',
              attrs: { lineType: 'speaker', id: 'line_conc_m1', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'MARIA' }],
            },
            {
              type: 'lyricLine',
              attrs: { lineType: 'lyric', id: 'line_conc_m2', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'I go to the hills when my heart is lonely' }],
            },
            {
              type: 'lyricLine',
              attrs: { lineType: 'lyric', id: 'line_conc_m3', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'I know I will hear what I have heard before' }],
            },
          ],
        },
        {
          type: 'speakerColumn',
          attrs: { speakerName: 'CAPTAIN', characterId: 'char_2' },
          content: [
            {
              type: 'lyricLine',
              attrs: { lineType: 'speaker', id: 'line_conc_c1', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'CAPTAIN' }],
            },
            {
              type: 'lyricLine',
              attrs: { lineType: 'lyric', id: 'line_conc_c2', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'My heart wants to sigh like a chime in the tower' }],
            },
            {
              type: 'lyricLine',
              attrs: { lineType: 'lyric', id: 'line_conc_c3', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'I hear my heart singing a song I have never heard' }],
            },
          ],
        },
      ],
    },
  ];

  // Create CyrilFile wrappers
  const projectBase = createDefaultProject('Test Project');
  projectBase.exportSettings = defaultExportSettings;

  const unsectionedFile = createCyrilFile({ ...projectBase, drafts: [unsectionedDraft] });
  const emptyFile = createCyrilFile({ ...projectBase, drafts: [emptyDraft] });
  const sectionedFile = createCyrilFile({ ...projectBase, drafts: [sectionedDraft] });

  return {
    unsectionedDraft,
    unsectionedFile,
    emptyDraft,
    emptyFile,
    sectionedDraft,
    sectionedFile,
    defaultExportSettings,
  };
}

const fixtures = buildFixtures();

/**
 * Helper to resolve print options for a profile
 */
function optionsForProfile(
  settings: ExportSettings,
  profile: 'lyricSheet' | 'chordSheet' | 'libretto' | 'annotated'
): ResolvedExportOptions {
  return resolvePrintOptions(settings, profile);
}

describe('Export Golden Files (C-34)', () => {
  describe('T-11.21: Sectionedraft — all four print profiles', () => {
    it('T-11.21: lyricSheet profile renders sectionedDraft', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });

    it('T-11.21: chordSheet profile renders sectionedDraft', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'chordSheet');
      const exportable = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });

    it('T-11.21: libretto profile renders sectionedDraft', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'libretto');
      const exportable = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });

    it('T-11.21: annotated profile renders sectionedDraft', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'annotated');
      const exportable = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });

    it('T-11.21: markdown export of sectionedDraft', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, options);
      const md = draftToMarkdown(exportable);
      expect(md).toMatchSnapshot();
    });
  });

  describe('T-11.22: UnsectionedDraft (D-02 regression guards)', () => {
    it('T-11.22: unsectionedDraft lyricSheet print includes lyric text and no empty-state', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.unsectionedFile, fixtures.unsectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      expect(html).toContain('The hills are alive with the sound of music');
      expect(html).toContain('With songs they have sung for a thousand years');
      expect(html).not.toContain('This draft has no content yet');
    });

    it('T-11.22: unsectionedDraft lyricSheet print snapshot', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.unsectionedFile, fixtures.unsectionedDraft, options);
      const html = renderPrintDocument(exportable, options);
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });

    it('T-11.22: unsectionedDraft markdown includes lyric text and no "## None" heading', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.unsectionedFile, fixtures.unsectionedDraft, options);
      const md = draftToMarkdown(exportable);
      expect(md).toContain('The hills are alive with the sound of music');
      expect(md).toContain('With songs they have sung for a thousand years');
      expect(md).not.toContain('## None');
    });

    it('T-11.22: unsectionedDraft markdown snapshot', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.unsectionedFile, fixtures.unsectionedDraft, options);
      const md = draftToMarkdown(exportable);
      expect(md).toMatchSnapshot();
    });
  });

  describe('T-11.23: EmptyDraft edge case', () => {
    it('T-11.23: emptyDraft renders empty-state message and does not crash', () => {
      const options = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');
      const exportable = buildExportableDraft(fixtures.emptyFile, fixtures.emptyDraft, options);
      const html = renderPrintDocument(exportable, options);
      expect(html).toContain('This draft has no content yet');
      // Snapshot the body
      const body = extractBodyContent(html);
      expect(body).toMatchSnapshot();
    });
  });

  describe('T-11.24: Profile-specific content filtering', () => {
    it('T-11.24: chordSheet contains chord symbols; lyricSheet does not', () => {
      const optionsChord = optionsForProfile(fixtures.defaultExportSettings, 'chordSheet');
      const optionsLyric = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');

      const exportableChord = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsChord);
      const exportableLyric = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsLyric);

      const htmlChord = renderPrintDocument(exportableChord, optionsChord);
      const htmlLyric = renderPrintDocument(exportableLyric, optionsLyric);

      // Chord sheet should include chord symbols
      expect(htmlChord).toContain('C');
      expect(htmlChord).toContain('G');

      // Lyric sheet should not include chord markup
      const bodyLyric = extractBodyContent(htmlLyric);
      // The chord symbols shouldn't appear in the lyric body
      expect(bodyLyric).not.toMatch(/\bC\b|\bG\b/);
    });

    it('T-11.24: libretto contains stage-direction text; lyricSheet does not', () => {
      const optionsLibretto = optionsForProfile(fixtures.defaultExportSettings, 'libretto');
      const optionsLyric = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');

      const exportableLibretto = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsLibretto);
      const exportableLyric = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsLyric);

      const htmlLibretto = renderPrintDocument(exportableLibretto, optionsLibretto);
      const htmlLyric = renderPrintDocument(exportableLyric, optionsLyric);

      // Libretto should include stage directions
      expect(htmlLibretto).toContain('twirling in the mountains');

      // Lyric sheet should not
      expect(htmlLyric).not.toContain('twirling in the mountains');
    });

    it('T-11.24: annotated profile contains alternate text in margin (via exportable)', () => {
      const optionsAnnotated = optionsForProfile(fixtures.defaultExportSettings, 'annotated');
      const optionsLyric = optionsForProfile(fixtures.defaultExportSettings, 'lyricSheet');

      const exportableAnnotated = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsAnnotated);
      const exportableLyric = buildExportableDraft(fixtures.sectionedFile, fixtures.sectionedDraft, optionsLyric);

      // The annotated exportable should include the alternate text
      const annotatedContent = JSON.stringify(exportableAnnotated);
      expect(annotatedContent).toContain('Version 2');

      // The lyric exportable should not
      const lyricContent = JSON.stringify(exportableLyric);
      expect(lyricContent).not.toContain('Version 2');
    });
  });
});
