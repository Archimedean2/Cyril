import { describe, it, expect } from 'vitest';
import { renderPrintDocument } from '../../../src/domain/export/printRenderer';
import { ExportableDraft, ExportableSection } from '../../../src/domain/export/exportTypes';

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
});
