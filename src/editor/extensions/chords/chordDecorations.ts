/**
 * Chord decoration builder for Tiptap/ProseMirror.
 *
 * Each chord is placed as a widget decoration at its exact character offset
 * within the lyric line text. ProseMirror resolves the pixel position
 * automatically, so chord markers appear above the correct character
 * regardless of font metrics.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { ChordMarker } from '../../../domain/project/types';

/**
 * Create a DOM element for a chord marker widget.
 */
function createChordMarkerElement(chord: ChordMarker, lineId: string): HTMLElement {
  // Zero-width anchor — takes no horizontal space in the text flow
  const anchor = document.createElement('span');
  anchor.className = 'cyril-chord-anchor';
  anchor.setAttribute('contenteditable', 'false');

  // Visible pill — absolutely positioned above the anchor
  const pill = document.createElement('span');
  pill.className = 'cyril-chord-marker';
  pill.setAttribute('data-testid', 'chord-marker');
  pill.setAttribute('data-chord-id', chord.id);
  pill.setAttribute('data-line-id', lineId);
  pill.setAttribute('data-symbol', chord.symbol);
  pill.textContent = chord.symbol;

  anchor.appendChild(pill);
  return anchor;
}

/**
 * Build all chord decorations for a document.
 *
 * Each chord becomes a widget placed at `lineTextStart + charOffset`,
 * i.e. exactly at the character it was attached to.
 */
export function buildAllChordDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name !== 'lyricLine') return true;

    const meta = node.attrs.meta || { chords: [] };
    const chords: ChordMarker[] = meta.chords || [];
    if (chords.length === 0) return true;

    const lineId = node.attrs.id || 'unknown';
    const textLength = node.textContent.length;
    // pos + 1 = first content position inside the lyricLine node
    const textStart = pos + 1;

    chords.forEach(chord => {
      const offset = Math.max(0, Math.min(chord.position.charOffset, textLength));
      const widgetPos = textStart + offset;
      const element = createChordMarkerElement(chord, lineId);
      decorations.push(
        Decoration.widget(widgetPos, element, {
          side: -1, // render before the character at this position
          key: `chord-${chord.id}`,
        })
      );
    });

    return true;
  });

  return DecorationSet.create(doc, decorations);
}

/** @deprecated Use buildAllChordDecorations directly */
export function buildChordDecorations(
  _pos: number,
  _lineId: string,
  _chords: ChordMarker[],
  _textLength: number
): Decoration[] {
  return [];
}
