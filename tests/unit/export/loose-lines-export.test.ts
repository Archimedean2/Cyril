/**
 * T-11.19: lyrics written outside any section block must still export.
 *
 * A new draft starts as bare `lyricLine` nodes, and a writer need never add a
 * section header — so this is the common case, not an edge case. Before this
 * was handled, `buildExportableDraft` walked only `sectionBlock` and
 * `concurrentBlock` top-level nodes and silently dropped everything else, so
 * such a draft printed and exported as an empty document.
 */
import { describe, it, expect } from 'vitest';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { renderPrintDocument } from '../../../src/domain/export/printRenderer';
import { draftToMarkdown } from '../../../src/domain/export/markdownTransformer';
import type { CyrilFile, Draft } from '../../../src/domain/project/types';
import type { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';

const options: ResolvedExportOptions = {
  includeSectionLabels: true,
  includeSpeakerLabels: true,
  includeStageDirections: true,
  includeChords: false,
  pageDensity: 'normal',
  concurrentLayout: 'squash',
};

const line = (text: string, lineType = 'lyric') => ({
  type: 'lyricLine',
  attrs: { lineType },
  content: [{ type: 'text', text }],
});

function draftWith(content: unknown[]): { file: CyrilFile; draft: Draft } {
  const draft = {
    id: 'd1',
    name: 'Draft 1',
    doc: { type: 'doc', content },
    inventory: { doc: { type: 'doc', content: [] } },
  } as unknown as Draft;
  const file = {
    schemaVersion: '1.0.0',
    project: { id: 'p1', title: 'Untitled Song', drafts: [draft] },
  } as unknown as CyrilFile;
  return { file, draft };
}

describe('T-11.19: lyrics outside a section block export', () => {
  it('T-11.19: top-level lyric lines reach the exportable draft', () => {
    const { file, draft } = draftWith([line('The hills are alive')]);
    const exportable = buildExportableDraft(file, draft, options);
    const texts = exportable.sections.flatMap(s => s.lines.map(l => l.content));
    expect(texts).toContain('The hills are alive');
  });

  it('T-11.19: a draft with no section header prints its lyrics, not an empty page', () => {
    const { file, draft } = draftWith([
      line('MARIA', 'speaker'),
      line('The hills are alive'),
    ]);
    const html = renderPrintDocument(buildExportableDraft(file, draft, options), options);
    expect(html).toContain('The hills are alive');
    expect(html).toContain('MARIA');
    expect(html).not.toContain('This draft has no content yet');
  });

  it('T-11.19: the same draft exports to markdown with its lyrics', () => {
    const { file, draft } = draftWith([line('The hills are alive')]);
    const md = draftToMarkdown(buildExportableDraft(file, draft, options));
    expect(md).toContain('The hills are alive');
  });

  it('T-11.19: loose lines keep their position relative to a later section', () => {
    const { file, draft } = draftWith([
      line('a pickup line before any header'),
      { type: 'sectionBlock', attrs: { sectionType: 'verse', label: 'Verse 1' }, content: [line('inside the verse')] },
    ]);
    const exportable = buildExportableDraft(file, draft, options);
    const order = exportable.sections.flatMap(s => s.lines.map(l => l.content));
    expect(order).toEqual(['a pickup line before any header', 'inside the verse']);
  });
});

describe('T-11.20: an unheaded section invents no heading', () => {
  it('T-11.20: print output for loose lines carries no section label', () => {
    const { file, draft } = draftWith([line('The hills are alive')]);
    const html = renderPrintDocument(buildExportableDraft(file, draft, options), options);
    // Assert against the rendered body only — the stylesheet in <head> legitimately
    // defines `.section-label`, so a whole-document match would never fail.
    const body = (html.match(/<body[\s\S]*<\/body>/i) || [''])[0];
    expect(body).not.toContain('>None<');
    expect(body).not.toContain('section-label');
    expect(body).toContain('The hills are alive');
  });

  it('T-11.20: markdown for loose lines carries no "## None" heading', () => {
    const { file, draft } = draftWith([line('The hills are alive')]);
    const md = draftToMarkdown(buildExportableDraft(file, draft, options));
    expect(md).not.toContain('## None');
    expect(md).toContain('The hills are alive');
  });
});
