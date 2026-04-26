# Feature: Concurrent Speakers

**Feature ID:** F-13  
**Tags:** `[CONCURRENT] [METADATA] [EXPORT] [STAGE-13]`

---

## Summary

Concurrent Speakers is a structured authoring mode for passages where two or more characters sing or speak simultaneously. It lets the writer enter each speaker's text independently in vertically-aligned columns, use Enter to create interleaved sub-lines within those columns, copy/paste per-speaker content independently, and squash the whole passage down to interleaved sequential lines when exporting to programs that do not support column layouts.

This is a musical-theatre-first feature. It directly targets duets, trios, call-and-response, and counter-melody passages where the visual simultaneity of content matters during writing but traditional tools require manual interleaving hacks.

---

## User Value

Without this feature, a lyricist writing a concurrent passage must either:
- Mentally track two streams and manually interleave them into a flat text layout (error-prone and unreadable while drafting), or
- Use a table or two-column Google Docs hack that destroys formatting and breaks export.

Cyril can store the columns natively, display them side-by-side while writing, and emit sensible interleaved text on export — all without any external tool.

---

## Concepts

### Concurrent Block

A `concurrentBlock` is a new top-level or within-section block node that contains two or more **speaker columns**. Each column belongs to one named speaker and contains an ordered list of lyric lines. Lines across columns at the same vertical index are considered **simultaneous**.

A concurrent block is not a section block. It may appear inside a section block or at the top level of a draft document, in the same positions as `lyricLine` or `sectionBlock` nodes.

### Speaker Column

Each column within a `concurrentBlock` has:
- a `speakerId` linking to a named speaker label
- an ordered list of `lyricLine` nodes (same schema as elsewhere)
- its own independent editing cursor, selection, and clipboard context

Columns are ordered left-to-right. Column count is fixed at creation but can be changed (add/remove column).

### Row

A **row** is a horizontal slice across all columns at the same index. Rows are the unit of simultaneity. A row with content in all columns means all speakers are singing at the same time. A row with content in only some columns means only those speakers are active at that moment.

Rows are implicit — they are derived from the maximum line count across all columns. A column with fewer lines than the tallest column is padded with empty lines for display purposes, but empty trailing lines are not stored.

### Simultaneous vs Interleaved

- **Simultaneous**: Cyril's native display. Columns are shown side-by-side or vertically-split. Content in the same row is happening at the same time.
- **Interleaved (squash)**: Export mode. The concurrent block is converted to sequential `lyricLine` nodes, reading left-to-right per row before moving to the next row.

---

## Included Behaviors

### Authoring

- User can insert a `concurrentBlock` at the cursor position via toolbar or keyboard shortcut
- User chooses speaker count (2–4) and speaker names at creation time
- Each column is an independent editing surface: cursor, selection, typing, undo all work per-column
- User can move between columns with Tab / Shift-Tab
- Enter within a column creates a new line in that column only (does not affect other columns)
- Pressing Enter at the end of the last row creates a new row in all columns simultaneously (empty lines added to all columns to maintain alignment)
- Backspace at the start of a line within a column merges it with the previous line in that column only
- Backspace on an empty last line in a column removes that line (shortens that column)
- Copy within a column copies only that column's selected text
- Paste within a column pastes into that column only
- Copy/paste of an entire concurrent block (selecting across columns) copies the block as a whole
- User can add a column to an existing concurrent block (appended on the right)
- User can remove a column from a concurrent block (with confirmation if it has content)
- User can reorder columns by drag or explicit left/right shift
- Speaker label within a concurrent block is displayed above each column (same visual treatment as a standalone speaker line)
- Speaker names can be edited inline above each column
- Each `lyricLine` within a concurrent block supports the same attributes as standalone lyric lines: `delivery`, `rhymeGroup`, `lineType`, `meta` (alternates, prosody, chords)
- Chords can be assigned to individual lines within a concurrent block column if the draft is in chord mode
- Stage directions can be inserted above or below a concurrent block, not inside it

### Display

- Columns are displayed side-by-side in the editor using a multi-column layout
- Column width is equal by default; columns adjust to viewport width
- Simultaneous rows are visually aligned at the same vertical position
- Empty cells (where one column is shorter) are rendered as blank space to maintain row alignment
- Speaker name appears above each column in the same bold/uppercase style as a standalone speaker line
- The concurrent block has a subtle visual container (border or background) to signal it is a grouped structure
- Display toggle for speaker labels hides column headers but not column content
- Horizontal scroll is supported if columns overflow the editor width

### Export

#### Interleaved (squash) mode — default
- Rows are emitted sequentially top to bottom
- Within each row, columns are emitted left to right
- Empty cells are skipped (no blank line emitted for an absent line in a column)
- Speaker label is prepended before the first line of each speaker's content in that row if speaker labels are included in export settings
- The squash order is always left-to-right for a given row; it does not attempt musical intelligence

Example: two-column block with rows A1/B1, A2/B2, A3/— emits as:
```
SPEAKER A
A1
SPEAKER B
B1
SPEAKER A
A2
SPEAKER B
B2
SPEAKER A
A3
```

#### Concurrent (side-by-side) mode — optional, print only
- Columns are laid out side-by-side in the print HTML
- Each column is a CSS flex child or table cell
- Only available in print/PDF export; not available in Markdown export
- Controlled by an export setting `concurrentLayout`: `"squash"` (default) or `"sideBySide"` (print only)

#### Markdown export
- Always uses interleaved squash mode
- No Markdown syntax for side-by-side columns exists; squash is the only sensible representation

---

## Excluded Behaviors

