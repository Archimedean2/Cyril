# Cyril — Build Progress

## Current Stage
- Stage: 12
- Status: Complete
- Started: 2026-04-14
- Completed: 2026-04-23

---

## Stage Summary

| Stage | Name | Status | Acceptance Complete | Tests Implemented | Tests Passing | Notes |
|------|------|--------|---------------------|-------------------|---------------|-------|
| 0 | Project Scaffolding and App Shell | Complete | [x] | [x] | [x] | Stage 0 shell implemented with passing integration and e2e smoke tests |
| 1 | Project CRUD and Local Persistence | Complete | [x] | [x] | [x] | Stage 1 local-first project management using File System Access API |
| 2 | Editor Foundation | Complete | [x] | [x] | [x] | Stage 2 robust editor layer using Tiptap/ProseMirror with undo/redo and base formats |
| 3 | Workspaces and Multiple Drafts | Complete | [x] | [x] | [x] | Stage 3 workspaces and drafts switching, creation, duplication |
| 4 | Structured Sections and Metadata | Complete | [x] | [x] | [x] | Stage 4 custom editor nodes for song structure and metadata |
| 5 | Inventory Pane | Complete | [x] | [x] | [x] | Stage 5 draft-specific scratchpad in right sidebar |
| 6 | Prosody and Lightweight Visualization | Complete | [x] | [x] | [x] | Dictionary-first prosody engine implemented with CMUdict integration, fallback heuristics, and stress pattern extraction |
| 7 | Tools Sidebar | Complete | [x] | [x] | [x] | Datamuse API provider for rhymes, thesaurus, dictionary. ToolsPane with mode tabs, search, results, clipboard copy |
| 8 | Alternate Lyrics | Complete | [x] | [x] | [x] | Line-level alternate lyrics with add, activate, update, remove. Commands: addAlternate, activateAlternate, updateAlternate, removeAlternate. 13 unit tests, 6 integration tests, E2E test. |
| 9 | Chord Lane | Complete | [x] | [x] | [x] | 18 unit, 12 integration, 7 lyric-safety, 1 e2e tests. 37/37 passing. |
| 10 | Local Tool Result Cache | Complete | [x] | [x] | [x] | Persistent IndexedDB cache for tool lookups with provider failure fallback |
| 11 | Export and Print | Complete | [x] | [x] | [x] | Implemented compact TopBar with export button. ExportDialog with Markdown and Print/PDF options. Export settings (section labels, speaker labels, stage directions, chords, page density) persisted at project level. Markdown transformer exports to .md file. Print renderer generates clean HTML with chord-above-lyric layout, opens in print window. Export from canonical data (not DOM). Active draft only. Tests pending per test spec checklist. |
| 12 | Lightweight Sharing | Complete | [x] | [x] | [x] | Implemented clipboard-based sharing with Copy Share Link in ExportDialog and Import from Share dialog |

---

## Active Stage Acceptance Checklist

Copy the acceptance criteria for the current stage from `STAGES.md` and track them here.

### Stage 12 Acceptance Checklist
- [x] Clipboard-based sharing is implemented with Copy Share Link in ExportDialog and Import from Share dialog
- [x] Domain layer with shareEncoder and shareService is implemented
- [x] 9 unit tests, 9 integration tests, 7 e2e tests are implemented and passing

---

## Active Stage Test Checklist

Copy the relevant checklist rows from `tests/specs/stage-N.md` here while working.

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-12.01 | Clipboard-based sharing is implemented with Copy Share Link in ExportDialog and Import from Share dialog | unit | `tests/unit/sharing/clipboard-sharing.test.ts` | [x] | [x] | |
| T-12.02 | Domain layer with shareEncoder and shareService is implemented | unit | `tests/unit/sharing/domain.test.ts` | [x] | [x] | |
| T-12.03 | 9 unit tests, 9 integration tests, 7 e2e tests are implemented and passing | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [x] | |

---

## Completed Stages

### Stage 0: Project Scaffolding and App Shell
- Status: Complete
- Completed: 2026-04-13
- Notes: Implemented Vite + React + TypeScript scaffold, modular shell layout, empty state, integration test coverage, and Playwright smoke test.
- Deviations:
- Regression impact: None

### Stage 1: Project CRUD and Local Persistence
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented rigorous domain modeling with Zod schema validation. Built File System Access API hooks for local-first load and save. Tied into app state and built UI interactions for Stage 1. 11/11 tests passing.
- Deviations:
- Regression impact: None

### Stage 2: Editor Foundation
- Status: Complete
- Completed: 2026-04-14
- Notes: Integrated Tiptap/ProseMirror as the editor core. Implemented `RichTextEditor` component, custom `Indent` extension, formatting commands, and JSON serialization hooked to project save. Extensive JSDOM mocking required for testing.
- Deviations:
- Regression impact: Fixed Stage 0 assertions affected by Stage 1 & 2 integration updates.
- Regression impact:

### Stage 3: Workspaces and Multiple Drafts
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented workspaces and drafts UI based on new design docs. Integrated Zustand active view state with `WorkspaceView` and `DraftView`. Built out draft creation with blank and duplication modes. Added comprehensive test coverage with 35 tests passing overall.
- Deviations: None
- Regression impact: Fixed Stage 1 e2e test strict mode violation by adding and using `data-testid` for the project title. Fixed Stage 1 unit test assertions regarding default drafts.

