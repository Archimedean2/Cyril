# Cyril — Robustness & Edge-Case Register

_Why this file exists: Cyril keeps breaking not on the happy path but where features **interact**
(chords + editing, alternates + concurrent blocks, autosave + lost file handles) and where the
**outside world** misbehaves (offline APIs, revoked permissions, corrupt files, weird paste). This is
the adversarial-QA list. **Every entry should become an ID-tagged test** per `DEFINITION_OF_DONE.md` —
that's how a hazard stops being a recurring bug. Prioritised: 🔴 data-loss / crash / core-flow break ·
🟠 wrong behaviour · 🟡 polish._

Written 2026-07-05. This is a living register — add to it as new interactions appear.

## 1. Chords × editing (offsets are fragile)

- 🔴 Typing **before** a chord's anchor must shift the chord right by the inserted length; typing
  after must not move it. Verify offset math, not just "a chord exists".
- 🔴 **Deleting the anchored character** (or the whole word) — chord should clamp to a valid offset or
  be removed, never point past end-of-text (the renderer clamps, but the stored offset can rot).
- 🔴 **Splitting a line (Enter) with chords on both halves** — each chord must follow its text to the
  correct resulting line at the correct offset.
- 🔴 **Merging lines (Backspace at start)** — the second line's chords must re-base onto the merged
  line (offset += first line length), not collapse to 0.
- 🟠 **Two chords at the same offset** — both must remain, render without overlapping.
- 🟠 **Paste into a chorded line** — inserted text shifts downstream chords correctly.
- 🟠 **Transpose** of non-trivial symbols: slash chords (`C/G`), `sus4`, `add9`, `maj7`, `N.C.`,
  flats/sharps (both `b/#` and `♭/♯`). Don't corrupt or half-transpose.
- 🟡 Trailing/instrumental chords (planned) when text is later added past them.

## 2. Alternates × everything

- 🔴 Activating an alternate must swap **all** line data consistently — does the alternate carry its
  own chords / prosody / lineType, or inherit the line's? Decide and test; mismatches lose data.
- 🔴 **Deleting a line that has alternates** — alternates go with it; undo restores them.
- 🟠 Alternate on a **speaker or stage-direction** line, or inside a **concurrent column**.
- 🟠 Undo immediately after activating an alternate returns the exact prior active text.
- 🟡 Alternate text with very different length → syllable gutter / chord alignment recompute.

## 3. Line types (speaker / stage direction / section)

- 🔴 Converting a line type on a line that **has chords or alternates** must preserve that metadata.
- 🟠 `[[NAME]]` / `((text))` input rules: at line start vs mid-line vs on a non-empty line vs inside a
  concurrent column; undo of the auto-conversion.
- 🟠 Sticky stage-direction mode (planned) × paste of multiple lines × Enter × Escape exit.
- 🟠 Empty section (no lines), deleting a section header, two sections with the same label, reordering.
- 🟡 A concurrent block nested in a section; a section with only a concurrent block.

## 4. Concurrent blocks (the most interaction-dense feature)

- 🔴 **Deletion** (currently broken — see feature doc E2): remove row, remove block, reduce to one
  column → convert to lyric lines **without losing chords/alternates** in the surviving column.
- 🔴 **Per-column undo** must not cross-contaminate other columns.
- 🟠 Paste multi-line text into a column; Tab/Shift-Tab at first/last cell; Enter at last row of last
  column creating a new aligned row.
- 🟠 Ragged columns → row alignment (planned markers) and squash-export order stay correct.
- 🟠 Fill an interior empty cell (already works) → interior empties must persist for alignment while
  trailing empties are not stored (see `DATA_MODEL.md` note to add).
- 🟠 Inserting a concurrent block **inside** a concurrent block must be blocked.
- 🟡 Speaker name blank → "Speaker N" fallback everywhere (display, export, remove-confirm).

## 5. Undo / redo

- 🔴 Structural ops must be atomic and undoable in one step: insert/delete section, insert concurrent
  block, add/remove column, activate alternate, add/move/remove chord.
- 🟠 Undo after autosave has fired (autosave must not poison the history stack).
- 🟠 Redo invalidated correctly after a new edit; no "ghost" redo restoring stale structure.

## 6. Paste & input

- 🔴 Paste **rich HTML** (Word / Google Docs): strip to the lyric schema — no stray marks, tables,
  spans, colours, or font tags leaking into the canonical doc (TASKING forbids formatting-as-metadata).
