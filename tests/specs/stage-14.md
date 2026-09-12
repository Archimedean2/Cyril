# Stage 14 Test Spec — Quality-of-Life Pass

**Tags:** `[QOL] [UI] [STAGE-14]`

## Scope
Quality-of-life improvements to the UI: remove duplicate draft header, toggle switches
for view controls, consolidated chords control, organised project action toolbar, and
click-to-edit identity in the top bar.

## Required Test Files
- `tests/integration/ui/qol-draft-header.test.tsx`
- `tests/integration/ui/qol-view-toggles.test.tsx`
- `tests/integration/ui/qol-chords-reconcile.test.tsx`
- `tests/integration/ui/qol-project-actions.test.tsx`
- `tests/integration/ui/qol-topbar-inline-edit.test.tsx`
- `tests/integration/ui/qol-single-title.test.tsx`
- `tests/integration/ui/qol-editor-page.test.tsx`
- `tests/integration/ui/qol-view-toggles-grouped.test.tsx`
- `tests/integration/inventory/inventory-chips.test.tsx`
- `tests/integration/tools/tools-filter-chips-and-collect.test.tsx`
- `tests/unit/editor/word-lookup.test.ts`
- `tests/integration/tools/tools-lookup-request.test.tsx`
- `tests/e2e/stage-14-lookup.spec.ts`
- `tests/integration/inventory/inventory-chip-insert.test.tsx`
- `tests/e2e/stage-14-chip-insert.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-14.01 | Draft name appears only in the top bar, not as a separate header below it | integration | `tests/integration/ui/qol-draft-header.test.tsx` | [ ] | [ ] | |
| T-14.02 | View toggles are on/off switches with keyboard focus; state persists per draft | integration | `tests/integration/ui/qol-view-toggles.test.tsx` | [ ] | [ ] | |
| T-14.03 | Exactly one Chords control: enabling it enters chord mode, disabling it exits without data loss | integration | `tests/integration/ui/qol-chords-reconcile.test.tsx` | [ ] | [ ] | |
| T-14.04 | Project actions are in the top bar on one row; primary actions one click, secondary in overflow menu | integration | `tests/integration/ui/qol-project-actions.test.tsx` | [ ] | [ ] | |
| T-14.05 | Song title and draft name in the top bar are click-to-edit; Enter/blur commits, Escape cancels | integration | `tests/integration/ui/qol-topbar-inline-edit.test.tsx` | [ ] | [ ] | |
| T-14.06 | The song title renders exactly once in the chrome (top bar); the left nav leads with Project/Drafts/View instead of a repeated title, with no leftover gap | integration | `tests/integration/ui/qol-single-title.test.tsx` | [ ] | [ ] | C-16 |
| T-14.07 | The editor page reads as a page: measure-constrained lyric column centred within it, a defined border/elevation edge distinct from the shell, a deliberate gap below the toolbar, and the grain overlay preserved | integration | `tests/integration/ui/qol-editor-page.test.tsx` | [ ] | [ ] | C-12 |
| T-14.08 | The six View toggles are grouped under quiet Structure/Sound sub-labels instead of a flat checklist; each toggle still works and keeps keyboard focus, and state persists per draft | integration | `tests/integration/ui/qol-view-toggles-grouped.test.tsx` | [ ] | [ ] | C-15 |
| T-14.09 | Inventory has no native textarea/resize grabber; collected items render as chips | integration | `tests/integration/inventory/inventory-chips.test.tsx` | [ ] | [ ] | C-11 |
| T-14.10 | Adding an item via the Inventory add-input persists it to the draft inventory (and blank/whitespace submissions are ignored) | integration | `tests/integration/inventory/inventory-chips.test.tsx` | [ ] | [ ] | C-11 |
| T-14.11 | Removing an Inventory chip persists the removal to the draft inventory | integration | `tests/integration/inventory/inventory-chips.test.tsx` | [ ] | [ ] | C-11 |
| T-14.12 | An empty Inventory shows an inviting, sentence-case, verb-first empty state | integration | `tests/integration/inventory/inventory-chips.test.tsx` | [ ] | [ ] | C-11 |
| T-14.13 | Existing multi-line legacy Inventory text loads with its content intact as chips | integration | `tests/integration/inventory/inventory-chips.test.tsx` | [ ] | [ ] | C-11 |
| T-14.14 | Rhyme filter chips (Perfect/Close/Wide) are wired to the existing rhyme-exact/rhyme-near modes (no new mode/provider); switching a chip changes the queried mode and, for Close, narrows the near-rhyme result set | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx` | [ ] | [ ] | C-14 |
| T-14.15 | A failed or hung provider lookup shows an honest offline state instead of an endless spinner | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx` | [ ] | [ ] | C-14 |
| T-14.16 | Results sourced from the tool cache surface a cache/offline note | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx` | [ ] | [ ] | C-14 |
| T-14.17 | A visible "+ collect" affordance adds a result to the active draft's Inventory and persists it, with feedback distinguishable from the existing click-to-copy gesture | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx` | [ ] | [ ] | C-14 |
| T-14.18 | A refused clipboard reports "Couldn't copy" and logs no error | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx` | [x] | [x] | Guards D-22 |
| T-14.19 | Rhyme emphasis uses an absolute score threshold, not a relative "top 30%"; a weak result set shows nothing emphasised and no result is hidden by score | integration | `tests/integration/tools/tools-rhyme-emphasis.test.tsx` | [x] | [x] | C-45, §13.5 |
| T-14.20 | Clicking a tool result collects it into the Inventory (primary click); copy is reachable as a secondary hover control and still reports honestly on a refused clipboard (D-22) | integration | `tests/integration/tools/tools-filter-chips-and-collect.test.tsx`, `tests/integration/tools/tools-sidebar-integration.test.tsx` | [x] | [x] | C-43, §13.3. Retires T-7.06 (stage-7.md) |
| T-14.21 | An Inventory chip whose text appears (case-insensitively, whole-word, punctuation-insensitively) in the active draft renders in a "used" state, derived not stored, and reverts when the word leaves the draft; a substring match (e.g. "low" inside "below") does not count | integration, unit | `tests/integration/inventory/inventory-used-state.test.tsx`, `tests/unit/tools/draft-word-usage.test.ts` | [x] | [x] | C-44, §13.4 |
| T-14.22 | Tool results already in the draft or already collected render dimmed (derived, un-dims once the word leaves the draft), so the writer scans what is new | integration | `tests/integration/tools/tools-results-used-state.test.tsx` | [x] | [x] | C-44, §13.4 |
| T-14.23 | The rhyme list stays skimmable: no comma separators, copy control out of layout flow, even row gap | integration | `tests/integration/tools/rhyme-list-skimmability.test.tsx` | [x] | [x] | Guards D-25 |
| T-14.24 | Double-clicking a word in the lyric queries the active tool for exactly that word, without moving the caret or taking focus from the editor; consecutive lookups of the same word each fire | unit, integration, e2e | `tests/unit/editor/word-lookup.test.ts`, `tests/integration/tools/tools-lookup-request.test.tsx`, `tests/e2e/stage-14-lookup.spec.ts` | [x] | [x] | C-41, §13.1. The click→position half needs real layout, so the gesture itself is proved in the browser; jsdom covers which word a position resolves to |
| T-14.25 | The rail names the word the results are for | integration | `tests/integration/tools/tools-lookup-request.test.tsx` | [x] | [x] | C-41, §13.1 |
| T-14.26 | A keyboard shortcut (`Mod-Shift-L`) looks up the word under the caret, and is a no-op when there is no word | unit | `tests/unit/editor/word-lookup.test.ts` | [x] | [x] | C-41, §13.1: never a mouse-only feature |
| T-14.27 | A setting disables the behaviour — with it off, double-click only selects; the preference persists, and a localStorage that throws does not break the feature | unit, integration, e2e | `tests/unit/editor/word-lookup.test.ts`, `tests/integration/tools/tools-lookup-request.test.tsx`, `tests/e2e/stage-14-lookup.spec.ts` | [x] | [x] | C-41, §13.1. A UI preference, NOT a `.cyril` field — no DATA_MODEL change |
| T-14.28 | Whitespace, free-standing punctuation, an empty line, and a multi-word selection raise no lookup | unit | `tests/unit/editor/word-lookup.test.ts` | [x] | [x] | C-41, §13.1. A click on the boundary immediately after a word deliberately resolves to that word — `pos` lands on either side of a glyph depending on which half was clicked |
| T-14.29 | The inert ⌖ "populate from selection" control is gone | integration | `tests/integration/tools/tools-lookup-request.test.tsx` | [x] | [x] | C-41, §13.1. Retires D-24 |
| T-14.30 | Clicking an Inventory chip inserts its text at the caret in the active draft, leaves the caret after the inserted word, and hands focus back to the lyric; with no draft editor mounted the control is disabled and the command a safe no-op, not an error | integration, unit, e2e | `tests/integration/inventory/inventory-chip-insert.test.tsx`, `tests/e2e/stage-14-chip-insert.spec.ts` | [x] | [x] | C-42, §13.2. Guards D-26 |
| T-14.31 | The insertion is a single undo step *as the writer experiences it* — one `Cmd+Z` removes the inserted word and nothing else, even when typing immediately preceded the click | integration, e2e | `tests/integration/inventory/inventory-chip-insert.test.tsx`, `tests/e2e/stage-14-chip-insert.spec.ts` | [x] | [x] | C-42, §13.2. Guards D-27 |
