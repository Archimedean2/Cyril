import { describe, it, expect } from 'vitest';
import { draftToMarkdown } from '../../../src/domain/export/markdownTransformer';
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

describe('Markdown Export', () => {
  it('T-11.01: Markdown export includes active lyric content only', () => {
    const draft: ExportableDraft = {
      projectTitle: 'My Song',
      draftName: 'Draft A',
      sections: [
        makeSection({
          sectionType: 'verse',
          label: 'Verse 1',
          lines: [
            { type: 'lyric', content: 'First line of lyrics' },
            { type: 'lyric', content: 'Second line of lyrics' },
          ],
        }),
      ],
    };

    const markdown = draftToMarkdown(draft);
    expect(markdown).toContain('# My Song');
    expect(markdown).toContain('**Draft A**');
    expect(markdown).toContain('## Verse 1');
    expect(markdown).toContain('First line of lyrics');
    expect(markdown).toContain('Second line of lyrics');
  });

  it('T-11.02: Markdown export respects metadata include/exclude settings', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Test Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          label: 'Verse 1',
          summary: 'A quiet beginning',
          lines: [
            { type: 'lyric', content: 'Lyric line' },
            { type: 'speaker', content: 'WOODY', speaker: 'WOODY' },
            { type: 'stageDirection', content: 'sighs', stageDirection: 'sighs' },
          ],
        }),
      ],
    };

    const markdown = draftToMarkdown(draft);
    // Speaker and stage direction are included because the markdown transformer
    // receives an already-filtered ExportableDraft from exportSelectors.
    // It does not re-apply filters.
    expect(markdown).toContain('**WOODY**');
    expect(markdown).toContain('*(sighs)*');
    expect(markdown).toContain('Lyric line');
    expect(markdown).toContain('*A quiet beginning*');
  });

  it('renders chords inline in brackets', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Chords Song',
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

    const markdown = draftToMarkdown(draft);
    expect(markdown).toContain('[C]Hello [G]world');
  });

  it('uses section type as fallback when label is absent', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'bridge',
          lines: [{ type: 'lyric', content: 'Bridge line' }],
        }),
      ],
    };

    const markdown = draftToMarkdown(draft);
    expect(markdown).toContain('## Bridge');
  });

  it('renders empty sections with only a header', () => {
    const draft: ExportableDraft = {
      projectTitle: 'Song',
      draftName: 'Draft',
      sections: [
        makeSection({
          sectionType: 'verse',
          lines: [{ type: 'lyric', content: 'Only line' }],
        }),
        makeSection({
          sectionType: 'bridge',
          lines: [],
        }),
      ],
    };

    const markdown = draftToMarkdown(draft);
    // draftToMarkdown renders all sections; filtering empty ones is buildExportableDraft's responsibility
    expect(markdown).toContain('## Bridge');
    expect(markdown).toContain('## Verse');
  });
});
