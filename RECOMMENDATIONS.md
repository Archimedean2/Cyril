# Cyril — Honest Assessment & Recommendations

## Summary

Cyril has an impressive spec suite, a well-thought-out staged build plan, and working implementations across 13 stages. The documentation is thorough and the product vision is clear. However, the gap between the documentation's ambition and the actual implementation quality is significant. The project reads like a well-organized proof of concept — not yet a product someone would trust with real creative work.

This document is organized into:
1. Architecture weaknesses
2. Testing weaknesses
3. Specification gaps
4. Code quality issues
5. Prioritized recommendations

---

## 1. Architecture Weaknesses

### 1.1 The Zustand Store is a God Object

`projectStore.ts` (407 lines) is a single monolithic store that owns:
- project CRUD
- draft CRUD
- navigation state
- draft content updates
- inventory updates
- export settings
- share import
- app initialization

Every action does a full shallow-copy of the entire `CyrilFile` tree to produce a new state. For a project with 5 drafts and complex documents, every keystroke in the editor triggers `updateDraftDoc`, which copies the entire project, all drafts, all workspaces — just to update one draft's `doc` field.

**Impact:** This will cause noticeable lag on real-sized documents. It also violates the architecture doc's own rule to separate project content state, editor session state, and UI state.

**Recommendation:** Split into at least 3 stores:
- `projectStore` — project metadata, CRUD, persistence
- `editorSessionStore` — active view, active draft content (the hot path)
- `uiStore` — sidebar collapsed, dialog open/closed, tool mode

Consider using Zustand slices or separate stores with selectors. The active draft's document should not require copying the entire project tree on every update.

### 1.2 No Autosave Implementation

`src/persistence/autosave/` is an empty directory. The architecture doc and data model both specify autosave as a core persistence behavior. The `projectSettings.autosave` field exists in the schema but does nothing.

**Impact:** Users can lose work. This is a critical gap for a product that positions itself as a serious local-first writing tool.

**Recommendation:** Implement IndexedDB-based autosave with debounced writes (e.g., 2–5 seconds after last change). This is one of the highest-impact reliability features possible.

### 1.3 Empty Scaffolding Directories and Files

The following directories/files exist but are completely empty:
- `src/domain/drafts/` — empty
- `src/domain/workspaces/` — empty
- `src/editor/marks/bold/` — empty
- `src/editor/marks/italic/` — empty
- `src/editor/nodes/paragraph/` — empty
- `src/editor/core/commands.ts` — empty (0 bytes)
- `src/editor/core/createEditor.ts` — empty (0 bytes)
- `src/editor/core/editorSchema.ts` — empty (0 bytes)
- `src/utils/clipboard/` — empty
- `src/utils/guards/` — empty
- `src/utils/text/` — empty
- `src/utils/timestamps/` — empty
- `src/persistence/autosave/` — empty
- `src/components/controls/` — empty
- `src/components/dialogs/` — empty
- `src/features/inventory-pane/` — empty
- `src/features/project-manager/` — empty

**Impact:** This creates a false impression of modularity. The architecture doc prescribes a clean separation, but in practice, most logic lives elsewhere. Newcomers will waste time looking for code in these locations.

**Recommendation:** Either populate these with real implementations (moving logic out of monolithic files) or delete them. Dead scaffolding is worse than no scaffolding.

### 1.4 Component Architecture Doesn't Match the Component Map

`COMPONENT_MAP.md` prescribes 44 components with clear separation of concerns. In practice:
- `LeftNav.tsx` (231 lines) mixes project CRUD actions (save, open, duplicate, close, rename), project title editing, and navigation all in one component with inline styles and inline event handlers.
- The "features" directory has a mix of populated and empty folders. There are no `ProjectCreateDialog`, `ProjectOpenDialog`, or `ConfirmDialog` components as specified — project creation uses `prompt()` (a browser alert).
- `DraftEditor.tsx` directly manages context menus, chord popovers, and display class toggles instead of delegating to child components.

**Impact:** The actual UI is fragile and hard to extend. Adding features means adding more logic to already-large files.

**Recommendation:** Refactor to match the component map. Extract project actions into a `ProjectActions` component. Move chord popover management out of `DraftEditor`. Replace `prompt()` calls with proper dialog components.

### 1.5 Inline Styles Mixed with CSS

The project uses three styling approaches simultaneously:
- CSS custom properties in `index.css` (good)
- A large `editor.css` file (1023 lines, acceptable)
- Inline `style={{...}}` objects in components like `LeftNav.tsx` and `AppShell.tsx`
- Inline `onMouseEnter`/`onMouseLeave` hover handlers reimplementing CSS `:hover`

