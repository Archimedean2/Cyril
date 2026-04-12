# Stage 8 Test Spec

**Tags:** `[ALTERNATES] [STAGE-8]`

## Scope
Line-level alternate lyrics.

## Required Test Files
- `tests/unit/editor/alternates-commands.test.ts`
- `tests/integration/editor/alternates-integration.test.ts`
- `tests/e2e/stage-8-alternates.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-8.01 | Add alternate to lyric line works | unit | `tests/unit/editor/alternates-commands.test.ts` | [ ] | [ ] | |
| T-8.02 | Activating alternate updates active line content correctly | unit | `tests/unit/editor/alternates-commands.test.ts` | [ ] | [ ] | |
| T-8.03 | Removing alternate preserves active content correctly | unit | `tests/unit/editor/alternates-commands.test.ts` | [ ] | [ ] | |
| T-8.04 | Alternates persist through save/load | integration | `tests/integration/editor/alternates-integration.test.ts` | [ ] | [ ] | |
| T-8.05 | Editor displays only active line text in main draft | integration | `tests/integration/editor/alternates-integration.test.ts` | [ ] | [ ] | |
| T-8.06 | Alternate switching is undoable | integration | `tests/integration/editor/alternates-integration.test.ts` | [ ] | [ ] | |
| T-8.07 | Alternates workflow passes in UI | e2e | `tests/e2e/stage-8-alternates.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–7 must remain passing