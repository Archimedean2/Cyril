# Stage 15 Test Spec — Phase 3 Feel Layer

**Tags:** `[FEEL] [UX] [SHORTCUTS] [STAGE-15]`

## Scope
Focus mode, empty draft placeholder, error boundary coverage, draft-switching keyboard shortcuts, command menu.

## Required Test Files
- `tests/integration/ui/focus-mode.test.tsx`
- `tests/integration/ui/empty-draft-placeholder.test.tsx`
- `tests/integration/ui/error-boundary-coverage.test.tsx`
- `tests/integration/ui/draft-switching-shortcuts.test.tsx`
- `tests/integration/ui/command-menu.test.tsx`
- `tests/e2e/journey-write-a-song.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-15.01 | Focus mode button in TopBar toggles both rails hidden/visible | integration | `tests/integration/ui/focus-mode.test.tsx` | [x] | [x] | |
| T-15.02 | Cmd+\ keyboard shortcut toggles focus mode | integration | `tests/integration/ui/focus-mode.test.tsx` | [x] | [x] | |
| T-15.03 | Empty draft shows placeholder text in the editor | integration | `tests/integration/ui/empty-draft-placeholder.test.tsx` | [x] | [x] | |
| T-15.04 | LeftNav panel is wrapped in an ErrorBoundary | integration | `tests/integration/ui/error-boundary-coverage.test.tsx` | [x] | [x] | |
| T-15.05 | Root app shell is wrapped in an ErrorBoundary | integration | `tests/integration/ui/error-boundary-coverage.test.tsx` | [x] | [x] | |
| T-15.06 | Cmd+[ switches to the previous draft | integration | `tests/integration/ui/draft-switching-shortcuts.test.tsx` | [x] | [x] | |
| T-15.07 | Cmd+] switches to the next draft | integration | `tests/integration/ui/draft-switching-shortcuts.test.tsx` | [x] | [x] | |
| T-15.08 | Cmd+K opens the command menu | integration | `tests/integration/ui/command-menu.test.tsx` | [x] | [x] | |
| T-15.09 | Command menu lists available keyboard shortcuts and closes on Escape | integration | `tests/integration/ui/command-menu.test.tsx` | [x] | [x] | |
| T-15.10 | End-to-end "write a song" journey: section → speaker → lyric lines → syllables → stress marks → tools search (mocked) → collect → chords → draft switch (no bleed) → print preview contains the lyrics | e2e | `tests/e2e/journey-write-a-song.spec.ts` | [x] | [x] | Exercises the transitions between features per docs/testing/TESTING.md §"Catching the bugs this suite keeps missing" |

## Regression Requirements
- Stages 0–14 must remain passing
- Existing Cmd+S and Cmd+Shift+E shortcuts must still work
