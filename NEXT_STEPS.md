# Cyril — What's Next

_Owner's roadmap, written after a hands-on audit of the repo on 2026-07-03. This is the plan of record; `PROGRESS.md` describes what a prior agent *claimed*, this describes what is actually true and what to do about it._

## The one-paragraph situation

Cyril is further along than it feels, and less finished than it claims. The underlying code is real: the app builds, runs, and 241 unit/integration tests genuinely pass. But every quality gate that was supposed to protect the project was quietly broken — the production build failed on type errors, there was no ESLint config at all, the test runner hung forever instead of exiting, and CI gated on a coverage number the project didn't meet. So "13 stages complete" was being declared on top of gates that never actually ran. The fix is not to build more; it is to make "done" mean something, then close the gap between claimed and verified before adding scope.

## What was repaired today (Phase 0 — done)

These were the load-bearing problems. All four are now fixed and verified:

- **`npm test` used to hang forever.** A leaked handle kept a worker alive under the default multi-process pool. Pinned the runner to a single fork, which tears down cleanly; the whole suite now runs and exits in ~9s (241 passing). The underlying leak still wants a real fix (see Phase 1) so parallelism can come back.
- **`npm run build` failed.** Nine TypeScript errors (a real one in `ExportDialog`, the rest stale test fixtures missing `showStressMarks` / `concurrentLayout`). Fixed; `tsc && vite build` is clean.
- **`npm run lint` didn't exist.** There was no ESLint config, so the lint gate never ran once. Added a config appropriate to the stack; it now reports 0 errors and ~50 warnings to burn down.
- **CI was gating on unmet coverage.** Relaxed the hard 70% threshold to report-only (per your call), added a non-blocking lint step, and wired the new feature-coverage report in.

Two new metrics now exist:

- **Code coverage** — v8, with `lcov` + HTML reports. Baseline: **69.6% lines, 74.2% branches, 51.3% functions**. The low function number is the honest weak spot.
- **Feature coverage** — a new, stricter metric (`npm run coverage:features`, see below). Baseline: **91.6%** of verifiable acceptance criteria have a passing automated test.

## The guiding principle from here

Code coverage tells you which lines ran. It does not tell you whether a feature works. The recurring failure mode on this project has been marking a stage "complete" on the strength of one or two shallow tests. So the source of truth going forward is **feature coverage**: every acceptance criterion in the spec pack must map to a real, passing test before it is called done. The generated `FEATURE_COVERAGE.md` is that ledger. Don't check a box in `PROGRESS.md` that the ledger doesn't back up.

## Phase 1 — Make green trustworthy (in progress)

The 91.6% headline hid exactly the kind of gap that started this whole conversation. Two of those gaps are now closed; three remain and are the immediate queue.

**1a. Retag the Stage 9 chord tests — ✅ DONE (2026-07-03).** Criteria T-9.01–T-9.06 had real, passing tests mislabelled `U-9.0x` / `I-9.0x`; retagged to the spec IDs so they trace.

**1b. Write the four genuinely-missing tests — ✅ DONE (2026-07-03).** `T-2.07` (formatted copy/paste), `T-2.09` (formatting survives save/load), `T-3.07` / `T-3.08` (duplicate-inventory-only / duplicate-both). Non-e2e feature coverage is now **100% (119/119)**. A pre-existing flaky clipboard test (`T-7.06`) was also fixed along the way.

**1c. Get the e2e suite green — ✅ DONE (2026-07-03).** Fixed 43 broken Playwright tests across 12 spec files. All 108/108 e2e tests now pass. Root causes were all test bugs, not product bugs: wrong selectors, wrong keyboard shortcuts (Control vs Meta on macOS), missing picker interactions, dialog deadlocks, and non-existent testid references.

**1d. Fix the ProseMirror "Unknown node type: paragraph" warning — ✅ DONE (2026-07-03).** `createDraft()` and `insertSectionBlock` were creating content with `{ type: 'paragraph' }` for draft docs, but the draft editor disables paragraph and uses `lyricLine`. Fixed all three code paths in `drafts.ts` and `sections.ts`. Zero warnings in test output now.

