# Cyril — UI Component Map

## Purpose

This document defines the primary UI components for Cyril and their responsibilities.

It is intended to:
- keep the UI modular
- prevent giant mixed-responsibility files
- align implementation with the wireframes and design system
- make it easier for coding agents to build one layer at a time

This document describes:
- component names
- responsibilities
- parent/child relationships
- stage relevance
- what each component should not own

---

## Architecture Principle

Components should be split by responsibility, not just by visual region.

Separate:
- shell layout
- navigation
- editor containers
- tool panes
- inventory panes
- dialogs
- display controls

Do not create giant "God components" that contain:
- layout
- business logic
- editor orchestration
- persistence
- toolbar logic
- dialogs
all in one file.

---

## Top-Level UI Tree

```text
App
└── AppShell
    ├── TopBar
    ├── LeftSidebar
    │   ├── ProjectNav
    │   ├── DraftList
    │   └── DisplayControls
    ├── MainPane
    │   ├── EmptyState
    │   ├── WorkspaceView
    │   └── DraftView
    └── RightSidebar
        ├── ToolsPane
        └── InventoryPane
```

This is the core shell.

---

## Stage-by-Stage Component Relevance

### Stage 0
- AppShell
- TopBar
- LeftSidebar
- MainPane
- RightSidebar
- EmptyState

### Stage 1
- ProjectOpenDialog
- ProjectCreateDialog
- RecentProjectsList
- SaveStatusIndicator

### Stage 2
- RichTextEditor
- EditorToolbar
- EditorSurface

### Stage 3
- WorkspaceView
- WorkspaceSwitcher / ProjectNav
- DraftView
- DraftList
- NewDraftDialog

### Stage 4
- SectionBlockView
- SectionHeader
- SpeakerLineView
- StageDirectionView
- DraftMetadataToolbar
- DisplayControls

### Stage 5
- InventoryPane
- InventoryEditor

### Stage 6
- SyllableGutter
- RhymeHighlightLayer (optional)

### Stage 7
- ToolsPane
- ToolsModeTabs
- ToolsSearchInput
- ToolsResultsList

### Stage 8
- AlternateLineButton
- AlternatePopover
- AlternateList

### Stage 9
- ChordLane
- ChordMarker
- ChordEditOverlay

### Stage 10
- ExportDialog
- PrintPreviewView

---

## Top-Level Components

## 1. App

### Responsibility
Application root.
Bootstraps app state, theme, shell, and active project context.

### Owns
- high-level state providers
- app bootstrap
- route or view root if needed

### Does Not Own
- detailed pane logic
- draft rendering
- toolbar controls
- persistence implementation details

---

## 2. AppShell

### Responsibility
The main desktop-style layout.

### Owns
- placement of top bar, left sidebar, main pane, right sidebar
- shell sizing and panel boundaries
- shell-level internal scroll behavior rules

### Children
- TopBar
- LeftSidebar
- MainPane
- RightSidebar

### Does Not Own
- project CRUD logic
- editor commands
- tools provider logic

---

## 3. TopBar

### Responsibility
Compact application header.

### Owns
- app title or breadcrumb
- current project title display
- save status
- export/settings actions later

### Children
- SaveStatusIndicator
- TopBarActions

### Does Not Own
- project editing logic
- large toolbar behavior
- navigation tree

### Notes
Must remain compact and visually quiet.

---

## 4. LeftSidebar

### Responsibility
Project navigation and draft-related controls.

### Owns
- workspace navigation area
- draft list area
- display toggles area

### Children
- SidebarSection
- ProjectNav
- DraftList
- DisplayControls

### Does Not Own
- draft editor state
- workspace editor instance
- project persistence logic

---

## 5. MainPane

### Responsibility
Render the currently active central view.

### Owns
- decides between:
  - EmptyState
  - WorkspaceView
  - DraftView

### Does Not Own
- sidebar logic
- export dialogs
- provider logic

---

## 6. RightSidebar

### Responsibility
Render top tools pane and bottom inventory pane.

### Owns
- top/bottom split layout
- divider between panes

### Children
- ToolsPane
- InventoryPane

### Does Not Own
- tool providers
- inventory persistence logic directly

---

## Navigation Components

## 7. ProjectNav

### Responsibility
Show project-level workspace destinations.

### Entries
- Brief
- Structure
- Hook Lab
- Vocabulary World

### Owns
- active nav highlight
- click navigation between workspaces

