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

## Regression Requirements
- Stages 0–12 must remain passing
- Chord tests (Stage 9) must remain passing
- Alternate lyrics tests (Stage 8) must remain passing
- Export tests (Stage 11) must remain passing
