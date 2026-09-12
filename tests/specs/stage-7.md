# Stage 7 Test Spec

**Tags:** `[TOOLS] [RHYME] [DICTIONARY] [STAGE-7]`

## Scope
Tools sidebar and provider-backed lookup workflows.

## Required Test Files
- `tests/unit/tools/tool-provider-adapters.test.ts`
- `tests/integration/tools/tools-sidebar-integration.test.ts`
- `tests/e2e/stage-7-tools.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-7.01 | Tool provider adapter returns normalized rhyme results | unit | `tests/unit/tools/tool-provider-adapters.test.ts` | [ ] | [ ] | |
| T-7.02 | Tool provider adapter handles provider failure gracefully | unit | `tests/unit/tools/tool-provider-adapters.test.ts` | [ ] | [ ] | |
| T-7.03 | Tools pane renders in top-right panel | integration | `tests/integration/tools/tools-sidebar-integration.test.ts` | [ ] | [ ] | |
| ~~T-7.04~~ | **RETIRED** (ID cell struck so `scripts/feature-coverage.mjs` no longer requires a matching test). Was "Selected word populates tool search term" — the ⌖ "populate from selection" control it described never worked (D-24: `getSelectedText` was a stub returning `null`) and C-41 (§13.1) removes it outright, replacing the gesture with a double-click in the lyric. Superseded by `T-14.24` and `T-14.29` (`tests/specs/stage-14.md`). | integration | `tests/integration/tools/tools-sidebar-integration.test.ts` | [ ] | [ ] | Retired 2026-09-12, C-41 |
| T-7.05 | Switching tool modes works | integration | `tests/integration/tools/tools-sidebar-integration.test.ts` | [ ] | [ ] | |
| ~~T-7.06~~ | **RETIRED** (ID cell struck so `scripts/feature-coverage.mjs` no longer requires a matching test — see its "Match table rows that start with an ID cell" parsing). Was "Clicking result copies text to clipboard" — C-43 (§13.3) inverted this gesture by design: the primary click now collects, not copies. Superseded by `T-14.20` (`tests/specs/stage-14.md`), which carries the current copy-control behaviour forward under the same test file. | integration | `tests/integration/tools/tools-sidebar-integration.test.ts` | [ ] | [ ] | Retired 2026-08-29, C-43 |
| T-7.07 | Provider failure does not crash editor | integration | `tests/integration/tools/tools-sidebar-integration.test.ts` | [ ] | [ ] | |
| T-7.08 | Tools workflow passes in UI | e2e | `tests/e2e/stage-7-tools.spec.ts` | [ ] | [ ] | |
| T-7.09 | Every declared `ToolMode` has a provider that supports it — no mode may be declared that nothing can answer | unit | `tests/unit/tools/tool-provider-adapters.test.ts` | [x] | [x] | C-49. Guards the class of defect `'idioms'` was: a type documenting a feature that did not exist |
| T-7.10 | The "Related" tab asks Datamuse for semantically related words (`rel_trg`), not sounds-like (`sl`) | unit | `tests/unit/tools/tool-provider-adapters.test.ts` | [x] | [x] | C-49. The tab promised meaning and returned rhyme, beside two tabs that already do rhyme |

## Regression Requirements
- Stages 0–6 must remain passing