**Impact:** Inconsistent styling, no hover states in tests, harder to theme or redesign.

**Recommendation:** Pick one approach and commit. Move all inline styles to CSS classes. Use Tailwind (already in dependencies) or CSS modules consistently. Delete the JavaScript hover handlers entirely — they belong in CSS.

### 1.6 No Error Boundary

There is no React error boundary anywhere in the app. If a Tiptap extension throws, or a corrupt document crashes the editor, the entire app goes blank.

**Recommendation:** Add error boundaries around the editor surface, the tools pane, and the inventory pane at minimum. Display a recovery UI that lets the user save their work.

### 1.7 File Persistence Is Fragile

`fileManager.ts` uses a module-level `let fileHandle` variable. This means:
- Only one file handle exists globally
- If the user opens a second browser tab, behavior is undefined
- The handle is lost on page refresh (though IndexedDB recovery is attempted)
- `saveProject` mutates the input `fileContent.project.updatedAt` directly — a side effect in what should be a persistence function

**Recommendation:** Move the file handle into the persistence store. Don't mutate input arguments. Add explicit dirty-state tracking instead of relying on timestamp changes.

---

## 2. Testing Weaknesses

### 2.1 Coverage Is Unknown

`PROGRESS.md` has a "Coverage Tracking" table that is completely empty. The `vitest.config.ts` has no coverage configuration. The `TESTING.md` prescribes 90%+ for domain code and 80%+ overall, but there is zero measurement infrastructure.

**Recommendation:** Add `coverage` config to vitest (e.g., `c8` or `istanbul`). Run it. Fill in the coverage table. You cannot claim quality without measuring it.

### 2.2 Many Tests Are "Trivial Pass"

Several test checklist items in `tests/specs/` are marked as passing but with notes like:
- "Trivial pass; drag-and-drop reorder not yet exposed as command" (T-4.02)
- "Trivial pass; section duplication command not yet exposed" (T-4.03)
- "CSS-level hide; trivial pass at data layer" (T-4.09)

These tests assert that nothing crashes rather than that the feature actually works. They pass because the feature doesn't exist yet.

**Impact:** The stage completion checklist gives a false sense of confidence. All boxes are checked, but the features aren't fully implemented.

**Recommendation:** Rewrite "trivial pass" tests as pending/skipped tests with clear TODO descriptions. A test that doesn't exercise real behavior is worse than no test — it hides gaps.

### 2.3 Validation Tests Are Minimal

`project-validation.test.ts` has exactly 2 tests:
- Accepts a valid project
- Rejects missing `title` and `schemaVersion`

It does not test:
- Invalid draft modes
- Missing `workspaces` keys
- Malformed section blocks
- Invalid chord positions
- Bad alternate structures
- Schema version mismatch
- Unknown `sectionType` values

The Zod schema itself is quite loose — `DraftDocumentSchema` just validates `content: z.array(RichTextNodeSchema)` with no structural enforcement.

**Recommendation:** Write property-based or at least thorough edge-case validation tests. Tighten the Zod schema to actually catch malformed data rather than using `.passthrough()` everywhere.

### 2.4 E2E Tests Are Mostly Smoke Tests

Most E2E tests follow this pattern:
1. Go to `/`
2. Create project
3. Perform 1–2 actions
4. Assert something is visible

They don't test:
- Full save/load round-trips (File System Access API limitation acknowledged, but no workaround)
- Cross-draft state corruption
- Undo/redo sequences
- Edge cases documented in the feature specs

The chord E2E test is notably thorough (21KB, many scenarios). The rest are thin.

**Recommendation:** Invest in integration tests (Vitest + Testing Library) that exercise real user workflows against the store and editor, bypassing the File System Access API limitation. These can cover what E2E cannot.

### 2.5 Regression Log Is Empty

`PROGRESS.md` has a regression log that's completely empty. Either there have genuinely been zero regressions across 13 stages (unlikely given the notes about "Fixed Stage 0 assertions" and "pre-existing T-4.07/T-4.08 failures"), or regressions weren't tracked.

**Recommendation:** Retroactively document known regressions. Going forward, use the regression log honestly.

### 2.6 No Load/Save Round-Trip Integration Tests

Despite `ARCHITECTURE.md` listing "load/save correctness" as the #1 testing priority, there are no integration tests that:
1. Create a complex project programmatically
2. Serialize it
3. Deserialize it
4. Assert structural equality

The serializer is a thin `JSON.stringify`/`JSON.parse` wrapper, but the migration layer does real transforms. These paths need coverage.

