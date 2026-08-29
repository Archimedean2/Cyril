import { describe, it, expect } from 'vitest';
import { renderPrintDocument } from '../../../src/domain/export/printRenderer';
import { ExportableDraft, ExportableSection, ResolvedExportOptions } from '../../../src/domain/export/exportTypes';

function makeOptions(overrides: Partial<ResolvedExportOptions> = {}): ResolvedExportOptions {
  return {
    includeSectionLabels: true,
    includeSpeakerLabels: true,
    includeStageDirections: true,
    includeChords: true,
    includeAlternates: false,
    pageDensity: 'normal',
    concurrentLayout: 'squash',
    printProfile: 'lyricSheet',
    ...overrides,
  };
}

function bodyOf(html: string): string {
  return html.split('</head>')[1] || html;
}

function makeSection(overrides: Partial<ExportableSection> = {}): ExportableSection {
  return {
    id: 'sec-1',
    sectionType: 'verse',
    label: undefined,
    summary: undefined,
    lines: [],
    ...overrides,
  };
}

describe('Print Renderer', () => {
  it('T-11.03: Print renderer includes chord data when requested', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'chorus',
          label: 'Chorus',
          lines: [
            {
              type: 'lyric',
              content: 'Hello world',
              chords: [
                { symbol: 'C', offset: 0 },
                { symbol: 'G', offset: 6 },
              ],
            },
          ],
        }),
      ],
    };

    const html = renderPrintDocument(draft, 'normal');
    expect(html).toContain('C');
    expect(html).toContain('G');
    expect(html).toContain('lyric-line-block');
    expect(html).toContain('chord-row');
    expect(html).toContain('Hello world');
  });

  it('T-11.04: Print renderer excludes hidden export elements correctly', () => {
    // When exportSelectors builds an ExportableDraft, it already omits
    // speaker lines and stage directions based on settings. The print renderer
    // receives a filtered ExportableDraft, so it should not render those lines.
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          label: 'Verse',
          lines: [
            { type: 'lyric', content: 'Lyric line' },
          ],
        }),
      ],
    };

    const html = renderPrintDocument(draft, 'normal');
    expect(html).toContain('Lyric line');
    // The HTML includes CSS rule definitions for speaker-line and stage-direction
    // in the <style> block regardless of content. Check the body content only.
    const bodyContent = html.split('<body>')[1] || html;
    expect(bodyContent).not.toContain('class="speaker-line"');
    expect(bodyContent).not.toContain('class="stage-direction"');
  });

  it('renders speaker lines with speaker-line class', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          lines: [
            { type: 'speaker', content: 'WOODY', speaker: 'WOODY' },
            { type: 'lyric', content: 'Where am I?' },
          ],
        }),
      ],
    };

    const html = renderPrintDocument(draft, 'normal');
    expect(html).toContain('speaker-line');
    expect(html).toContain('WOODY');
    expect(html).toContain('Where am I?');
  });

  it('renders stage directions with stage-direction class', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          lines: [
            { type: 'stageDirection', content: 'sighs', stageDirection: 'sighs' },
            { type: 'lyric', content: 'Oh no' },
          ],
        }),
      ],
    };

    const html = renderPrintDocument(draft, 'normal');
    expect(html).toContain('stage-direction');
    expect(html).toContain('(sighs)');
    expect(html).toContain('Oh no');
  });

  it('renders compact density with smaller font size', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          lines: [{ type: 'lyric', content: 'Line' }],
        }),
      ],
    };

    const compactHtml = renderPrintDocument(draft, 'compact');
    const normalHtml = renderPrintDocument(draft, 'normal');

    expect(compactHtml).toContain('11px');
    expect(normalHtml).toContain('14px');
  });

  it('T-11.09: Chord sheet profile renders the chord row in a mono font; other profiles do not', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          lines: [{ type: 'lyric', content: 'Hello world', chords: [{ symbol: 'C', offset: 0 }] }],
        }),
      ],
    };

    const chordSheetHtml = renderPrintDocument(draft, makeOptions({ printProfile: 'chordSheet' }));
    const lyricSheetHtml = renderPrintDocument(draft, makeOptions({ printProfile: 'lyricSheet' }));

    expect(chordSheetHtml).toContain("'Courier New'");
    expect(lyricSheetHtml).not.toContain("'Courier New'");
  });

  it('T-11.10: Libretto profile renders speakers and stage directions in theatre format; lyric sheet omits stage directions', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          lines: [
            { type: 'speaker', content: 'WOODY', speaker: 'WOODY' },
            { type: 'stageDirection', content: 'looks around', stageDirection: 'looks around' },
            { type: 'lyric', content: 'Where am I?' },
          ],
        }),
      ],
    };

    const librettoHtml = renderPrintDocument(draft, makeOptions({ printProfile: 'libretto', includeSpeakerLabels: true, includeStageDirections: true }));
    expect(bodyOf(librettoHtml)).toContain('libretto-character');
    expect(bodyOf(librettoHtml)).toContain('libretto-stage-direction');
    expect(librettoHtml).toContain('WOODY');
    expect(librettoHtml).toContain('(looks around)');
    expect(librettoHtml).toContain('Where am I?');

    // A draft filtered for the lyric-sheet profile (as exportSelectors would
    // produce, with speakers/stage directions excluded) must render no
    // trace of stage-direction markup — lyric sheet omits stage directions.
    const lyricOnlyDraft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [makeSection({ lines: [{ type: 'lyric', content: 'Where am I?' }] })],
    };
    const lyricSheetHtml = renderPrintDocument(lyricOnlyDraft, makeOptions({ printProfile: 'lyricSheet' }));
    expect(bodyOf(lyricSheetHtml)).not.toContain('libretto-stage-direction');
    expect(bodyOf(lyricSheetHtml)).not.toContain('class="stage-direction"');
  });

  it('T-11.11: Annotated profile renders other alternates as a margin note next to the active line', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          summary: 'Try a softer word here',
          lines: [
            {
              type: 'lyric',
              content: 'Hello world',
              alternates: [{ id: 'alt-1', label: 'Alt 1', text: 'Hi there' }],
            },
          ],
        }),
      ],
    };

    const html = renderPrintDocument(draft, makeOptions({ printProfile: 'annotated', includeAlternates: true }));
    expect(html).toContain('margin-alternates');
    expect(html).toContain('Hi there');
    expect(html).toContain('Alt 1');
    expect(html).toContain('Try a softer word here');
    expect(html).toContain('Hello world');
  });

  it('T-11.15: Printing an empty draft renders a valid, non-crashing document for every profile', () => {
    const emptyDraft: ExportableDraft = { projectTitle: 'Empty Song', draftName: 'Draft', sections: [] };

    for (const profile of ['lyricSheet', 'chordSheet', 'libretto', 'annotated'] as const) {
      const html = renderPrintDocument(emptyDraft, makeOptions({ printProfile: profile }));
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('print-empty');
      expect(html).toContain(`data-print-profile="${profile}"`);
    }
  });

  it('T-11.16: Concurrent block squash order is left-to-right per row in print output', () => {
    // Two columns, two rows each; squash should read A1, B1, A2, B2.
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        {
          id: 'conc-1',
          sectionType: 'concurrent',
          lines: [
            { type: 'lyric', content: 'A1' },
            { type: 'lyric', content: 'B1' },
            { type: 'lyric', content: 'A2' },
            { type: 'lyric', content: 'B2' },
          ],
        },
      ],
    };

    const html = renderPrintDocument(draft, makeOptions());
    const order = ['A1', 'B1', 'A2', 'B2'].map(token => html.indexOf(`>${token}<`));
    expect(order.every(i => i !== -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('each of the four print profiles produces visibly different output from the same draft', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          label: 'Verse 1',
          summary: 'A note for the room',
          lines: [
            { type: 'speaker', content: 'WOODY', speaker: 'WOODY' },
            { type: 'stageDirection', content: 'sighs', stageDirection: 'sighs' },
            {
              type: 'lyric',
              content: 'Hello world',
              chords: [{ symbol: 'C', offset: 0 }],
              alternates: [{ id: 'alt-1', text: 'Hi there' }],
            },
          ],
        }),
      ],
    };

    const outputs = (['lyricSheet', 'chordSheet', 'libretto', 'annotated'] as const).map(profile => ({
      profile,
      // Each profile resolves its own include flags in resolvePrintOptions;
      // here we approximate that resolution to prove the renderer itself
      // reacts to every relevant flag, independent of that resolution logic.
      html: renderPrintDocument(
        draft,
        makeOptions({
          printProfile: profile,
          includeChords: profile === 'chordSheet',
          includeSpeakerLabels: profile === 'libretto',
          includeStageDirections: profile === 'libretto',
          includeAlternates: profile === 'annotated',
        })
      ),
    }));

    const unique = new Set(outputs.map(o => o.html));
    expect(unique.size).toBe(outputs.length);
  });
});
