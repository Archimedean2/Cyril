# Cyril — Action Plan

Each step has a **measurable outcome** — a concrete, verifiable condition that proves the step is done. Steps are ordered by dependency and priority. Each step is sized to be completable in a single focused session.

---

## Phase 1 — Reliability Foundation

These steps make what already exists trustworthy. No new features.

### Step 4: Tighten validation tests

**Do:** Expand `tests/unit/domain/project-validation.test.ts` to cover: invalid draft mode values, missing workspace keys, malformed section blocks (missing `id` or `sectionType`), invalid chord positions (negative offset, missing `anchorType`), bad alternate structures (missing `isActive`), schema version mismatch. Also tighten the Zod schemas where `.passthrough()` currently hides structural errors.

**Measurable outcome:**
- At least 10 additional validation test cases pass
- Each test asserts a specific Zod error for a specific malformed input
- `npm run test` passes with no regressions

---

### Step 5: Implement autosave to IndexedDB

**Do:** Populate `src/persistence/autosave/` with a debounced autosave service that writes the current project to IndexedDB on a 3-second debounce after any store change. On app init, check IndexedDB for a recovery document. Wire it into the store via a Zustand `subscribe` listener.

**Measurable outcome:**
- An integration test in `tests/integration/persistence/autosave.test.ts` (using `fake-indexeddb`) proves: (a) a project change triggers an IndexedDB write after debounce, (b) on simulated reload, the project is recovered from IndexedDB, (c) autosave can be disabled via `projectSettings.autosave = false`
- All existing tests still pass

---

### Step 6: Add React error boundaries

**Do:** Create an `ErrorBoundary` component in `src/components/layout/ErrorBoundary.tsx`. Wrap the editor surface, tools pane, and inventory pane each in their own error boundary. The fallback UI should display a message and a "Reload" button (not crash the whole app).

**Measurable outcome:**
- An integration test renders each pane with a component that throws, and asserts the error boundary fallback appears instead of an uncaught error
- The app shell remains functional when one pane crashes
- `npm run test` passes

---

### Step 7: Add dirty-state tracking and unsaved-changes warning

**Do:** Track whether the project has changed since last save. Show a visual indicator in the TopBar. Add a `beforeunload` handler that warns the user if there are unsaved changes.

**Measurable outcome:**
- After creating a project and editing, TopBar shows "Unsaved" indicator
- After saving, indicator shows "Saved"
- A unit test asserts dirty state transitions: clean → dirty on edit → clean on save
- `npm run test` passes

---

## Phase 2 — Honest Testing

These steps fix the gap between "tests pass" and "features work."

### Step 8: Audit and fix "trivial pass" tests

**Do:** Search all `tests/specs/*.md` files for "Trivial pass" or "trivial" notes. For each one, either: (a) implement the real feature and write a real test, or (b) mark the test as `it.skip(...)` with a `TODO:` comment explaining what's missing. Update the spec checklist to reflect reality (uncheck "Passing" for skipped tests).