### Does Not Own
- workspace content itself

---

## 8. DraftList

### Responsibility
Show all drafts and allow draft selection.

### Owns
- draft rows
- active draft highlight
- “new draft” action
- draft context menu trigger later

### Children
- DraftListItem
- NewDraftButton

### Does Not Own
- draft duplication logic implementation
- draft deletion logic implementation
- editor rendering

---

## 9. DisplayControls

### Responsibility
Show draft view toggles.

### Controls may include
- show chords
- show sections
- show speakers
- show stage directions
- show syllables

### Does Not Own
- document mutation
- export settings

### Important
These are visibility controls, not content editing controls.

---

## Main Content Components

## 10. EmptyState

### Responsibility
Render no-project-open state.

### Owns
- New Project action
- Open Project action
- optional recent projects prompt

---

## 11. WorkspaceView

### Responsibility
Render one of the non-draft workspaces.

### Owns
- workspace title/header
- workspace editor container

### Children
- WorkspaceHeader
- RichTextEditor

### Does Not Own
- draft-specific rendering
- inventory pane logic

---

## 12. DraftView

### Responsibility
Render the active draft workspace.

### Owns
- draft header/title
- draft toolbar/controls
- draft editor container

### Children
- DraftHeader
- DraftToolbar
- DraftEditor

### Does Not Own
- inventory pane
- tools pane

---

## Editor Components

## 13. RichTextEditor

### Responsibility
Generic editor wrapper for project workspaces and simple rich text surfaces.

### Used In
- Brief
- Structure
- Hook Lab
- Vocabulary World
- possibly inventory if shared base is useful

### Owns
- base editor instance/config
- save/update callbacks
- content binding

### Does Not Own
- lyric-specific semantic rendering
- section blocks
- chord lane
- alternates

---

## 14. DraftEditor

### Responsibility
Lyric-aware editor wrapper.

### Owns
- draft editor instance/config
- structured nodes and rendering
- display setting integration
- later hooks for sections/metadata/prosody/alternates/chords

### Children / subparts
- DraftEditorSurface
- DraftEditorToolbar
- line/section renderers later

### Does Not Own
- project navigation
- inventory
- tools provider logic

---

## 15. EditorToolbar

### Responsibility
Compact formatting controls for base rich text editing.

### Controls
- bold
- italic
- indent
- undo
- redo

### Used In
- base editor
- maybe shared in draft editor with extension points

### Does Not Own
- large feature controls
- section insertion unless explicitly extended later

---

## 16. DraftToolbar

### Responsibility
Compact lyric-draft-specific controls.

### Potential controls
- add section
- add speaker
- add direction
- toggle spoken/sung
- formatting shortcuts
- later alternate/chord controls

### Notes
May begin very small in early stages.

---

## Structured Draft Components

## 17. SectionBlockView

### Responsibility
Render a structured section inside a draft.

### Owns
- section container
- section color accent
- section metadata visibility

### Children
- SectionHeader
- section content renderers

---

## 18. SectionHeader

### Responsibility
Render section label and optional summary.

### Owns
- section label display
- summary display
- optional subtle color cue

### Does Not Own
- full section editing behavior

---

## 19. SpeakerLineView

### Responsibility
Render speaker metadata line.

### Notes
Should visually distinguish speaker labels from lyric content.

---

## 20. StageDirectionView

### Responsibility
Render stage direction metadata line.

### Notes
Muted and secondary in visual hierarchy.

---

## 21. LyricLineView

### Responsibility
Render a lyric line and associated overlays/decorations.

### Later children
- SyllableGutter
- ChordLane
- AlternateIndicator
- rhyme highlights as decorations

### Notes
This becomes one of the most important UI components later.

---

## Inventory Components

## 22. InventoryPane

### Responsibility
Bottom-right scratchpad container.

### Owns
- pane header
- inventory editor mounting
- empty state for inventory if needed

### Children
- InventoryEditor

---

## 23. InventoryEditor

### Responsibility
The editable surface for inventory content.

### Notes
Can use base rich text editor or a reduced editor wrapper.
Should remain simple in v1.

---

## Tools Components

## 24. ToolsPane

### Responsibility
Top-right language tools container.

### Owns
- tool mode selection
- search input
- result rendering
- loading/error states

### Children
- ToolsModeTabs
- ToolsSearchInput
- ToolsResultsList

### Does Not Own
- provider implementation internals

