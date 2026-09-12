import { ChordMarker, ChordPosition, CharChordPosition, SlotChordPosition } from '../project/types';

/**
 * C-25 / §4.4 — narrowing helpers for the `ChordPosition` union.
 *
 * `ChordPosition` became a discriminated union so that a chord in a wordless measure can
 * hold an ordered slot instead of a character offset. Every place that used to read
 * `position.charOffset` blindly now has to say which kind it means, and these are the words
 * for it. Keeping them in one module means the answer to "is this chord over a letter?" has
 * exactly one definition.
 */

/**
 * Only an explicit `'slot'` is a slot. Everything else — including data that omits
 * `anchorType` entirely — is a chord over a letter.
 *
 * The asymmetry is deliberate and load-bearing. `'slot'` is the value C-25 introduced, so
 * anything written before C-25 cannot carry it; treating "not slot" as "char" means every
 * older file, and every hand-built fixture that never bothered with the discriminant, keeps
 * its offsets. Testing `anchorType === 'char'` instead silently zeroes them — caught by the
 * chordSheet golden file, which is exactly what C-34 built it to catch.
 */
export function isSlotAnchored(position: ChordPosition): position is SlotChordPosition {
  return position.anchorType === 'slot';
}

export function isCharAnchored(position: ChordPosition): position is CharChordPosition {
  return !isSlotAnchored(position);
}

/**
 * The character offset of a chord, or `null` when it is not anchored to a character.
 * Callers must handle the `null` — that is the point of returning it rather than a 0, which
 * would silently pile every wordless chord onto the first letter of the line.
 */
export function charOffsetOf(position: ChordPosition): number | null {
  if (isSlotAnchored(position)) return null;
  // `?? 0` covers a legacy position that names no offset at all; a chord with nothing to say
  // about where it sits belongs at the start of the line, not nowhere.
  return position.charOffset ?? 0;
}

/**
 * Split a line's chords into the ones sitting over letters and the ordered run that follows
 * the text. Both come back sorted the way they are read: anchored chords left to right by
 * offset, the run left to right by slot.
 *
 * Every renderer and exporter needs exactly this split, and getting the ordering wrong is
 * how a chord sheet stops being playable — so it is computed once, here.
 */
export function splitChords(chords: readonly ChordMarker[]): {
  anchored: ChordMarker[];
  run: ChordMarker[];
} {
  const anchored: ChordMarker[] = [];
  const run: ChordMarker[] = [];

  for (const chord of chords) {
    (isSlotAnchored(chord.position) ? run : anchored).push(chord);
  }

  anchored.sort((a, b) => (charOffsetOf(a.position) ?? 0) - (charOffsetOf(b.position) ?? 0));
  run.sort((a, b) => slotIndexOf(a) - slotIndexOf(b));

  return { anchored, run };
}

/** The slot a chord occupies, or -1 if it is not slot-anchored. */
export function slotIndexOf(chord: ChordMarker): number {
  return isSlotAnchored(chord.position) ? chord.position.slotIndex : -1;
}

/** The next free slot on a line — one past the highest slot already used. */
export function nextSlotIndex(chords: readonly ChordMarker[]): number {
  let highest = -1;
  for (const chord of chords) {
    if (isSlotAnchored(chord.position)) highest = Math.max(highest, chord.position.slotIndex);
  }
  return highest + 1;
}
