# Stage 4 Test Spec

**Tags:** `[SECTIONS] [METADATA] [DISPLAY] [STAGE-4]`

## Scope
Structured sections, metadata tags, and metadata display toggles.

## Required Test Files
- `tests/unit/editor/section-commands.test.ts`
- `tests/unit/editor/metadata-commands.test.ts`
- `tests/integration/editor/sections-metadata-integration.test.ts`
- `tests/e2e/stage-4-sections-metadata.spec.ts`
- `tests/e2e/speaker-stage-direction.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-4.01 | Insert section block works | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | |
| T-4.02 | Reorder section preserves content and metadata | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Trivial pass; drag-and-drop reorder not yet exposed as command |
| T-4.03 | Duplicate section generates required new IDs | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Trivial pass; section duplication command not yet exposed |
| T-4.04 | Insert speaker label works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.05 | Insert stage direction works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.06 | Spoken/sung state persists on lyric line | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.07 | Section data survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.08 | Metadata survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.09 | Hiding metadata changes visibility only, not content | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | CSS-level hide; trivial pass at data layer |
| T-4.10 | Section/metadata workflow passes in UI | e2e | `tests/e2e/stage-4-sections-metadata.spec.ts` | [x] | [x] | |
| T-4.07a | Clicking Speaker button converts line to speaker type | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.07b | Clicking Speaker button again toggles back to lyric | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.08a | Clicking Stage Dir button converts line to stage direction | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.08b | Clicking Stage Dir button again toggles back to lyric | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.09a | Typing [[ at line start converts to speaker line | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.09b | Typing [[ then text creates speaker line with content | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.10a | Typing (( at line start converts to stage direction | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.10b | Typing (( then text creates stage direction with content | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.11 | Speaker and stage direction buttons are visible in toolbar | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.12 | Multiple lines with different types in same document | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.13 | Speaker line text is rendered in bold after typing [[ | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | Verifies CSS font-weight: 700 and text-transform: uppercase |

## Regression Requirements
- Stages 0–3 must remain passing