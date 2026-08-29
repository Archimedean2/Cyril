# Cyril — Status

**Read this file first, every time you come back.** It answers "where was I?" in about
thirty seconds. Half of it is stamped by a script and cannot drift; half is written by
whoever last worked here.

- **What's true right now** → the generated block below (`npm run status` to refresh).
- **What I was in the middle of** → *Current focus*.
- **What to do next** → `BACKLOG.md`, lowest unclaimed item.
- **What "done" means** → `DEFINITION_OF_DONE.md`.

---

<!-- BEGIN GENERATED — npm run status -->
_Last stamped: **2026-08-29 09:56 UTC** · regenerate with `npm run status`_

### Gate status — 🟢 all green

| Gate | Status | Detail |
|---|:--:|---|
| `npm run build` | 🟢 | tsc + vite clean |
| `npm run lint` | 🟢 | 0 errors, 0 warnings |
| `npm test` | 🟢 | 428/428 tests, 76 files |
| `npm run coverage:features` | 🟢 | 100.0% — 184 passing, 0 failing, 0 untested, 37 e2e-only |
| `npm run test:e2e` | 🟢 | 114 passed |

### Repo

| | |
|---|---|
| Branch | `feat/title-screen` (0 behind / 3 ahead) |
| Last commit | chore: regenerate ledger from the merged tree |
| Committed | 2026-08-29 10:47:27 +0100 |
| Uncommitted files | **7** (`git status`) |
| Backlog | **22 of 31** done · 2 in flight (C-20, C-22) · next up **C-21** |
<!-- END GENERATED -->

---

## Current focus

> Hand-maintained. Whoever is working: keep this to **three lines or fewer** and update it
> when you start and when you stop. If it disagrees with the generated block above, the
> generated block is right.

**Working on:** three agents — C-20 (character registry, the headline differentiator), C-22
(print profiles), C-31 + C-28 (ledger conflict fix and the persistence edge-case slice).

**Last verified state:** the whole P0 persistence block is complete (H1–H7 + C-29 + C-30).
Integration branch green: 397 tests, 168/168 non-e2e criteria, e2e 113/113. Nine PRs open.

**Blocked on:** two items need the maintainer and were deliberately NOT started — **C-25**
(chord transpose / trailing chords: changes `ChordMarker.position` in the file format) and
**C-27** (Hook Lab: expands v1 scope). Both say so in `BACKLOG.md`.

## Decisions taken unsupervised (2026-08-29) — review these

The maintainer stepped away and asked for the backlog to be worked autonomously. These are the
judgement calls made in their absence, each one reversible:

1. **`beforeunload` treats `saving` as dirty** (was an open question from C-03, now C-30). A tab
   closed mid-write got no warning. Cost of a false positive is a spurious dialog in a sub-second
   window; cost of a false negative is lost work. Chose the dialog.
2. **The re-grant affordance (C-29) is an inline banner, not a modal.** Non-blocking, sits near
   the work. A modal on init would block a writer who just wants to keep typing.
3. **The Inventory (C-11) keeps its existing storage.** Chips are a rendering change over the
   same document, not a schema change — one line per collected item. Changing `.cyril` for a
   visual improvement would have been the wrong trade, and `TASKING.md` forbids casual schema
   drift. The agent was told to stop and report if that proved impossible.
4. **CI now runs on pull requests to any base branch.** Stacked PR #9 was getting no CI at all.
5. **CI fails if a tracked file exceeds 5 MB.** Added after a near-miss: a `git add -A` on a
   branch cut before the current `.gitignore` staged the 486 MB ConceptNet dump and GitHub's
   hook rejected the push. The smaller 9 MB and 24 MB indexes would not have been rejected.
6. **Order of work: finished the P0 persistence block before visual polish**, on the maintainer's
   own stated priority that data safety outranks look and feel.

---

## How to resume after a pause

```bash
npm run status          # stamps the block above: gates, git, backlog count
npm run status -- --e2e # same, plus Playwright (~25s slower)
```

Then read, in this order:

1. **This file** — the generated block tells you if the tree is healthy and what's uncommitted.
2. **The session log below** — the last few entries say what happened and why.
3. **`BACKLOG.md`** — anything marked `🚧` is claimed and in flight; that's probably yours.
4. `git log --oneline -10` and `git status` — the ground truth the stamp summarises.

If the generated block is red and the session log doesn't explain it, the safe move is
`git stash` and re-stamp to find out whether the breakage is yours or committed.

---

## Session log

Newest first. **Append one entry per working session**, even a short one — this is the memory
that survives you. Keep entries to the shape below; it takes a minute and saves an hour.

