/**
 * Chord decoration builder for Tiptap/ProseMirror.
 *
 * Each chord is placed as a widget decoration at its exact character offset
 * within the lyric line text. ProseMirror resolves the pixel position
 * automatically, so chord markers appear above the correct character
 * regardless of font metrics.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
import { ChordMarker } from '../../../domain/project/types';
import { splitChords, charOffsetOf } from '../../../domain/chords/position';

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
 * Build the run of chords that belong to a wordless measure (C-25 §4.4).
 *
 * The whole run is ONE widget holding a row of pills, not one widget per chord. Several
 * widgets at the same document position would stack on top of each other — there is no
 * character between them to separate them — whereas a single flex row spaces them evenly,
 * which is exactly what both cases want: a trailing fill spread across the empty space after
 * the last word, and an instrumental line spread across the whole line.
 */
function createChordRunElement(chords: ChordMarker[], lineId: string, isInstrumental: boolean): HTMLElement {
  const anchor = document.createElement('span');
  anchor.className = 'cyril-chord-anchor cyril-chord-run-anchor';
  anchor.setAttribute('contenteditable', 'false');

  const row = document.createElement('span');
  row.className = isInstrumental ? 'cyril-chord-run cyril-chord-run-instrumental' : 'cyril-chord-run';
  row.setAttribute('data-testid', 'chord-run');
  row.setAttribute('data-line-id', lineId);

  for (const chord of chords) {
    const pill = document.createElement('span');
    pill.className = 'cyril-chord-marker';
    pill.setAttribute('data-testid', 'chord-marker');
    pill.setAttribute('data-chord-id', chord.id);
    pill.setAttribute('data-line-id', lineId);
    pill.setAttribute('data-symbol', chord.symbol);
    pill.textContent = chord.symbol;
    row.appendChild(pill);
  }

  anchor.appendChild(row);
  return anchor;
}

/**
 * Build all chord decorations for a document.
 *
 * A chord over a letter becomes a widget at `lineTextStart + charOffset`. Chords in a
 * wordless measure have no letter to sit above, so they render as one run at the end of the
 * line's text — after the last word for a trailing fill, across the line for an instrumental.
 */
export function buildAllChordDecorations(doc: Node): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: Node, pos: number) => {
    if (node.type.name !== 'lyricLine') return true;

    const meta = node.attrs.meta || { chords: [] };
    const chords: ChordMarker[] = meta.chords || [];
    if (chords.length === 0) return true;

    const lineId = node.attrs.id || 'unknown';
    const textLength = node.textContent.length;
    // pos + 1 = first content position inside the lyricLine node
    const textStart = pos + 1;

    const { anchored, run } = splitChords(chords);

    anchored.forEach(chord => {
      // Clamped for RENDER SAFETY only: a widget position outside the line would throw, and
      // an offset can outlive the text it pointed at (delete the last word and its chord's
      // offset is now past the end). The clamp never touches the stored offset — the chord
      // keeps its place and comes back if the text does. Wordless measures are no longer
      // expressed as an offset past the end, so this clamp can no longer swallow one (C-25).
      const offset = Math.max(0, Math.min(charOffsetOf(chord.position) ?? 0, textLength));
      const widgetPos = textStart + offset;
      const element = createChordMarkerElement(chord, lineId);
      decorations.push(
        Decoration.widget(widgetPos, element, {
          side: -1, // render before the character at this position
          key: `chord-${chord.id}`,
        })
      );
    });

    if (run.length > 0) {
      // An empty line holding only chords IS the instrumental line (§4.4): same data,
      // different presentation, told apart by whether there are words to sit after.
      const element = createChordRunElement(run, lineId, textLength === 0);
      decorations.push(
        Decoration.widget(textStart + textLength, element, {
          side: 1, // after the last character, in the empty space
          key: `chord-run-${lineId}-${run.map(c => c.id).join('-')}`,
        })
      );
    }

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