- No musical intelligence in squash ordering (no beat-grid alignment, no auto-interleave based on syllable counts)
- No MIDI, audio, or playback-aware behaviour
- No notation-style vocal score output
- No automatic detection that two sequential speaker passages should be merged into a concurrent block
- No drag-and-drop merging of two existing speaker passages into a concurrent block
- No diff or comparison between columns
- No per-row metadata (e.g., bar number, time code)
- No variable column widths in v1
- No more than 4 columns in v1

---

## Data Dependencies

### New node: `concurrentBlock`

```json
{
  "type": "concurrentBlock",
  "attrs": {
    "id": "concurrent_001"
  },
  "content": [
    SpeakerColumn,
    SpeakerColumn
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique block identifier |
| `content` | array of SpeakerColumn | yes | Ordered columns, minimum 2, maximum 4 |

### New node: `speakerColumn`

```json
{
  "type": "speakerColumn",
  "attrs": {
    "id": "col_001",
    "speakerName": "WOODY"
  },
  "content": [
    LyricLine,
    LyricLine
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique column identifier |
| `speakerName` | string | yes | Display name for this column's speaker |
| `content` | array of lyricLine | yes | Ordered lines in this column, minimum 1 |

### Changes to `DraftDocument`

Top-level `content` of a `DraftDocument` may now contain `concurrentBlock` in addition to `sectionBlock`.

A `sectionBlock`'s content may now contain `concurrentBlock` in addition to `lyricLine`.

### Changes to `ExportSettings`

Add field `concurrentLayout`:

| Value | Meaning |
|-------|---------|
| `"squash"` | Default. Interleave columns sequentially on export |
| `"sideBySide"` | Print/PDF only. Render columns side-by-side |

---

## Interaction Flows

### Insert Concurrent Block

1. User places cursor at a line boundary or positions cursor within a section
2. User triggers "Insert Concurrent Block" (toolbar button or keyboard shortcut `Ctrl+Shift+K` / `Cmd+Shift+K`, TBD)
3. A dialog prompts: number of speakers (2–4), and names for each
4. User confirms
5. App inserts a `concurrentBlock` with the specified `speakerColumn` nodes, each containing one empty `lyricLine`
6. Cursor moves into the first column's first line

### Edit Within Columns

1. User types in a column — text enters that column's current lyric line only
2. User presses Enter — new lyric line added to the current column only
3. User presses Tab — cursor jumps to same row position in next column (wraps to first column of next row if at last column)
4. User presses Shift-Tab — cursor jumps to same row position in previous column
5. User presses Enter at the last position of the last column in the last row — new row appended across all columns; cursor moves to first column of new row

### Edit Speaker Name

1. User clicks speaker name above a column
2. Name becomes an editable inline text input
3. User types new name
4. On blur or Enter, name is saved to `speakerColumn.attrs.speakerName`

### Add/Remove Column

1. User right-clicks the concurrent block or uses a block toolbar
2. "Add Speaker" option appends a new column with a prompt for name
3. "Remove Speaker" option on a column header removes that column (confirmation dialog if it has content)

### Copy/Paste Within a Column

1. User selects text within a single column
2. Cmd/Ctrl+C copies only the selected column content as plain text
3. Cmd/Ctrl+V pastes into the cursor column only
4. Cross-column selection (user drags across columns) selects entire rows for all selected columns and copies a tab-separated or newline-separated representation

### Export Squash

1. User opens Export dialog
2. `concurrentLayout` setting shows "Interleaved (default)" or "Side-by-side (print only)"
3. On Markdown export, squash is always used regardless of setting
4. On print/PDF export, the setting is respected
5. Squash produces sequential speaker-labeled lines as described above

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| One column is much longer than others | Shorter columns display empty space; on squash, missing rows simply absent |
| Speaker name is blank | Falls back to "Speaker N" label in display and export |
| All lines in a column are deleted | Column shows one empty line (minimum 1 line per column) |
| User deletes last column | Block is replaced by a standalone `lyricLine` with the remaining column's content |
| User deletes second-to-last column | Confirmed removal; if confirmed, block reduces to single column, then converts to standalone lyric lines |
| Concurrent block inside a section block | Supported; concurrent block inherits no special behavior from the parent section |
| Alternates on lines within a concurrent block | Supported using same `meta.alternates` schema as standalone lyric lines |
| Chords on lines within a concurrent block | Supported in chord mode; chord lane renders per-column |
| Undo inside a column | Undo applies only to that column's operation stack; does not cross-contaminate other columns |
| Save/load round-trip | All column content, speaker names, and lyric line attributes preserved exactly |
| Sharing (Stage 12 blob) | `concurrentBlock` nodes serialized in the share blob using same JSON schema |
| Syllable count gutter | Each column has its own syllable gutter if enabled; gutters render per-column |

---

## Acceptance Criteria

- User can insert a concurrent block with 2–4 named speaker columns
- Each column is independently editable (type, Enter, Backspace, undo)
- Tab / Shift-Tab navigation moves between columns
- Enter at the last row position of the last column creates a new row in all columns
- Copy/paste works within a single column without affecting other columns
- Speaker names are editable above each column
- Columns can be added and removed
- Display toggle for speaker labels hides column headers only
- Export in squash mode produces correctly interleaved sequential lines, left-to-right per row
- Print export in side-by-side mode renders columns visually adjacent
- Markdown export always uses squash
- Save/load fully round-trips all concurrent block content
- Undo works correctly within each column
- Empty trailing cells do not generate empty lines in squash export

---

## Stage Dependency

- Depends on: Stage 4 (unified `lyricLine` node), Stage 11 (export pipeline)
- Must not break: any existing `lyricLine`, `sectionBlock`, speaker/stage direction, alternates, or chord behavior
- Proposed stage: **Stage 13**
