# CLAUDE.md — Operating Guide for Cyril

Read this first, every session. It is short on purpose.

## What Cyril is

A desktop-first, local-first lyric editor for musical-theatre lyricists. React +
TypeScript + Vite, Tiptap/ProseMirror editor, Zustand state, local `.cyril` files via
the File System Access API. Product scope and non-goals live in `SCOPE.md` — respect
the "out of scope" list (no AI features, no collaboration, no mobile, etc.).

## The one rule that matters most

**"Complete" means verified, not written.** This project previously marked 13 stages
"done" on top of a failing build, absent lint, a hanging test suite, and untested
features. Do not repeat that. Before you call anything done, satisfy every item in
**`DEFINITION_OF_DONE.md`**. That file is the contract; this section is the summary.

Every change must pass all four gates:

```bash
npm run build              # tsc + vite build — must exit 0
npm run lint               # must report 0 errors
npm test                   # must pass AND terminate (no hang)
npm run coverage:features  # your acceptance criteria must show ✅ in FEATURE_COVERAGE.md
```

And every acceptance criterion you implement must have a test whose title contains its
spec ID (e.g. `it('T-9.04: Chords persist through save/load', ...)`). Untagged tests are
invisible to the feature-coverage ledger and therefore do not count. Details and the
"write an honest test" rules are in `DEFINITION_OF_DONE.md`.

## Where to look

| You need… | Read |
|---|---|
| What's done vs. actually verified | `PROGRESS.md` + `FEATURE_COVERAGE.md` (the ledger; generated, don't hand-edit) |
| What to work on next | `NEXT_STEPS.md` |
| The done contract | `DEFINITION_OF_DONE.md` |
| Product scope & non-goals | `SCOPE.md` |
| Stage plan & acceptance criteria | `STAGES.md`, and `tests/specs/stage-*.md` (the criterion ↔ test map) |
| Data model / schema | `DATA_MODEL.md` |
| Architecture decisions | `ARCHITECTURE.md`, `COMPONENT_MAP.md` |
| Testing strategy & conventions | `TESTING.md`, `TEST_IDS.md` |
| Layout / visual rules | `WIREFRAMES.md`, `DESIGN_SYSTEM.md`, `UI_TOKENS.md` |
| Honest assessment of weak spots | `RECOMMENDATIONS.md` |
| Full agent navigation guide | `README_AGENT.md` |

## How to work

1. Pick the next task from `NEXT_STEPS.md` (or the stage in `STAGES.md`).
2. Find its acceptance criteria in `tests/specs/stage-*.md`. Each has a `T-` ID.
3. Implement narrowly. Don't build future-stage features early. Don't add schema fields
   unless `DATA_MODEL.md` is updated intentionally.
4. Write/keep an ID-tagged test per criterion; make it genuinely exercise the behaviour.
5. Run all four gates. Regenerate `FEATURE_COVERAGE.md` and confirm your criteria are ✅.
6. Update `PROGRESS.md` — only checking boxes the ledger backs up. Record deviations.
7. Commit with a message that names the criteria/IDs addressed.

## Known landmines (save yourself the debugging)

- **`tsc` and `vite build` are separate failure modes.** `vite build` alone can succeed
  while `tsc` fails on type errors — `npm run build` runs both, so trust it, not vite.
- **Test-suite teardown — FIXED.** The leak was undestroyed Tiptap editors in two test
  files and an unclosed IndexedDB connection. The `singleFork` pin has been removed;
  the suite runs with the default multi-fork pool. Always `.destroy()` editors you
  create in tests and close IndexedDB connections in afterEach.
- **`Unknown node type: paragraph` — FIXED.** `createDraft()` and `insertSectionBlock`
  now create `lyricLine` nodes instead of `paragraph` for draft content. Inventory and
  workspace docs still use `paragraph` correctly (they use a different editor).
- **Export layer vs. unified line model.** Per `HANDOFF.md`, export selectors still filter
  by old node types (`speakerLine`/`stageDirection`) instead of `lineType`. Expect wrong
  export output until fixed.
- **Environment.** `.windsurfrules` describes a Windows/PowerShell setup for a different
  tool; ignore it here and use the standard npm commands above.
