# Stage 9 Test Spec

**Tags:** `[CHORDS] [DISPLAY] [STAGE-9]`

## Scope
Chord lane for chord-enabled drafts.

## Required Test Files
- `tests/unit/editor/chord-commands.add-edit-move-remove.test.ts`
- `tests/integration/editor/chords.persistence-and-visibility.test.ts`
- `tests/integration/editor/chords.lyric-edit-safety.test.ts`
- `tests/e2e/chords.spec.ts`
- `tests/unit/chords/transpose.test.ts`
- `tests/integration/editor/chord-transpose-integration.test.ts`
- `tests/e2e/stage-9-transpose.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-9.01 | Add chord marker works | unit | `tests/unit/editor/chord-commands.add-edit-move-remove.test.ts` | [x] | [x] | |
| T-9.02 | Chord marker position is stored correctly | unit | `tests/unit/editor/chord-commands.add-edit-move-remove.test.ts` | [x] | [x] | |
| T-9.03 | Moving chord marker updates position correctly | unit | `tests/unit/editor/chord-commands.add-edit-move-remove.test.ts` | [x] | [x] | |
| T-9.04 | Chords persist through save/load | integration | `tests/integration/editor/chords.persistence-and-visibility.test.ts` | [x] | [x] | |
| T-9.05 | Chord visibility toggle hides without deleting data | integration | `tests/integration/editor/chords.persistence-and-visibility.test.ts` | [x] | [x] | |
| T-9.06 | Editing lyric text does not corrupt chord marker data unexpectedly | integration | `tests/integration/editor/chords.lyric-edit-safety.test.ts` | [x] | [x] | |
| T-9.07 | Chord workflow passes in UI | e2e | `tests/e2e/chords.spec.ts` | [x] | [ ] | e2e requires running app server |
| T-9.08 | Transposing up two semitones turns every `C` into `D` (etc.); transposing down wraps below C, and a full octave either way returns the original symbol | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25, §4.5 |
| T-9.09 | The chord quality survives the move, including a flat inside the quality (`Am7b5` → `Bm7b5`) — only the leading note is ever rewritten | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25. The case a naive string replace destroys |
| T-9.10 | Slash chords transpose both halves; text after a slash that is not a note is kept verbatim | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25 |
| T-9.11 | The writer's accidental idiom is preserved (a flat-spelled chord stays flat-spelled), and pasted unicode ♯/♭ are understood | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25. A sheet mixing Bb and A# reads as a mistake |
| T-9.12 | A symbol the transposer does not understand (`N.C.`, `%`, `tacet`, lowercase, empty) is returned **unchanged** | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25. Never mangle a writer's chord sheet to satisfy a parser |
| T-9.13 | Enharmonic edge spellings resolve correctly (`Cb`=B, `B#`=C, double flats); a non-note returns null | unit | `tests/unit/chords/transpose.test.ts` | [x] | [x] | C-25 |
| T-9.14 | Every chord in the draft moves, across plain lines and inside concurrent-block speaker columns | integration | `tests/integration/editor/chord-transpose-integration.test.ts` | [x] | [x] | C-25. A half-transposed duet is worse than useless |
| T-9.15 | The whole transpose is a single undo step, and does not fold into the typing that preceded it | integration | `tests/integration/editor/chord-transpose-integration.test.ts` | [x] | [x] | C-25. Same `closeHistory` reasoning as D-27 |
| T-9.16 | Transposing rewrites symbols only — chord ids and positions are untouched, and an unparseable symbol survives a draft-wide transpose | integration | `tests/integration/editor/chord-transpose-integration.test.ts` | [x] | [x] | C-25. This half of the item touches no schema |
| T-9.17 | A zero, non-integer, all-unparseable or chord-free transpose reports that nothing changed rather than dispatching an empty transaction | integration | `tests/integration/editor/chord-transpose-integration.test.ts` | [x] | [x] | C-25 |
| T-9.18 | Transposed symbols survive a save/load round trip | integration | `tests/integration/editor/chord-transpose-integration.test.ts` | [x] | [x] | C-25, §4.5 acceptance |
| E-9.24 | The transpose controls appear only in chord mode | e2e | `tests/e2e/stage-9-transpose.spec.ts` | [x] | [ ] | C-25 |
| E-9.25 | Transposing up two semitones turns C into D on the rendered page | e2e | `tests/e2e/stage-9-transpose.spec.ts` | [x] | [ ] | C-25 |
| E-9.26 | Transposing down works from the toolbar and one undo puts the song back without touching the lyric | e2e | `tests/e2e/stage-9-transpose.spec.ts` | [x] | [ ] | C-25 |

## Regression Requirements
- Stages 0–8 must remain passing
