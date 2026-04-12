# Cyril — Feature Specifications

## Purpose

This document defines feature-level behavior for Cyril.

Each feature section includes:
- feature ID
- tags
- summary
- included behaviors
- excluded behaviors
- data dependencies
- stage dependency
- edge cases
- acceptance notes

Read only the features required for the current stage in `STAGES.md`.

---

## Feature 1: Project CRUD

**Tags:** `[PROJECT] [PERSISTENCE]`

### Summary
Create, open, rename, duplicate, and delete `.cyril` projects.

### User Value
Allows the user to manage song projects as local-first files.

### Included Behaviors
- Create new project from default template
- Open existing `.cyril` project
- Rename project title
- Duplicate project
- Delete project from local app index or local storage reference
- Save project to canonical `.cyril` file
- Load project into app state

### Excluded Behaviors
- Cloud sync
- Account-based ownership
- Collaborative project permissions

### Data Dependencies
- `project`
- `schemaVersion`
- `createdAt`
- `updatedAt`

### Stage Dependency
- Stage 1

### Edge Cases
- Invalid JSON file
- Valid JSON but invalid `.cyril` schema
- Opening file with missing optional fields
- Duplicate title names
- Opening file with unknown extra fields

### Acceptance Notes
- New project opens successfully
- Existing project loads without data loss
- Rename updates title and persists
- Duplicate creates distinct project ID
- Delete removes project from available project list/index

---

## Feature 2: Rich Text Editor Foundation

**Tags:** `[EDITOR] [UNDO]`

### Summary
Provide a smooth rich text editing experience for workspace docs and draft content.

### User Value
This is the core writing surface. It must feel reliable and fast.

### Included Behaviors
- Normal typing
- Text selection
- Copy/paste
- Bold
- Italic
- Indentation
- Undo/redo
- Keyboard shortcuts for formatting
- Line breaks and paragraph breaks
- Basic toolbar or shortcuts

### Excluded Behaviors
- Metadata tags
- Section blocks
- Chords
- Alternates
- Prosody
- Collaboration

### Data Dependencies
- `RichTextDocument`
- text nodes
- paragraph nodes
- bold/italic marks

### Stage Dependency
- Stage 2

### Edge Cases
- Paste rich text from Google Docs
- Paste plain text
- Undo after multiple format operations
- Empty editor state
- Selecting across multiple lines

### Acceptance Notes
- Editor remains responsive during normal use
- Bold/italic persist through save/load
- Undo/redo behaves as one would expect in a text editor
- Copy/paste does not corrupt document structure

---

## Feature 3: Workspaces

**Tags:** `[WORKSPACES] [NAV]`

### Summary
Support project-level writing surfaces separate from drafts.

### User Value
Reflects real lyric-writing workflow: brief, structure, hooks, vocabulary.

### Included Behaviors
- Workspace navigation for:
  - Brief
  - Structure
  - Hook Lab
  - Vocabulary World
- Each workspace stores independent content
- Workspace content persists in project

### Excluded Behaviors
- Draft content
- Inventory
- Specialized structured behavior beyond base rich text

### Data Dependencies
- `project.workspaces.brief`
- `project.workspaces.structure`
- `project.workspaces.hookLab`
- `project.workspaces.vocabularyWorld`

### Stage Dependency
- Stage 3

### Edge Cases
- Empty workspaces
- Switching workspaces with unsaved edits
- Reopening project preserves all workspace content

### Acceptance Notes
- User can switch between workspaces without data loss
- Each workspace retains independent content
- Workspace selection is reflected in UI state

---

## Feature 4: Multiple Named Drafts

**Tags:** `[DRAFTS] [WORKSPACES]`

### Summary
Support multiple named lyric drafts inside one project.

### User Value
Allows exploration of alternate approaches and versions within the same song.

### Included Behaviors
- Create draft
- Rename draft
- Delete draft
- Duplicate draft
- Switch active draft
- Draft creation options:
  - blank
  - duplicate text only
  - duplicate inventory only
  - duplicate both

### Excluded Behaviors
- Draft compare/diff
- Merge drafts
- Cross-project draft sharing

### Data Dependencies
- `project.drafts[]`
- `project.activeDraftId`
- `Draft`
- `InventoryDocument`

### Stage Dependency
- Stage 3

