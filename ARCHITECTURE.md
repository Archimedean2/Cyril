# Cyril — Architecture

## Purpose

This document defines the engineering architecture for Cyril.

It is the source of truth for:
- app structure
- stack choices
- editor strategy
- persistence strategy
- module boundaries
- tool integration strategy
- export strategy
- implementation constraints

This document explains **how the app should be built**, not product scope or feature behavior.

---

## Architecture Goals

1. Desktop-first UX
2. Local-first persistence
3. High-quality editor experience
4. Strong support for structured lyric semantics
5. Modular implementation suitable for staged agent work
6. Low-friction export and future extensibility
7. Minimal dependence on backend infrastructure for v1

---

## Product Form

Cyril should be implemented as a **standalone local-first web app**.

Recommended near-term deployment modes:
- browser-based local app during development
- optionally packaged later as a desktop app shell if desired

For v1, architecture should not require:
- user accounts
- cloud database
- real-time sync
- server-side collaboration

---

## Recommended Stack

### Frontend
- **TypeScript**
- **React**
- **Vite**
- **Tiptap** (ProseMirror-based editor)
- **CSS modules** or **Tailwind** for styling
- **Zustand** or lightweight React state for app-level UI state

### Persistence
Choose one of these approaches:

#### Preferred if staying purely web/local:
- Browser File System Access API where available
- fallback to downloadable/importable `.cyril` files
- local autosave via IndexedDB

#### Preferred if packaging desktop later:
- Electron or Tauri file access layer
- local filesystem `.cyril` save/load
- optional autosave mirror in app data directory

### Export
- Markdown export implemented client-side
- PDF export via print-rendered HTML or client PDF pipeline

### Tool integrations
- provider abstraction layer
- external API or embedded integrations behind a clean interface

---

## Why Tiptap / ProseMirror

The editor must support:
- rich text marks
- structured blocks
- metadata nodes
- custom line semantics
- decorations (syllable counts, rhyme highlights)
- later custom rendering for chords and alternates

Tiptap/ProseMirror is recommended because it:
- is mature
- supports schema-driven structured documents
- works well with custom nodes and extensions
- is much better suited than raw `contenteditable`
- is a stronger fit than simpler textarea/code-editor approaches for mixed rich text + semantic structure

### Rejected alternatives

#### Plain contenteditable
Rejected because:
- hard to make robust
- copy/paste and selection behavior become fragile
- custom semantics become messy

#### CodeMirror / Monaco as primary editor
Rejected because:
- strong for plain text/code
- less natural for rich text + metadata tags + lyric semantics

#### Slate
Possible, but less preferred than Tiptap for this project’s combination of structure and extensibility.

---

## App Architecture Overview

The app should be split into four layers:

1. **Core domain layer**
   - project schema types
   - draft types
   - validation
   - migration
   - ID generation
   - serialization/deserialization

2. **Persistence layer**
   - load/save `.cyril`
   - autosave
   - import/export
   - local cache/indexing

3. **Editor/document layer**
   - Tiptap schema/extensions
   - document transforms
   - metadata insertion
   - section operations
   - prosody/chord/alternate hooks

4. **UI/application layer**
   - layout
   - navigation
   - sidebars
   - dialogs
   - view state
   - command routing

---

## High-Level Module Boundaries

### Domain modules
Responsible for:
- TypeScript types/interfaces
- defaults
- schema validation
- normalization
- migrations

Must not depend on UI framework code.

### Persistence modules
Responsible for:
- reading/writing project files
- autosave snapshots
- import/export transforms

Must not contain editor UI logic.

### Editor modules
Responsible for:
- editor schema
- custom nodes
- commands
- rendering extensions
- selection-sensitive actions

Must not know about file APIs directly.

### UI modules
Responsible for:
- panes
- menus
- draft switching
- modals
- settings panels

Should call domain/persistence/editor APIs rather than embedding logic directly.

---

## Suggested Directory Structure

