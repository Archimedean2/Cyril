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