### Edge Cases
- Last remaining draft cannot be deleted without replacement
- Duplicate draft must receive new IDs
- Duplicate inventory without text
- Duplicate text without inventory

### Acceptance Notes
- New draft appears in draft list
- Active draft switching updates editor content correctly
- Duplicate mode behaves according to selected option
- Draft deletion does not corrupt remaining drafts

---

## Feature 5: Structured Sections

**Tags:** `[SECTIONS]`

### Summary
Represent lyric structure using section blocks rather than formatting hacks.

### User Value
Allows clearer organization and easier rearrangement of songs.

### Included Behaviors
- Insert section block
- Choose section type:
  - verse
  - chorus
  - bridge
  - intro
  - outro
  - spoken
  - reprise
  - custom
- Optional label
- Optional summary/goal
- Optional section color
- Reorder sections
- Duplicate section
- Delete section

### Excluded Behaviors
- Section diffing
- Nested section hierarchies
- Auto-generated section numbering

### Data Dependencies
- `sectionBlock`
- `sectionType`
- `label`
- `summary`
- `color`

### Stage Dependency
- Stage 4

### Edge Cases
- Empty section
- Reordering first/last section
- Custom section without label
- Duplicating section with internal IDs

### Acceptance Notes
- Section blocks persist through save/load
- Section order is preserved
- Section metadata remains attached to the correct section
- Reorder is undoable

---

## Feature 6: Metadata Tags

**Tags:** `[METADATA] [DISPLAY]`

### Summary
Store and display structured metadata such as speaker labels and stage directions.

### User Value
Replaces formatting hacks with semantic lyric annotations.

### Included Behaviors
- Add speaker label
- Add stage direction
- Set lyric line delivery:
  - sung
  - spoken
- Display metadata in styled form
- Preserve metadata in structured document

### Excluded Behaviors
- Comments on metadata
- Per-metadata permissions
- Hidden metadata deletion

### Data Dependencies
- `speakerLine`
- `stageDirection`
- `lyricLine.attrs.delivery`

### Stage Dependency
- Stage 4

### Edge Cases
- Multiple metadata items before one lyric line
- Consecutive speaker changes
- Hidden metadata still exported when export setting includes it
- Spoken lyric lines without explicit speaker

### Acceptance Notes
- Metadata renders clearly
- Metadata survives save/load
- Hiding metadata affects visibility only, not persistence

---

## Feature 7: Display Toggles

**Tags:** `[DISPLAY]`

### Summary
Allow the user to hide/show structured elements without changing underlying content.

### User Value
Supports drafting mode, clean reading mode, and cleaner printing.

### Included Behaviors
Toggle visibility of:
- chords
- section labels
- speaker labels
- stage directions
- section summaries
- syllable counts

### Excluded Behaviors
- Content deletion
- Per-line visibility settings
- Print-only hidden state separate from export settings

### Data Dependencies
- `draftSettings`
- `displaySettings`

### Stage Dependency
- Stage 4 for metadata toggles
- Stage 6 for syllables
- Stage 9 for chords

### Edge Cases
- Toggle off element type not present in document
- Switch drafts with different draft settings
- Hidden content still present after reopen

### Acceptance Notes
- Toggling visibility does not mutate document content
- Toggled state persists at draft or project level as defined
- Export remains governed by export settings, not current display alone

---

## Feature 8: Inventory Pane

**Tags:** `[INVENTORY] [NAV]`

### Summary
Provide a draft-specific scratchpad visible beside the lyric editor.

### User Value
Keeps spare lines, rhymes, and useful fragments available while drafting.

### Included Behaviors
- Bottom-right panel displays inventory
- Inventory is editable rich text or simple formatted text
- Inventory persists per draft
- Copying from inventory is easy
- Pasting into draft is easy
- New draft creation may duplicate inventory selectively

### Excluded Behaviors
- Global inventory vault
- Inventory tagging
- Search/filter
- Drag-and-drop semantics in v1 unless trivial

### Data Dependencies
- `draft.inventory`

### Stage Dependency
- Stage 5

### Edge Cases
- Empty inventory
- Switching drafts with different inventory
- Duplicate draft with/without inventory
- Inventory hidden/collapsed UI state

### Acceptance Notes
- Inventory content persists independently per draft
- Editing inventory does not affect draft content directly
- Inventory remains visible alongside draft editor in default layout

