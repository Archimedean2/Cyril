# Stage 11 Test Spec

**Tags:** `[EXPORT] [PRINT] [STAGE-11]`

## Scope
Markdown export and print/PDF pipeline.

## Required Test Files
- `tests/unit/export/markdown-export.test.ts`
- `tests/unit/export/print-renderer.test.ts`
- `tests/integration/export/export-integration.test.ts`
- `tests/e2e/stage-11-export.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-11.01 | Markdown export includes active lyric content only | unit | `tests/unit/export/markdown-export.test.ts` | [ ] | [ ] | |
| T-11.02 | Markdown export respects metadata include/exclude settings | unit | `tests/unit/export/markdown-export.test.ts` | [ ] | [ ] | |
| T-11.03 | Print renderer includes chord data when requested | unit | `tests/unit/export/print-renderer.test.ts` | [ ] | [ ] | |
| T-11.04 | Print renderer excludes hidden export elements correctly | unit | `tests/unit/export/print-renderer.test.ts` | [ ] | [ ] | |
| T-11.05 | Export flow reads canonical project data rather than live DOM state | integration | `tests/integration/export/export-integration.test.ts` | [ ] | [ ] | |
| T-11.06 | Export settings persist and are applied correctly | integration | `tests/integration/export/export-integration.test.ts` | [ ] | [ ] | |
| T-11.07 | Export workflow passes in UI | e2e | `tests/e2e/stage-11-export.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–10 must remain passing