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
_Last stamped: **2026-09-12 16:24 UTC** · regenerate with `npm run status`_

### Gate status — 🟢 all green

| Gate | Status | Detail |
|---|:--:|---|
| `npm run build` | 🟢 | tsc + vite clean |
| `npm run lint` | 🟢 | 0 errors, 0 warnings |
| `npm test` | 🟢 | 576/576 tests, 98 files |
| `npm run coverage:features` | 🟢 | 100.0% — 235 passing, 0 failing, 0 untested, 39 e2e-only |
| `npm run test:e2e` | ⚪️ | not run — `npm run status -- --e2e` |

### Repo

| | |
|---|---|
| Branch | `main` |
| Last commit | docs: record T-13.18–21 and recover the concurrent-speaker enhancement spec |
| Committed | 2026-09-12 17:19:09 +0100 |
| Uncommitted files | **1** (`git status`) |
| Backlog | **31 of 54** done |
| Next up | **C-25 (95) Chords: transpose, trailing runs, instrumental lines**<br>C-24 (100) Alternates peek + draft compare view<br>C-21 (110) Section type colour-coding + sticky stage-direction mode |
<!-- END GENERATED -->

---

## Current focus

> Hand-maintained. Whoever is working: keep this to **three lines or fewer** and update it
> when you start and when you stop. If it disagrees with the generated block above, the
> generated block is right.

**Working on:** nothing in flight. `main` is the only branch that exists now, locally or on
origin — every PR is landed and closed, every worktree removed. Cut new work from `main`. The lookup-and-collect loop (§13) is complete end to end:
double-click to look up, click to collect, dim what is used, click a chip to put it back.
C-25 and C-27 were unblocked by the maintainer — see *Decisions* below before starting either.

**Last verified state:** all gates green — 576 tests, 231/231 non-e2e criteria, e2e 120/120,
visual 8/8. Next unclaimed item is C-24 (Pri 100).

## Decisions taken by the maintainer (2026-09-12) — these are settled

Both items that had been parked in `BACKLOG.md`'s "Blocked on the maintainer" table are now
unblocked. That table is gone; nothing is waiting on the owner.

1. **Cyril's chord sheets are played from by musicians** — not just a lyricist's note of where
   the harmony moves. This was the open question behind C-25, and it settles the item: a sheet
   that cannot notate an intro, a solo or an end-of-line fill is incomplete for the person
   holding it. **The `ChordMarker.position` format change is approved** — as an additive
   discriminated union on `anchorType`, so existing files stay valid — with
   `docs/engineering/DATA_MODEL.md` updated in the same commit and `SCHEMA_VERSION` bumped.
   Transpose needs none of this and should land first, on its own.
2. **Hook Lab gets built as a structured workspace (C-27)** — hooks, groups, per-hook notes,
   drag-reorder, and a migration from the legacy rich-text doc. This **deliberately expands v1
   scope**, so `SCOPE.md`, `FEATURES.md` and `DATA_MODEL.md` move with the code in the same PR.

---

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
6. **Print profiles are based on PR #4, not `main`** (C-32). `main` cannot run `npm run lint`
   or `npm run coverage:features` at all — neither `.eslintrc.cjs` nor
   `scripts/feature-coverage.mjs` is tracked. Basing the branch on the tooling PR was the only
   way to verify it honestly.
7. **Order of work: finished the P0 persistence block before visual polish**, on the maintainer's
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

### 2026-09-12 — Claude — Cleaned out the worktrees, branches and the stash