---

## Feature 9: Syllable Counts

**Tags:** `[PROSODY] [DISPLAY]`

### Summary
Show estimated syllable counts for lyric lines.

### User Value
Helps with prosody while remaining unobtrusive.

### Included Behaviors
- Compute syllable count for lyric lines
- Display count in subtle gutter
- Toggle display on/off
- Recompute when lyric line changes

### Excluded Behaviors
- Prosody enforcement
- AI meter correction
- Advanced stress diagnostics if too noisy

### Data Dependencies
- `lyricLine.meta.prosody`
- `draftSettings.showSyllableCounts`

### Stage Dependency
- Stage 6

### Edge Cases
- Enjambed phrasing
- Non-dictionary words
- Character names and punctuation
- Empty lyric lines

### Acceptance Notes
- Syllable display is non-intrusive
- Failure to compute does not block editing
- Recomputed values persist or update as designed

---

## Feature 10: Rhyme Visualization

**Tags:** `[PROSODY] [DISPLAY] [RHYME]`

### Summary
Allow lyric rhyme group coloring for visual review.

### User Value
Makes rhyme relationships easier to scan than abstract labels.

### Included Behaviors
- Manual rhyme group assignment to lyric lines or words
- Visual color display when enabled
- Project-level rhyme color mode:
  - off
  - manual

### Excluded Behaviors
- Automatic rhyme detection in v1
- Complex rhyme scheme labeling
- Phonetic matching engine in editor core

### Data Dependencies
- `lyricLine.attrs.rhymeGroup`
- `displaySettings.rhymeColorMode`

### Stage Dependency
- Stage 6 or later if scoped in

### Edge Cases
- Same group used non-consecutively
- Color conflicts with section colors
- Hidden rhyme mode should not remove group assignments

### Acceptance Notes
- Rhyme annotations persist
- Turning rhyme display off does not remove metadata

---

## Feature 11: Tools Sidebar Framework

**Tags:** `[TOOLS]`

### Summary
Top-right panel provides contextual writing tools based on selected word or manual lookup.

### User Value
Removes the need to switch to external browser tabs during drafting.

### Included Behaviors
- Top-right tools panel
- Manual search input
- Populate from selected word via shortcut or context action
- Switch between tool tabs or modes
- Copy result to clipboard on click

### Excluded Behaviors
- AI-generated suggestions
- Inline auto-complete writing assistance
- Multi-provider ranking UI in v1 unless needed

### Data Dependencies
- no schema dependency required beyond UI state

### Stage Dependency
- Stage 7

### Edge Cases
- No selected word
- Empty results
- Provider failure
- Rate-limited provider
- Clipboard failure

### Acceptance Notes
- Tools panel can be used without interrupting editing
- Results are easy to copy
- Provider failures are handled gracefully

---

## Feature 12: Rhyme Finder

**Tags:** `[TOOLS] [RHYME]`

### Summary
Support exact and near rhyme lookup for a selected or typed word.

### User Value
Replaces external rhyme websites in the core drafting flow.

### Included Behaviors
- Exact rhyme lookup
- Near rhyme lookup
- Manual search term entry
- Selected-word population

### Excluded Behaviors
- Full phonetic explorer
- Multisyllabic advanced filters in v1
- AI rhyme suggestions

### Data Dependencies
- external provider abstraction

### Stage Dependency
- Stage 7

### Edge Cases
- Unknown word
- Proper noun
- Provider returns duplicates or strange formatting

### Acceptance Notes
- Exact and near modes are distinct
- Results are usable and copyable

---

## Feature 13: Dictionary / Thesaurus / Idioms / Related Concepts

**Tags:** `[TOOLS] [DICTIONARY]`

### Summary
Provide non-rhyme language tools in the top-right panel.

### User Value
Supports vocabulary exploration, idiom search, and thematic world-building.

### Included Behaviors
- Dictionary lookup
- Thesaurus lookup
- Idioms by word
- Related concepts / thematic clusters
- Copy result to clipboard on click

### Excluded Behaviors
- AI-generated semantic fields
- Mood-search idiom browsing in v1 unless trivial
- Full lexical database management in app

### Data Dependencies
- external provider abstraction

### Stage Dependency
- Stage 7

