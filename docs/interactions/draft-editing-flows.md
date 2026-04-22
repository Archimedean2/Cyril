# Cyril — Draft Editing Flows

## 1. Basic Draft Editing

### Trigger
- User opens a draft and types

### Preconditions
- Active draft exists
- Draft editor is mounted

### Main Flow
1. User focuses draft editor
2. User types text
3. Draft content updates
4. Save state becomes dirty/unsaved
5. Undo history updates
6. On save/reload, content is preserved

### Postconditions
- Draft text reflects edits

---

## 2. Apply Formatting

### Trigger
- User selects text and uses toolbar or shortcut

### Preconditions
- Text selection exists where formatting is valid

### Main Flow
1. User selects text
2. User triggers bold / italic / indent
3. Editor applies mark or block formatting
4. Selection or cursor remains usable
5. Undo reverses change cleanly

### Postconditions
- Formatting visible in editor
- Formatting preserved through save/load

---

## 3. Insert Section

### Trigger
- User clicks `Add Section` control or equivalent

### Preconditions
- Draft editor active

### Main Flow
1. User triggers section insertion
2. App inserts new section block at cursor or sensible boundary
3. Default section type is chosen or user selects type
4. Section label/summary fields available if supported
5. Cursor moves into new section content

### Postconditions
- Section exists as structured content
- Section persists through save/load

---

## 4. Reorder Section

### Trigger
- User uses move action or reorder control

### Preconditions
- Draft contains more than one section

### Main Flow
1. User triggers move up/down or drag reorder
2. App reorders section block
3. Section content and metadata move together
4. Undo restores prior order

### Postconditions
- Section order updated correctly

---

## 5. Insert Speaker Label

### Trigger
- User clicks `Speaker` control or equivalent

### Preconditions
- Draft editor active

### Main Flow
1. User triggers speaker insertion
2. App inserts speaker metadata node at cursor or before current lyric line
3. User enters speaker text
4. Speaker line displays in metadata style

### Postconditions
- Speaker metadata is stored structurally

---

## 6. Insert Stage Direction

### Trigger
- User clicks `Direction` control or equivalent

### Preconditions
- Draft editor active

### Main Flow
1. User triggers stage direction insertion
2. App inserts stage direction node
3. User enters text
4. Direction displays in muted/italic metadata style

### Postconditions
- Stage direction is stored structurally

---

## 7. Set Spoken/Sung State

### Trigger
- User uses delivery toggle for lyric line

### Preconditions
- Cursor or selection is within lyric line

### Main Flow
1. User selects line or places cursor in line
2. User toggles spoken/sung mode
3. App updates lyric line `delivery` state
4. UI reflects state if visible

### Postconditions
- Delivery state stored on line

---

## 8. Toggle Metadata Visibility

### Trigger
- User toggles section/speaker/stage visibility in left sidebar controls

### Preconditions
- Active draft exists

### Main Flow
1. User clicks visibility toggle
2. App updates draft display settings
3. Draft view rerenders with element hidden or shown
4. Underlying content remains unchanged

### Postconditions
- View changes only
- data remains intact