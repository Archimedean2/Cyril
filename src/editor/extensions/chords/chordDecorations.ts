/**
 * Chord decoration builder for Tiptap/ProseMirror.
 * 
 * Creates widget decorations for chord markers above lyric lines.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { ChordMarker } from '../../../domain/project/types';

/**
 * Calculate horizontal position for a chord marker based on character offset.
 * 
 * This is an approximation using character offset ratio.
 * For v1, we use a simple monospace-ish approximation.
 */
function calculateChordPosition(charOffset: number, textLength: number): string {
  if (textLength === 0) return '0px';
  const ratio = charOffset / textLength;
  // Clamp ratio to 0-1
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  // Convert to percentage
  return `${clampedRatio * 100}%`;
}

/**
 * Create a DOM element for a chord marker.
 */
function createChordMarkerElement(chord: ChordMarker, lineId: string): HTMLElement {
  const element = document.createElement('span');
  element.className = 'cyril-chord-marker';
  element.setAttribute('data-testid', 'chord-marker');
  element.setAttribute('data-chord-id', chord.id);
  element.setAttribute('data-line-id', lineId);
  element.textContent = chord.symbol;
  return element;
}

/**
 * Build decorations for chord markers on a lyric line.
 * 
 * @param pos - Position of the lyric line node in the document
 * @param lineId - ID of the lyric line
 * @param chords - Array of chord markers for this line
 * @param textLength - Length of the lyric line text
 * @returns Array of decorations
 */
export function buildChordDecorations(
  pos: number,
  lineId: string,
  chords: ChordMarker[],
  textLength: number
): Decoration[] {
  if (chords.length === 0) return [];

  // Create a container for the chord lane
  const container = document.createElement('div');
  container.className = 'cyril-chord-lane';
  container.setAttribute('data-testid', 'chord-lane');
  container.setAttribute('data-line-id', lineId);

  // Add chord markers to the container
  chords.forEach(chord => {
    const marker = createChordMarkerElement(chord, lineId);
    const leftPosition = calculateChordPosition(chord.position.charOffset, textLength);
    marker.style.left = leftPosition;
    container.appendChild(marker);
  });

  // Create a widget decoration for the chord lane
  // Position it at the start of the lyric line
  const decoration = Decoration.widget(pos, container, {
    side: -1, // Place before the line
  });

  return [decoration];
}

/**
 * Build all chord decorations for a document.
 * 
 * @param doc - ProseMirror document
 * @returns DecorationSet with all chord decorations
 */
export function buildAllChordDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'lyricLine') {
      const meta = node.attrs.meta || { chords: [] };
      const chords = meta.chords || [];
      
      if (chords.length > 0) {
        // Get the text length of this line
        const textLength = node.textContent.length;
        const lineId = node.attrs.id || 'unknown';
        
        const lineDecorations = buildChordDecorations(pos, lineId, chords, textLength);
        decorations.push(...lineDecorations);
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}
