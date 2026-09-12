import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { addChordToCurrentLine, getChordsForCurrentLine, moveChordOnCurrentLine } from '../../../src/domain/editor/chord-commands';
import { buildAllChordDecorations } from '../../../src/editor/extensions/chords/chordDecorations';
import { isSlotAnchored, charOffsetOf, splitChords, nextSlotIndex } from '../../../src/domain/chords/position';
import { toExportableChords } from '../../../src/domain/export/exportTypes';
import { ChordMarker } from '../../../src/domain/project/types';

/**
 * C-25 / DESIGN_PROPOSAL.md §4.4 — chords in wordless measures.
 *
 * A trailing run (chords after the last word) and an instrumental line (chords with no words
 * at all) are the same stored thing — an ordered slot rather than a character offset — told
 * apart by whether the line has text.
 */
describe('C-25: wordless measures', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function editorWith(text: string, chords: ChordMarker[] = []) {
    return new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [{
          type: 'lyricLine',
          attrs: { id: 'l1', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords } },
          content: text ? [{ type: 'text', text }] : [],
        }],
      },
    }));
  }

  const chordsOf = (ed: Editor) => (ed.state.doc.firstChild!.attrs.meta.chords ?? []) as ChordMarker[];

  test('T-9.19: every chord on an empty line becomes an instrumental-line chord', () => {
    editor = editorWith('');

    addChordToCurrentLine(editor, 'C');
    addChordToCurrentLine(editor, 'Am');
    addChordToCurrentLine(editor, 'F');

    const chords = chordsOf(editor);
    expect(chords).toHaveLength(3);
    expect(chords.every((c) => isSlotAnchored(c.position))).toBe(true);
    // Ordered left to right. Before C-25 all three landed at offset 0, on top of each other.
    expect(chords.map((c) => (c.position as { slotIndex: number }).slotIndex)).toEqual([0, 1, 2]);
    expect(chords.map((c) => c.symbol)).toEqual(['C', 'Am', 'F']);
  });

  test('T-9.20: the first chord at line end still anchors to the last character', () => {
    editor = editorWith('nothing left');
    editor.commands.setTextSelection(1 + 12); // caret at the very end

    addChordToCurrentLine(editor, 'C');

    const [chord] = chordsOf(editor);
    // The ordinary way to put a chord on the final word must keep working.
    expect(isSlotAnchored(chord.position)).toBe(false);
    expect(charOffsetOf(chord.position)).toBe(12);
  });

  test('T-9.20: pressing again at line end starts a trailing run', () => {
    editor = editorWith('nothing left');
    editor.commands.setTextSelection(1 + 12);

    addChordToCurrentLine(editor, 'C');   // anchors to the last character
    addChordToCurrentLine(editor, 'Am');  // …each further press drops the next chord right
    addChordToCurrentLine(editor, 'F');

    const { anchored, run } = splitChords(chordsOf(editor));
    expect(anchored.map((c) => c.symbol)).toEqual(['C']);
    expect(run.map((c) => c.symbol)).toEqual(['Am', 'F']);
    expect(run.map((c) => (c.position as { slotIndex: number }).slotIndex)).toEqual([0, 1]);
  });

  test('T-9.20: a chord added mid-line is unaffected by any trailing run', () => {
    editor = editorWith('nothing left');
    editor.commands.setTextSelection(1 + 12);
    addChordToCurrentLine(editor, 'C');
    addChordToCurrentLine(editor, 'Am'); // run starts

    editor.commands.setTextSelection(1 + 4);
    addChordToCurrentLine(editor, 'G');

    const { anchored, run } = splitChords(chordsOf(editor));
    expect(anchored.map((c) => [c.symbol, charOffsetOf(c.position)])).toEqual([['G', 4], ['C', 12]]);
    expect(run.map((c) => c.symbol)).toEqual(['Am']);
  });

  test('T-9.21: a run chord cannot be nudged along a line it does not sit on', () => {
    editor = editorWith('');
    addChordToCurrentLine(editor, 'C');
    const [chord] = chordsOf(editor);

    // Moving is a character-offset gesture; refusing is honest, inventing an offset is not.
    expect(moveChordOnCurrentLine(editor, chord.id, 2)).toBe(false);
    expect(isSlotAnchored(chordsOf(editor)[0].position)).toBe(true);
  });

  test('T-9.22: a run renders as one decoration, not one stacked per chord', () => {
    editor = editorWith('nothing left', [
      { id: 'c1', symbol: 'C', position: { anchorType: 'char', charOffset: 0, bias: 'on' } },
      { id: 'c2', symbol: 'Am', position: { anchorType: 'slot', slotIndex: 0 } },
      { id: 'c3', symbol: 'F', position: { anchorType: 'slot', slotIndex: 1 } },
    ]);

    const decorations = buildAllChordDecorations(editor.state.doc).find();
    // One widget for the anchored chord, one for the whole run — three widgets at the same
    // end-of-line position would render on top of each other.
    expect(decorations).toHaveLength(2);
  });

  test('T-9.23: export puts the run after the text, in slot order', () => {
    const chords: ChordMarker[] = [
      { id: 'c3', symbol: 'F', position: { anchorType: 'slot', slotIndex: 1 } },
      { id: 'c1', symbol: 'C', position: { anchorType: 'char', charOffset: 8, bias: 'on' } },
      { id: 'c2', symbol: 'Am', position: { anchorType: 'slot', slotIndex: 0 } },
      { id: 'c0', symbol: 'G', position: { anchorType: 'char', charOffset: 0, bias: 'on' } },
    ];

    // Deliberately stored out of order: reading order is the exporter's job, not the file's.
    expect(toExportableChords(chords)).toEqual([
      { symbol: 'G', offset: 0 },
      { symbol: 'C', offset: 8 },
      { symbol: 'Am', offset: 0, slotIndex: 0 },
      { symbol: 'F', offset: 0, slotIndex: 1 },
    ]);
  });

  test('T-9.24: a legacy chord position with no anchorType keeps its offset', () => {
    // Files written before C-25 have no discriminant. Treating "not slot" as "char" is what
    // keeps them intact; testing `anchorType === "char"` instead would zero every offset.
    const legacy = { charOffset: 7, bias: 'on' } as unknown as ChordMarker['position'];
    expect(charOffsetOf(legacy)).toBe(7);
    expect(isSlotAnchored(legacy)).toBe(false);

    expect(toExportableChords([{ id: 'c1', symbol: 'D', position: legacy }]))
      .toEqual([{ symbol: 'D', offset: 7 }]);
  });

  test('T-9.24: slots continue from the highest used, never colliding', () => {
    expect(nextSlotIndex([])).toBe(0);
    expect(nextSlotIndex([
      { id: 'a', symbol: 'C', position: { anchorType: 'slot', slotIndex: 0 } },
      { id: 'b', symbol: 'F', position: { anchorType: 'slot', slotIndex: 3 } },
      { id: 'c', symbol: 'G', position: { anchorType: 'char', charOffset: 2, bias: 'on' } },
    ])).toBe(4);
  });

  test('T-9.25: wordless chords survive a save/load round trip', () => {
    editor = editorWith('');
    addChordToCurrentLine(editor, 'C');
    addChordToCurrentLine(editor, 'Am');

    const saved = JSON.parse(JSON.stringify(editor.getJSON()));
    editor.destroy();

    editor = new Editor(getDraftEditorConfig({ content: saved }));
    const reloaded = chordsOf(editor);
    expect(reloaded.map((c) => c.symbol)).toEqual(['C', 'Am']);
    expect(reloaded.every((c) => isSlotAnchored(c.position))).toBe(true);
    // And they are not clamped back onto the (empty) text — the defect §4.4 exists to fix.
    expect(getChordsForCurrentLine(editor)).toHaveLength(2);
  });
});
