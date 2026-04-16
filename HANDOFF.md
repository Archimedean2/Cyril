# Handoff Notes

## 12. Section label edit stale closure fix (2026-04-16)

**File:** `src/editor/nodes/sectionBlock/sectionBlock.ts`

**Problem:** Editing a section label would save correctly, but re-editing showed the original (stale) name. The NodeView's `enterEditMode` closure captured the initial `node` parameter and never saw updates.

**Fix (surgical, 6 line changes):**
- Changed destructured parameter from `node` to `node: initialNode`
- Added `let currentNode = initialNode;` mutable reference at top of closure
- Replaced all internal `node` references with `currentNode`:
  - `dom.setAttribute('data-section-type', currentNode.attrs.sectionType)`
  - `label.textContent = getDisplayLabel(currentNode)`
  - `enterEditMode(label, currentNode, ...)`
  - context menu `sectionType: currentNode.attrs.sectionType`
- Added `currentNode = updatedNode;` as first line in `update()` method

**Pattern:** ProseMirror NodeViews receive the initial node once. The `update()` method receives fresh nodes on every transaction. The fix uses a mutable `let` binding that `update()` keeps current, so all closures read fresh attrs.

**Verified flow:**
- Click label → edit to "BRIDGE" → Enter → label shows "BRIDGE"
- Click label again → input shows "BRIDGE" (not old name)
- Edit to "CHORUS" → Enter → label shows "CHORUS"
- Click again → input shows "CHORUS"
- Escape during edit → label reverts to current saved name

---

## 11. Unified line model refactor (2026-04-16)

### Overview

Removed `speakerLine` and `stageDirection` as separate ProseMirror node types. All editable lines in the editor are now `lyricLine` nodes. A `lineType` attribute (`'lyric' | 'speaker' | 'stageDirection'`) controls styling, export behavior, and toggle visibility.

---

### 1. Files changed

| File | Change |
|---|---|
| `src/editor/nodes/lyricLine/lyricLine.ts` | Added `lineType` attr; new `renderHTML`/`parseHTML`; `setLineType`, `toggleLineType` commands; `[[...]]` and `((...))` input rules; backspace-at-start keyboard handler; Enter key handler that resets lineType to lyric when splitting speaker/stage lines |
| `src/editor/nodes/sectionBlock/sectionBlock.ts` | Content rule changed from `(lyricLine \| speakerLine \| stageDirection \| paragraph)+` to `lyricLine+` |
| `src/editor/core/draftConfig.ts` | Removed `SpeakerLine` and `StageDirection` imports and extension registrations |
| `src/editor/transforms/metadata.ts` | Removed dead `setSpeakerLine` and `setStageDirection` command exports |
| `src/components/editor/editor.css` | Removed all `.speaker-line` and `.stage-direction` rules; added `.line-type-speaker`, `.line-type-stageDirection` rules with longhand padding; updated display toggle and sibling indent selectors |
| `src/components/editor/DraftToolbar.tsx` | Replaced `toggleSpeakerLine`/`toggleStageDirection` with `toggleLineType`; updated `isActive` checks; updated `data-testid` to `toolbar-speaker` / `toolbar-stage-dir` |
| `src/components/editor/LineContextMenu.tsx` | Rewrote to use `setLineType` attr mutations; removed node-type conversion logic; conditions now check `lineType` values |
| `src/app/state/lineMenuStore.ts` | Renamed `LineMenuNodeType` → `LineMenuLineType`; values changed from node names to `lineType` attr values |
| `src/components/editor/DraftEditor.tsx` | `LINE_TYPES` now contains only `'lyricLine'`; `openLineMenu` reads `node.attrs.lineType` instead of `node.type.name` |
| `src/domain/project/migration.ts` | `migrateDocNode` converts old `speakerLine`/`stageDirection` node objects to `lyricLine` with `lineType` attrs and inline content |
| `tests/unit/editor/metadata-commands.test.ts` | T-4.04 and T-4.05 updated to use `setLineType` and assert `lineType` attr |
| `tests/integration/editor/sections-metadata-integration.test.ts` | T-4.07 uses `lyricLine` in sectionBlock; T-4.08 uses `lyricLine` with `lineType` attrs |
| `tests/e2e/stage-4-sections-metadata.spec.ts` | Updated toolbar test IDs and DOM attribute selectors to `data-line-type` |

### 2. Files deleted

- `src/editor/nodes/speakerLine/speakerLine.ts` (and directory)
- `src/editor/nodes/stageDirection/stageDirection.ts` (and directory)

