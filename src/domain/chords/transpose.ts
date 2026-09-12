/**
 * C-25 / `docs/product/DESIGN_PROPOSAL.md` §4.5 — transposing a draft's chords.
 *
 * Transposing rewrites chord *symbols* and nothing else: no position, no anchor, no schema.
 * That is why this half of C-25 ships before the file-format work — it is pure string
 * rewriting over data Cyril already stores.
 *
 * The governing rule here is **never mangle what you do not understand.** A chord field is
 * free text a writer typed; it may hold `N.C.` (no chord), a slash chord, a repeat mark, a
 * note to themselves, or a symbol using a convention this parser has never seen. Anything
 * this module cannot confidently parse is returned untouched. A transpose that silently
 * corrupted a chord sheet would be far worse than one that left a few symbols alone, and the
 * writer can see and fix what did not move.
 */

/** Semitone offsets from C for every spelling of a natural note. */
const NATURALS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Sharp spellings, indexed by pitch class. */
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
/** Flat spellings, indexed by pitch class. */
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * A note name: a letter A–G, then any run of sharps/flats. Accepts the unicode ♯/♭ a writer
 * may paste from a songbook as well as the typed `#`/`b`.
 */
const NOTE_RE = /^([A-G])([#b♯♭]*)/;

/** How a symbol spells its accidentals, so a transposed symbol stays in the same idiom. */
export type AccidentalStyle = 'sharp' | 'flat';

/** The pitch class (0–11) of a note name, or `null` if it is not one. */
export function pitchClassOf(note: string): number | null {
  const match = NOTE_RE.exec(note);
  if (!match || match[0].length !== note.length) return null;

  const [, letter, accidentals] = match;
  let value = NATURALS[letter];
  for (const char of accidentals) {
    value += char === '#' || char === '♯' ? 1 : -1;
  }
  // Deliberately wraps: Cb is B, B# is C. Writers do use both.
  return ((value % 12) + 12) % 12;
}

/**
 * Which accidental idiom a symbol is written in. A symbol containing a flat is spelled with
 * flats; everything else with sharps. Preserving the writer's own idiom matters more than
 * being theoretically correct about the destination key: a sheet that suddenly mixes `Bb`
 * and `A#` reads as a mistake, and Cyril is not trying to be a notation program (`SCOPE.md`).
 */
export function accidentalStyleOf(symbol: string): AccidentalStyle {
  return /[b♭]/.test(symbol) ? 'flat' : 'sharp';
}

/** Spell a pitch class in the given idiom. */
function spell(pitchClass: number, style: AccidentalStyle): string {
  return (style === 'flat' ? FLAT_NAMES : SHARP_NAMES)[pitchClass];
}

/**
 * Transpose one chord symbol by `semitones`, preserving its quality and its slash bass.
 *
 * Returns the symbol **unchanged** when it does not begin with a note name — `N.C.`, `%`,
 * an empty field, or anything else this parser does not recognise.
 *
 *   transposeChordSymbol('C', 2)        → 'D'
 *   transposeChordSymbol('Am7', 2)      → 'Bm7'
 *   transposeChordSymbol('F#m/A', -1)   → 'Fm/G#'
 *   transposeChordSymbol('Bb', 2)       → 'C'      (flat idiom preserved where it applies)
 *   transposeChordSymbol('N.C.', 2)     → 'N.C.'   (untouched)
 */
export function transposeChordSymbol(symbol: string, semitones: number): string {
  const trimmed = symbol.trim();
  if (!trimmed) return symbol;

  const style = accidentalStyleOf(trimmed);
  // A slash chord transposes both halves; only the first is required to parse.
  const slash = trimmed.indexOf('/');
  const head = slash === -1 ? trimmed : trimmed.slice(0, slash);
  const bass = slash === -1 ? null : trimmed.slice(slash + 1);

  const shiftedHead = shiftNoteAtStart(head, semitones, style);
  if (shiftedHead === null) return symbol; // not a chord we understand — leave it alone

  if (bass === null) return shiftedHead;

  const shiftedBass = shiftNoteAtStart(bass, semitones, style);
  // A slash with something unparseable after it (`C/rest of the bar`) keeps that text as-is
  // rather than losing it.
  return `${shiftedHead}/${shiftedBass ?? bass}`;
}

/**
 * Replace the note name at the start of `text`, keeping everything after it verbatim —
 * that trailing run is the chord quality (`m7b5`, `sus4`, `maj9`) and must survive untouched,
 * including any `b` inside it, which is why only the leading note is ever rewritten.
 */
function shiftNoteAtStart(text: string, semitones: number, style: AccidentalStyle): string | null {
  const match = NOTE_RE.exec(text);
  if (!match) return null;

  const noteName = match[0];
  const pitchClass = pitchClassOf(noteName);
  if (pitchClass === null) return null;

  const shifted = (((pitchClass + semitones) % 12) + 12) % 12;
  return spell(shifted, style) + text.slice(noteName.length);
}
