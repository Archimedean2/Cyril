# Cyril — Advanced Draft Flows

## 1. Add Alternate Lyric

### Trigger
- User invokes `Add Alternate` on a lyric line

### Preconditions
- Active draft exists
- Cursor or line target exists

### Main Flow
1. User targets lyric line
2. User triggers add alternate
3. Alternate UI opens
4. User enters alternate text
5. Alternate is stored on line
6. Main editor continues showing active line text

### Postconditions
- Line has alternate options
- active line remains primary in draft view

---

## 2. Activate Alternate Lyric

### Trigger
- User opens alternate UI and selects another option

### Preconditions
- Line has one or more alternates

### Main Flow
1. User opens line alternates
2. User selects alternate
3. App marks chosen alternate active
4. Main lyric line content updates to active version
5. Undo can restore previous active version

### Postconditions
- Draft displays selected version
- non-active alternates remain stored

---

## 3. Add Chord Marker

### Trigger
- User is in chord-enabled draft and adds a chord to a lyric line

### Preconditions
- Draft mode is `lyricsWithChords`
- Target lyric line exists

### Main Flow
1. User selects lyric line
2. User triggers add chord
3. New chord marker appears in chord lane
4. User enters chord symbol
5. Chord stored with position metadata

### Postconditions
- Chord marker visible above lyric line
- lyric text unchanged

---

## 4. Move Chord Marker

### Trigger
- User drags or repositions chord marker

### Preconditions
- Chord marker exists

### Main Flow
1. User selects chord marker
2. User drags horizontally or uses position control
3. App updates marker position
4. Chord rerenders at new location

### Postconditions
- Updated marker position persisted

---

## 5. Show Syllable Counts

### Trigger
- User enables syllables toggle

### Preconditions
- Active draft exists

### Main Flow
1. User toggles syllables on
2. App computes or retrieves syllable counts
3. Gutter appears beside lyric lines
4. Counts update when lyric lines change

### Postconditions
- syllables visible but unobtrusive

---

## 6. Apply Manual Rhyme Group

### Trigger
- User assigns rhyme group to line or relevant text unit

### Preconditions
- Draft editor active

### Main Flow
1. User selects target line or text
2. User assigns rhyme group
3. App stores rhyme group metadata
4. Highlight/color appears if rhyme view enabled

### Postconditions
- rhyme annotation persists
- turning display off hides annotation only

---

## 7. Open Export Dialog

### Trigger
- User clicks Export in top bar or menu

### Preconditions
- Active project exists

### Main Flow
1. User opens export dialog
2. Dialog shows format and inclusion options
3. User chooses export type and settings
4. User confirms export
5. App generates output from canonical data model

### Postconditions
- export artifact generated
- export respects active content and inclusion settings