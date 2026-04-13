# Cyril — Workspace and Draft Flows

## 1. Switch Workspace

### Trigger
- User clicks Brief / Structure / Hook Lab / Vocabulary World in left sidebar

### Preconditions
- Active project exists

### Main Flow
1. User clicks workspace item
2. App updates current central view to selected workspace
3. Main pane swaps to workspace editor
4. Prior workspace/draft content remains preserved
5. Active nav item updates

### Postconditions
- Selected workspace is visible
- No draft content is lost

---

## 2. Open Draft

### Trigger
- User clicks a draft in the Drafts section of left sidebar

### Preconditions
- Active project exists
- Draft exists

### Main Flow
1. User clicks draft name
2. App sets selected draft as active
3. Main pane renders DraftView for that draft
4. Inventory pane switches to that draft’s inventory
5. Display controls reflect that draft’s settings

### Postconditions
- Active draft changes
- Main editor and inventory update together

---

## 3. Create New Draft

### Trigger
- User clicks `+ New Draft`

### Preconditions
- Active project exists

### Main Flow
1. New Draft dialog opens
2. User enters draft name
3. User chooses start mode:
   - blank
   - duplicate text only
   - duplicate inventory only
   - duplicate both
4. If duplication mode chosen, user selects source draft
5. User confirms
6. App creates new draft with new IDs
7. New draft becomes active
8. Main pane updates to new draft

### Alternate Flows
- User cancels:
  - no draft created
- Source draft required but not selected:
  - disable confirm or choose sensible default

### Postconditions
- New draft exists in draft list
- Active draft switches to new draft

---

## 4. Rename Draft

### Trigger
- User chooses rename draft action from draft row or context menu

### Preconditions
- Target draft exists

### Main Flow
1. User triggers rename
2. Inline rename field or dialog appears
3. User enters new name
4. App updates draft name
5. Save state becomes dirty/unsaved

### Postconditions
- Draft list shows updated name
- Draft name persists through reload

---

## 5. Duplicate Draft

### Trigger
- User chooses duplicate draft action

### Preconditions
- Source draft exists

### Main Flow
1. Duplicate Draft dialog opens
2. User provides new draft name
3. User chooses duplication mode:
   - text only
   - inventory only
   - both
4. App copies selected data
5. App regenerates draft ID and nested IDs as required
6. New draft appears in draft list
7. New draft may become active by default

### Postconditions
- Original draft unchanged
- Duplicate draft available independently

---

## 6. Delete Draft

### Trigger
- User chooses delete draft action

### Preconditions
- Target draft exists
- Project has more than one draft, or implementation creates replacement draft automatically

### Main Flow
1. User triggers delete
2. Confirm dialog appears
3. User confirms
4. App removes draft
5. If deleted draft was active, app selects fallback draft
6. Main pane updates

### Alternate Flows
- If deleting last draft is not allowed:
  - disable action or show explanatory message

### Postconditions
- Deleted draft is removed cleanly
- No orphaned activeDraftId remains