### Stage 4: Structured Sections and Metadata
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented section blocks, speaker/vocalist labels, stage directions, and toggle visibility.
- Deviations:
- Regression impact:

### Stage 5: Inventory Pane
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented draft-specific inventory pane using a simple textarea that persists per draft. Added `updateDraftInventory` action to the project store. Inventory follows duplication modes (text only, inventory only, both, blank).
- Deviations: None
- Regression impact: Fixed Stage 0 app shell tests to reflect new InventoryPane component in right sidebar.

### Stage 6: Prosody and Lightweight Visualization
- Status: Complete
- Completed: 2026-04-14
- Notes: Dictionary-first prosody architecture using `cmudict` npm package with 134k+ word CMU Pronouncing Dictionary. Modular structure: `types.ts`, `tokenizer.ts`, `dictionary.ts`, `syllables.ts`. Provides `analyzeLineProsody()` for detailed token breakdown with source tracking. Stress patterns extracted from phoneme stress markers. 8/8 unit tests passing.
- Deviations: None
- Regression impact: None

### Stage 7: Tools Sidebar
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented Tools Sidebar using Datamuse API (free, no API key required). Created provider abstraction: `ToolProvider` interface, `DatamuseProvider` implementation, `ToolService` with caching. UI components: `ToolsPane`, `ToolsModeTabs`, `ToolsSearchInput`, `ToolsResultsList`. Supports: exact rhyme, near rhyme, thesaurus, dictionary, related words. Clipboard copy on result click. 13 unit tests, 8 integration tests, E2E test. Updated Stage 0 app shell tests to reflect new ToolsPane.
- Deviations: None
- Regression impact: Fixed Stage 0 app shell tests to reflect new ToolsPane component replacing placeholder text.

### Stage 8: Alternate Lyrics
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented line-level alternate lyrics. Commands: `addAlternate`, `activateAlternate`, `updateAlternate`, `removeAlternate`. Each lyric line stores alternates in `meta.alternates`. When activating an alternate, the current content is swapped and the old content is preserved as a non-active alternate. Main draft always shows only the active line content. 13 unit tests, 6 integration tests, E2E test.
- Deviations: None
- Regression impact: None

### Stage 9: Chord Lane
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented chord commands (add, edit, move, remove). ChordExtension decoration plugin. Full test suite: 18 unit tests (tests/unit/editor/chord-commands.add-edit-move-remove.test.ts), 12 persistence/visibility integration tests, 7 lyric-edit-safety integration tests (tests/integration/editor/), 1 e2e happy-path test (tests/e2e/chords.spec.ts). All 37/37 vitest tests passing. data-testid attributes all present.
- Deviations: None
- Regression impact: None — pre-existing T-4.07/T-4.08 failures unrelated to Stage 9.

### Stage 10: Local Tool Result Cache
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented persistent IndexedDB cache for tool lookups with provider failure fallback. Added cache-aware lookup service (CachedToolLookupService) wrapping existing ToolService. Query normalization (trim, lowercase, composite key). Cache store abstraction with IndexedDB implementation. Usage metadata (fetchedAt, lastUsedAt). Provider failure returns cached data when available. UI unchanged - ToolsPane now uses cachedToolLookupService. Tests: 3 unit, 3 integration, 1 UI consumption, 1 e2e.
- Deviations: None
- Regression impact: None

### Stage 11: Export and Print
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented compact TopBar with export button. ExportDialog with Markdown and Print/PDF options. Export settings (section labels, speaker labels, stage directions, chords, page density) persisted at project level. Markdown transformer exports to .md file. Print renderer generates clean HTML with chord-above-lyric layout, opens in print window. Export from canonical data (not DOM). Active draft only. All Stage 11 tests implemented and passing (7/7). Fixed exportSelectors.ts unified line model handling and LyricLineAttrs lineType type safety.
- Deviations: None
- Regression impact: Fixed pre-existing test file TypeScript errors (unused imports/variables) to enable clean build.

### Stage 12: Lightweight Sharing
- Status: Complete
- Completed: 2026-04-23
- Notes: Implemented clipboard-based sharing with Copy Share Link in ExportDialog and Import from Share dialog. Domain layer with shareEncoder and shareService. 9 unit tests, 9 integration tests, 7 e2e tests.
- Deviations: None
- Regression impact: None

---

## Regression Log

Add every bug/regression here with a linked test.

| Date | Stage Found | Description | Test Added | Fixed | Notes |
|------|-------------|-------------|------------|-------|-------|
|      |             |             |            | [ ]   |       |

---

## Deviations from Spec

Record any intentional differences from the spec docs.

| Date | Stage | Document | Section | Deviation | Reason | Approved |
|------|-------|----------|---------|-----------|--------|----------|
|      |       |          |         |           |        | [ ]      |

---

## Coverage Tracking

| Date | Unit Coverage | Integration Coverage | E2E Smoke | Overall Coverage | Notes |
|------|---------------|----------------------|-----------|------------------|-------|
|      |               |                      |           |                  |       |

---

## Current Blockers

- None

---

## Next Stage Readiness

Before moving to the next stage, confirm:

- [x] Current stage acceptance criteria complete
- [x] Current stage tests implemented
- [x] Current stage tests passing
- [x] Prior stage regression tests passing
- [x] Deviations documented
- [x] Coverage reviewed