```
### YYYY-MM-DD — <who> — <one-line headline>
Did:      what actually landed (with item IDs)
Gates:    green / red, and which
Next:     the single next thing you'd do
Notes:    anything surprising, any decision made, anything half-finished
```

### 2026-08-28 — agent fleet (lane S) — Editor page surface and single title

Did:      C-12 restructured the centre pane into a "desk + page" model — the page now carries a
          capped width, border, soft shadow, paper tone and grain, with the lyric column on its
          own ~65-character measure so concurrent-speaker blocks keep the full page width. Two
          real bugs surfaced while building it: `display:flex` on the page stopped block children
          stretching (a speaker label shrank to content width), and `min-height:100%` plus the
          page margin overflowed the scroll container, so focusing the editor silently ate the
          top and bottom gap on first keystroke. Both fixed. C-16 removed the duplicated song
          title from LeftNav. New tokens, no hardcoded hex.
Gates:    🟢 all five on the merged tree — 310 tests, 146/146 non-e2e criteria, e2e 113/113.
Next:     C-04 (IndexedDB recovery snapshot).
Notes:    T-14.07 asserts DOM nesting plus the CSS source rather than pixel values, because jsdom
          runs no layout — a reasonable call, but it means the page's *appearance* is guarded by
          screenshots and human review, not by the suite. Worth remembering before trusting the
          gates alone on visual work.

### 2026-08-28 — agent fleet (lanes P/E/X) — First parallel run: 4 items landed

Did:      C-01 write-permission check before every save, with autosave explicitly barred from
          prompting (it has no user gesture) so a non-granted handle ends in `error`, never
          `saved`. C-03 `beforeunload` guard registered while dirty. C-09 `[[NAME]]` / `((text))`
          now strip their closing brackets — the rule only fires on a line the opening trigger
          already converted, so a plain lyric line typing `]]` is untouched. C-18 lint made
          blocking, CI job name fixed, Playwright install scoped to chromium.
Gates:    🟢 all five on the merged tree — 294 tests, 144/144 non-e2e criteria, e2e 113/113.
Next:     C-04 (IndexedDB recovery snapshot) — the largest remaining durability win, unblocked
          now that C-01 has landed.
Notes:    Three things worth carrying. (1) The C-18 item was partly wrong: it claimed CI had no
          e2e step, which came from reading 60 lines of a 73-line file. E2E was already wired;
          corrected in place in BACKLOG.md. (2) C-09's undo behaviour was verified in a real
          browser, not just in unit tests: Backspace after `[[MARIA]]` does restore `MARIA]]`.
          But the unit test also asserts `undoInputRule()` restores a bare `[[`, which no user
          can reach — lyricLine's own Backspace handler wins that case and yields an empty lyric
          line. Harmless, but the assertion overstates. (3) Every merge conflicted on
          FEATURE_COVERAGE.md, because every agent regenerates it. Resolve by regenerating from
          the merged tree, never by picking a side — or stop tracking it.

### 2026-08-28 — Claude (product/design audit) — Restructured the docs; built the tracker

Did:      Audited the whole project as a product designer. Ran all five gates (all green).
          Drove the running app and captured a live design review. Reorganised 30 root-level
          markdown files into `docs/{product,design,engineering,testing,process,archive}`.
          Wrote `BACKLOG.md` (28 agent-ready items in 5 parallel lanes), this `STATUS.md`,
          and `scripts/status.mjs` + `npm run status`.
Gates:    🟢 green — build 0, lint 0 errors / 0 warnings, 286 tests, feature coverage 100%
          (136/136 non-e2e), e2e 111/111.
Next:     `BACKLOG.md` C-01 — write-permission check before save. The P0 persistence block is
          the project's largest real risk: none of H1–H7 in HARDENING_PERSISTENCE exists.
Notes:    Three findings worth carrying forward. (1) The docs badly understate the project —
          they describe a broken build and hanging tests that were fixed long ago; the code is
          in far better shape than it reads. (2) `[[NAME]]` leaves `]]` in the line (C-09) —
          the documented gesture doesn't match the implemented rule. (3) ~530 MB of untracked
          word-index data and a raw ConceptNet dump are sitting in the working tree, imported
          by nothing (C-08) — one `git add -A` away from a very bad commit.

### Earlier history

Pre-2026-08-28 build history is preserved in `docs/archive/PROGRESS.md` (the stage-by-stage
build log) and `docs/archive/NEXT_STEPS.md` (the stabilization plan that repaired the quality
gates). Both are **history, not instructions** — do not work from them.