**Measurable outcome:**
- Zero tests in the suite assert "trivially" — every passing test exercises real behavior
- `tests/specs/*.md` checklists accurately reflect which tests are truly passing vs skipped
- `npm run test` passes (skipped tests don't count as failures)

---

### Step 9: Add undo/redo integration tests

**Do:** Create `tests/integration/editor/undo-redo.test.ts`. Test undo/redo for: (a) section insertion, (b) line type toggle (lyric → speaker → lyric), (c) chord add/move/delete, (d) delivery toggle (sung → spoken). Each test should perform an action, undo, assert original state, redo, assert action state.

**Measurable outcome:**
- At least 4 undo/redo test cases pass
- Each test verifies document state after undo AND redo
- `npm run test` passes

---

### Step 10: Backfill the regression log

**Do:** Review git history and `PROGRESS.md` deviation notes. For every fix that changed test assertions or fixed a broken stage, add an entry to the regression log in `PROGRESS.md` with: date, description, affected stage, test ID if applicable.

**Measurable outcome:**
- Regression log has at least 3 entries (based on known deviations in PROGRESS.md)
- Each entry has a date and description
- This is a documentation-only step — no code changes

---

## Phase 3 — Code Quality

### Step 11: Delete empty scaffolding

**Do:** Remove all empty directories and 0-byte files that contain no implementation:
- `src/domain/drafts/`, `src/domain/workspaces/`
- `src/editor/marks/bold/`, `src/editor/marks/italic/`
- `src/editor/nodes/paragraph/`
- `src/editor/core/commands.ts`, `src/editor/core/createEditor.ts`, `src/editor/core/editorSchema.ts`
- `src/utils/clipboard/`, `src/utils/guards/`, `src/utils/text/`, `src/utils/timestamps/`
- `src/persistence/autosave/` (if populated in Step 5, skip this one)
- `src/components/controls/`, `src/components/dialogs/`
- `src/features/inventory-pane/`, `src/features/project-manager/`

**Measurable outcome:**
- `find . -empty -type d` (or equivalent) returns zero results under `src/`
- No 0-byte `.ts` or `.tsx` files exist under `src/`
- `npm run build` succeeds
- `npm run test` passes

---

### Step 12: Replace `prompt()` and `confirm()` with dialog components

**Do:** Create `src/components/dialogs/InputDialog.tsx` and `src/components/dialogs/ConfirmDialog.tsx` as reusable React dialog components. Replace the `prompt()` call in `LeftNav.tsx` (project duplication) with `InputDialog`. Audit for any other `prompt()`/`confirm()` usage and replace.

**Measurable outcome:**
- `grep -r "prompt(" src/` returns zero results
- `grep -r "confirm(" src/` returns zero results
- Duplicate-project flow works via a styled dialog
- An integration test renders the dialog, fills input, submits, and asserts the project was duplicated

---

### Step 13: Eliminate inline styles and JS hover handlers

**Do:** In `LeftNav.tsx`, `AppShell.tsx`, and any other components using inline `style={{...}}` objects or `onMouseEnter`/`onMouseLeave` hover handlers: move all styles to CSS classes (in the appropriate CSS file or a new colocated CSS file). Delete all inline `onMouseEnter`/`onMouseLeave` handlers — use CSS `:hover` instead.

**Measurable outcome:**
- `grep -r "onMouseEnter" src/components/` returns zero results
- `grep -r "onMouseLeave" src/components/` returns zero results
- No `const styles: Record<string, React.CSSProperties>` objects exist in component files
- Visual appearance is unchanged (manual spot check)
- `npm run build` succeeds

---

### Step 14: Remove `any` types from domain and persistence layers

**Do:** Replace every `any` in `src/domain/` and `src/persistence/` with proper types or `unknown` + type guards. Key targets:
- `migration.ts` — type the input as `unknown`, add runtime checks
- `exportSelectors.ts` — replace `as any` concurrent hack with a proper union type in `ExportableLine`
- `DraftEditorConfigOptions.content` — type as `RichTextDocument | undefined`
- `projectStore.ts` — remove `as any as RichTextDocument` cast

**Measurable outcome:**
- `grep -r "as any" src/domain/` returns zero results
- `grep -r ": any" src/domain/` returns zero results
- `grep -r "as any" src/persistence/` returns zero results
- `npm run build` succeeds with no type errors
- `npm run test` passes

---

### Step 15: Split `editor.css` into modular files

**Do:** Break `editor.css` (1023 lines) into focused modules:
- `editor-surface.css` — ProseMirror container, scroll, basic layout
- `toolbar.css` — editor toolbar and draft toolbar styles
- `section-block.css` — section block, section label, section type picker
- `chord.css` — chord anchor, chord marker, chord popover
- `concurrent-block.css` — concurrent block layout, speaker columns, headers
- `tools-pane.css` — tools tabs, search, results
- `inventory.css` — inventory textarea, placeholder
- `context-menu.css` — section and line context menus

Import them from `DraftEditor.tsx` or a single `editor/index.css` barrel.

**Measurable outcome:**
- `editor.css` no longer exists (or is < 100 lines as a barrel import)
- Each new CSS file is < 200 lines
- Visual appearance is unchanged (manual spot check)
- `npm run build` succeeds

---

## Phase 4 — Architecture Improvement

### Step 16: Split the Zustand store

**Do:** Refactor `projectStore.ts` into:
- `projectStore.ts` — project CRUD, persistence actions, project metadata
- `editorSessionStore.ts` — `activeView`, `updateDraftDoc`, `updateDraftInventory`, `toggleDraftSetting`, `setDraftMode` (the hot path that doesn't need to copy the full project tree)
- `uiStore.ts` — extend existing `uiState.ts` with dialog open/closed, tool mode, sidebar state

The editor session store should hold only the active draft's document, syncing back to the project store on save/switch rather than on every keystroke.

**Measurable outcome:**
- `projectStore.ts` is < 200 lines
- `editorSessionStore.ts` exists and handles draft doc updates without copying the full project tree
- A performance test (or manual profiling) shows that typing in the editor does NOT trigger a full project tree copy
- All existing integration and E2E tests pass

---

### Step 17: Update DATA_MODEL.md to match implementation

**Do:** Update `DATA_MODEL.md` to document:
- The unified `lyricLine` model with `lineType` attribute (replacing separate `speakerLine`/`stageDirection` node types)
- The `showStressMarks` field in `DraftSettings`
- The `concurrentLayout` field in `ExportSettings`
- The `ConcurrentBlock` and `SpeakerColumn` node schemas

Add a "Deviations from Original Spec" section explaining why the unified model was chosen.

**Measurable outcome:**
- Every type in `src/domain/project/types.ts` has a corresponding section in `DATA_MODEL.md`
- No undocumented fields exist in the TypeScript interfaces
- This is a documentation-only step

---

### Step 18: Implement versioned migration chain

**Do:** Refactor `migration.ts` to support a chain of version-specific migrators:
- `migrateFrom_1_0_0_to_1_1_0()`
- A `migrate(data: unknown): CyrilFile` entry point that detects the version and runs each step in sequence

Bump the schema version to `1.1.0` to reflect the unified `lineType` model and new fields.

**Measurable outcome:**
- A unit test creates a `1.0.0` project with legacy `speakerLine`/`stageDirection` nodes, migrates it, and asserts the result is valid `1.1.0`
- A unit test asserts that a `1.1.0` project passes through migration unchanged
- `SCHEMA_VERSION` constant is `'1.1.0'`
- All existing tests pass

---

## Phase 5 — UX Polish

### Step 19: Fix export to preserve formatting marks

**Do:** Update `extractTextContent()` in `exportSelectors.ts` to recurse into nested content. Update `markdownTransformer.ts` to emit `**bold**` and `*italic*` for marked text nodes. Update `printRenderer.ts` to emit `<strong>` and `<em>` tags.

**Measurable outcome:**
- A unit test in `tests/unit/export/` asserts that a lyric line with bold text exports as `**text**` in markdown
- A unit test asserts that italic text exports as `*text*` in markdown
- Print export preserves bold/italic as HTML tags
- `npm run test` passes

---

### Step 20: Refactor LeftNav into smaller components

**Do:** Extract from `LeftNav.tsx`:
- `ProjectTitle.tsx` — editable project title
- `ProjectActions.tsx` — save/open/duplicate/close buttons
- Keep `LeftNav.tsx` as a thin shell that composes these + `WorkspaceNav` + `DraftList` + `DisplayControls`

**Measurable outcome:**
- `LeftNav.tsx` is < 60 lines
- `ProjectTitle.tsx` and `ProjectActions.tsx` each exist and have clear single responsibilities
- Existing E2E tests (stage-1 project CRUD) still pass
- Visual appearance is unchanged

---

### Step 21: Add keyboard shortcut registry and command palette

**Do:** Create `src/domain/editor/shortcutRegistry.ts` that maps shortcut strings to commands. Aggregate shortcuts from all extensions. Create a simple `CommandPalette.tsx` component (Ctrl+K / Cmd+K) that lists available commands and allows fuzzy search.

**Measurable outcome:**
- Pressing Ctrl+K opens a command palette overlay
- The palette lists at least: Bold, Italic, Undo, Redo, Toggle Delivery, Insert Section, Add Chord
- Selecting a command executes it
- A unit test asserts the registry contains all registered shortcuts
- `npm run test` passes

---

## Progress Tracking

| Step | Phase | Status | Notes |
|------|-------|--------|-------|
| 1  | Reliability | **done** | Completed 2026-04-30. Baseline: 68.8% lines, 50.77% functions, 74.08% branches |
| 2  | Reliability | **done** | Completed 2026-04-30. 5 round-trip tests, 223/223 passing |
| 3  | Reliability | **done** | Completed 2026-04-30. 9 migration tests covering legacy nodes, missing fields, unknown fields |
| 4  | Reliability | pending | |
| 5  | Reliability | pending | |
| 6  | Reliability | pending | |
| 7  | Reliability | pending | |
| 8  | Honest Testing | pending | |
| 9  | Honest Testing | pending | |
| 10 | Honest Testing | pending | |
| 11 | Code Quality | pending | |
| 12 | Code Quality | pending | |
| 13 | Code Quality | pending | |
| 14 | Code Quality | pending | |
| 15 | Code Quality | pending | |
| 16 | Architecture | pending | |
| 17 | Architecture | pending | |
| 18 | Architecture | pending | |
| 19 | UX Polish | pending | |
| 20 | UX Polish | pending | |
| 21 | UX Polish | pending | |