---

## 25. ToolsModeTabs

### Responsibility
Switch between:
- rhyme
- near rhyme
- dictionary
- thesaurus
- idioms
- related concepts

---

## 26. ToolsSearchInput

### Responsibility
Term input for tools lookup.

### Notes
Should support selected-word population from editor.

---

## 27. ToolsResultsList

### Responsibility
Render lookup results.

### Owns
- empty state
- loading state
- clickable result rows
- copy-to-clipboard behavior trigger

---

## Alternate Components

## 28. AlternateLineButton

### Responsibility
Subtle control indicating alternates are available or can be added.

### Notes
Should not clutter every line visually.

---

## 29. AlternatePopover

### Responsibility
Line-level alternate management UI.

### Owns
- list of alternates
- active alternate selection
- add/edit/delete actions

### Children
- AlternateList
- AlternateEditorPanel or inline form later

---

## 30. AlternateList

### Responsibility
Render alternate options for a lyric line.

---

## Chord Components

## 31. ChordLane

### Responsibility
Render chord markers above a lyric line.

### Owns
- chord lane layout
- marker positioning
- visibility rules

---

## 32. ChordMarker

### Responsibility
Render a single chord symbol at a stored position.

---

## 33. ChordEditOverlay

### Responsibility
UI affordances for editing chord markers.

### Includes
- drag handle or selection state
- symbol editing affordance
- position guides if needed

---

## Prosody Components

## 34. SyllableGutter

### Responsibility
Render subtle syllable count beside lyric line.

### Notes
Must remain visually quiet.

---

## 35. RhymeHighlightLayer

### Responsibility
Render optional manual rhyme visualization.

### Notes
Likely decoration-based rather than a heavy standalone component.

---

## Dialog Components

## 36. ProjectCreateDialog

### Responsibility
Create a new project.

---

## 37. ProjectOpenDialog

### Responsibility
Open/import existing project.

---

## 38. NewDraftDialog

### Responsibility
Create a new draft and choose duplication mode.

---

## 39. ExportDialog

### Responsibility
Choose export format and inclusion settings.

---

## 40. ConfirmDialog

### Responsibility
Reusable confirmation dialog for deletes/destructive actions.

---

## Utility/Support Components

## 41. SaveStatusIndicator

### Responsibility
Show:
- saved
- unsaved
- saving
- error state if needed later

---

## 42. SidebarSection

### Responsibility
Reusable visual wrapper for sidebar subsections.

### Used for
- Project
- Drafts
- View

---

## 43. PanelHeader

### Responsibility
Reusable compact header for:
- tools pane
- inventory pane
- maybe main subviews

---

## 44. ResizableDivider

### Responsibility
Future-friendly divider for resizable panes.

### Notes
Optional initially.

---

## Suggested File Organization

```text
src/components/layout/
  AppShell.tsx
  TopBar.tsx
  LeftSidebar.tsx
  MainPane.tsx
  RightSidebar.tsx
  SidebarSection.tsx
  PanelHeader.tsx

src/features/workspace-nav/
  ProjectNav.tsx

src/features/draft-manager/
  DraftList.tsx
  DraftListItem.tsx
  NewDraftDialog.tsx

src/features/display-controls/
  DisplayControls.tsx

src/features/project-manager/
  ProjectCreateDialog.tsx
  ProjectOpenDialog.tsx
  SaveStatusIndicator.tsx

src/features/inventory-pane/
  InventoryPane.tsx
  InventoryEditor.tsx

src/features/tools-pane/
  ToolsPane.tsx
  ToolsModeTabs.tsx
  ToolsSearchInput.tsx
  ToolsResultsList.tsx

src/editor/
  DraftEditor.tsx
  RichTextEditor.tsx
  EditorToolbar.tsx
  DraftToolbar.tsx

src/editor/nodes/... and extensions/...
```

---

## Ownership Rules

### Layout components should not own persistence logic
### Editor components should not own project navigation logic
### Sidebar components should not implement domain transforms directly
### Dialogs should call actions/services, not contain deep business logic

This separation is especially important for AI-assisted development.

---

## Smell Tests

A component is too big if it:
- manages more than one pane
- contains both editor setup and project CRUD
- mixes layout, persistence, and domain transforms
- becomes difficult to describe in one sentence

A component split is probably right if:
- each component has one clear responsibility
- files remain small
- props and ownership stay understandable
```
