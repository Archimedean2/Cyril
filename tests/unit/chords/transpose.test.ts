import { describe, test, expect } from 'vitest';
import {
  transposeChordSymbol,
  pitchClassOf,
  accidentalStyleOf,
} from '../../../src/domain/chords/transpose';

/**
 * C-25 / DESIGN_PROPOSAL.md §4.5 — transposing chord symbols.
 *
 * The chord field is free text a writer typed, so the tests that matter most here are the
 * ones asserting what is NOT changed. A transpose that quietly corrupted a chord sheet is a
 * far worse defect than one that leaves an unusual symbol alone.
 */
describe('C-25: transposeChordSymbol', () => {
  test('T-9.08: transposing up two semitones turns every C into D', () => {
    expect(transposeChordSymbol('C', 2)).toBe('D');
    expect(transposeChordSymbol('D', 2)).toBe('E');
    expect(transposeChordSymbol('E', 2)).toBe('F#');
    expect(transposeChordSymbol('F', 2)).toBe('G');
    expect(transposeChordSymbol('G', 2)).toBe('A');
    expect(transposeChordSymbol('A', 2)).toBe('B');
    expect(transposeChordSymbol('B', 2)).toBe('C#');
  });

  test('T-9.08: transposing down works and wraps below C', () => {
    expect(transposeChordSymbol('C', -1)).toBe('B');
    expect(transposeChordSymbol('C', -2)).toBe('A#');
    expect(transposeChordSymbol('A', -3)).toBe('F#');
  });

  test('T-9.08: a full octave in either direction returns the same chord', () => {
    for (const symbol of ['C', 'F#m7', 'Bbmaj9', 'Dsus4/A']) {
      expect(transposeChordSymbol(symbol, 12)).toBe(symbol);
      expect(transposeChordSymbol(symbol, -12)).toBe(symbol);
    }
  });

  test('T-9.09: the chord quality survives untouched', () => {
    expect(transposeChordSymbol('Am7', 2)).toBe('Bm7');
    expect(transposeChordSymbol('Cmaj9', 2)).toBe('Dmaj9');
    expect(transposeChordSymbol('Gsus4', 2)).toBe('Asus4');
    expect(transposeChordSymbol('Ddim7', 2)).toBe('Edim7');
    expect(transposeChordSymbol('F+', 2)).toBe('G+');
  });

  test('T-9.09: a flat INSIDE the quality is not mistaken for the root accidental', () => {
    // The `b5` is part of the quality. Only the leading note may ever be rewritten —
    // this is the case that a naive string replace of "b" would destroy.
    expect(transposeChordSymbol('Am7b5', 2)).toBe('Bm7b5');
    expect(transposeChordSymbol('C7b9', 2)).toBe('D7b9');
  });

  test('T-9.10: slash chords transpose both halves', () => {
    expect(transposeChordSymbol('C/G', 2)).toBe('D/A');
    expect(transposeChordSymbol('F#m/A', -1)).toBe('Fm/G#');
    expect(transposeChordSymbol('Am7/G', 3)).toBe('Cm7/A#');
  });

  test('T-9.10: text after a slash that is not a note is kept verbatim', () => {
    // Writers do put things there. Losing it would be data loss.
    expect(transposeChordSymbol('C/let it ring', 2)).toBe('D/let it ring');
  });

  test('T-9.11: the writer\'s accidental idiom is preserved', () => {
    // A sheet that suddenly mixes Bb and A# reads as a mistake.
    expect(transposeChordSymbol('Bb', 2)).toBe('C');
    expect(transposeChordSymbol('Bb', 1)).toBe('B');
    expect(transposeChordSymbol('Eb', 1)).toBe('E');
    expect(transposeChordSymbol('Ab', -1)).toBe('G');
    // A flat-spelled chord stays flat-spelled when the result needs an accidental.
    expect(transposeChordSymbol('Bbm', 3)).toBe('Dbm');
    // A sharp-spelled one stays sharp.
    expect(transposeChordSymbol('F#', 1)).toBe('G');
    expect(transposeChordSymbol('C', 1)).toBe('C#');
  });

  test('T-9.11: unicode ♯ and ♭ pasted from a songbook are understood', () => {
    expect(transposeChordSymbol('B♭', 2)).toBe('C');
    expect(transposeChordSymbol('F♯m', 1)).toBe('Gm');
  });

  test('T-9.12: a symbol the parser does not understand is returned UNCHANGED', () => {
    // The rule that protects a writer's sheet from a transposer that guesses.
    for (const symbol of ['N.C.', '%', '?', 'tacet', '—', 'x2', '(hold)', 'Hm']) {
      expect(transposeChordSymbol(symbol, 2)).toBe(symbol);
    }
  });

  test('T-9.12: empty and whitespace-only symbols are returned unchanged', () => {
    expect(transposeChordSymbol('', 2)).toBe('');
    expect(transposeChordSymbol('   ', 2)).toBe('   ');
  });

  test('T-9.12: lowercase note letters are left alone rather than guessed at', () => {
    // `am` might mean A minor, or might be a word. Not worth corrupting a sheet to find out.
    expect(transposeChordSymbol('am', 2)).toBe('am');
  });

  test('T-9.13: enharmonic edge spellings resolve correctly', () => {
    expect(pitchClassOf('Cb')).toBe(11); // Cb is B
    expect(pitchClassOf('B#')).toBe(0);  // B# is C
    expect(pitchClassOf('E#')).toBe(5);
    expect(pitchClassOf('Fb')).toBe(4);
    expect(pitchClassOf('Bbb')).toBe(9); // double flat
    expect(pitchClassOf('H')).toBeNull();
    expect(pitchClassOf('Cm')).toBeNull(); // a chord, not a note name
  });

  test('T-9.13: accidental style is read from the symbol', () => {
    expect(accidentalStyleOf('Bb')).toBe('flat');
    expect(accidentalStyleOf('B♭m7')).toBe('flat');
    expect(accidentalStyleOf('F#')).toBe('sharp');
    expect(accidentalStyleOf('C')).toBe('sharp');
  });
});
