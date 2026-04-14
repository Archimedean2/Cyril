# Cyril — Implementation Stages

## Purpose

This document defines the build sequence for Cyril.

Each stage is intentionally limited in scope.
Do not begin a later stage until the current stage satisfies all acceptance criteria.

For each stage:
1. Read the stage section here
2. Read the referenced feature sections in `FEATURES.md`
3. Check required schema in `DATA_MODEL.md`
4. Implement only what is in scope
5. Run the matching tests in `TESTS.md`
6. Update `PROGRESS.md`

---

## Stage 0: Project Scaffolding and App Shell

**Tags:** `[SCAFFOLD] [NAV] [STAGE-0]`

### Objective
Create the project skeleton and application shell with the intended desktop layout.

### Why this stage exists
Provides a stable place to add features without redesigning the app structure later.

### Read First
- `SCOPE.md`
- `ARCHITECTURE.md`
- `DATA_MODEL.md` (overview only)

### Feature Sections to Read
- none required

### In Scope
- Initialize project with chosen stack
- Base app layout
- Left navigation area
- Center content area
- Right split sidebar
- Empty state when no project is loaded
- Basic theming/layout styling
- Placeholder panel headers
- App boot without runtime errors

### Explicitly Out of Scope
- Real project loading
- Editor behavior
- Persistence
- Export
- Tools
- Inventory logic
- Drafts
- Metadata
- Chords
- Alternates

### Files to Create
- app shell files
- layout components
- placeholder pane components
- base styles
- initial state scaffolding

### Files to Modify
- root app entrypoint
- global styles/config

### Implementation Notes
- Match the intended desktop layout:
  - left nav
  - center editor
  - right sidebar split top/bottom
- Do not overbuild panel logic yet
- Use placeholder text/components where necessary

### Acceptance Criteria
- App runs locally
- Shell layout renders without errors
- Left, center, and right panels are visible
- Right panel is visually split into top and bottom sections
- Empty state is shown when no project is loaded
- Codebase is organized into modular folders

### Stop Condition
Do not move on until the app shell is stable and visually matches the intended layout.

---

## Stage 1: Project CRUD and Local Persistence

**Tags:** `[PROJECT] [PERSISTENCE] [STAGE-1]`

### Objective
Make `.cyril` projects real: create, open, save, rename, duplicate, delete.

### Why this stage exists
Everything else depends on stable project loading and saving.

### Read First
- `DATA_MODEL.md`
- `ARCHITECTURE.md` persistence sections

### Feature Sections to Read
- Feature 1: Project CRUD

### In Scope
- Create project from default template
- Load/open `.cyril`
- Save `.cyril`
- Rename project title
- Duplicate project with new IDs
- Delete project from app-local index/reference
- Validate and normalize project on load
- Keep project state in memory
- Project list or recent-projects mechanism if practical

### Explicitly Out of Scope
- Rich text editing
- Draft UI
- Export
- Autosave recovery UX
- Cloud backup
- Sharing

### Files to Create
- domain types/defaults/validation/migration
- persistence load/save/create/delete utilities
- project manager UI
- project template creator

### Files to Modify
- app shell to load active project
- navigation area to display current project
- state modules for project state

### Implementation Notes
- Follow `DATA_MODEL.md` strictly
- Save/load must preserve unknown fields if practical
- Duplicating a project must generate new project ID
- If drafts exist, duplicate draft IDs too

### Acceptance Criteria
- New project can be created
- New project matches schema defaults
- Existing `.cyril` can be opened
- Project title can be changed and saved
- Project can be duplicated without ID collisions
- Project can be deleted from app-local index/reference
- Reloading preserves project content exactly
- Invalid project files fail gracefully

### Stop Condition
Do not continue until canonical save/load works reliably.

---

## Stage 2: Editor Foundation

**Tags:** `[EDITOR] [UNDO] [STAGE-2]`

### Objective
Create a high-quality rich text editor foundation.

### Why this stage exists
If editing quality is weak, the product fails regardless of later features.

### Read First
- `ARCHITECTURE.md` editor sections
- `DATA_MODEL.md` rich text document model

### Feature Sections to Read
- Feature 2: Rich Text Editor Foundation

### In Scope
- Base editor instance
- Rich text support for paragraphs/text
- Bold
- Italic
- Indentation
- Copy/paste
- Undo/redo
- Keyboard shortcuts
- Workspace-compatible editor surface
- Draft-compatible base editor surface
- Save/load round trip for base text content