### Edge Cases
- Provider unavailable
- Results include formatting unsuitable for clipboard
- Ambiguous words
- Multi-word search term

### Acceptance Notes
- Each tool mode is reachable in UI
- Results are copyable and useful
- Failures degrade gracefully

---

## Feature 14: Alternate Lyrics

**Tags:** `[ALTERNATES]`

### Summary
Allow a lyric line to store alternate versions while showing only one active version in the draft.

### User Value
Reduces clutter while preserving creative options.

### Included Behaviors
- Add alternate to lyric line
- View list of alternates
- Activate alternate
- Edit alternate
- Keep active line visible in draft
- Print/export active content only
- Keyboard shortcut to add alternate

### Excluded Behaviors
- Branching document model
- Alternate comments
- Alternate comparison mode
- Section-level alternates in v1

### Data Dependencies
- `lyricLine.meta.alternates`
- `lyricLine.content`

### Stage Dependency
- Stage 8

### Edge Cases
- No alternates
- One alternate only
- Promoting alternate to active content
- Deleting active alternate
- Undo after alternate switch

### Acceptance Notes
- Alternate operations do not corrupt active line content
- Export uses active line only
- Alternate switching is undoable

---

## Feature 15: Chord Lane

**Tags:** `[CHORDS] [DISPLAY]`

### Summary
Provide a visual chord lane above lyric lines for chord-enabled drafts.

### User Value
Replaces fragile plain-text chord alignment with a usable notation/reference layer.

### Included Behaviors
- Draft mode can be `lyricsWithChords`
- Lyric lines can hold chord markers
- Chords displayed above lyric line
- Add chord symbol
- Move chord symbol horizontally
- Position chord before/on/after lyric offsets
- Toggle chord visibility
- Print/export with chords

### Excluded Behaviors
- Playback
- Voicings
- Diagrams
- Transposition
- Harmonic analysis

### Data Dependencies
- `draft.mode`
- `lyricLine.meta.chords`
- `draftSettings.showChords`

### Stage Dependency
- Stage 9

### Edge Cases
- Chord before first character
- Chord after last character
- Multiple chords on one line
- Editing lyric text after chord placement
- Draft switched from lyrics to lyricsWithChords

### Acceptance Notes
- Chords persist through save/load
- Chords are visually more stable than plain text spacing
- Chords do not alter lyric text content
- Chord visibility toggle does not delete chord data

---

## Feature 16: Export and Print

**Tags:** `[EXPORT] [PRINT]`

### Summary
Export structured project content to Markdown and printable PDF output.

### User Value
Produces clean lyric sheets and chord sheets without manual cleanup.

### Included Behaviors
- Export to Markdown
- Export to print-ready HTML/PDF flow
- Export modes:
  - lyrics only
  - lyrics + chords
- Export toggles:
  - include/exclude section labels
  - include/exclude speaker labels
  - include/exclude stage directions
  - include/exclude chords
- Compact page density option

### Excluded Behaviors
- DOCX export in v1
- Complex typography system
- Multi-column layout in v1 unless added later
- Export of inactive alternates

### Data Dependencies
- `exportSettings`
- `project`
- `draft`
- active lyric content only
- structured metadata nodes
- chord markers

### Stage Dependency
- Stage 10

### Edge Cases
- Empty draft
- Export with hidden metadata but export settings include it
- Export from chord-less draft with includeChords=true
- Long project across multiple pages

### Acceptance Notes
- Export reads canonical structured data
- Export is not dependent on current editor DOM
- Export respects toggles
- Export includes only active alternate content

---

## Feature 17: Lightweight Sharing

**Tags:** `[SHARING]`

### Summary
Provide minimal sharing after local-first workflow is stable.

### User Value
Allows easy reading or light editing by collaborators.

### Included Behaviors
- Minimal share flow if implemented
- View-only or edit-capable mode at coarse project level

### Excluded Behaviors
- Real-time co-editing
- Comments
- Suggestions mode
- Identity-based permissions
- Commercial collaboration model

### Data Dependencies
- depends on later architecture choice

### Stage Dependency
- Stage 11 or deferred

### Edge Cases
- Share target unavailable
- Local file changed after share artifact generated

### Acceptance Notes
- Sharing must not compromise local-first core
- If omitted from v1, no workaround architecture is required yet