# Cyril — Defect log

Every real defect found, what guards it now, and what is still open. Add to this file whenever
you find one — **before** you fix it, so a bug that turns out to be hard doesn't get lost.

A defect earns a row here only if it was a genuine product fault. Test-harness artifacts and
mistaken diagnoses are recorded at the bottom under *False alarms*, because knowing what looked
like a bug and wasn't is worth almost as much.

Severity: 🔴 data loss / core flow broken · 🟠 wrong behaviour · 🟡 polish.

---

## Fixed

| # | Sev | Defect | Why the suite missed it | Guarded by |
|---|:--:|---|---|---|
| D-01 | 🔴 | **Concurrent saves clobbered newer work.** `saveProject` had no serialization, so whichever write's `close()` finished last won on disk. A slow autosave could land after — and overwrite — a newer manual save, while the manual save returned `true` and the UI said "Saved". | Every persistence test exercised one save at a time. Races need deliberate concurrency, not a UI path. | `T-1.32` (controllable per-write latency; asserts final disk content) |
| D-02 | 🔴 | **Lyrics outside a section block never exported.** `buildExportableDraft` walked only top-level `sectionBlock` / `concurrentBlock` nodes and silently discarded everything else. A new draft starts as bare `lyricLine` nodes and a writer need never add a section header — so print, print preview and Markdown all produced an **empty document for an ordinary song**. | Every renderer test fed it a pre-seeded, sectioned draft. None used the document shape the app actually produces. | `T-11.19` |
| D-03 | 🔴 | **Tool cache crashed instead of degrading.** `IndexedDBToolCacheStore` let every method reject when `indexedDB.open` failed (quota, private browsing); its consumer has no try/catch, so a word lookup crashed rather than falling back to a live lookup. | No test simulated an unavailable IndexedDB. | `T-1.35` |
| D-04 | 🟠 | **`[[NAME]]` / `((text))` left their closing brackets.** The input rules matched opening brackets only, so typing the documented gesture produced a speaker line reading `MARIA]]`. | No test typed the full documented gesture; they typed `[[` and relied on the shortcut. | `T-4.21`–`T-4.25` |
| D-05 | 🟠 | **Speaker autocomplete swallowed Enter** whenever the typed name exactly matched a suggestion — the common case for a repeat speaker — silently merging the next line's text onto the still-open speaker line. | Tests used distinct speaker names, never a repeat. | `T-4.38` |
| D-06 | 🟠 | **`SpeakerColumn` never declared `characterId`** in its Tiptap schema, so the editor silently dropped it. | ProseMirror drops unknown attrs without erroring; nothing asserted round-trip of that attr. | C-20 schema tests |
| D-07 | 🟠 | **Editor page ate its own top and bottom margin.** `min-height: 100%` plus the page's vertical margin overflowed the scroll container, so focusing the editor auto-scrolled and consumed the gap on the first keystroke. | jsdom runs no layout. Unreachable by any non-visual test. | Visual check; see C-34 |
| D-08 | 🟠 | **`display: flex` on the page stopped block children stretching** — a speaker label shrank to content width and centred. | Same as D-07. | Visual check |
| D-09 | 🟠 | **Real network failures leaked a raw `Failed to fetch`** into the Tools pane instead of the friendly offline copy; the catch block only fired on a rejection, not on the cache service's resolved-with-error path. | The offline test stubbed a rejection, which took the other branch. | `T-14.x` offline state |
| D-10 | 🟡 | **Print panel pushed the dialog's close button off-screen.** | No test asserted the dialog stayed within the viewport. | e2e export spec |
| D-11 | 🟡 | **An unheaded section printed a heading reading "None"** in both print and Markdown. | Surfaced only once D-02 made unheaded sections reachable. | `T-11.20` |
| D-12 | 🟡 | **A tooltip advertised a shortcut that did not exist** (`Ctrl+Shift+K` on Concurrent). | Nothing checks tooltip claims against real keybindings. | Removed in C-13 |
| D-13 | 🟠 | **A tab closed mid-write got no unsaved warning** — the guard treated only `unsaved`/`error` as dirty, not `saving`. | The spec was written that way; the test encoded the spec. | `T-1.30` |
| D-22 | 🟠 | **A denied clipboard logged a console error and flashed "Copied" over a failure.** Clicking a tool result called `navigator.clipboard.writeText` and, on denial (insecure context, gated permission, automated session), logged `console.error` and ran a no-op "fallback" that cleared the selection. The user was told "Copied" regardless. | Nothing failed a test on a console error until the guard landed — this was its very first catch. | `T-7.08` + the console guard |
| D-14 | 🟠 | **`T-5.04` was a hollow test** — it claimed to verify per-draft inventory without ever switching drafts. | It passed, which is the whole problem. | Rewritten to switch drafts |