**1e. Find and fix the test-suite leak — ✅ DONE (2026-07-03).** Three leaks found: `formatting-commands.test.ts` and `chords.lyric-edit-safety.test.ts` created Tiptap editors without calling `.destroy()`, and `IndexedDBToolCacheStore` never closed its database connection. Added cleanup to all three. Removed the `singleFork: true` pin — suite now runs with the default multi-fork pool and exits cleanly.

## Phase 2 — Reliability and architecture

Once green is trustworthy, pay down the structural debt that will otherwise make the product feel fragile "at the lightest touch" — which is exactly the complaint.

- **Implement autosave — ✅ DONE (2026-07-03).** Debounced 3s autosave via Zustand subscriber. Writes to disk only when `projectSettings.autosave` is true AND a file handle exists (project saved at least once). Silent on errors. 6 unit tests.
- **Optimize the store — ✅ DONE (2026-07-03).** Rather than a full store split, converted all 10 components from whole-store destructuring to individual Zustand selectors. Components like WorkspaceNav/TopBar/DraftList no longer re-render on every keystroke. The actual update (`updateDraftDoc`) does shallow copies (not deep clones), so the allocation cost was already negligible — the re-render isolation was the real win.
- **Delete the dead scaffolding — ✅ DONE (2026-07-03).** Removed 10 empty files (orphaned `App.tsx`, empty editor/state/persistence stubs) and the empty `panes/` directory.
- **Code-split the bundle — ✅ DONE (2026-07-03).** Split into vendor chunks via `manualChunks`: vendor-react (142 KB), vendor-editor (371 KB), vendor-zod (64 KB), vendor-icons (6 KB). The CMU dictionary was NOT in the bundle (only used by test code via dynamic require). Total gzipped: ~950 KB, now with independent cache lifetimes per vendor chunk.

## Phase 3 — Make it feel finished (the "look better / smoother" ask)

This is the polish layer, and it should come *after* the app is trustworthy — a beautiful UI over a fragile core still feels broken. I haven't driven the running UI yet, so treat these as candidates to confirm by using the app: save-status feedback that's actually wired to autosave, graceful empty and error states (the error boundaries exist — make their fallbacks genuinely helpful), keyboard shortcuts for the core writing loop, print/PDF output polish, and a consistent pass over spacing/typography against `DESIGN_SYSTEM.md`. I'd like to spend a session in the live app with you to turn this into a concrete punch list rather than guessing.

## Phase 4 — New scope

`SCOPE.md`'s out-of-scope list (AI assist, collaboration, audio, chord diagrams) stays out until the core drafting experience is excellent and honestly at 100% verified feature coverage. The project's own principle — "no speculative complexity before core drafting is excellent" — is the right call. Hold the line.

## How to use the two metrics going forward

Run `npm run coverage:features` after any stage of work; it regenerates `FEATURE_COVERAGE.md` from the spec pack and the live test results, so it can't drift from reality. Suggested gate timeline, matching the "report now, gate later" decision:

1. **Now:** both metrics report-only in CI. Lint non-blocking.
2. **After Phase 1:** make e2e a required check and gate feature coverage at its then-current level so it can only go up.
3. **After Phase 2:** raise the code-coverage floor to 70% lines / 60% functions and re-enable the hard threshold; flip lint to blocking once warnings are cleared.

## Concrete next pull requests

1. ~~Retag Stage 9 chord tests to spec IDs (1a).~~ ✅ Done.
2. ~~Add the four missing tests and fix whatever they expose (1b).~~ ✅ Done.
3. ~~Get Playwright green and make it a required check (1c).~~ ✅ Done — 108/108 e2e passing.
4. ~~Fix the paragraph-schema bug and the test-leak; restore the parallel pool (1d, 1e).~~ ✅ Done.
5. ~~Implement debounced autosave (Phase 2).~~ ✅ Done — 3s debounce, 6 unit tests.
6. ~~Optimize store, delete dead scaffolding, code-split bundle (Phase 2).~~ ✅ Done.
7. Phase 3 — Polish pass (save-status UI, keyboard shortcuts, error states, typography).