- 🟠 Smart quotes, non-breaking spaces, tabs, trailing whitespace normalised sensibly.
- 🟠 Paste containing many newlines → creates the right number of lines, not one giant line.
- 🟠 **IME / non-Latin / RTL / emoji / combining characters** in lyrics: caret, syllable count, and
  chord offsets must count characters correctly (surrogate pairs!).
- 🟡 Paste of an image or file → rejected gracefully, no crash.

## 7. Prosody / syllables

- 🟠 Words not in the dictionary (proper nouns, slang, coined words) → heuristic fallback, no crash.
- 🟠 Hyphenates, contractions (`don't`, `we'll`), numbers, punctuation-only "words".
- 🟡 Very long lines → count performance; toggling syllables with chords shown (both gutters/lanes).

## 8. Persistence & files (highest data-loss risk)

> These 🔴 items are drafted as a concrete, test-first task in **`HARDENING_PERSISTENCE.md`** (the top
> robustness priority in `NEXT_STEPS.md`).

- 🔴 **File handle lost / permission revoked** after a browser restart — autosave currently writes only
  when a handle exists and is silent on error, so the user may think they're saved when they're not.
  Surface it: on failure, show "not saved — reconnect file", offer re-pick.
- 🔴 **File moved / deleted / renamed externally** while open → save must fail loudly, not lose work.
- 🔴 **No File System Access API** (Firefox, Safari, some mobile) → must have a download/upload
  fallback, or clearly degrade. Don't assume Chromium.
- 🔴 **Open a corrupt / truncated / non-JSON / wrong-schema `.cyril`** → validated error, never a white
  screen; preserve unknown fields; forward-compat when `schemaVersion` is newer than the app.
- 🔴 **Unsaved changes on tab close / refresh** → `beforeunload` guard.
- 🟠 Two tabs / windows editing the same file; autosave debounce racing a manual save; Save As over an
  existing file (overwrite confirm).
- 🟠 IndexedDB unavailable/quota-exceeded (private browsing) → autosave + tool cache degrade, no crash.

## 9. Drafts & workspaces

- 🔴 Delete the **active** draft (what becomes active?) and delete the **last** draft (never leave zero
  drafts in a broken state).
- 🟠 Switch drafts mid-edit → pending autosave flushes to the right draft; no bleed between drafts.
- 🟠 Rename a draft to empty / duplicate name; duplicate a very large draft.
- 🟠 Hook Lab migration (planned) from rich-text doc to structured hooks — no content loss.

## 10. Tools, inventory, clipboard

- 🔴 **Clipboard API unavailable** (insecure context, denied permission) → copy/collect degrade
  gracefully (this already bit us once, T-7.06).
- 🟠 Datamuse offline / rate-limited / 5xx → cache fallback + a quiet "offline" state, not a spinner
  forever.
- 🟠 Contextual follow-selection (planned) when the selection is multi-word, multi-line, or empty.
- 🟡 Empty / very long / special-char queries; collecting duplicates; huge inventory.

## 11. Export / print / share

- 🟠 Export an **empty** draft; export with concurrent blocks (squash order left-to-right per row);
  which alternate is exported (active only).
- 🟠 Chord-sheet with trailing / instrumental chords; print with view toggles off (hidden elements).
- 🟠 Markdown special-char escaping; share blob too large for clipboard/URL.
- 🔴 **Import a malformed share blob** → validated error; importing must not silently destroy the
  current project (confirm / open-as-new).

## 12. UI, layout, focus, accessibility

- 🟠 Resizable panes dragged to 0 / extremes; very narrow window; panes remember size.
- 🟠 Context menu / popover near a screen edge → reposition to stay on-screen; right-click must suppress
  the native browser menu inside the editor.
- 🟠 Dialog focus trap + Escape; Escape while inline-editing a name cancels the edit, not the dialog.
- 🟠 Focus after a NodeView action (chord edit, speaker rename, menu action) returns somewhere sane —
  the caret-jump class of bug (speaker-name field) is the canonical example.
- 🟡 Keyboard-only navigation, visible focus rings, ARIA roles on custom NodeViews, screen-reader labels.

---

## How to use this register

Pick hazards relevant to whatever backlog item you're building and write them as `T-`tagged tests
**as part of that item** — e.g. building chords (backlog #10) means covering all of §1 here. Don't let
a feature be "done" while its neighbouring hazards are untested. When you find a new break, add it here
first, then fix it with a test (per `DEFINITION_OF_DONE.md`).