### 3. How the unified line model works

Every line is a `lyricLine` node with `content: 'inline*'`. The `lineType` attr takes one of three values: `'lyric'` (default), `'speaker'`, `'stageDirection'`. The node renders as:

```html
<div class="lyric-line line-type-speaker" data-type="lyricLine" data-line-type="speaker" ...>
```

ProseMirror treats all three identically — same node type, same content rule, same editability. Only the attribute value differs. There is no node conversion, no atom confusion, no content migration on type change.

### 4. How input rules work

Two input rules fire when the full line content matches a pattern:

- `[[WOODY]]` → sets `lineType: 'speaker'`, replaces line text with `WOODY`
- `((approaches slowly))` → sets `lineType: 'stageDirection'`, replaces line text with `approaches slowly`

The handler deletes all block content, calls `setNodeMarkup` on the block position to flip `lineType`, then inserts the extracted text. Rules match only when the full line is the pattern — not mid-line.

### 5. How the indent CSS works

All lines render with the same base class, so the sibling combinator works:

```css
.line-type-speaker ~ .line-type-lyric          { padding-left: 1.5em; }
.line-type-speaker ~ .line-type-stageDirection  { padding-left: 1.5em; }
```

A speaker line's own `padding-left: 0` means it is not indented. Longhand padding properties are used throughout — never the `padding` shorthand — to prevent cascade resets of `padding-left` set by the sibling rule.

### 6. How migration works

Two layers:

1. **JSON migration** (`migration.ts` `migrateDocNode`): fires at file load. Converts `speakerLine`/`stageDirection` node objects to `lyricLine` with `lineType` attrs. Handles old atom format (`attrs.speaker`, `attrs.text`) by converting to inline content.
2. **HTML parse migration** (`lyricLine.ts` `parseHTML`): maps old `data-type` attribute values (`speakerLine`, `speaker`, `stageDirection`, `stage-direction`) to the new unified node with correct `lineType`.

### 7. Toolbar toggles

- **Speaker** (`data-testid="toolbar-speaker"`): `toggleLineType('speaker')`. Active when `isActive('lyricLine', { lineType: 'speaker' })`.
- **Stage Dir** (`data-testid="toolbar-stage-dir"`): `toggleLineType('stageDirection')`. Active when `isActive('lyricLine', { lineType: 'stageDirection' })`.

`toggleLineType` flips between the given value and `'lyric'` — pressing an active button resets to lyric.

**Not verified at runtime — pending test run.**

### 8. Display toggles

No logic changes needed. `DraftEditor` already applied `hide-speakers` / `hide-stage-directions` classes. CSS rules updated to target new class names:

```css
.hide-speakers          .line-type-speaker        { display: none; }
.hide-stage-directions  .line-type-stageDirection  { display: none; }
```

### 9. Backspace-at-start behavior

When cursor is at position 0 of a non-lyric line with nothing selected, Backspace resets `lineType` to `'lyric'` without deleting any text. Normal Backspace (mid-line or with selection) passes through unchanged.

**Not verified at runtime — pending test run.**

### 10. Enter key behavior (new)

When inside a speaker or stageDirection line, pressing Enter:
1. Splits the block normally
2. The **new** line automatically resets to `lineType: 'lyric'`

The original line keeps its type; only the newly created line reverts to lyric. This matches the requested behavior where typing a speaker name then pressing Enter continues in basic lyric mode.

### 11. Old data loading

Handled by the two migration layers described in §6. Both the `attrs.speaker`/`attrs.text` atom format and the inline content format are covered.

### 12. Deviations from plan

- **Export layer not updated**: `exportSelectors.ts`, `markdownTransformer.ts`, `printRenderer.ts` still filter by old node type names. Intentionally deferred per plan ("export changes NOT in this pass").
- **`StageDirectionNode` / `SpeakerLineNode` in `types.ts`**: left in place. They describe the old on-disk format, are referenced by no active code, and can be removed in a future cleanup pass.

### 13. Open concerns / regression risk

- **Export layer produces wrong output** until `exportSelectors.ts` etc. are updated to check `node.attrs.lineType` instead of `node.type`.
- **Hidden speaker indent**: when speakers are hidden via `display: none`, the `~` combinator still applies — lyric lines after a hidden speaker remain visually indented. Whether this is desired when speakers are toggled off is unspecified.
- **`makeLyricLineNodeJSON` in `sectionBlock.ts`** omits `lineType` — relies on schema default of `'lyric'`. Correct, but fragile if the default ever changes.
