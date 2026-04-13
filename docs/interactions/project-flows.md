# Cyril — Project Flows

## 1. Create New Project

### Trigger
- User clicks `New Project` in empty state
- or uses top bar/menu action later

### Preconditions
- App is open
- No blocking modal is active

### Main Flow
1. User triggers `New Project`
2. New Project dialog opens
3. User enters project title
4. User confirms creation
5. App creates a default `.cyril` project object
6. App sets project as active
7. App opens default active draft or empty initialized project state
8. Save status shows unsaved/saved according to implementation policy

### Alternate Flows
- If title is blank:
  - use default title such as `Untitled Song`
  - or disable confirm until title provided
- If dialog cancelled:
  - no project created

### Postconditions
- Active project exists in app state
- Left sidebar updates
- Main pane displays draft or project start state

---

## 2. Open Existing Project

### Trigger
- User clicks `Open Project`
- or chooses from recent projects if implemented

### Preconditions
- User has a `.cyril` file or indexed project entry available

### Main Flow
1. User triggers `Open Project`
2. File picker or recent-project selector opens
3. User chooses project
4. App loads raw project data
5. App validates and normalizes data
6. App sets project as active
7. App opens last active draft or current active draft in schema

### Alternate Flows
- Invalid file:
  - show error
  - do not corrupt current session
- Missing optional fields:
  - normalize defaults silently
- Unknown fields:
  - preserve if supported

### Postconditions
- Project is active
- UI reflects project title and active draft/workspace

---

## 3. Save Project

### Trigger
- User invokes save action
- autosave may run separately, but explicit save is canonical

### Preconditions
- Active project exists

### Main Flow
1. User triggers save
2. App serializes canonical project state
3. App writes `.cyril`
4. Save status updates to saved

### Alternate Flows
- Save fails:
  - show error or unsaved state
  - do not destroy in-memory project
- First save may require path selection depending on persistence implementation

### Postconditions
- Canonical project file updated
- Save timestamp/state updated

---

## 4. Rename Project

### Trigger
- User edits project title in top bar or project settings flow

### Preconditions
- Active project exists

### Main Flow
1. User changes title
2. App updates project title in state
3. Save status becomes unsaved
4. On save, persisted file reflects updated title

### Postconditions
- New title visible in UI
- New title preserved through reload

---

## 5. Duplicate Project

### Trigger
- User chooses duplicate project action

### Preconditions
- Active or selected project exists

### Main Flow
1. User triggers duplicate
2. App copies project data
3. App regenerates project ID
4. App regenerates nested IDs where required
5. App assigns duplicate title or prompts for new one
6. Duplicate opens as separate project

### Postconditions
- Original project unchanged
- Duplicate exists independently

---

## 6. Delete Project

### Trigger
- User chooses delete project action

### Preconditions
- Target project exists

### Main Flow
1. User triggers delete
2. Confirm dialog appears
3. User confirms
4. App removes project from local index/reference or deletes file according to implementation
5. App clears active project if deleted project was active
6. Empty state or fallback project view appears

### Alternate Flows
- User cancels confirmation:
  - nothing changes

### Postconditions
- Deleted project no longer appears in project list/index