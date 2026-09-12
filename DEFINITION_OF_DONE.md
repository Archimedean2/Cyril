# Cyril — Definition of Done

This is a contract, not a suggestion. Cyril reached "13 stages complete" while the
build failed, lint had never run, the test suite hung, and features marked ✅ were
untested. That happened because "done" meant "I wrote some code and checked a box."
It now means something verifiable. Nothing is done until every item below is true.

## A change is DONE only when all of these pass

1. **Build is clean.** `npm run build` exits 0 (this runs `tsc` *and* `vite build`; type errors block the build).
2. **Lint is clean.** `npm run lint` reports **0 errors**. (Warnings are tracked down over time; errors never merge.)
3. **The suite passes and exits.** `npm test` ends with all tests passing **and the process terminates** (no hang).
4. **Every acceptance criterion you touched has an ID-tagged, passing test.** See the ID rule below.
5. **Feature coverage confirms it.** `npm run coverage:features` shows your criteria as `✅ passing` in `FEATURE_COVERAGE.md` — not `⚠️ no test`, not `❌ failing`.
6. **Docs match reality.** `docs/archive/PROGRESS.md` is updated, and any box you check there is backed by the feature-coverage ledger. Do not check a box the ledger can't prove.

If a criterion is only covered by an end-to-end (Playwright) test, it is **not done**
until `npm run test:e2e` actually runs green. "e2e exists" ≠ "e2e passes."

## The ID rule (this is what makes features traceable)

Every acceptance criterion in the spec pack has an ID like `T-9.04`. **The test that
proves it must carry that exact ID in its title** (in the `it(...)`/`test(...)` name,
or the nearest `describe(...)`). Example:

```ts
it('T-9.04: Chords persist through save/load', () => { ... });
```

This is not cosmetic. `scripts/feature-coverage.mjs` matches tests to criteria by that
ID. An untagged test is invisible to the ledger, so the feature reads as unverified —
which is exactly the failure mode we're eliminating. Do not invent new ID schemes
(`U-9.01`, `I-9.04`): use the spec's `T-` IDs.

## Writing an honest test

- Write the test to describe the **behaviour the criterion promises**, then run it.
- If it fails, fix the code — do not weaken the test to make it pass.
- Do not add assertions that merely restate what the code already does (a "test" that
  can never fail is worse than no test — it manufactures false confidence).
- A criterion with one shallow assertion is not covered. Cover the real behaviour,
  including the failure and edge cases the criterion implies.

## The commands (memorize these four)

```bash
npm run build              # tsc + vite; must exit 0
npm run lint               # must be 0 errors
npm test                   # must pass AND exit
npm run coverage:features  # regenerates FEATURE_COVERAGE.md; your criteria must be ✅
```

Plus `npm run test:coverage` for line/branch/function coverage (currently report-only).

## Two coverage numbers, and why both matter

- **Code coverage** (`npm run test:coverage`) — which lines ran. Baseline ~70% lines,
  ~51% functions. Useful, but it does not prove a feature works.
- **Feature coverage** (`npm run coverage:features`) — whether each *claimed* acceptance
  criterion has a passing test tied to it. This is the primary honesty metric and the
  one that gates completion. Target: 100% of non-e2e criteria, then e2e green.

## Current gate status (2026-07-03)

Report-only in CI for now, by decision: coverage does not fail the build yet, and lint
is non-blocking while the warning backlog is burned down. The plan to tighten these is
in `docs/archive/NEXT_STEPS.md` ("How to use the two metrics going forward"). Report-only does **not**
mean optional — the Definition of Done above still applies to every change.