**Recommendation:** Write round-trip tests for projects with every node type: sections, speaker lines, stage directions, lyric lines with chords, alternates, concurrent blocks.

---

## 3. Specification Gaps

### 3.1 Undo/Redo Is Undertested

The architecture doc calls undo/redo integrity "critical" and lists 4 specific scenarios that need protection. There are no dedicated undo/redo tests. The editor relies on Tiptap's built-in history, which is generally solid, but custom commands (section insert, alternate switch, chord add/move) may produce multi-step undo behavior.

**Recommendation:** Write explicit undo tests for: section insertion, metadata toggling, alternate activation, chord placement. These are the operations most likely to break undo expectations.

### 3.2 Migration Strategy Is Incomplete

`migration.ts` merges legacy `speakerLine` and `stageDirection` nodes into unified `lyricLine` nodes with `lineType` attributes. But:
- There is only one schema version (`1.0.0`). No version-to-version migration chain exists.
- The function accepts `any` input with eslint-disable comments
- Unknown fields are sometimes preserved (`.passthrough()`) and sometimes not
- `DraftSettings` migration silently adds `showStressMarks: false` which isn't in the original DATA_MODEL.md spec

**Recommendation:** Implement a versioned migration chain. Each schema version bump should have a named migrator. Add tests for migrating from v1.0.0 to v1.1.0 etc.

### 3.3 `DraftSettings.showStressMarks` Is Undocumented

The `types.ts` `DraftSettings` interface includes `showStressMarks: boolean`, which doesn't appear in `DATA_MODEL.md` or `FEATURES.md`. The migration layer adds it silently. The syllable extension uses it.

**Recommendation:** Update `DATA_MODEL.md` to document this field, or remove it if it's not part of the v1 spec.

### 3.4 Export Doesn't Handle Rich Text Formatting

`extractTextContent()` in `exportSelectors.ts` only extracts `node.text` from `type: "text"` nodes. Bold/italic marks are silently stripped during export. Nested content (e.g., a paragraph inside a lyric line) is not recursed into.

**Recommendation:** Decide whether export should preserve bold/italic (as markdown `**bold**` / `*italic*`) or explicitly strip them. Either way, document the decision. Currently it's an implicit data loss.

### 3.5 `LyricLineAttrs.lineType` Is a Domain Deviation

The `DATA_MODEL.md` spec defines `speakerLine` and `stageDirection` as separate node types. The implementation unifies them into `lyricLine` with a `lineType` attribute. This is arguably better architecture, but it's undocumented as a deviation.

**Recommendation:** Update `DATA_MODEL.md` to reflect the actual unified model, or document it in the Deviations table in `PROGRESS.md`.

### 3.6 Concurrent Block Export Uses `as any` Casts

In `exportSelectors.ts`, concurrent block handling uses `as any` to smuggle a `_concurrent` property onto an `ExportableLine`. This bypasses the type system for what should be a first-class export concept.

**Recommendation:** Extend `ExportableLine` with a proper discriminated union variant for concurrent content.

---

## 4. Code Quality Issues

### 4.1 Excessive `any` Types

Multiple files use `any` extensively:
- `migration.ts` — 4 eslint-disable-next-line comments for `any`
- `projectStore.ts` — `as any as RichTextDocument` cast in DraftEditor
- `exportSelectors.ts` — `as any` for concurrent export
- `DraftEditorConfigOptions.content` is typed as `any`
- `RichTextNode.attrs` is `Record<string, any>`

**Recommendation:** Replace `any` with proper types or `unknown` + type guards. The `RichTextNode` type should have discriminated union variants for each node type.

### 4.2 The `editor.css` File Is Too Large

At 1023 lines, `editor.css` contains styles for the editor, toolbar, section context menus, chord popovers, concurrent blocks, inventory, and tools pane. This contradicts the modularity principle.

**Recommendation:** Split into: `editor-surface.css`, `toolbar.css`, `section-block.css`, `chord.css`, `concurrent-block.css`, `tools-pane.css`, `inventory.css`.

### 4.3 `prompt()` for User Input

`LeftNav.tsx` uses `prompt('Enter name for duplicate project:')` for project duplication. This is a blocking browser dialog that:
- Looks unprofessional
- Can't be styled
- Can't be tested in Playwright without special handling
- Breaks the flow of a "desktop-quality" app

**Recommendation:** Replace all `prompt()` and `confirm()` usage with proper React dialog components.

### 4.4 No Keyboard Shortcut Documentation or System