Did:      Removed all four agent worktrees and every branch but `main` — 19 local, 12 remote.
          Each was verified contained in `main` first, not assumed. Two branches (PRs #1 and #3)
          were squash-merged so their commits are not ancestors; they were checked by content
          instead and force-deleted once confirmed superseded. Restore SHAs, should any be
          wanted back: concurrent-block-deletion 7d2cbd4, e2e-stale-draft-mode-testids b0a5668,
          the stash 3672f4c, title-screen ed42280.
Gates:    🟢 all five on `main` — 576 tests, **235/235** non-e2e criteria, e2e 120/120, visual 8/8.
Next:     C-25 (Pri 95) — chords; transpose first, it needs no format change.
Notes:    The clean-up turned up two things that were not clean-up.
          (1) **Four tests had been passing uncounted since they were written.** `T-13.18`–`T-13.21`
          (concurrent-block row and block deletion) are tagged correctly in
          `concurrent-block-integration.test.ts`, but no criterion row for them ever existed in
          `tests/specs/stage-13.md` — on any branch, so this was an original omission, not a merge
          loss. The ledger read 231/231 while the suite actually verified 235 criteria' worth of
          behaviour. Rows added; the ledger now reports 235/235. Worth knowing the gate is silent
          in this direction: an untagged test is invisible, and so is a tagged test with no row.
          (2) **A July stash held the only copy of a written spec.** It was 99% edits to documents
          the audit retired (`NEXT_STEPS.md`, `current_step.md`, the old `CLAUDE.md` orchestration
          section), but one hunk documented enhancements E1 (row alignment guides while editing)
          and E2 (Backspace row/block deletion) for `docs/features/feature-concurrent-speakers.md`.
          Both features had shipped; only the reasoning was never committed. Recovered into that
          doc, marked shipped, before the stash was dropped. It also records the one piece of E2
          that was never built — the hover-revealed bin control — which is not in `BACKLOG.md`.

### 2026-09-12 — Claude — Landed the whole PR stack on `main`

Did:      Merged all ten open PRs (#6–#15) and closed the stack. `main` had been sitting ~20
          commits behind a chain of stacked branches for two weeks. Net content change across
          all ten: **one file** — `.github/workflows/ci.yml`. Everything else was already in the
          integration branch; PR #8 was the only branch carrying work that had never landed
          (blocking lint, PRs on any base, the 5 MB tracked-file guard).
Gates:    🟢 all five on `main` — 576 tests (98 files), 231/231 non-e2e criteria, e2e 120/120,
          visual 8/8. Run on the merged tree before the push, not after.
Next:     C-25 (Pri 95) — chords; transpose first, it needs no format change.
Notes:    Four things worth carrying, because this will happen again.
          (1) **Naive merging would have reverted finished work.** Five of the branches (#10–#14)
          predate the 2026-08-28 doc reorganisation and still carry the 26 root-level markdown
          files as tracked content, plus `src/editor/transforms/metadata.ts` — the `delivery`
          feature C-10 deleted and T-4.26 asserts is grep-clean. A plain merge resurrects both.
          Those five were recorded with `-s ours` after verifying, per branch, that every
          acceptance criterion on them was already present: no unique criteria, no unique
          source beyond the two hazards above. The merge messages say so.
          (2) **Check the branch side of a conflict before resolving.** Nearly every conflict was
          "HEAD has later content, branch side is empty" — safe to keep ours — but that has to be
          *verified*, not assumed. A throwaway script reported both sides of every conflict block;
          the two-sided ones in `projectStore.ts` and `autosave.ts` turned out to be C-29/C-06
          work the branch predated. `FEATURE_COVERAGE.md` conflicted on all nine merges and was
          regenerated every time, never picked (C-31).
          (3) **`git cherry` over-reports uniqueness.** It compares patch-ids, so a commit applied
          through a conflict resolution looks unique when its work is already in. It said PR #9
          had 4 unique commits; all four test files were already on the branch. Compare trees and
          criteria, not patch-ids.
          (4) **PRs #4 and #5 were merged on GitHub mid-session**, which is why the first push was
          rejected. Their content was already here; merging `origin/main` back in was clean.
          GitHub then auto-closed #6/#7/#8/#15 as merged, but refused to retarget or merge #9–#14
          ("no new commits between base and head") — an already-landed PR cannot be marked merged.
          Those six were closed with a comment naming the commit that landed them.

### 2026-09-12 — Claude — The lookup-and-collect loop closes (C-41, C-42, C-47)

Did:      C-41 double-click a word in the lyric and the rail looks it up. The gesture is
          observed, never consumed (`handleDoubleClick` always returns false), so the browser
          still selects the word and the caret never moves; the rail names what it is showing
          ("rhymes for **left**"); `Mod-Shift-L` is the keyboard twin for the word under the
          caret; a checkbox at the foot of the Tools pane turns the whole thing off. The word is
          read from the document at the clicked position rather than from the selection
          afterwards — at handler time ProseMirror has not yet applied its word selection, and
          waiting for it would be a timing hack. C-42 clicking an Inventory chip inserts its
          text at the caret through C-48's bridge — the way out of the word bank, which until
          now only had a way in. C-47 the empty state now teaches the gesture instead of
          describing the search box the writer can already see. Removed the inert ⌖ control
          (D-24 closed) and retired T-7.04, which asserted its behaviour.
Gates:    🟢 all five — 576 tests (98 files), 231/231 non-e2e criteria, e2e 120/120, visual 8/8.
Next:     C-24 (alternates peek + draft compare view) is the next unclaimed item, at Pri 100.
Notes:    Four things worth carrying. (1) **Two real defects, both found only in the browser**
          (D-26, D-27). Clicking a chip left focus on the chip button — a button takes focus on
          mousedown, before the click handler runs — so the writer's next keystroke went
          nowhere and `Cmd+Z` reached the browser's native undo, which emptied the editor.
          Fixed with `preventDefault` on mousedown. Then, with focus fixed, one `Cmd+Z` still
          removed the inserted word *and the sentence typed before it*: `insertAtCaret` was one
          transaction (true, and tested) but prosemirror-history folds adjacent steps into one
          undo *event* inside its 500 ms group delay. Now `closeHistory` runs before the insert.
          The lesson is the gap between "one transaction" and "one undo as the writer feels it"
          — the unit test asserted the first and would never have caught the second.
          (2) **The visual suite's 2% pixel tolerance is loose enough to miss a new row of UI.**
          Adding the subject line and the preference toggle to the rail changed shot 6 by less
          than `maxDiffPixelRatio: 0.02`, so it passed and Playwright did not rewrite the
          baseline; the committed PNG was quietly stale. I deleted and regenerated it. Worth
          deciding whether that tolerance should be tighter, or whether baselines should be
          regenerated deliberately whenever a pane's contents change.
          (3) The double-click preference is a **localStorage UI preference, not a `.cyril`
          field** — it describes how this person works, not the song, and DATA_MODEL.md is
          untouched.
          (4) §13.2's "drag a result or a chip into a line" is **not built** — it is a bullet in
          the spec prose, not one of the item's acceptance criteria, and I did not widen scope
          to take it. If you want drag, it needs its own item.

### 2026-09-12 — Claude (coordinator) — Merged F2's stranded lane: the editor bridge, at last

Did:      Merged `worktree-agent-ae70e79a6130d6de0` — three commits from 2026-08-29 that were
          finished, committed and then never merged or marked. C-48 gives the right rail a narrow
          command surface over the draft editor (`insertAtCaret` / `getFocusedWord`) registered as
          a non-reactive ref, so the rail can read and write the caret without re-rendering the
          shell on every keystroke. C-35 puts a character picker on the speaker line's colour dot.
          C-36 adds the speaker gutter you can click and drag to paint a range, in one undo step.
          29 new criteria (T-4.39 … T-4.59) with tests. Marked all three ✅ and wrote this entry —
          the lane's own step 8 was never done, which is why the work sat invisible for two weeks.
Gates:    🟢 all five on the merged tree — 549 tests (95 files), 223/223 non-e2e criteria,
          e2e 116/116, visual 8/8.
Next:     C-41 (double-click a word to look it up) — unblocked now that C-48 has landed.
Notes:    Three things worth carrying. (1) The merge conflicted on FEATURE_COVERAGE.md and only
          on that — the known landmine, resolved by regenerating from the merged tree as C-31
          requires. (2) The standing warning in this file that visual baselines would fail after
          the F2/F3 merges is now obsolete: all 8 pass, including the right-rail shot. Removed it.
          (3) `npm run test:e2e` is 116 tests, not 124 — Playwright has two projects and the
          visual suite (8) runs separately via `npm run test:visual`. Earlier entries quoting 124
          were counting both. The coordinator note about the `tools-collect-button` selector swap
          is also done and gone; F2's branch carried the fix.

### 2026-08-29 — F3 (lane S) — Lookup-and-collect: score emphasis, click-to-collect, dim-when-used

Did:      C-45 replaced the relative "top 30%" rhyme-emphasis threshold with a fixed absolute
          score (5000), chosen by sampling real `rel_rhy` scores from the Datamuse API — it sits
          in the cliff between genuine dictionary rhymes and DEFECTS.md D-22's known junk
          ("left" → bereft/cleft/deft/theft/heft above it, antitheft/klepht below). C-43 flipped
          Tools-pane result clicks: primary click now collects into Inventory, copy moved to a
          shared secondary `tools-copy-button` (same testid for both the rhyme and generic result
          renderers, per coordinator note). Retired T-7.06 (stage-7.md, struck ID so the coverage
          script skips it) rather than reword it in place, since it asserted the exact behaviour
          C-43 inverted; T-14.20 carries the current behaviour. C-44 added a derived (never
          stored) "used" state — `src/domain/tools/draftWordUsage.ts` tokenizes the draft's text
          (walking every node type: sectionBlock/concurrentBlock/speakerColumn/lyricLine) and
          does whole-word, case-insensitive, punctuation-insensitive matching, so "low" is not
          used merely because the draft has "below". Dims Inventory chips and Tools results
          already in the draft or already collected.
Gates:    🟢 all four (build/lint/test/coverage) after each of the three commits; e2e green for
          stage-7-tools.spec.ts + stage-5-inventory.spec.ts. Full `npm run test:e2e` also run:
          115/116 pass — the one failure (journey-write-a-song.spec.ts:98, `tools-collect-button`
          no longer exists) is expected from C-43 and was coordinated with main/the file's owner
          ahead of time; fix is a one-line testid swap to be applied at merge.
Next:     C-42 (click an Inventory chip to insert at the caret) is the next item in this area,
          but needs the C-48 editor bridge, which is a different agent's lane.
Notes:    `tests/e2e/visual.spec.ts` and `journey-write-a-song.spec.ts` both still reference the
          removed `tools-collect-button` testid — flagged to `main`/the owning agent rather than
          edited directly (outside this lane's file ownership). Visual baselines will need
          regenerating for the right-rail shot after this merges (expected, not done here per
          instructions). BACKLOG.md's "Depends: C-42" on C-43/C-44 turned out not to apply in
          practice — both landed fully without any editor access, since collecting/dimming are
          rail-side-only concerns; left the dependency column as-is since it wasn't asked for.

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
