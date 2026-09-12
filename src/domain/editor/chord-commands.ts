/**
 * Chord marker commands for Tiptap editor.
 * 
 * Provides commands to add, edit, move, and remove chord markers
 * for lyric lines in chord-enabled drafts.
 */

import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ChordMarker, LyricLineNode, LyricLineMeta } from '../project/types';
import { generateId } from '../project/ids';
import { closeHistory } from '@tiptap/pm/history';
import { transposeChordSymbol } from '../chords/transpose';
import { splitChords, charOffsetOf, isCharAnchored, nextSlotIndex } from '../chords/position';

interface LyricLineInfo {
  node: ProseMirrorNode;
  pos: number;
  attrs: LyricLineNode;
  meta: LyricLineMeta;
}

/**
 * Find a lyric line anywhere in the doc that contains the given chord ID.
 */
function findLineByChordId(editor: Editor, chordId: string): LyricLineInfo | null {
  let result: LyricLineInfo | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'lyricLine') {
      const attrs = node.attrs as unknown as LyricLineNode;
      if (attrs.meta?.chords?.some((c: ChordMarker) => c.id === chordId)) {
        result = { node, pos, attrs, meta: attrs.meta };
        return false;
      }
    }
    return true;
  });
  return result;
}

/**
 * Get the lyric line node at the current selection.
 */
export function getLyricLineAtSelection(editor: Editor): LyricLineInfo | null {
  const { state } = editor;
  const { selection } = state;
  
  let result: LyricLineInfo | null = null;
  
  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'lyricLine') {
      const attrs = node.attrs as unknown as LyricLineNode;
      result = {
        node,
        pos,
        attrs,
        meta: attrs.meta,
      };
      return false; // Stop traversing
    }
    return true;
  });
  
  return result;
}

/**
 * Get the plain text length of the lyric line at current selection.
 */
function getLineTextLength(editor: Editor): number {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return 0;
  
  const { node, pos } = lineInfo;
  const text = editor.state.doc.textBetween(
    pos + 1,
    pos + node.nodeSize - 1,
    '\n'
  );
  
  return text.length;
}

/**
 * Clamp a character offset to valid range for the current line.
 */
function clampOffset(offset: number, max: number): number {
  return Math.max(0, Math.min(offset, max));
}

/**
 * Create a new chord marker.
 */
function createChordMarker(symbol: string, charOffset: number, bias: 'before' | 'on' | 'after' = 'on'): ChordMarker {
  return {
    id: generateId('chord'),
    symbol,
    position: {
      anchorType: 'char',
      charOffset,
      bias,
    },
  };
}

/**
 * Sort chord markers into reading order: chords over letters first, left to right, then the
 * trailing run in slot order (C-25 §4.4). A slot chord has no offset to compare, so the two
 * groups are ordered separately and concatenated rather than sorted together.
 */
function sortChords(chords: ChordMarker[]): ChordMarker[] {
  const { anchored, run } = splitChords(chords);
  return [...anchored, ...run];
}

/**
 * Command: Add a chord to the current lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @param symbol - Chord symbol (e.g., "A", "D", "Em")
 * @param charOffset - Optional character offset. Defaults to current cursor position.
 * @param bias - Position bias (before, on, after). Defaults to "on".
 * @returns true if successful, false otherwise
 */
export function addChordToCurrentLine(
  editor: Editor,
  symbol: string,
  charOffset?: number,
  bias: 'before' | 'on' | 'after' = 'on'
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  const lineLength = getLineTextLength(editor);
  
  // If no offset provided, use current cursor position relative to line start
  let finalOffset = charOffset;
  if (finalOffset === undefined) {
    const { selection } = editor.state;
    const relativePos = selection.from - lineInfo.pos - 1; // Adjust for node boundaries
    finalOffset = clampOffset(relativePos, lineLength);
  } else {
    finalOffset = clampOffset(finalOffset, lineLength);
  }

  const newChord = wantsWordlessMeasure(meta.chords, finalOffset, lineLength)
    ? createRunChordMarker(symbol, nextSlotIndex(meta.chords))
    : createChordMarker(symbol, finalOffset, bias);
  const updatedChords = sortChords([...meta.chords, newChord]);
  
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        chords: updatedChords,
      }
    })
    .run();
}