## Open

| # | Sev | Defect | Notes |
|---|:--:|---|---|
| D-15 | 🟠 | **The file-input fallback may never resolve on cancel.** Cancel detection relies on the `cancel` event, which not every browser fires. A dismissed picker leaves the promise pending rather than throwing. | Acceptable under "never throws", but a real UX dead end. From C-05. |
| D-16 | 🟡 | **The permission banner's "Not now" is per-mount**, not persisted — it reappears on a fresh mount while the permission is still unresolved. | From C-29. |
| D-17 | 🟡 | **The chord toolbar group overflows** into horizontal scroll at 1024px with both sidebars open. Pre-existing; C-13 improved it but did not eliminate it. | |
| D-18 | 🟡 | **A suppressed duplicate speaker label leaves a blank row.** The hidden label still occupies its line height, so the continuation reads as an accidental empty line. | Tracked as `BACKLOG.md` C-33. |
| D-19 | 🟡 | **Annotated print margin notes skip concurrent blocks** — they apply only to lyric lines inside a section. | From C-22. |
| D-20 | 🟠 | **`main` cannot run two of its own four gates.** Neither `.eslintrc.cjs` nor `scripts/feature-coverage.mjs` is tracked, so a fresh clone fails `npm run lint` and `npm run coverage:features`. | Tracked as `BACKLOG.md` C-32. |
| D-21 | 🟡 | **`printProfile` is bolted onto `ExportSettings` by TypeScript module augmentation** rather than declared in `types.ts`. A scheduling workaround, not a design choice. | Tracked in C-32. |
| D-23 | 🟡 | **Inserting a section with `<<` leaves stray empty `lyricLine` siblings** around the new section, so a fresh draft ends up with an invisible blank line above and below it. *Corrected on review:* these do **not** reach the export — `processNode` drops content-less lines, verified by running it rather than reading it. It is a document-hygiene issue, not an export fault. A separate, real finding did come out of checking: a **whitespace-only** line (`"   "`) *was* exported as a blank line, which is now fixed. | No test asserted document shape immediately after a section insert into an otherwise-untouched draft. | whitespace case: `T-11.25` |

## Quality issues that are not defects

- **Rhyme results contain junk.** Searching `left` returns *klepht, kreft, neft, tefft, antitheft*.
  That is Datamuse's corpus, not a Cyril fault — but it is the strongest practical argument for
  finishing the offline word indexes (C-23), which are already built and unwired.
- **Three of the four workspaces are empty rich-text boxes.** Brief, Hook Lab and Vocabulary
  World each render a bare editor. Hook Lab is a headline concept in the design docs and is
  currently a blank page (C-27).

## False alarms — things that looked like bugs and were not

Recorded deliberately: each of these cost real time, and the next person should not re-chase them.

- **"`[[ANNA]]` renders as literal text inside a section."** An artifact of Playwright typing nine
  characters in under a millisecond: the `<<` rule fired and moved focus to the section-label
  input mid-string. At human pace the flow is correct. **Always type with a delay when driving
  input rules.**
- **"A syllable badge appears on the section label."** Misread — the "1" was part of the label
  text "Verse 1".
- **"CI has no e2e step."** Came from reading the first 60 lines of a 73-line file. E2E was
  already wired.
- **"The recovery snapshot is empty."** Wrong parse of the snapshot shape, which is
  `{file, savedAt}`. The snapshot was correct.
- **"e2e dropped to 93 of 111 tests."** A stale dev-server process interfering. A clean re-run
  gave 111/111.

## Two hollow assertions caught before they shipped

Both would have passed forever without ever being able to fail:

```js
expect(html).not.toContain('print-empty');    // also matches the CSS rule in <head>
expect(html).not.toContain('section-label');  // ditto
```

When asserting the *absence* of something in rendered HTML, scope to the `<body>` — a stylesheet
legitimately names every class the page can use.
