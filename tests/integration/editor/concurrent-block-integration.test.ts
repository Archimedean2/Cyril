/**
 * Stage 13 — Concurrent Block integration tests
 * Covers: migration, save/load round-trip, chord preservation through columns.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { migrateProject } from '../../../src/domain/project/migration';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

const defaultOptions: ResolvedExportOptions = {
  includeSectionLabels: true,
  includeSpeakerLabels: true,
  includeStageDirections: true,
  includeChords: false,
  pageDensity: 'normal',
  concurrentLayout: 'squash',
};

// ─── T-13.12: migration ───────────────────────────────────────────────────────

describe('T-13.12: migration adds concurrentLayout default', () => {
  it('adds concurrentLayout: squash to projects that lack the field', () => {
    const legacyProject = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_legacy',
        title: 'Legacy Song',
        drafts: [],
        exportSettings: {
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          // concurrentLayout intentionally absent
        },
      },
    };

    const migrated = migrateProject(legacyProject);
    expect(migrated.project.exportSettings.concurrentLayout).toBe('squash');
  });

  it('preserves explicit concurrentLayout value if already present', () => {
    const project = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_new',
        title: 'New Song',
        drafts: [],
        exportSettings: {
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          concurrentLayout: 'sideBySide',
        },
      },
    };

    const migrated = migrateProject(project);
    expect(migrated.project.exportSettings.concurrentLayout).toBe('sideBySide');
  });
});

// ─── T-13.13: save/load round-trip ───────────────────────────────────────────

describe('T-13.13: concurrentBlock save/load round-trip', () => {
  const projectWithConcurrent = {
    schemaVersion: '1.0.0',
    project: {
      id: 'proj_concurrent',
      title: 'Concurrent Song',
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
          doc: {
            type: 'doc',
            content: [
              {
                type: 'concurrentBlock',
                attrs: { id: 'concurrent_001' },
                content: [
                  {
                    type: 'speakerColumn',
                    attrs: { id: 'col_woody', speakerName: 'WOODY' },
                    content: [
                      {
                        type: 'lyricLine',
                        attrs: { id: 'line_001', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                          meta: { alternates: [], prosody: null, chords: [] } },
                        content: [{ type: 'text', text: 'You got a friend in me' }],
                      },
                    ],
                  },
                  {
                    type: 'speakerColumn',
                    attrs: { id: 'col_buzz', speakerName: 'BUZZ' },
                    content: [
                      {
                        type: 'lyricLine',
                        attrs: { id: 'line_002', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                          meta: { alternates: [], prosody: null, chords: [] } },
                        content: [{ type: 'text', text: 'To infinity and beyond' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
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
  };

  it('preserves speakerName and lyricLine content after migration round-trip', () => {
    const migrated = migrateProject(projectWithConcurrent);
    const draft = migrated.project.drafts[0];

    expect(draft.doc.content[0].type).toBe('concurrentBlock');
    const block = draft.doc.content[0];
    expect(block.content![0].attrs?.speakerName).toBe('WOODY');
    expect(block.content![1].attrs?.speakerName).toBe('BUZZ');

    const woodyLine = block.content![0].content![0];
    expect(woodyLine.content![0].text).toBe('You got a friend in me');

    const buzzLine = block.content![1].content![0];
    expect(buzzLine.content![0].text).toBe('To infinity and beyond');
  });

  it('round-trips through exportSelectors preserving content', () => {
    const migrated = migrateProject(projectWithConcurrent);
    const draft = migrated.project.drafts[0];

    const exportable = buildExportableDraft(migrated as any, draft, defaultOptions);

    expect(exportable.sections).toHaveLength(1);
    const lyricLines = exportable.sections[0].lines.filter(l => l.type === 'lyric');
    expect(lyricLines.map(l => l.content)).toContain('You got a friend in me');
    expect(lyricLines.map(l => l.content)).toContain('To infinity and beyond');
  });
});

// ─── T-13.14: chords inside speakerColumn ─────────────────────────────────────

describe('T-13.14: chords on lyricLines inside speakerColumn are preserved', () => {
  it('chord data survives migration and export', () => {
    const projectWithChords = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_chords',
        title: 'Chord Song',
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
            mode: 'lyricsWithChords',
            doc: {
              type: 'doc',
              content: [
                {
                  type: 'concurrentBlock',
                  attrs: { id: 'cb_001' },
                  content: [
                    {
                      type: 'speakerColumn',
                      attrs: { id: 'col_a', speakerName: 'A' },
                      content: [
                        {
                          type: 'lyricLine',
                          attrs: {
                            id: 'line_001', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                            meta: {
                              alternates: [],
                              prosody: null,
                              chords: [
                                { id: 'chord_001', symbol: 'G', position: { anchorType: 'char', charOffset: 0, bias: 'before' } },
                              ],
                            },
                          },
                          content: [{ type: 'text', text: 'Gone' }],
                        },
                      ],
                    },
                    {
                      type: 'speakerColumn',
                      attrs: { id: 'col_b', speakerName: 'B' },
                      content: [
                        {
                          type: 'lyricLine',
                          attrs: { id: 'line_002', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                            meta: { alternates: [], prosody: null, chords: [] } },
                          content: [{ type: 'text', text: 'Away' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
            draftSettings: {
              showChords: true, showSectionLabels: true, showSpeakerLabels: true,
              showStageDirections: true, showSummaries: true, showSyllableCounts: false,
            },
          },
        ],
        activeDraftId: 'draft_001',
        displaySettings: {
          defaultShowChords: true, defaultShowSectionLabels: true, defaultShowSpeakerLabels: true,
          defaultShowStageDirections: true, defaultShowSummaries: true, defaultShowSyllableCounts: false,
          rhymeColorMode: 'off',
        },
        exportSettings: {
          includeSectionLabels: true, includeSpeakerLabels: false, includeStageDirections: true,
          includeChords: true, fontPreset: 'default', pageDensity: 'normal', concurrentLayout: 'squash',
        },
        projectSettings: { autosave: true, preferredExportMode: 'lyricsWithChords' },
      },
    };

    const migrated = migrateProject(projectWithChords);
    const draft = migrated.project.drafts[0];
    const chordsOptions: ResolvedExportOptions = {
      ...defaultOptions,
      includeChords: true,
      includeSpeakerLabels: false,
    };

    const exportable = buildExportableDraft(migrated as any, draft, chordsOptions);

    const goneLine = exportable.sections[0].lines.find(l => l.content === 'Gone');
    expect(goneLine).toBeDefined();
    expect(goneLine?.chords).toHaveLength(1);
    expect(goneLine?.chords![0].symbol).toBe('G');
  });
});

// ─── T-13.16a/b: row alignment markers ────────────────────────────────────────

function makeTwoColumnDoc() {
  const line = (id: string, text: string) => ({
    type: 'lyricLine',
    attrs: { id, delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
    content: text ? [{ type: 'text', text }] : [],
  });
  return {
    type: 'doc',
    content: [{
      type: 'concurrentBlock',
      attrs: { id: 'cb_test' },
      content: [
        {
          type: 'speakerColumn',
          attrs: { id: 'col_a', speakerName: 'WOODY' },
          content: [line('la1', 'To infinity'), line('la2', 'And beyond')],
        },
        {
          type: 'speakerColumn',
          attrs: { id: 'col_b', speakerName: 'BUZZ' },
          content: [line('lb1', 'I am Buzz'), line('lb2', 'Lightyear')],
        },
      ],
    }],
  };
}

describe('T-13.16a: row guides appear when caret is inside a concurrent block', () => {
  let editor: Editor;
  let el: HTMLDivElement;

  afterEach(() => {
    editor.destroy();
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  it('adds concurrent-block--focused to the block and lyric-line--active-row to the active row', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    editor = new Editor({
      ...getDraftEditorConfig({ content: makeTwoColumnDoc() }),
      element: el,
    });

    // Find the position inside the first lyricLine of column A
    let firstLinePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (firstLinePos !== -1) return false;
      if (node.type.name === 'lyricLine') {
        firstLinePos = pos + 1; // inside the lyricLine
        return false;
      }
    });
    expect(firstLinePos).toBeGreaterThan(0);

    const { tr } = editor.state;
    const $pos = editor.state.doc.resolve(firstLinePos);
    editor.view.dispatch(tr.setSelection(TextSelection.near($pos)));

    // The block should receive the focused class
    const blockEl = el.querySelector('[data-type="concurrentBlock"]');
    expect(blockEl?.classList.contains('concurrent-block--focused')).toBe(true);

    // Row 0 in both columns should have the active-row class.
    // Query within the block element to exclude any trailing lyricLine that
    // ProseMirror appends outside an isolating node.
    const linesInBlock = Array.from(blockEl!.querySelectorAll('[data-type="lyricLine"]'));
    expect(linesInBlock.length).toBe(4); // 2 columns × 2 rows
    // Column A row 0 and column B row 0 → indices 0 and 2 in DOM order
    expect(linesInBlock[0].classList.contains('lyric-line--active-row')).toBe(true);
    expect(linesInBlock[2].classList.contains('lyric-line--active-row')).toBe(true);
    // Row 1 lines should not have the class
    expect(linesInBlock[1].classList.contains('lyric-line--active-row')).toBe(false);
    expect(linesInBlock[3].classList.contains('lyric-line--active-row')).toBe(false);
  });
});

describe('T-13.16b: row guides disappear when caret leaves the concurrent block', () => {
  let editor: Editor;
  let el: HTMLDivElement;

  afterEach(() => {
    editor.destroy();
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  it('removes concurrent-block--focused and lyric-line--active-row when cursor moves outside the block', () => {
    // Doc with a concurrent block followed by a standalone lyricLine
    const standaloneLine = {
      type: 'lyricLine',
      attrs: { id: 'outside_line', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
      content: [{ type: 'text', text: 'Outside the block' }],
    };
    const docWithTrailing = {
      ...makeTwoColumnDoc(),
      content: [...(makeTwoColumnDoc().content as object[]), standaloneLine],
    };

    el = document.createElement('div');
    document.body.appendChild(el);
    editor = new Editor({
      ...getDraftEditorConfig({ content: docWithTrailing }),
      element: el,
    });

    // First put cursor inside the block
    let firstLinePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (firstLinePos !== -1) return false;
      if (node.type.name === 'lyricLine') { firstLinePos = pos + 1; return false; }
    });
    const { tr: tr1 } = editor.state;
    editor.view.dispatch(tr1.setSelection(TextSelection.near(editor.state.doc.resolve(firstLinePos))));
    expect(el.querySelector('[data-type="concurrentBlock"]')?.classList.contains('concurrent-block--focused')).toBe(true);

    // Now move cursor to the standalone line outside the block
    let outsidePos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'lyricLine' && node.attrs.id === 'outside_line') {
        outsidePos = pos + 1;
        return false;
      }
    });
    expect(outsidePos).toBeGreaterThan(0);
    const { tr: tr2 } = editor.state;
    editor.view.dispatch(tr2.setSelection(TextSelection.near(editor.state.doc.resolve(outsidePos))));

    // Both classes should be gone
    const blockEl = el.querySelector('[data-type="concurrentBlock"]');
    expect(blockEl?.classList.contains('concurrent-block--focused')).toBe(false);
    const linesInBlock = Array.from(blockEl!.querySelectorAll('[data-type="lyricLine"]'));
    expect(linesInBlock.every(l => !l.classList.contains('lyric-line--active-row'))).toBe(true);
  });
});

// ─── T-13.17: stress-mark row-height equalisation ────────────────────────────

describe('T-13.17: stress marks in one column do not break row alignment', () => {
  let editor: Editor;
  let el: HTMLDivElement;

  afterEach(() => {
    editor.destroy();
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  it('stress-mark spans from col A are inside the concurrent-block element, enabling :has() CSS rule on col B', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    // Column A has text that will receive stress-mark decorations;
    // Column B has plain text with no stress marks.
    const doc = {
      type: 'doc',
      content: [{
        type: 'concurrentBlock',
        attrs: { id: 'cb_stress' },
        content: [
          {
            type: 'speakerColumn',
            attrs: { id: 'col_a', speakerName: 'A' },
            content: [{
              type: 'lyricLine',
              attrs: { id: 'la1', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
              content: [{ type: 'text', text: 'Amazing grace' }],
            }],
          },
          {
            type: 'speakerColumn',
            attrs: { id: 'col_b', speakerName: 'B' },
            content: [{
              type: 'lyricLine',
              attrs: { id: 'lb1', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
              content: [],
            }],
          },
        ],
      }],
    };

    editor = new Editor({
      ...getDraftEditorConfig({ content: doc, showStressMarks: true }),
      element: el,
    });

    const blockEl = el.querySelector('[data-type="concurrentBlock"]');
    expect(blockEl).not.toBeNull();

    // Col A's lyricLine must contain stress-mark spans so the CSS
    // .concurrent-block:has(.cyril-stress-mark) selector activates for col B too.
    const stressMarks = blockEl!.querySelectorAll('.cyril-stress-mark');
    expect(stressMarks.length).toBeGreaterThan(0);

    // The stress marks are descendants of the concurrent block — confirmed by the
    // querySelector scope above. This is the structural precondition for the
    // :has(.cyril-stress-mark) rule to apply to all lyricLines in the block.
    const colBLine = blockEl!.querySelector('[data-id="col_b"] [data-type="lyricLine"]');
    expect(colBLine).not.toBeNull();
    // Col B has no stress marks of its own — the CSS rule must handle it via the block selector
    expect(colBLine!.querySelectorAll('.cyril-stress-mark').length).toBe(0);
  });
});
