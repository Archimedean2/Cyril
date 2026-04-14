# Stage 9 Test Spec

**Tags:** `[CHORDS] [DISPLAY] [STAGE-9]`

## Scope
Chord lane for chord-enabled drafts.

## Required Test Files
- `tests/unit/editor/chord-commands.add-edit-move-remove.test.ts`
- `tests/integration/editor/chords.persistence-and-visibility.test.ts`
- `tests/integration/editor/chords.lyric-edit-safety.test.ts`
- `tests/e2e/chords.spec.ts`

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

## Regression Requirements
- Stages 0–8 must remain passing