/**
 * Does this chord belong in a wordless measure rather than over a letter? (C-25 §4.4)
 *
 * Two situations, and the rule is written so that neither can be reached by accident:
 *
 * - **An empty line.** There are no letters, so every chord on it is part of an instrumental
 *   line. Without this, a second chord on an empty line lands at offset 0 on top of the
 *   first — which is what the app did before C-25.
 * - **Repeating at the end of a line that already has a chord there.** §4.4 describes the
 *   gesture as "press the chord shortcut repeatedly with the caret at line end — each press
 *   drops the next chord to the right". The FIRST press at line end still anchors to the
 *   last character, because that is the ordinary way to put a chord on the final word and
 *   changing it would break a gesture writers already use. Only the presses after it, when
 *   that end position is taken, start a trailing run.
 */
function wantsWordlessMeasure(
  existing: ChordMarker[],
  offset: number,
  lineLength: number
): boolean {
  if (lineLength === 0) return true;
  if (offset < lineLength) return false;
  return existing.some(
    (chord) => isCharAnchored(chord.position) && (charOffsetOf(chord.position) ?? 0) >= lineLength
  );
}

/** A chord in a wordless measure: it holds an ordered slot, not a character offset. */
function createRunChordMarker(symbol: string, slotIndex: number): ChordMarker {
  return {
    id: generateId('chord'),
    symbol,
    position: { anchorType: 'slot', slotIndex },
  };
}

/**
 * Command: Edit a chord symbol on the current lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @param chordId - ID of chord to edit
 * @param newSymbol - New chord symbol
 * @returns true if successful, false otherwise
 */
export function editChordOnCurrentLine(
  editor: Editor,
  chordId: string,
  newSymbol: string
): boolean {
  // Re-find the lyricLine directly so we can use setNodeMarkup at the exact
  // position — updateAttributes('lyricLine') applies to the cursor position,
  // which may not be inside the target lyricLine when a chord pill was clicked.
  const lineInfo = findLineByChordId(editor, chordId);
  if (!lineInfo) return false;

  const { meta, node, pos } = lineInfo;
  const chordIndex = meta.chords.findIndex(c => c.id === chordId);
  if (chordIndex === -1) return false;

  const updatedChords = meta.chords.map((chord, idx) =>
    idx === chordIndex ? { ...chord, symbol: newSymbol } : chord
  );

  const { tr } = editor.state;
  tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    meta: { ...meta, chords: updatedChords },
  });
  editor.view.dispatch(tr);
  return true;
}

/**
 * Command: Move a chord on the current lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @param chordId - ID of chord to move
 * @param delta - Character offset delta (positive for right, negative for left)
 * @returns true if successful, false otherwise
 */
export function moveChordOnCurrentLine(
  editor: Editor,
  chordId: string,
  delta: number
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  const lineLength = getLineTextLength(editor);
  
  const chordIndex = meta.chords.findIndex(c => c.id === chordId);
  if (chordIndex === -1) return false;
  
  const chord = meta.chords[chordIndex];
  // Moving is a character-offset gesture. A chord in a wordless measure has no character to
  // move along, and its place in the run is set by its slot — nudging it left would be
  // meaningless, so the command refuses rather than inventing an offset for it (C-25 §4.4).
  const currentOffset = charOffsetOf(chord.position);
  if (currentOffset === null) return false;
  const newOffset = clampOffset(currentOffset + delta, lineLength);
  
  const updatedChords = meta.chords.map((c, idx) => {
    if (idx === chordIndex) {
      return {
        ...c,
        position: { anchorType: 'char' as const, charOffset: newOffset, bias: 'on' as const },
      };
    }
    return c;
  });
  
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        chords: sortChords(updatedChords),
      }
    })
    .run();
}

