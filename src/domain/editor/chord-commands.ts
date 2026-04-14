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

interface LyricLineInfo {
  node: ProseMirrorNode;
  pos: number;
  attrs: LyricLineNode;
  meta: LyricLineMeta;
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
 * Sort chord markers by character offset.
 */
function sortChords(chords: ChordMarker[]): ChordMarker[] {
  return [...chords].sort((a, b) => a.position.charOffset - b.position.charOffset);
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
  
  const newChord = createChordMarker(symbol, finalOffset, bias);
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
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  
  const chordIndex = meta.chords.findIndex(c => c.id === chordId);
  if (chordIndex === -1) return false;
  
  const updatedChords = meta.chords.map((chord, idx) => {
    if (idx === chordIndex) {
      return {
        ...chord,
        symbol: newSymbol,
      };
    }
    return chord;
  });
  
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
  const newOffset = clampOffset(chord.position.charOffset + delta, lineLength);
  
  const updatedChords = meta.chords.map((c, idx) => {
    if (idx === chordIndex) {
      return {
        ...c,
        position: {
          ...c.position,
          charOffset: newOffset,
        },
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
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  
  const updatedChords = meta.chords.filter(c => c.id !== chordId);
  
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