Keyboard shortcuts are scattered across individual Tiptap extensions (`lyricLine.ts` has Enter/Backspace, chord extension likely has its own). There's no centralized shortcut registry, no way to discover shortcuts in the UI, and no way to customize them.

**Recommendation:** Create a shortcut registry. Display shortcuts in tooltips. Consider a command palette (Ctrl+K / Cmd+K) — this is table stakes for a desktop-quality editor.

### 4.5 Inventory Is a Plain Textarea

The inventory pane uses a raw `<textarea>` rather than a rich text editor. The `DATA_MODEL.md` defines `InventoryDocument` as containing a `RichTextDocument`, but the implementation stores plain text.

**Recommendation:** Upgrade to a lightweight Tiptap instance for inventory, or change the data model to match the implementation. The current mismatch means serialized inventory data may not round-trip correctly.

---

## 5. Prioritized Recommendations

### Tier 1 — Without These, It's Not a Real Product

| # | Action | Why |
|---|--------|-----|
| 1 | **Implement autosave** | Data loss is unacceptable for a writing tool |
| 2 | **Add error boundaries** | A crash shouldn't kill the entire app |
| 3 | **Split the Zustand store** | Performance will degrade on real documents |
| 4 | **Add coverage measurement** | Can't claim quality without numbers |
| 5 | **Replace `prompt()`/`confirm()` with real dialogs** | Looks amateur, breaks testing |
| 6 | **Write round-trip serialization tests** | The #1 architecture testing priority, currently untested |

### Tier 2 — Required for Quality

| # | Action | Why |
|---|--------|-----|
| 7 | **Clean up empty directories and files** | Reduces confusion, shows honest project state |
| 8 | **Rewrite "trivial pass" tests as real tests or mark pending** | False confidence is dangerous |
| 9 | **Add undo/redo integration tests** | Called "critical" in architecture doc but untested |
| 10 | **Fix export to handle bold/italic** | Silent data loss in a core workflow |
| 11 | **Update DATA_MODEL.md for unified lineType model** | Spec and implementation diverge |
| 12 | **Remove all `as any` casts** | Type safety is why you chose TypeScript |
| 13 | **Move inline styles to CSS** | Consistency, testability, maintainability |

### Tier 3 — Polish Into a Real Product

| # | Action | Why |
|---|--------|-----|
| 14 | **Add a command palette** | Desktop-quality UX expectation |
| 15 | **Add keyboard shortcut discoverability** | Users can't use what they can't find |
| 16 | **Upgrade inventory to rich text editor** | Match the data model or change the model |
| 17 | **Split `editor.css` into modules** | 1023 lines is unmaintainable |
| 18 | **Refactor LeftNav into smaller components** | Match the component map |
| 19 | **Add versioned migration chain** | Future schema changes will break existing files |
| 20 | **Add dirty-state tracking** | "Unsaved changes" warning on close |
| 21 | **Implement CI pipeline** | Tests mean nothing if they don't run automatically |
| 22 | **Write validation edge-case tests** | The Zod schema is too loose to catch real corruption |

### Tier 4 — Differentiation

| # | Action | Why |
|---|--------|-----|
| 23 | **Add dark mode** | Expected for a desktop-quality app |
| 24 | **Add drag-and-drop section reordering** | Spec'd in Stage 4, listed as "trivial pass" |
| 25 | **Add section duplication** | Spec'd in Stage 4, listed as "trivial pass" |
| 26 | **Implement rhyme color visualization** | Spec'd in Stage 6, not clearly implemented |
| 27 | **Add print preview** | Spec says print is a "core workflow" |
| 28 | **Implement recent projects list** | Spec'd in Stage 1, partially done via IndexedDB handle |

---

## Honest Assessment

The documentation quality is genuinely excellent — it's one of the best spec suites I've seen for a solo project. The staged approach is sound. The technology choices are correct.

But the implementation has the hallmarks of fast AI-assisted development where each stage was declared "complete" as quickly as possible:
- All 12 stages completed on April 14, 2026 (same day) — this means most stages were built in hours, not days
- Tests pass but many don't test real behavior
- Scaffolding was created but never filled
- The architecture doc's own rules are routinely violated in the actual code
- The spec's emphasis on "editor quality first" is contradicted by `prompt()` dialogs and inline hover handlers

The path from here to a quality product is not about adding more features. It's about:
1. Making what exists reliable (autosave, error handling, round-trip tests)
2. Making what exists honest (coverage numbers, real tests, accurate docs)
3. Making what exists clean (style consistency, component structure, type safety)

Then — and only then — does it make sense to continue adding features.