### Explicitly Out of Scope
- Workspaces UI logic
- Multiple drafts
- Sections
- Metadata tags
- Syllables
- Inventory
- Tools
- Alternates
- Chords

### Files to Create
- editor core setup
- base schema/extensions
- formatting commands
- keyboard shortcut bindings
- editor wrapper components

### Files to Modify
- center panel content
- project state integration
- save/load serialization bridge

### Implementation Notes
- Use a shared base editor config
- Keep schema minimal at this stage
- Prioritize paste stability and undo integrity
- Do not add speculative custom nodes yet beyond what is necessary

### Acceptance Criteria
- User can type and edit text smoothly
- Bold works
- Italic works
- Indentation works
- Copy/paste works
- Undo/redo works
- Editor content can be saved and reloaded
- No major cursor/selection corruption in normal usage

### Stop Condition
Do not continue until editing feels solid enough for real drafting.

---

## Stage 3: Workspaces and Multiple Drafts

**Tags:** `[WORKSPACES] [DRAFTS] [NAV] [STAGE-3]`

### Objective
Support the user’s real workflow with multiple project-level workspaces and multiple named drafts.

### Why this stage exists
This stage turns the shell + editor into a usable writing environment.

### Read First
- `DATA_MODEL.md` workspace and draft schemas

### Feature Sections to Read
- Feature 3: Workspaces
- Feature 4: Multiple Named Drafts

### In Scope
- Workspace navigation:
  - Brief
  - Structure
  - Hook Lab
  - Vocabulary World
- Draft list in left navigation
- Create draft
- Rename draft
- Delete draft
- Duplicate draft
- Draft creation options:
  - blank
  - duplicate text only
  - duplicate inventory only
  - duplicate both
- Active draft switching
- Separate editor content for workspaces vs drafts
- Ensure layout and interaction follow `WIREFRAMES.md`, `DESIGN_SYSTEM.md`, `UI_TOKENS.md`, `COMPONENT_MAP.md`, and `docs/interactions/workspace-and-draft-flows.md`

### Explicitly Out of Scope
- Structured sections
- Metadata tags
- Inventory pane UI
- Tools pane logic
- Prosody
- Alternates
- Chords

### Files to Create
- workspace navigation components
- draft list/manager components
- draft creation dialog/flow
- draft duplication utilities

### Files to Modify
- left navigation
- app state for active workspace/draft
- persistence integration for drafts/workspaces

### Implementation Notes
- Drafts and workspaces are different surfaces; do not conflate them
- Inventory data may exist in schema but inventory pane UI is Stage 5
- Use stable IDs for duplicated drafts and nested entities

### Acceptance Criteria
- User can switch between all workspaces
- User can create multiple drafts
- User can rename a draft
- User can delete a draft safely
- User can duplicate a draft using each duplication option
- Active draft changes editor content correctly
- Workspace content remains separate from draft content

### Stop Condition
Do not continue until project navigation and multi-draft workflow are stable.

---

## Stage 4: Structured Sections and Metadata

**Tags:** `[SECTIONS] [METADATA] [DISPLAY] [STAGE-4]`

### Objective
Replace formatting hacks with structured lyric-aware semantics.

### Why this stage exists
This is one of Cyril’s key differentiators from Google Docs.

### Read First
- `DATA_MODEL.md` sectionBlock, speakerLine, stageDirection, lyricLine
- `ARCHITECTURE.md` structured editing strategy

### Feature Sections to Read
- Feature 5: Structured Sections
- Feature 6: Metadata Tags
- Feature 7: Display Toggles (metadata-related parts only)

### In Scope
- Section blocks
- Section type selection
- Optional section label
- Optional section summary
- Optional section color
- Section insert/delete/duplicate/reorder
- Speaker label insertion
- Stage direction insertion
- Lyric line delivery field (`sung` / `spoken`)
- Visibility toggles for:
  - section labels
  - speaker labels
  - stage directions
  - section summaries

### Explicitly Out of Scope
- Syllable counts
- Tools sidebar
- Inventory pane
- Alternates
- Chords
- Export

### Files to Create
- custom editor nodes for sections and metadata
- section commands
- metadata commands
- display toggle UI
- structured render components

