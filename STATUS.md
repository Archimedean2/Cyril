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
_Last stamped: **2026-08-28 13:06 UTC** · regenerate with `npm run status`_

### Gate status — 🟢 all green

| Gate | Status | Detail |
|---|:--:|---|
| `npm run build` | 🟢 | tsc + vite clean |
| `npm run lint` | 🟢 | 0 errors, 0 warnings |
| `npm test` | 🟢 | 286/286 tests, 49 files |
| `npm run coverage:features` | 🟢 | 100.0% — 136 passing, 0 failing, 0 untested, 36 e2e-only |
| `npm run test:e2e` | 🟢 | 111 passed |

### Repo

| | |
|---|---|
| Branch | `feat/title-screen` |
| Last commit | fix(e2e): create a project before the sharing tests that need the app shell |
| Committed | 2026-08-28 13:36:32 +0100 |
| Uncommitted files | **46** (`git status`) |
| Backlog | **0 of 28** done · next up **C-01** |
<!-- END GENERATED -->

---

## Current focus

> Hand-maintained. Whoever is working: keep this to **three lines or fewer** and update it
> when you start and when you stop. If it disagrees with the generated block above, the
> generated block is right.

**Working on:** nothing claimed — the queue is open at `BACKLOG.md` C-01.

**Last verified state:** full audit 2026-08-28. All five gates green (build, lint, 286 unit +
integration tests, 100% feature coverage on 136 non-e2e criteria, 111/111 Playwright). The app
was driven live and reviewed; findings are in `docs/design/DESIGN_REVIEW.md` §"Live app audit".

**Blocked on:** nothing. C-01 (write-permission check) is the recommended start — see the P0
note in `BACKLOG.md` about durability being the project's single largest risk.

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
