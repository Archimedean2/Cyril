import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { transposeDraftChords } from '../../../src/domain/editor/chord-commands';
import { ChordMarker } from '../../../src/domain/project/types';

/**
 * C-25 / DESIGN_PROPOSAL.md §4.5 — transposing a whole draft.
 *
 * The symbol grammar is covered in `tests/unit/chords/transpose.test.ts`; this is about the
 * document walk: every chord in the draft moves, including chords inside concurrent-block
 * speaker columns, and the whole thing is one undo step.
 */
describe('C-25: transposeDraftChords', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  const chord = (id: string, symbol: string, charOffset: number): ChordMarker => ({
    id,
    symbol,
    position: { anchorType: 'char', charOffset, bias: 'before' },
  });

  function lyricLine(id: string, text: string, chords: ChordMarker[]) {
    return {
      type: 'lyricLine',
      attrs: { id, rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords } },
      content: text ? [{ type: 'text', text }] : [],
    };
  }

  /** Every chord symbol in the document, in document order. */
  function symbols(ed: Editor): string[] {
    const found: string[] = [];
    ed.state.doc.descendants((node) => {
      if (node.type.name === 'lyricLine') {
        for (const c of (node.attrs.meta?.chords ?? []) as ChordMarker[]) found.push(c.symbol);
      }
      return true;
    });
    return found;
  }

  test('T-9.14: every chord in the draft moves, across plain lines and concurrent blocks', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          lyricLine('l1', 'nothing left to lose', [chord('c1', 'C', 0), chord('c2', 'Am7', 8)]),
          {
            type: 'concurrentBlock',
            attrs: { id: 'cb1' },
            content: [
              {
                type: 'speakerColumn',
                attrs: { id: 'col_a', speakerName: 'ANNA' },
                content: [lyricLine('l2', 'we sing together', [chord('c3', 'F', 0)])],
              },
              {
                type: 'speakerColumn',
                attrs: { id: 'col_b', speakerName: 'BEN' },
                content: [lyricLine('l3', 'at the very same time', [chord('c4', 'G7', 0)])],
              },
            ],
          },
        ],
      },
    }));

    expect(symbols(editor)).toEqual(['C', 'Am7', 'F', 'G7']);

    expect(transposeDraftChords(editor, 2)).toBe(true);

    // A transposed sheet with one untransposed duet column would be worse than useless.
    expect(symbols(editor)).toEqual(['D', 'Bm7', 'G', 'A7']);
  });

  test('T-9.15: the whole transpose is a single undo step', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          lyricLine('l1', 'line one', [chord('c1', 'C', 0)]),
          lyricLine('l2', 'line two', [chord('c2', 'F', 0)]),
          lyricLine('l3', 'line three', [chord('c3', 'G', 0)]),
        ],
      },
    }));

    transposeDraftChords(editor, 2);
    expect(symbols(editor)).toEqual(['D', 'G', 'A']);

    // One Cmd+Z, not one per line.
    editor.commands.undo();
    expect(symbols(editor)).toEqual(['C', 'F', 'G']);
  });

  test('T-9.15: a transpose does not fold into the typing that preceded it', () => {
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'nothing', [chord('c1', 'C', 0)])] },
    }));

    editor.commands.setTextSelection(1 + 7);
    editor.commands.insertContent(' left');
    expect(editor.getText()).toBe('nothing left');

    transposeDraftChords(editor, 2);
    expect(symbols(editor)).toEqual(['D']);

    // Undo takes back the transpose and ONLY the transpose — the typed text stays (D-27).
    editor.commands.undo();
    expect(symbols(editor)).toEqual(['C']);
    expect(editor.getText()).toBe('nothing left');
  });

  test('T-9.16: chord positions are untouched — transposing rewrites symbols only', () => {
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'nothing left', [chord('c1', 'C', 0), chord('c2', 'G', 8)])] },
    }));

    const before = (editor.state.doc.firstChild!.attrs.meta.chords as ChordMarker[])
      .map((c) => ({ id: c.id, position: c.position }));

    transposeDraftChords(editor, 5);

    const after = (editor.state.doc.firstChild!.attrs.meta.chords as ChordMarker[])
      .map((c) => ({ id: c.id, position: c.position }));

    // No anchor, no offset, no id changes: this half of C-25 touches no schema at all.
    expect(after).toEqual(before);
  });

  test('T-9.16: a symbol the transposer does not understand survives a draft transpose', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [lyricLine('l1', 'instrumental break', [chord('c1', 'N.C.', 0), chord('c2', 'C', 5)])],
      },
    }));

    transposeDraftChords(editor, 2);
    expect(symbols(editor)).toEqual(['N.C.', 'D']);
  });

  test('T-9.17: a no-op transpose reports that nothing changed', () => {
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'nothing', [chord('c1', 'C', 0)])] },
    }));

    // Zero semitones, and a non-integer, are refused rather than dispatching an empty change.
    expect(transposeDraftChords(editor, 0)).toBe(false);
    expect(transposeDraftChords(editor, 0.5)).toBe(false);

    // A draft whose only chord cannot be transposed reports false too, so a UI can stay honest.
    editor.destroy();
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'break', [chord('c1', 'N.C.', 0)])] },
    }));
    expect(transposeDraftChords(editor, 2)).toBe(false);
  });

  test('T-9.18: transposed symbols survive a save/load round trip', () => {
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'nothing left', [chord('c1', 'C', 0), chord('c2', 'Am7', 8)])] },
    }));

    transposeDraftChords(editor, 2);

    // `editor.getJSON()` is exactly what DraftView hands the store and what ends up in the
    // .cyril file, so serialising it and loading it back is the save/load path for this data.
    const saved = JSON.parse(JSON.stringify(editor.getJSON()));
    editor.destroy();

    editor = new Editor(getDraftEditorConfig({ content: saved }));
    expect(symbols(editor)).toEqual(['D', 'Bm7']);
  });

  test('T-9.17: a draft with no chords at all is a safe no-op', () => {
    editor = new Editor(getDraftEditorConfig({
      content: { type: 'doc', content: [lyricLine('l1', 'just words', [])] },
    }));

    expect(transposeDraftChords(editor, 2)).toBe(false);
    expect(editor.getText()).toBe('just words');
  });
});
