import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { collectPaintablePositions } from '../../../src/editor/core/gutterPaint';

/**
 * C-36 (§12.2) — `collectPaintablePositions`, shared by the gutter's own
 * drag/click collection and its `Mod-Shift-A` keyboard equivalent. Testing
 * it directly against a bare `Editor`'s `state.doc`/selection is more
 * reliable than driving a real keyboard/pointer flow through jsdom (see
 * `tests/integration/editor/speaker-gutter-integration.test.tsx` for the
 * full pointer-drag path, which mocks layout rects for exactly this
 * reason).
 */
describe('C-36: collectPaintablePositions (the keyboard-equivalent selection scan)', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  test('T-4.57: a collapsed caret on one line collects just that line', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'one' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'two' }] },
        ],
      },
    }));

    editor.commands.setTextSelection(2); // inside the first line
    const { from, to } = editor.state.selection;
    const positions = collectPaintablePositions(editor.state.doc, from, to);
    expect(positions).toEqual([0]);
  });

  test('T-4.57: a selection spanning several lines collects every one of them, skipping a stage direction in between', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'one' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'stageDirection' }, content: [{ type: 'text', text: '(pause)' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'lyric' }, content: [{ type: 'text', text: 'three' }] },
        ],
      },
    }));

    const doc = editor.state.doc;
    let l1Pos = -1;
    let l3Pos = -1;
    doc.descendants((node, pos) => {
      if (node.attrs?.id === 'l1') l1Pos = pos;
      if (node.attrs?.id === 'l3') l3Pos = pos;
    });

    editor.commands.setTextSelection({ from: 1, to: doc.content.size - 1 }); // spans all three lines
    const { from, to } = editor.state.selection;
    const positions = collectPaintablePositions(doc, from, to);
    expect(positions.sort((a, b) => a - b)).toEqual([l1Pos, l3Pos]); // the stage direction is excluded
  });

  test('T-4.58: a selection spanning a section header only collects the lyric lines, not the header itself', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'before' }] },
          {
            type: 'sectionBlock',
            attrs: { id: 'sec1', sectionType: 'verse', label: 'Verse 1' },
            content: [
              { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'inside section' }] },
            ],
          },
        ],
      },
    }));

    const doc = editor.state.doc;
    let l1Pos = -1;
    let l2Pos = -1;
    doc.descendants((node, pos) => {
      if (node.attrs?.id === 'l1') l1Pos = pos;
      if (node.attrs?.id === 'l2') l2Pos = pos;
    });

    const positions = collectPaintablePositions(doc, 0, doc.content.size);
    expect(positions.sort((a, b) => a - b)).toEqual([l1Pos, l2Pos].sort((a, b) => a - b));
    // The section header node itself never appears in the collected list —
    // there's no such thing as "painting" a header.
  });

  test('a selection touching a concurrent block collects nothing from inside it (out of scope for the gutter)', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [{
          type: 'concurrentBlock',
          attrs: { id: 'cb1' },
          content: [
            { type: 'speakerColumn', attrs: { id: 'col1', speakerName: 'A' }, content: [{ type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [] }] },
            { type: 'speakerColumn', attrs: { id: 'col2', speakerName: 'B' }, content: [{ type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [] }] },
          ],
        }],
      },
    }));

    const doc = editor.state.doc;
    const positions = collectPaintablePositions(doc, 0, doc.content.size);
    expect(positions).toEqual([]);
  });
});
