# Cyril — Test ID Specification

## Rules

1. Use `data-testid`
2. Use lowercase kebab-case
3. Prefer stable structural anchors and major controls
4. Do not over-tag decorative elements
5. For repeated entities, use stable internal IDs:
   - `draft-list-item-<draftId>`
   - `section-block-<sectionId>`
   - `lyric-line-<lineId>`

## Core Required IDs

### Shell
- `app-shell`
- `top-bar`
- `left-sidebar`
- `main-pane`
- `right-sidebar`
- `right-sidebar-tools`
- `right-sidebar-inventory`

### Empty state
- `empty-state`
- `new-project-button`
- `open-project-button`

### Header
- `project-title`
- `save-status`

### Left sidebar
- `project-nav`
- `draft-list`
- `display-controls`

### Workspace nav items
- `nav-brief`
- `nav-structure`
- `nav-hook-lab`
- `nav-vocabulary-world`

### Draft list
- `new-draft-button`
- `draft-list-item-<draftId>`
- `draft-list-item-label-<draftId>`
- `draft-list-item-active` (if implemented as a marker/state hook)

### Main pane roots
- `workspace-view`
- `draft-view`

### Workspace roots
- `workspace-brief`
- `workspace-structure`
- `workspace-hook-lab`
- `workspace-vocabulary-world`

### Draft view
- `draft-header`
- `draft-header-title`
- `draft-editor`

### Editor
- `editor-toolbar`
- `editor-undo-button`
- `editor-redo-button`
- `editor-bold-button`
- `editor-italic-button`
- `editor-surface`

### New draft dialog
- `new-draft-dialog`
- `new-draft-name-input`
- `new-draft-mode-blank`
- `new-draft-mode-text-only`
- `new-draft-mode-inventory-only`
- `new-draft-mode-both`
- `new-draft-source-select`
- `new-draft-confirm-button`
- `new-draft-cancel-button`

## Future-Friendly IDs

### Display toggles
- `toggle-show-chords`
- `toggle-show-sections`
- `toggle-show-speakers`
- `toggle-show-stage-directions`
- `toggle-show-syllables`

### Tools
- `tools-pane`
- `tools-mode-tabs`
- `tools-search-input`
- `tools-results-list`

### Inventory
- `inventory-pane`
- `inventory-editor`

### Structured draft content
- `section-block-<sectionId>`
- `section-header-<sectionId>`
- `speaker-line-<lineId>`
- `stage-direction-<lineId>`
- `lyric-line-<lineId>`

### Alternates
- `alternate-button-<lineId>`
- `alternate-popover-<lineId>`

### Chords
- `chord-lane-<lineId>`
- `chord-marker-<chordId>`

## Guidance for Tests

Use `getByTestId` for:
- shell regions
- lists
- active views
- draft/workspace roots
- stable controls
- dialog interactions

Use visible text assertions when text itself is part of the requirement.