### Files to Modify
- draft editor configuration
- draft toolbar/controls
- draft settings persistence

### Implementation Notes
- Hiding metadata must not mutate document content
- Section reorder should be an explicit command
- Keep structured semantics in node data, not formatting marks

### Acceptance Criteria
- User can insert and edit sections
- User can assign section type/label/summary/color
- User can reorder sections
- User can insert speaker labels
- User can insert stage directions
- Spoken/sung state can be stored on lyric lines
- Metadata visibility toggles work without data loss
- Save/load preserves all structured data

### Stop Condition
Do not continue until structured lyric semantics are stable and persistent.

---

## Stage 5: Inventory Pane

**Tags:** `[INVENTORY] [NAV] [STAGE-5]`

### Objective
Add the draft-specific inventory scratchpad in the bottom-right pane.

### Why this stage exists
Inventory is central to the user’s real drafting workflow.

### Read First
- `DATA_MODEL.md` inventory schema
- `ARCHITECTURE.md` inventory architecture

### Feature Sections to Read
- Feature 8: Inventory Pane

### In Scope
- Bottom-right inventory pane
- Inventory editor/document surface
- Draft-specific inventory loading
- Inventory persistence
- Switching drafts switches inventory
- Inventory duplication behavior already reflected when using draft duplication flow
- Basic collapse/show behavior if practical

### Explicitly Out of Scope
- Inventory tagging
- Search/filter
- Drag-and-drop insertion
- Global vault

### Files to Create
- inventory pane UI
- inventory editor wrapper
- inventory binding logic

### Files to Modify
- right sidebar
- draft manager flows if needed for duplication handling
- persistence wiring for inventory updates

### Implementation Notes
- Inventory is not part of the draft editor document tree
- Keep inventory interactions simple
- Copy/paste friendliness matters more than sophisticated UI

### Acceptance Criteria
- Inventory appears in bottom-right pane
- Inventory persists per draft
- Switching drafts updates inventory correctly
- Editing inventory does not corrupt draft content
- Draft duplication respects selected inventory duplication option

### Stop Condition
Do not continue until inventory behaves as a reliable draft-specific scratchpad.

---

## Stage 6: Prosody and Lightweight Visualization

**Tags:** `[PROSODY] [DISPLAY] [RHYME] [STAGE-6]`

### Objective
Add subtle lyric intelligence with minimal disruption.

### Why this stage exists
This adds genuine value for lyric writing without requiring heavy architecture.

### Read First
- `DATA_MODEL.md` prosody fields and rhyme group fields
- `ARCHITECTURE.md` prosody architecture

### Feature Sections to Read
- Feature 9: Syllable Counts
- Feature 10: Rhyme Visualization

### In Scope
- Syllable count computation for lyric lines
- Syllable gutter display
- Toggle syllable display on/off
- Manual rhyme group assignment if included in this stage
- Manual rhyme color display if included

### Explicitly Out of Scope
- AI prosody suggestions
- Automatic rhyme detection
- Stress-heavy visualizations unless trivial and low-noise

### Files to Create
- prosody utilities
- syllable gutter extension/decorations
- optional rhyme annotation UI

### Files to Modify
- draft editor config
- display controls
- lyric line update handling

### Implementation Notes
- Syllable counts are advisory only
- Compute gracefully; failures should not break editing
- Keep visuals faint and optional

### Acceptance Criteria
- Syllable counts appear for lyric lines
- Syllable counts update when lyric text changes
- User can toggle syllable display
- If rhyme mode is included, rhyme annotations persist and display correctly

### Stop Condition
Do not continue until prosody features are stable and non-intrusive.

---

## Stage 7: Tools Sidebar

**Tags:** `[TOOLS] [RHYME] [DICTIONARY] [STAGE-7]`

### Objective
Make the top-right pane useful for contextual word exploration.

### Why this stage exists
This replaces external browser-tab lookups in the writing flow.

### Read First
- `ARCHITECTURE.md` tools sidebar architecture
- relevant provider abstraction notes

### Feature Sections to Read
- Feature 11: Tools Sidebar Framework
- Feature 12: Rhyme Finder
- Feature 13: Dictionary / Thesaurus / Idioms / Related Concepts

### In Scope
- Top-right tools panel
- Manual term search
- Populate term from selected word
- Tool modes:
  - exact rhyme
  - near rhyme
  - dictionary
  - thesaurus
  - idioms
  - related concepts