```text
src/
  app/
    App.tsx
    routes/
    layout/
    state/

  domain/
    project/
      types.ts
      defaults.ts
      validation.ts
      migration.ts
      ids.ts
    drafts/
    workspaces/
    export/

  persistence/
    fileSystem/
      loadProject.ts
      saveProject.ts
      createProject.ts
      deleteProject.ts
    autosave/
    indexeddb/
    serializers/

  editor/
    core/
      createEditor.ts
      editorSchema.ts
      commands.ts
    nodes/
      sectionBlock/
      speakerLine/
      stageDirection/
      lyricLine/
      paragraph/
    marks/
      bold/
      italic/
    extensions/
      syllables/
      rhymeHighlight/
      alternates/
      chords/
    transforms/
      sections.ts
      metadata.ts
      drafts.ts

  features/
    project-manager/
    workspace-nav/
    draft-manager/
    inventory-pane/
    tools-pane/
    export-panel/
    display-controls/

  components/
    layout/
    panes/
    controls/
    dialogs/

  utils/
    text/
    clipboard/
    timestamps/
    guards/
```

Keep modules small. Do not centralize everything into a few giant files.

---

## State Management Strategy

### Domain state
Project data should be represented as a normalized in-memory project object matching `DATA_MODEL.md`.

### UI state
UI-only state should be kept separate from project content.

Examples of UI state:
- current selected workspace
- current selected draft
- whether sidebar is collapsed
- modal open/closed state
- selected tool tab

### Recommended state split
- **project content state**: current `.cyril` document
- **editor session state**: editor instances and current editing context
- **UI state**: layout and interaction controls

Do not mix these unnecessarily.

---

## Persistence Strategy

## Local-first rules
Cyril must remain useful without any cloud service.

### Required persistence behaviors
- create new project from template
- save project to `.cyril`
- open existing `.cyril`
- autosave locally
- recover from unsaved session if practical

### Recommended v1 persistence model
Use a dual persistence strategy:

1. **primary project file**
   - explicit user-owned `.cyril` file

2. **local autosave cache**
   - IndexedDB or app-local storage
   - keyed by project ID
   - supports crash recovery and smoother editing

### Save model
- explicit save writes canonical `.cyril`
- autosave writes local cache
- opening a project may offer recovery if autosave is newer than file version

---

## Validation and Migration

All loaded project data should pass through:

1. parse
2. validate
3. normalize defaults
4. migrate if necessary

This should happen in the persistence/domain layer, not inside UI components.

### Rule
Never assume raw loaded JSON already matches the current app model.

---

## Editor Architecture

The editor system should support different document surfaces.

### Surfaces
- workspace editors
  - Brief
  - Structure
  - Hook Lab
  - Vocabulary World

- draft editor
  - structured lyric-aware editor

### Important rule
Workspace editors and draft editor may share base editor config, but the draft editor must support additional structured nodes.

### Recommended approach
Create:
- a **base editor extension set**
- a **draft editor extension set**
- optional feature extensions layered by stage

This prevents stage coupling.

---

## Draft Editor Node Strategy

### Core node types
- `paragraph`
- `text`
- `sectionBlock`
- `speakerLine`
- `stageDirection`
- `lyricLine`

### Core marks
- bold
- italic

### Later extensions
- syllable decorations
- rhyme decorations
- alternate UI
- chord lane rendering

Important:
Do not implement future-stage nodes early unless needed for schema compatibility.

---

## Structured Editing Strategy

The product must support structured operations such as:
- insert section
- set speaker
- set stage direction
- toggle visibility
- duplicate draft
- reorder sections

These should be implemented as explicit editor commands or domain transforms, not ad hoc DOM manipulation.

### Rule
All structural editor actions should be:
- deterministic
- undoable
- schema-safe

---

## Undo/Redo Requirements

Undo/redo integrity is critical.

### Rules
- user actions should map cleanly to editor transactions
- structural actions should be single logical undo steps where possible
- persistence side effects must not pollute undo history
- toggling display visibility should not alter document content

This is especially important for:
- section insertion
- metadata insertion
- alternate switching
- chord movement

---

## Inventory Architecture

Inventory is draft-specific and should be treated as a separate document surface.

### Important rule
Do not store inventory inside the draft editor document tree.

Keep it separate as:
- a dedicated draft field in the project data
- a separate editor instance or document surface

This avoids entangling inventory with lyric content and simplifies duplication/export rules.

---

## Tools Sidebar Architecture

