# Stage 10 Test Spec

**Tags:** `[EXPORT] [PRINT] [STAGE-10]`

## Scope
Markdown export and print/PDF pipeline.

## Required Test Files
- `tests/unit/export/markdown-export.test.ts`
- `tests/unit/export/print-renderer.test.ts`
- `tests/integration/export/export-integration.test.ts`
- `tests/e2e/stage-10-export.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-10.01 | Markdown export includes active lyric content only | unit | `tests/unit/export/markdown-export.test.ts` | [ ] | [ ] | |
| T-10.02 | Markdown export respects metadata include/exclude settings | unit | `tests/unit/export/markdown-export.test.ts` | [ ] | [ ] | |
| T-10.03 | Print renderer includes chord data when requested | unit | `tests/unit/export/print-renderer.test.ts` | [ ] | [ ] | |
| T-10.04 | Print renderer excludes hidden export elements correctly | unit | `tests/unit/export/print-renderer.test.ts` | [ ] | [ ] | |
| T-10.05 | Export flow reads canonical project data rather than live DOM state | integration | `tests/integration/export/export-integration.test.ts` | [ ] | [ ] | |
| T-10.06 | Export settings persist and are applied correctly | integration | `tests/integration/export/export-integration.test.ts` | [ ] | [ ] | |
| T-10.07 | Export workflow passes in UI | e2e | `tests/e2e/stage-10-export.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–9 must remain passing