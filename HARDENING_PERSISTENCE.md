# Task: Persistence Hardening (highest data-loss risk)

_A concrete, test-first hardening task for the 🔴 items in `EDGE_CASES.md` §8. This is the biggest
data-loss surface in Cyril. Build it under `DEFINITION_OF_DONE.md`: every sub-task lands with
`T-`tagged tests (use the Stage-1 persistence range, `T-1.2x`). Order below is by risk._

## Current state (as built — verify before changing)

- `src/persistence/fileSystem/fileManager.ts` holds a single module-level `fileHandle`. `saveProject`
  calls `fileHandle.createWritable()` **without checking/requesting permission**. `openProject` and
  `tryReopenLastProject` read via `getFile()` and `deserializeProject(contents)` directly.
- `src/persistence/autosave.ts` debounces 3s and writes **to the file**, but only when
  `projectSettings.autosave` is on **and** `hasFileHandle()`. It routes failures to
  `saveStatusStore` (`'error'`), and **silently no-ops when there is no file handle**.
- There is **no IndexedDB recovery snapshot** (the original action-plan "recovery doc" was never
  built), **no `beforeunload` guard**, and **no fallback** when the File System Access API is absent
  (both pickers just throw "not supported").

Net effect of the gaps: a new project that hasn't been manually saved has **zero durability**; a
reopened or permission-revoked handle makes autosave fail (surfaced as an error, but with no way to
re-grant); and Firefox/Safari users can't save at all.

## Sub-tasks

### H1 — Verify/request write permission before writing 🔴
Before any write, `queryPermission({ mode: 'readwrite' })` on the handle; if not `'granted'`,
`requestPermission({ mode: 'readwrite' })`. Because `requestPermission` needs a user gesture, a
**manual Save** is the place to (re)request; **autosave** cannot prompt, so on a non-granted handle it
must set status `'error'` (not `'saved'`) and the UI should invite the user to Save.
- `T-1.20`: save on a handle whose permission is `'prompt'` requests permission, then writes.
- `T-1.21`: a `'denied'` handle never reports `'saved'`; status ends `'error'`.

### H2 — Local recovery snapshot in IndexedDB 🔴 (the durability win)
On the same debounce, write a full snapshot of `currentProject` to IndexedDB **regardless of file
handle or the autosave setting**. On app init, if a snapshot exists and is newer than the opened file
(or there is no file), offer "Recover unsaved work?" — accept restores it, decline discards it. This
closes both the "never-saved project is lost" and "autosave no-ops without a handle" holes. Add the
snapshot store to `DATA_MODEL.md`.
- `T-1.22`: editing with no file handle writes a recovery snapshot.
- `T-1.23`: on init with a newer snapshot, recovery is offered; accept restores exactly; decline clears it.

### H3 — `beforeunload` guard 🔴
When there are unsaved changes (dirty / status `unsaved`|`error`), register a `beforeunload` handler
that warns; remove it when clean. (A durable H2 snapshot softens this, but the warning still matters.)
- `T-1.24`: dirty state registers the guard and sets `returnValue`; clean state removes it.

### H4 — Fallback when the File System Access API is missing 🔴
Feature-detect `showSaveFilePicker` / `showOpenFilePicker`. If absent: **Save** → download the `.cyril`
as a Blob; **Open** → hidden `input[type=file]`. Auto-save-to-file is impossible in this mode, so lean
on H2 and tell the user plainly ("this browser can't auto-save to disk — download to keep a copy").
- `T-1.25`: with pickers undefined, Save produces a download Blob and Open reads a `File`; no throw.

### H5 — Load validation + forward-compat 🔴
Route every open through validation (`validation.ts`): a corrupt / truncated / non-JSON / wrong-schema
file yields a surfaced, friendly error — never a white screen — and **never destroys the source file**.
Preserve unknown fields. If `schemaVersion` is newer than the app, warn / open read-only rather than
silently "migrate" and corrupt. `tryReopenLastProject` must distinguish *permission lost* (keep the
handle, prompt to re-grant) from *file gone/corrupt* (clear it).
- `T-1.26`: opening corrupt JSON surfaces a validation error and does not throw to a crash.
- `T-1.27`: a newer `schemaVersion` is handled (warn/read-only), not blindly loaded.
- (Unknown-field preservation is already covered by the round-trip tests — keep it green.)

### H6 — External-change / overwrite safety 🟠 (stretch)
Before overwriting on manual Save, compare the file's `lastModified` to the value last read; if it
changed underneath us, warn ("file changed outside Cyril — overwrite?").
- `T-1.28`: a changed `lastModified` triggers the overwrite warning.

### H7 — Status truthfulness 🟠
The save dot must never read "Saved" when no durable copy exists. If autosave is on but there is no
handle and no fallback copy yet, reflect `unsaved` (or a new `local-only` state), not `idle`.
- `T-1.29`: no handle + edits → status is never `saved`/clean-`idle`.

## Suggested order

H1 → H5 → H3 (core correctness, small), then **H2** (the durability payoff), then H4 (fallback), then
H6/H7. Land each with its tests and regenerate `FEATURE_COVERAGE.md`. Touches `fileManager.ts`,
`autosave.ts`, `saveStatusStore.ts`, the app-init path, and `DATA_MODEL.md` (recovery store).
