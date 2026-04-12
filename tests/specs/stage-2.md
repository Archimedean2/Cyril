# Stage 2 Test Spec

**Tags:** `[EDITOR] [UNDO] [STAGE-2]`

## Scope
Rich text editor foundation.

## Required Test Files
- `tests/unit/editor/editor-schema.test.ts`
- `tests/unit/editor/formatting-commands.test.ts`
- `tests/integration/editor/editor-foundation-integration.test.ts`
- `tests/e2e/stage-2-editor.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-2.01 | Base editor schema supports paragraph and text nodes | unit | `tests/unit/editor/editor-schema.test.ts` | [ ] | [ ] | |
| T-2.02 | Bold command applies and removes mark correctly | unit | `tests/unit/editor/formatting-commands.test.ts` | [ ] | [ ] | |
| T-2.03 | Italic command applies and removes mark correctly | unit | `tests/unit/editor/formatting-commands.test.ts` | [ ] | [ ] | |
| T-2.04 | Indentation command updates document as expected | unit | `tests/unit/editor/formatting-commands.test.ts` | [ ] | [ ] | |
| T-2.05 | Editor loads saved content correctly | integration | `tests/integration/editor/editor-foundation-integration.test.ts` | [ ] | [ ] | |
| T-2.06 | Copy/paste plain text works | integration | `tests/integration/editor/editor-foundation-integration.test.ts` | [ ] | [ ] | |
| T-2.07 | Copy/paste formatted text works without corruption | integration | `tests/integration/editor/editor-foundation-integration.test.ts` | [ ] | [ ] | |
| T-2.08 | Undo/redo restores expected editor states | integration | `tests/integration/editor/editor-foundation-integration.test.ts` | [ ] | [ ] | |
| T-2.09 | Editor formatting survives save/load | integration | `tests/integration/editor/editor-foundation-integration.test.ts` | [ ] | [ ] | |
| T-2.10 | Editor smoke flow passes in UI | e2e | `tests/e2e/stage-2-editor.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stage 0 tests must remain passing
- Stage 1 tests must remain passing