The tools pane should be built as a provider-driven system.

### Tool provider abstraction
Create a provider interface such as:

- lookupRhyme(term, mode)
- lookupDictionary(term)
- lookupThesaurus(term)
- lookupIdioms(term)
- lookupRelatedConcepts(term)

### Why
This allows:
- quick pragmatic integrations in v1
- replacement of data sources later
- easier testing
- reduced coupling to external sites/APIs

### Rule
UI components must not hardcode external service behavior directly if avoidable.

---

## Prosody Architecture

Prosody should be treated as assistive derived data.

### Rule
Syllable counts and stress patterns may be:
- computed on demand
- cached in document meta
- recomputed when line text changes

But:
- prosody data must never become the source of truth for text
- failure to compute prosody must not block editing

---

## Alternates Architecture

Alternates should be implemented as a lightweight line-level feature in v1.

### Rule
Do not create a branching-document model.

Use:
- active line content in `lyricLine.content`
- alternate options in `lyricLine.meta.alternates`

This keeps editor complexity manageable.

---

## Chord Architecture

Chords are a late-stage feature and should be isolated accordingly.

### Rule
Chord support should be implemented as:
- line-level marker metadata
- separate rendering/decorations/UI controls
- not as inline lyric text

### Important constraint
Chord storage is data-model-level.
Chord rendering is editor-extension-level.

Do not solve chord display by inserting fake spaces or extra text lines.

---

## Export Architecture

Exports should be transform-based, not editor-DOM scraping based.

### Export pipeline
1. Load canonical project model
2. Choose export target and options
3. Transform structured document to export representation
4. Render output

### Export targets in v1
- Markdown
- printable HTML/PDF

### Important rule
Export should read from structured data, not from current visual display DOM.

This is necessary because:
- metadata may be hidden in UI
- chords may be rendered via decorations
- alternates should export active content only

---

## Rendering Strategy for Print/PDF

Recommended approach:
- create a dedicated print/export renderer from project data
- render to clean HTML
- print to PDF from that representation

Do not rely on screenshotting or editor DOM capture.

---

## Sharing Architecture

Sharing is deferred for v1.

If later implemented, it should be layered on top of:
- the canonical project data model
- export/render pipelines
- optional file sync or static share artifacts

Do not add server architecture for sharing before local-first core is stable.

---

## Performance Constraints

The app is not expected to handle huge documents, but it must feel responsive.

### Performance priorities
- typing latency must remain low
- switching drafts/workspaces must feel immediate
- right sidebar interactions must not freeze editor
- prosody computation must be throttled/debounced if needed
- external tool calls must not block editor input

---

## Error Handling Requirements

The app should gracefully handle:
- invalid `.cyril` files
- partial schema mismatches
- failed tool lookups
- failed exports
- autosave write issues

### Rule
Failures in auxiliary systems must not destroy project content or block the core editor unnecessarily.

---

## Testing Priorities

The most important architecture-level test areas are:
1. load/save correctness
2. schema validation and normalization
3. editor undo/redo integrity
4. project switching without state corruption
5. draft duplication correctness
6. hidden metadata persistence
7. export correctness from canonical data
8. tool provider isolation from UI

---

## Deferred Architecture

The following are intentionally deferred:
- cloud sync
- authentication
- collaboration backend
- comments system
- account-linked projects
- sync conflict resolution
- mobile-specific architecture
- plugin ecosystem

Do not prepare speculative infrastructure for these in v1 unless it has clear immediate value.

---

## Key Implementation Constraints

1. Do not build around raw HTML as canonical storage
2. Do not put inventory inside draft document content
3. Do not encode metadata using formatting-only conventions
4. Do not use plain text alignment hacks for chords
5. Do not bind export to rendered editor DOM
6. Do not tightly couple tool UI to a single external provider
7. Do not introduce server dependency for basic local use

---

## Recommended Initial Technical Decisions

These should be assumed unless explicitly revised:

- Frontend: React + TypeScript + Vite
- Editor: Tiptap
- Local autosave: IndexedDB
- File format: JSON `.cyril`
- Print/PDF: HTML render + print
- App state: lightweight store + editor-managed document state
- Tool integrations: provider abstraction with pragmatic source implementation
```

---
