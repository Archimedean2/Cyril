# Stage 11 Test Spec

**Tags:** `[EXPORT] [PRINT] [STAGE-11]`

## Scope
Markdown export and print/PDF pipeline, including the four named print profiles (C-22 /
DESIGN_PROPOSAL §7): Lyric sheet, Chord sheet, Script / libretto, Annotated.

## Required Test Files
- `tests/unit/export/markdown-export.test.ts`
- `tests/unit/export/print-renderer.test.ts`
- `tests/unit/export/print-profiles.test.ts`
- `tests/integration/export/export-integration.test.ts`
- `tests/e2e/stage-11-export.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-11.01 | Markdown export includes active lyric content only | unit | `tests/unit/export/markdown-export.test.ts` | [x] | [x] | |
| T-11.02 | Markdown export respects metadata include/exclude settings | unit | `tests/unit/export/markdown-export.test.ts` | [x] | [x] | |
| T-11.03 | Print renderer includes chord data when requested | unit | `tests/unit/export/print-renderer.test.ts` | [x] | [x] | |
| T-11.04 | Print renderer excludes hidden export elements correctly | unit | `tests/unit/export/print-renderer.test.ts` | [x] | [x] | |
| T-11.05 | Export flow reads canonical project data rather than live DOM state | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | |
| T-11.06 | Export settings persist and are applied correctly | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | |
| T-11.07 | Export workflow passes in UI | e2e | `tests/e2e/stage-11-export.spec.ts` | [x] | [x] | |
| T-11.08 | Lyric sheet profile omits chords, speaker labels, and stage directions (section labels stay optional) | unit | `tests/unit/export/print-profiles.test.ts` | [x] | [x] | |
| T-11.09 | Chord sheet profile always shows chords + section labels, in a mono chord font | unit | `tests/unit/export/print-profiles.test.ts`, `tests/unit/export/print-renderer.test.ts` | [x] | [x] | |
| T-11.10 | Libretto profile renders speakers + stage directions in theatre format; lyric sheet omits stage directions | unit | `tests/unit/export/print-profiles.test.ts`, `tests/unit/export/print-renderer.test.ts` | [x] | [x] | |
| T-11.11 | Annotated profile shows alternates and section notes in the margin | unit | `tests/unit/export/print-profiles.test.ts`, `tests/unit/export/print-renderer.test.ts` | [x] | [x] | |
| T-11.12 | Chosen print profile and options survive save/load | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | JSON round-trip through `validateCyrilFile` |
| T-11.13 | Export dialog can build a preview for each profile before printing (no print window opened) | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | |
| T-11.14 | Export dialog offers four named print profiles with a live preview, and the choice persists | e2e | `tests/e2e/stage-11-export.spec.ts` | [x] | [x] | |
| T-11.15 | Printing an empty draft renders a valid, non-crashing document for every profile | unit + integration | `tests/unit/export/print-renderer.test.ts`, `tests/integration/export/export-integration.test.ts` | [x] | [x] | EDGE_CASES §11 |
| T-11.16 | Concurrent block squash order is left-to-right per row in print output | unit | `tests/unit/export/print-renderer.test.ts` | [x] | [x] | EDGE_CASES §11 |
| T-11.17 | Only the active alternate is exported in the main line; other alternates surface only in the Annotated profile margin | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | EDGE_CASES §11 |
| T-11.18 | Printing is independent of the editor's view toggles (`draftSettings`) — only `ExportSettings` governs output | integration | `tests/integration/export/export-integration.test.ts` | [x] | [x] | EDGE_CASES §11 |

## Regression Requirements
- Stages 0–10 must remain passing