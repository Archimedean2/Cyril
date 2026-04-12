# Stage 4 Test Spec

**Tags:** `[SECTIONS] [METADATA] [DISPLAY] [STAGE-4]`

## Scope
Structured sections, metadata tags, and metadata display toggles.

## Required Test Files
- `tests/unit/editor/section-commands.test.ts`
- `tests/unit/editor/metadata-commands.test.ts`
- `tests/integration/editor/sections-metadata-integration.test.ts`
- `tests/e2e/stage-4-sections-metadata.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-4.01 | Insert section block works | unit | `tests/unit/editor/section-commands.test.ts` | [ ] | [ ] | |
| T-4.02 | Reorder section preserves content and metadata | unit | `tests/unit/editor/section-commands.test.ts` | [ ] | [ ] | |
| T-4.03 | Duplicate section generates required new IDs | unit | `tests/unit/editor/section-commands.test.ts` | [ ] | [ ] | |
| T-4.04 | Insert speaker label works | unit | `tests/unit/editor/metadata-commands.test.ts` | [ ] | [ ] | |
| T-4.05 | Insert stage direction works | unit | `tests/unit/editor/metadata-commands.test.ts` | [ ] | [ ] | |
| T-4.06 | Spoken/sung state persists on lyric line | unit | `tests/unit/editor/metadata-commands.test.ts` | [ ] | [ ] | |
| T-4.07 | Section data survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [ ] | [ ] | |
| T-4.08 | Metadata survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [ ] | [ ] | |
| T-4.09 | Hiding metadata changes visibility only, not content | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [ ] | [ ] | |
| T-4.10 | Section/metadata workflow passes in UI | e2e | `tests/e2e/stage-4-sections-metadata.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–3 must remain passing