- Copy result to clipboard on click
- Provider abstraction layer
- Graceful failure states

### Explicitly Out of Scope
- AI-generated suggestions
- Inline completion
- Mood/tone browsing unless trivial
- Multi-provider comparison UI

### Files to Create
- tools pane UI
- provider interfaces
- initial provider implementations
- clipboard helpers
- selected-word command/bridge

### Files to Modify
- right sidebar top section
- editor selection integration
- UI state for active tool mode

### Implementation Notes
- Start with the easiest practical provider approach
- Keep provider code isolated from UI rendering
- Do not hardwire the app to one brittle external integration in UI components

### Acceptance Criteria
- User can open and use tools pane
- Selected word can populate search term
- User can switch tool modes
- Results can be copied to clipboard
- Provider failures do not crash editor

### Stop Condition
Do not continue until tools are usable during live drafting.

---

## Stage 8: Alternate Lyrics

**Tags:** `[ALTERNATES] [STAGE-8]`

### Objective
Add lightweight line-level alternates.

### Why this stage exists
Allows creative branching without cluttering the main draft.

### Read First
- `DATA_MODEL.md` alternate schema
- `ARCHITECTURE.md` alternates architecture

### Feature Sections to Read
- Feature 14: Alternate Lyrics

### In Scope
- Add alternate to lyric line
- View alternates for lyric line
- Activate alternate
- Edit alternate
- Delete alternate
- Keyboard shortcut to add alternate
- Preserve active line text in main content

### Explicitly Out of Scope
- Section-level alternates
- Word-level alternates
- Alternate comparison mode
- Alternate comments

### Files to Create
- alternate UI controls
- alternate editor/overlay/popover components
- alternate commands and transforms

### Files to Modify
- lyric line rendering
- export prep logic if needed
- undo integration

### Implementation Notes
- Keep this line-level only
- Active content must remain easy to edit
- Alternate switching must be undoable as a single logical action where practical

### Acceptance Criteria
- User can add alternate to a line
- User can switch active alternate
- User can edit alternate text
- User can remove alternate
- Save/load preserves alternates
- Main draft shows only active line text

### Stop Condition
Do not continue until alternates feel lightweight and reliable.

---

## Stage 9: Chord Lane

**Tags:** `[CHORDS] [DISPLAY] [STAGE-9]`

### Objective
Add chord support for chord-enabled drafts.

### Why this stage exists
This addresses one of the user’s strongest pain points versus Google Docs.

### Read First
- `DATA_MODEL.md` chord schema
- `ARCHITECTURE.md` chord architecture

### Feature Sections to Read
- Feature 15: Chord Lane
- Feature 7: Display Toggles (chord parts)

### In Scope
- Draft mode `lyricsWithChords`
- Chord lane rendering above lyric lines
- Add chord marker
- Edit chord symbol
- Move chord marker horizontally
- Persist chord positions
- Toggle chord visibility
- Clean rendering in editor

### Explicitly Out of Scope
- Playback
- Voicings
- Diagrams
- Transposition
- Music-theory analysis

### Files to Create
- chord rendering extension
- chord marker controls
- chord commands/transforms

### Files to Modify
- draft settings controls
- lyric line rendering
- export pipeline prep if needed

### Implementation Notes
- Chords must not be stored as plain text spacing hacks
- Chord display may use decorations or custom node views
- Keep placement model consistent with `DATA_MODEL.md`

### Acceptance Criteria
- Draft can be marked chord-enabled
- User can add chord symbols to lyric lines
- User can move chord positions
- Chord data persists through save/load
- Chords can be hidden without deletion
- Chords are visually stable enough to be useful

### Stop Condition
Do not continue until chord-enabled drafts are practically usable.

---

## Stage 10: Local Tool Result Cache

**Tags:** `[TOOLS] [CACHE] [LOCAL-FIRST] [STAGE-10]`

### Objective
Persist normalized results from user-triggered lexical tool lookups so repeated lookups can be served locally and cached data can be reused when a provider is unavailable.

### Why this stage exists
The tools sidebar (Stage 7) calls external providers on every lookup. Caching normalized results locally reduces redundant network calls, makes previously looked-up terms available offline, and makes the tool layer more resilient to provider failures — all without changing the provider abstraction or product direction.

