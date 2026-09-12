# Stage 13 Test Spec

**Tags:** `[CONCURRENT] [METADATA] [EXPORT] [STAGE-13]`

## Scope
Concurrent speaker blocks: authoring, navigation, export (squash and side-by-side), save/load round-trip. Must not break any lyricLine, sectionBlock, alternates, or chord behavior.

## Required Test Files
- `tests/unit/editor/concurrent-block.test.ts`
- `tests/integration/editor/concurrent-block-integration.test.ts`
- `tests/e2e/stage-13-concurrent-speakers.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-13.01 | concurrentBlock node inserts with correct structure (2–4 columns, each with 1 lyricLine) | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.02 | speakerColumn stores speakerName attr correctly | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.03 | squashConcurrentBlock produces interleaved lines left-to-right per row | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.04 | squashConcurrentBlock skips empty cells (unequal column lengths) | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.05 | squashConcurrentBlock emits speaker labels when includeSpeakerLabels=true | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.06 | squashConcurrentBlock omits speaker labels when includeSpeakerLabels=false | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.07 | buildSideBySideConcurrentBlock returns correct column/line structure | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.08 | exportSelectors handles top-level concurrentBlock in squash mode | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.09 | exportSelectors handles concurrentBlock inside sectionBlock in squash mode | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.10 | markdownTransformer squashes concurrent sections without adding a header | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.11 | printRenderer renders concurrent blocks side-by-side when concurrentLayout=sideBySide | unit | `tests/unit/editor/concurrent-block.test.ts` | [x] | [x] | |
| T-13.12 | migration adds concurrentLayout default to legacy projects missing the field | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | |
| T-13.13 | concurrentBlock save/load round-trip preserves speakerName, lyricLine content, and attrs | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | |
| T-13.14 | chords on lyricLines inside a speakerColumn are preserved through save/load | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | |
| T-13.15 | concurrent block insert, navigate, and export workflow passes in UI | e2e | `tests/e2e/stage-13-concurrent-speakers.spec.ts` | [x] | [x] | |
| T-13.16a | row guides (concurrent-block--focused + lyric-line--active-row) appear when caret is inside a concurrent block | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | Enhancement E1 |
| T-13.16b | row guides disappear (both classes removed) when caret moves outside the concurrent block | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | Enhancement E1 |
| T-13.17 | stress-mark spans from one column are inside the concurrent-block element, enabling :has() CSS rule on columns without stress marks | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | Stress-mark row alignment bug fix |
| T-13.18 | Backspace at the start of the first column on an all-empty row deletes that row from every column | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | Recorded 2026-09-12: the tests existed and passed, but had no criterion row, so the ledger never counted them |
| T-13.19 | Backspace on the last remaining empty row removes the whole block, leaving a plain empty `lyricLine` in its place | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | As above |
| T-13.20 | Backspace does **not** delete a row when the first column still has content | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | As above |
| T-13.21 | `deleteConcurrentBlock` replaces the block with a plain `lyricLine` | integration | `tests/integration/editor/concurrent-block-integration.test.ts` | [x] | [x] | As above |

## Regression Requirements
- Stages 0–12 must remain passing
- Chord tests (Stage 9) must remain passing
- Alternate lyrics tests (Stage 8) must remain passing
- Export tests (Stage 11) must remain passing
