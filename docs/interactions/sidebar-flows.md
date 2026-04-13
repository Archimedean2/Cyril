# Cyril — Sidebar Flows

## 1. Use Tools Pane

### Trigger
- User manually types into tool search
- or selected word populates tool search

### Preconditions
- Right sidebar visible
- Tools pane active

### Main Flow
1. User selects tool mode (rhyme, near, dictionary, etc.)
2. User enters search term or selection populates term
3. App calls tool provider
4. Tools pane shows loading state if needed
5. Results appear in results list
6. User clicks result
7. Result is copied to clipboard

### Alternate Flows
- No results:
  - show empty state
- Provider fails:
  - show error state, editor remains unaffected

### Postconditions
- User can paste copied result into editor or inventory

---

## 2. Populate Tool Search from Selected Word

### Trigger
- User selects word in editor and uses keyboard shortcut or context action

### Preconditions
- Word selection exists
- Tools pane available

### Main Flow
1. User selects a word
2. User triggers lookup action
3. Selected text becomes tool search term
4. Tools pane activates appropriate mode
5. Results load

### Postconditions
- Tools pane reflects selected word

---

## 3. Edit Inventory

### Trigger
- User types into inventory pane

### Preconditions
- Active draft exists
- Inventory pane visible

### Main Flow
1. User focuses inventory editor
2. User types or pastes text
3. Draft inventory updates
4. Save state becomes dirty/unsaved
5. Switching drafts swaps inventory content

### Postconditions
- Inventory persists for active draft

---

## 4. Copy from Inventory to Draft

### Trigger
- User copies text from inventory and pastes into draft

### Preconditions
- Inventory contains text
- Draft editor available

### Main Flow
1. User selects inventory text
2. User copies
3. User focuses draft editor
4. User pastes
5. Draft updates normally

### Postconditions
- Inventory remains unchanged
- Draft receives pasted content

---

## 5. Toggle Display Controls

### Trigger
- User clicks left sidebar display toggle

### Preconditions
- Active draft exists

### Main Flow
1. User toggles a display option
2. App updates draft settings
3. Draft rerenders accordingly

### Common toggles
- chords
- sections
- speakers
- stage directions
- syllables

### Postconditions
- only visibility changes
- structured content remains intact