### Read First
- `ARCHITECTURE.md` Tool Provider Caching section
- `DATA_MODEL.md` Local Tool Cache Model section
- `FEATURES.md` Feature 10: Local Tool Result Cache

### Feature Sections to Read
- Feature 10: Local Tool Result Cache

### In Scope
- Local-first cache store for normalized tool lookup results (exact rhyme, near rhyme, dictionary, thesaurus, idioms, related concepts)
- Cache keyed by tool type + query term + provider
- Cache hit path: serve from local cache instead of calling provider
- Cache miss path: call provider, normalize, persist result, return to UI
- Provider failure fallback: serve cached result if provider call fails
- `lastUsedAt` updated on every cache hit
- Cache stored in app-local persistent storage (IndexedDB or equivalent)
- Provider abstraction layer remains intact; cache sits inside the service layer, not in UI components

### Explicitly Out of Scope
- Bulk ingestion or background pre-fetching of lookup data
- Cache management UI (eviction, clearing, browsing) in this stage
- Global vocabulary vault product
- Per-project cache partitioning unless trivial
- Cache TTL-based expiry in v1 unless straightforward to add

### Files to Create
- cache store interface and implementation
- cache-aware lookup service wrapper
- normalized result persistence utilities

### Files to Modify
- tool service layer to route through cache
- provider integration path to persist on response

### Implementation Notes
- Cache must store Cyril-normalized result shapes, not raw provider response payloads
- UI components must not need to know whether a result came from cache or a live provider call
- Do not bypass the provider abstraction layer when writing to or reading from cache
- Cache is supporting reference data; it is not part of canonical song draft content

### Acceptance Criteria
- Repeated lookup for the same term and tool type is served from local cache without calling the provider
- Provider response is normalized before being stored in cache
- Cached results are returned when the provider is unavailable or fails
- Cache entries persist across app reload
- Existing tools sidebar behavior is unchanged when cache is empty
- Provider abstraction layer is not bypassed by the cache implementation

### Stop Condition
Do not continue until the cache layer is transparent to the UI and resilient to provider failure.

---

## Stage 11: Export and Print

**Tags:** `[EXPORT] [PRINT] [STAGE-11]`

### Objective
Produce clean output from canonical project data.

### Why this stage exists
Printing and export are a core workflow, not just polish.

### Read First
- `DATA_MODEL.md` export settings
- `ARCHITECTURE.md` export architecture

### Feature Sections to Read
- Feature 11: Export and Print

### In Scope
- Markdown export
- Print-ready HTML rendering
- PDF via print flow
- Export toggles for:
  - section labels
  - speaker labels
  - stage directions
  - chords
- Page density:
  - normal
  - compact

### Explicitly Out of Scope
- DOCX
- multi-column export
- advanced typography presets
- inactive alternate export

### Files to Create
- export transformers
- print renderer
- export UI controls

### Files to Modify
- project/export settings
- toolbar/menu integration

### Implementation Notes
- Export from canonical project data, not live editor DOM
- Export active alternate content only
- Respect export settings even if display toggles differ in current UI

### Acceptance Criteria
- Markdown export works
- Print view renders correctly
- PDF flow works via print pipeline
- Export settings are respected
- Chords are included/excluded correctly
- Metadata is included/excluded correctly

### Stop Condition
Do not continue until exported output is usable without manual cleanup.

---

## Stage 12: Lightweight Sharing (Optional / Deferred)

**Tags:** `[SHARING] [STAGE-12]`

### Objective
Add a minimal sharing mechanism only after the local-first core is strong.

### Why this stage exists
Useful, but not part of the critical path for the initial product.

### Read First
- `SCOPE.md` sharing limits
- any updated architecture decision if sharing is pursued

### Feature Sections to Read
- Feature 12: Lightweight Sharing

### In Scope
- Minimal sharing workflow if explicitly chosen
- Coarse project-level share mode only

### Explicitly Out of Scope
- Real-time collaboration
- Comments
- Suggestions mode
- account-based permissions
- full sync backend

### Files to Create
- depends on chosen implementation path

### Files to Modify
- depends on chosen implementation path

### Implementation Notes
- This stage may be skipped entirely for the first release
- Do not introduce complex backend architecture unless required by an explicit new decision

### Acceptance Criteria
- Sharing mechanism works in the chosen limited form
- Local-first core remains intact

### Stop Condition
This stage is optional and should not block a usable v1.