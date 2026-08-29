# CLAUDE.md — Operating Guide for Cyril

Read this first, every session. It is short on purpose.

## What Cyril is

A desktop-first, local-first lyric editor for musical-theatre lyricists. React + TypeScript +
Vite, Tiptap/ProseMirror editor, Zustand state, local `.cyril` files via the File System Access
API. Product scope and non-goals live in `docs/product/SCOPE.md` — respect the "out of scope"
list (no AI features, no collaboration, no mobile, etc.).

## The three files that run this project

| File | What it is |
|---|---|
| **`STATUS.md`** | Where things stand *right now*, and where the last session left off. **Read first.** Refresh with `npm run status`. |
| **`BACKLOG.md`** | The single ordered work queue. Take the lowest unclaimed item. Nothing else is a backlog. |
| **`DEFINITION_OF_DONE.md`** | The contract for "done". Non-negotiable. |

Everything else is reference material you read *when a task needs it* — see the map below.

## The one rule that matters most

**"Complete" means verified, not written.** This project once marked 13 stages "done" on top of
a failing build, absent lint, a hanging test suite, and untested features. Those gates were
repaired and are green today; keep them that way.

Every change must pass all four gates:

```bash
npm run build              # tsc + vite build — must exit 0
npm run lint               # must report 0 errors
npm test                   # must pass AND terminate (no hang)
npm run coverage:features  # your acceptance criteria must show ✅ in FEATURE_COVERAGE.md
```

Plus `npm run test:e2e` (Playwright) whenever you touch the UI.

And every acceptance criterion you implement must have a test whose title contains its spec ID
(e.g. `it('T-9.04: Chords persist through save/load', ...)`). Untagged tests are invisible to the
feature-coverage ledger and therefore do not count. Details and the "write an honest test" rules
are in `DEFINITION_OF_DONE.md`.

## How to work

1. **`npm run status`** — confirm the tree is green before you touch anything.
2. Read `STATUS.md` *Current focus* and the top of the session log.
3. Take the lowest unclaimed item from `BACKLOG.md`. Claim it (`🚧 <you>`) and commit that
   one-line change first, so a parallel agent doesn't duplicate your work.
4. Read the item's linked spec. Find or write its `T-` acceptance criteria.
5. Implement narrowly. Don't build future-item features early. Don't add schema fields unless
   `docs/engineering/DATA_MODEL.md` is updated intentionally.
6. Write an ID-tagged test per criterion; make it genuinely exercise the behaviour.
7. Run the gates. Regenerate `FEATURE_COVERAGE.md`; confirm your criteria are ✅.
8. Mark the item ✅, **append a session-log entry to `STATUS.md`**, run `npm run status`, commit
   with the item ID in the message.

Step 8 is the one people skip. Don't — it is the only reason the next session (or the next
agent) knows what happened.

## Where to look

| You need… | Read |
|---|---|
| Where things stand / where I left off | `STATUS.md` |
| What to work on next | `BACKLOG.md` |
| The done contract | `DEFINITION_OF_DONE.md` |
| What's actually verified | `FEATURE_COVERAGE.md` (generated — never hand-edit) |
| Product scope & non-goals | `docs/product/SCOPE.md` |
| Feature behaviour specs | `docs/product/FEATURES.md` |
| The forward design spec (characters, print, chords, tools) | `docs/product/DESIGN_PROPOSAL.md` |
| Visual rules & tokens | `docs/design/DESIGN_SYSTEM.md`, `docs/design/UI_TOKENS.md`, `docs/design/WIREFRAMES.md` |
| A designer's read of the current build | `docs/design/DESIGN_REVIEW.md` |
| Data model / schema | `docs/engineering/DATA_MODEL.md` |
| Architecture & components | `docs/engineering/ARCHITECTURE.md`, `docs/engineering/COMPONENT_MAP.md` |
| Known hazards to test against | `docs/engineering/EDGE_CASES.md` |
| The persistence hardening task | `docs/engineering/HARDENING_PERSISTENCE.md` |
| Testing strategy & selectors | `docs/testing/TESTING.md`, `docs/testing/TEST_IDS.md` |
| Criterion ↔ test map | `tests/specs/stage-*.md` |
| Rules for agents (scope, change size, when to stop) | `docs/process/TASKING.md` |
| Full document map | `docs/process/DOC_MAP.md` |
| A prompt to start an agent on this repo | `docs/process/AGENT_BRIEF.md` |

**`docs/archive/` is history — do not work from it.** It holds `STAGES.md`, `PROGRESS.md`,
`NEXT_STEPS.md`, `ACTION_PLAN.md`, `HANDOFF.md`, `RECOMMENDATIONS.md`, `current_step.md`,
`last_step.md` and `completed_steps.md`. They record how the project got here, and several of
them describe problems that were fixed long ago. `BACKLOG.md` supersedes all of them.

## Running several agents at once

`BACKLOG.md` assigns every item to a **lane** (Persistence · Editor · Shell · Domain · Repo).
Lanes own disjoint file paths, so one agent per lane runs in parallel safely. Two agents in the
same lane will conflict over the same files. Items within a lane are ordered — respect the
`Depends on` column.

## Known landmines (save yourself the debugging)

- **`tsc` and `vite build` are separate failure modes.** `vite build` alone can succeed while
  `tsc` fails on type errors — `npm run build` runs both, so trust it, not vite.
- **Destroy your editors.** The test suite once hung forever because Tiptap editors created in
  tests were never `.destroy()`ed and an IndexedDB connection was never closed. Always tear both
  down in `afterEach`. (Fixed; the `singleFork` pin is gone and the suite runs multi-fork.)
- **Draft content uses `lyricLine`, not `paragraph`.** `createDraft()` and `insertSectionBlock`
  create `lyricLine` nodes — the draft editor doesn't register `paragraph`. Inventory and
  workspace docs use a different editor and do use `paragraph` correctly.
- **The word-index files are gitignored build artefacts.** `rhyme-index.json` (8.9 MB) and
  `family-index.json` (23.8 MB) are generated by `npm run build:rhymes` / `build:families` and
  are not committed. Nothing imports them yet — see `BACKLOG.md` C-08 and C-23.
- **`FEATURE_COVERAGE.md` conflicts on every merge.** Every agent regenerates it as part of the
  gates, so any two branches that touched tests will collide on it. **Always resolve by
  regenerating from the merged tree** (`npm run coverage:features`), never by picking a side —
  picking a side silently reports the wrong ledger. Tracked as `BACKLOG.md` C-31.
- **`git add -A` is dangerous on a branch cut from `main`.** Until the corrected `.gitignore`
  lands, such branches do not ignore the generated word indexes (9 MB, 24 MB) or the raw
  ConceptNet dump (~500 MB). Stage explicit paths. CI now fails on any tracked file over 5 MB.
- **Environment.** `.windsurfrules` describes a Windows/PowerShell setup for a different tool;
  ignore it here and use the standard npm commands above.