/**
 * Command: Remove a chord from the current lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @param chordId - ID of chord to remove
 * @returns true if successful, false otherwise
 */
export function removeChordFromCurrentLine(
  editor: Editor,
  chordId: string
): boolean {
  const lineInfo = findLineByChordId(editor, chordId);
  if (!lineInfo) return false;

  const { meta, node, pos } = lineInfo;
  const updatedChords = meta.chords.filter(c => c.id !== chordId);

  const { tr } = editor.state;
  tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    meta: { ...meta, chords: updatedChords },
  });
  editor.view.dispatch(tr);
  return true;
}

/**
 * Get all chords for the current lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @returns Array of chord markers, or empty array if not in a lyric line
 */
export function getChordsForCurrentLine(editor: Editor): ChordMarker[] {
  const lineInfo = getLyricLineAtSelection(editor);
  return lineInfo?.meta.chords || [];
}

/**
 * Check if the current selection is in a lyric line.
 * 
 * @param editor - Tiptap editor instance
 * @returns true if in a lyric line, false otherwise
 */
export function isInLyricLine(editor: Editor): boolean {
  return getLyricLineAtSelection(editor) !== null;
}

/**
 * Check if chords can be edited based on draft mode and visibility.
 * 
 * @param draftMode - Current draft mode
 * @param showChords - Current show chords setting
 * @returns true if chords can be edited, false otherwise
 */
export function canEditChords(draftMode: string, showChords: boolean): boolean {
  return draftMode === 'lyricsWithChords' && showChords;
}

/**
 * Command: transpose every chord in the draft by `semitones`
 * (C-25 / `docs/product/DESIGN_PROPOSAL.md` §4.5).
 *
 * Walks the whole document, so chords inside concurrent-block speaker columns move with
 * everything else — a transposed sheet with one untransposed duet column would be worse
 * than useless.
 *
 * Every line is rewritten in ONE transaction, which makes the whole transpose a single undo
 * step: a writer who transposes a forty-line song and changes their mind presses Cmd+Z once,
 * not forty times. `closeHistory` starts a fresh undo event first, for the same reason the
 * Inventory insert does (D-27): a transpose is a discrete act and must not fold into whatever
 * the writer was typing half a second earlier.
 *
 * Symbols the transposer does not understand are left exactly as they are — see
 * `src/domain/chords/transpose.ts`.
 *
 * @returns true if any chord actually changed.
 */
export function transposeDraftChords(editor: Editor, semitones: number): boolean {
  if (!Number.isInteger(semitones) || semitones === 0) return false;

  const edits: { pos: number; node: ProseMirrorNode; chords: ChordMarker[] }[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== 'lyricLine') return true;
    const meta = (node.attrs as unknown as LyricLineNode).meta;
    const chords = meta?.chords;
    if (!chords?.length) return true;

    const transposed = chords.map((chord) => ({
      ...chord,
      symbol: transposeChordSymbol(chord.symbol, semitones),
    }));

    // Skip a line whose symbols all came back identical (e.g. a line holding only `N.C.`),
    // so the transaction carries no no-op steps.
    if (transposed.every((chord, i) => chord.symbol === chords[i].symbol)) return true;

    edits.push({ pos, node, chords: transposed });
    return true;
  });

  if (edits.length === 0) return false;

  const { tr } = editor.state;
  closeHistory(tr);
  for (const edit of edits) {
    const meta = (edit.node.attrs as unknown as LyricLineNode).meta;
    tr.setNodeMarkup(edit.pos, undefined, {
      ...edit.node.attrs,
      meta: { ...meta, chords: edit.chords },
    });
  }
  editor.view.dispatch(tr);
  return true;
}
