# Completed Steps

## Step 1: Add coverage measurement (completed 2026-04-30)

**Do:** Configure vitest with `c8` or `istanbul` coverage. Add a `test:coverage` script to `package.json`. Run it once and record the baseline numbers in `PROGRESS.md`.

**Measurable outcome:**
- [x] `npm run test:coverage` succeeds and prints a coverage summary
- [x] `PROGRESS.md` coverage table has real numbers for: domain, persistence, editor, export, UI, overall
- [x] Coverage thresholds are NOT enforced yet (just measured)

**Notes:**
- Installed `@vitest/coverage-v8@^1.5.0`
- Added `reportOnFailure: true` to coverage config so reports generate even with pre-existing test failures
- Fixed 4 pre-existing test failures (paragraph → lyricLine node fixtures, missing `descendants` mock)
- Baseline: 68.8% lines, 50.77% functions, 74.08% branches

---

## Step 2: Write round-trip serialization tests (completed 2026-04-30)

**Do:** Create `tests/integration/persistence/round-trip.test.ts`. Build complex project fixtures that include every node type. Serialize with `serializeProject`, deserialize with `deserializeProject`, and assert deep equality.

**Measurable outcome:**
- [x] At least 5 round-trip tests pass covering: minimal project, project with all node types, project with concurrent blocks, project with alternates and chords, project with populated workspaces
- [x] `npm run test` passes with no regressions (223/223)

**Notes:**
- 5 tests: minimal, all node types (section blocks + lyric/speaker/stageDirection + bold/italic marks + prosody), concurrent blocks (2 speaker columns, sideBySide layout), alternates + chords (2 chords, 2 alternates, rhyme group), populated workspaces (all 4 workspaces + writers + subtitle)
- Tests use `serializeProject` → `deserializeProject` round-trip through JSON + migration + validation

---

## Step 3: Write migration tests (completed 2026-04-30)

**Do:** Create `tests/unit/domain/migration.test.ts`. Test that `migrateProject` correctly handles legacy `speakerLine`/`stageDirection` nodes, missing `draftSettings` fields, missing `exportSettings.concurrentLayout`, projects with no `schemaVersion`, and preserves unknown fields.

**Measurable outcome:**
- [x] At least 6 migration tests pass (9 written)
- [x] Each test uses a hand-crafted legacy fixture
- [x] `npm run test` passes with no regressions

**Notes:**
- 9 tests covering: speakerLine→lyricLine migration, speakerLine speaker-attr fallback, stageDirection→lyricLine migration, recursive migration inside sectionBlock, missing draftSettings field defaults, missing concurrentLayout default, raw project data (no schemaVersion wrapper) gets stamped, unknown fields preserved, missing drafts array handled gracefully

---

## Step 22: Set up CI pipeline (completed 2026-04-29)

**Do:** Create a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on push/PR:
- `npm ci`
- `npm run build`
- `npm run test`
- `npm run test:coverage` (with minimum thresholds: 70% overall for now)
- `npx playwright install && npm run test:e2e`

**Measurable outcome:**
- [x] A push to main triggers the CI workflow (workflow listens on `push` to `main` and `pull_request` to `main`)
- [x] CI runs all unit, integration, and E2E tests
- [x] CI fails if coverage drops below 70% (enforced via `--coverage.thresholds.lines/functions/branches/statements=70` CLI flags)
- [x] Badge in README shows CI status

**Files created/changed:**
- `.github/workflows/ci.yml` — single `test` job: checkout → setup-node@v4 (Node 20, npm cache) → `npm ci` → `npm run build` → `npm run test` → `npm run test:coverage` with 70% thresholds → `npx playwright install --with-deps` → `npm run test:e2e`. Uploads `coverage/` always and `playwright-report/` on failure. Has `concurrency` group to cancel superseded runs and a 20-minute timeout.
- `README.md` — added GitHub Actions CI badge under the title.

**Notes / follow-ups:**
- Coverage thresholds are enforced **only in CI** via CLI flags; `vitest.config.ts` is unchanged so local `npm run test:coverage` continues to be measure-only (matches Step 1's "thresholds NOT enforced yet" intent).
- Per the post-Step-1 baseline (68.8% lines, 50.77% functions, 74.08% branches), **the first push to `main` will fail at the Coverage step** until coverage rises to 70% across all four metrics. This is the intended behavior of the threshold gate per the action plan ("CI fails if coverage drops below 70%"). To unblock `main` sooner, consider one of: (a) lowering the threshold temporarily, (b) thresholding only on lines, or (c) marking the coverage step `continue-on-error: true` until later phases land.
- The "push triggers workflow" outcome cannot be fully verified locally; it requires pushing to GitHub. YAML structure was sanity-checked (no tabs, valid indentation, `--coverage.thresholds.*` flags confirmed via `vitest run --help --coverage`).
