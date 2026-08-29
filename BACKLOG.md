# Cyril — Backlog

**This is the single ordered work queue.** One agent, or ten, take items from here. Nothing
else is a backlog: `docs/archive/NEXT_STEPS.md` and `docs/archive/STAGES.md` are history and
must not be worked from.

Written 2026-08-28 after a full audit: all five gates run green, the app was driven live, and
every "not started" claim in the spec docs was checked against the source.

---

## How to take an item

1. Read `CLAUDE.md` and `DEFINITION_OF_DONE.md`. They are short and they are the contract.
2. Pick the **lowest-numbered unclaimed item whose dependencies are met**. Prefer your lane
   (see *Lanes* below) if you are one of several agents.
3. Claim it: set **Status** to `🚧 <your name/id>` in the table and commit that one-line change
   immediately, so no one else takes it.
4. Build it. Every acceptance criterion gets a test whose title contains its `T-` ID.
5. Run all four gates (`npm run build`, `npm run lint`, `npm test`, `npm run coverage:features`),
   plus `npm run test:e2e` if you touched the UI.
6. Set **Status** to `✅`, add a line to the session log in `STATUS.md`, run `npm run status`,
   and commit with the item ID in the message (e.g. `feat(C-09): accept [[NAME]] closing brackets`).

**If an item is ambiguous, needs a `docs/engineering/DATA_MODEL.md` change, or has two viable approaches — stop
and ask.** That rule is in `docs/process/TASKING.md` and it is the one that keeps this codebase
from drifting.

## Lanes (for running several agents at once)

Items in different lanes touch disjoint files and can run in parallel. Items **within** a lane
share files and must run in order.

| Lane | Owns these paths | Items |
|---|---|---|
| **P — Persistence** | `src/persistence/**`, `src/app/state/saveStatusStore.ts` | C-01 … C-07 |
| **E — Editor** | `src/editor/**`, `src/components/editor/**` | C-09, C-10, C-17, C-25, C-26 |
| **S — Shell & styling** | `src/components/layout/**`, `src/features/**`, `src/index.css` | C-11 … C-16, C-20, C-22, C-24 |
| **D — Domain & export** | `src/domain/**` | C-19, C-21, C-23 |
| **X — Repo / process** | config, CI, docs, scripts | C-08, C-18, C-27, C-28 |

Two agents in the same lane will conflict. One agent per lane is the safe fleet shape.

---

## The queue

Ordered by **Pri**, lowest first. Priorities are spaced by ten so an item can be slid in
between two others by giving it a number in the gap — no renumbering. `npm run status` reads
this table and tells you what is next, so this ordering is the one that counts.

| Pri | # | Item | Lane | Status | Size | Depends | Spec |
|--:|---|---|:--:|:--:|:--:|---|---|
| 10 | C-32 | Track the lint config and the coverage script (main cannot run its own gates) | X | ✅ | S | — | below |
| 15 | C-48 | **Editor command bridge** — let the rail read and write the caret | E | 🚧 F2 | S | — | §13.0 |
| 20 | C-41 | **Double-click a word in the lyric to look it up** | S | ⬜ | M | C-48 | §13.1 |
| 30 | C-42 | **Click an Inventory chip to insert it at the caret** | S | ⬜ | S | C-48 | §13.2 |
| 40 | C-45 | Emphasise results by an absolute score, not a relative one | S | ✅ | S | — | §13.5 |
| 50 | C-35 | Speaker picker on the character colour dot | E | 🚧 F2 | S | C-20 | §12.1 |
| 60 | C-36 | **Speaker gutter — click a cell, drag to paint a range** | E | 🚧 F2 | M | C-35 | §12.2 |
| 70 | C-43 | Clicking a result collects it; copy becomes secondary | S | ✅ | S | C-42 | §13.3 |
| 80 | C-44 | Dim collected words once they appear in the draft | S | ✅ | S | C-42 | §13.4 |
| 90 | C-47 | Empty states teach the double-click gesture | S | ⬜ | S | C-41 | §13.7 |
| 100 | C-24 | Alternates peek + draft compare view | S | ⬜ | M | — | §5 |
| 110 | C-21 | Section type colour-coding + sticky stage-direction mode | D | ⬜ | M | C-20 | §3.2–3.3 |
| 120 | C-37 | Structure outline with drag-reorder and jump-to | S | ⬜ | M | C-21 | §12.3 |
| 130 | C-39 | Smart paste — detect `NAME:` prefixes into speaker lines | E | ⬜ | M | C-20 | §12.5 |
| 140 | C-23 | Reference tools: wire the offline word indexes | D | ⬜ | L | C-08 | §6 |
| 150 | C-26 | Unified right-click context menu | E | ⬜ | L | C-35 | §10 |
| 160 | C-38 | Bulk line-type conversion on a multi-line selection | E | ⬜ | S | C-26 | §12.4 |
| 170 | C-40 | Make `Cmd+K` selection-aware | S | ⬜ | S | C-38 | §12.5 |
| 180 | C-46 | One shared word-bank component (Inventory + Vocabulary World) | S | ⬜ | M | C-44 | §13.6 |
| 190 | C-33 | A suppressed duplicate speaker label leaves a blank row | S | ⬜ | S | C-20 | below |
| 200 | C-28 | Burn down the edge-case register (ongoing) | X | ⬜ | — | — | below |

### Blocked on the maintainer

Not started deliberately — each changes something only the owner should agree to.

| # | Item | Lane | Size | Why it is blocked | Spec |
|---|---|:--:|:--:|---|---|
| C-25 | Chords: transpose, trailing runs, instrumental lines | E | L | changes `ChordMarker.position` in the **file format** | §4.4–4.5 |
| C-27 | Hook Lab as a structured workspace | X | L | expands **v1 scope** | §9 |

### Done

25 items. Detail for the ones with a written-up rationale is kept below.

- **C-01** — Write-permission check before every save
- **C-02** — Validate on load; corrupt + newer-schema files
- **C-03** — `beforeunload` guard when dirty
- **C-04** — IndexedDB recovery snapshot — the durability win
- **C-05** — Fallback Open/Save without the File System Access API
- **C-06** — Honest `local-only` save status
- **C-07** — Warn before overwriting a file changed outside Cyril
- **C-08** — Gitignore the word-data pile; track its scripts
- **C-09** — `[[NAME]]` / `((text))` accept their closing brackets
- **C-10** — Removed the `delivery` feature
- **C-11** — Inventory as removable chips
- **C-12** — The editor reads as a real page
- **C-13** — Toolbar rebuilt as grouped controls
- **C-14** — Tools filter chips + honest offline states
- **C-15** — View toggles grouped under Structure / Sound
- **C-16** — Song title appears once
- **C-17** — Chords left-align to their anchor letter (landed on `main` earlier)
- **C-18** — CI: blocking lint, correct job name, chromium-only, 5 MB guard
- **C-19** — Editor token sweep finished
- **C-20** — Character registry with colours, migration, autocomplete
- **C-22** — Print profiles — lyric / chord / libretto / annotated
- **C-29** — Re-grant banner when a handle loses permission
- **C-30** — `beforeunload` also treats `saving` as dirty
- **C-31** — Feature-coverage gate moved into CI
- **C-34** — Console guard, golden files, visual regression, journey test

---

## Item detail

Only items that needed more than a table row. Everything else is specified in the linked
`docs/product/DESIGN_PROPOSAL.md` section.

### C-32 · The lint config and the coverage script are not in version control — Lane X · Size S · ⬜

**Found 2026-08-29 and it matters.** `main` tracks neither `.eslintrc.cjs` nor
`scripts/feature-coverage.mjs`. Both were created during the July stabilization and left
**untracked** in the maintainer's working directory. Consequences:

- On a fresh clone of `main`, `npm run lint` fails outright ("ESLint couldn't find a
  configuration file") and `npm run coverage:features` fails with `MODULE_NOT_FOUND`.
- The project's two honesty mechanisms — the lint gate and the feature-coverage ledger — have
  never actually been part of the repository. That is why CI carried `continue-on-error` on
  lint, and why "lint had never run" in the original assessment.
- Every open PR branch happens to add `.eslintrc.cjs`, because agents' `git add -A` swept the
  untracked file in. It will therefore land — but by accident, not by intent.

Also in scope: fold `printProfile` into `ExportSettings` in `src/domain/project/types.ts`. C-22
added it via TypeScript module augmentation to avoid touching a concurrently-owned file; that
was a scheduling workaround and should not be the permanent shape.

- Acceptance: a fresh clone of `main` runs all four gates with no missing-file errors; the
  config and script are tracked deliberately in one commit; `printProfile` lives in `types.ts`.


### C-33 · A suppressed duplicate speaker label leaves a blank row — Lane S · Size S · ⬜

C-20 hides the repeated label on consecutive lines by the same character and shows a colour
gutter tick instead (correct, script-style). But the hidden label still occupies its line
height, so the continuation reads as an accidental blank line with a tick beside it rather than
a tight continuation.

- Acceptance: consecutive same-character lines sit at normal line spacing; the gutter tick
  aligns with the continuation text; no empty row appears where the label was.

For the look-and-feel pass.


### C-28 · Burn down the edge-case register — Lane X · Size ongoing · 🔵 §8 (persistence) done

`docs/engineering/EDGE_CASES.md` is an adversarial-QA list of ~70 hazards, prioritised
🔴/🟠/🟡. It is not a task in itself: **when you build any item above, cover that item's
neighbouring hazards as part of it.** Building chords (C-17, C-25) means covering §1 in full.
Building persistence (C-01…C-07) means §8. Building the context menu (C-26) means §12.

An item is not done while its adjacent 🔴 hazards are untested.

**§8 (persistence) is done — and it earned its keep.** Working through it found two real bugs
that the feature tests had missed: `saveProject` had no serialization, so a slow autosave could
land after — and silently overwrite — a newer manual save while the UI reported "Saved"; and
`IndexedDBToolCacheStore` rejected instead of degrading, so a word lookup crashed in private
browsing. Both fixed with tests confirmed to fail against the old code (`T-1.32`, `T-1.35`).
Remaining slices: §1 chords, §2 alternates, §3 line types, §4 concurrent blocks, §5 undo/redo,
§6 paste/input, §7 prosody, §10 tools, §11 export, §12 UI/a11y.

---


### C-08 · Deal with the uncommitted word-data pile — Lane X · Size S · ✅

The working tree holds ~530 MB of untracked build output and source data that no code imports:

| Path | Size | Status |
|---|---|---|
| `conceptnet-assertions-5.7.0.csv.gz` | 498 MB | raw download, should never be committed |
| `src/domain/tools/family-index.json` | 23.8 MB | generated, **not imported by any source file** |
| `src/domain/prosody/rhyme-index.json` | 8.9 MB | generated, **not imported by any source file** |
| `vocab.txt`, `cache/` | ~100 KB | generated |
| `scripts/build-*.mjs/cjs`, `make-vocab.mjs`, `warm-word-cache.mjs` | — | real work, worth keeping |

Someone built an offline rhyme + word-family pipeline (see `scripts/README.md`) and stopped
before wiring it into the app. That is a genuinely good idea — it removes the Datamuse network
round-trip from the writing loop — but right now it is only a hazard: one `git add -A` commits
half a gigabyte.

**Do now (this item):** add the generated artefacts and the raw dump to `.gitignore`, commit the
four `scripts/*` files and `scripts/README.md`, and add `build:rhymes` / `build:families` npm
scripts. Do **not** wire the indexes into the app here — that is C-23.

- Acceptance: `git status` is clean after a fresh build of the indexes; the scripts are tracked;
  no file over 1 MB is stageable; `scripts/README.md` says where the generated files go.

---


### C-09 · The speaker/stage-direction gesture is a trap — Lane E · Size S

`src/editor/nodes/lyricLine/lyricLine.ts:232` defines the rule as `/^\[\[$/` — opening brackets
only. Typing `[[` converts the line and swallows the trigger, which is a fine *shortcut*. But
every document in this repo (including `docs/product/DESIGN_PROPOSAL.md` §3.1) describes the
gesture as `[[NAME]]`, and that is what a writer will naturally type. Doing so produces a speaker
line reading **`MARIA]]`** — observed live. `((text))` has the identical flaw.

- Acceptance: typing `[[MARIA]]` yields a speaker line whose text is exactly `MARIA`; typing
  `[[` still converts immediately and leaves an empty speaker line; typing `((beat))` yields a
  stage-direction line reading `beat`; `((` still converts immediately. Trailing `]]` / `))` are
  never left in the text. Undo of the auto-conversion restores the literal characters.
- Note: also covers `docs/engineering/EDGE_CASES.md` §3 (input rules mid-line vs. line start).


### C-12 · The paper doesn't read as paper — Lane S · Size M

The centre pane is the hero surface and the one place the product's taste shows. Live, it is a
warm rectangle almost the same value as the shell, with text starting at a hard left margin and
running the full ~870 px width, no page edge, no elevation, and no measure limit. It reads as
"empty area", not "a sheet you write on" — which undercuts the whole ink-on-paper concept the
token pass was building toward.

- Acceptance: the lyric column is constrained to a comfortable measure (~62–70 characters) and
  centred in the pane; the page has a defined edge (border or soft elevation) distinct from the
  shell background at both pane widths; the top of the text sits a deliberate distance from the
  toolbar rather than flush; the existing grain overlay survives. Follows
  `docs/design/DESIGN_SYSTEM.md` and uses only `docs/design/UI_TOKENS.md` tokens.


### C-13 · The toolbar is a row of undifferentiated words — Lane S · Size M

Currently: `B  I  § Section  Speaker  Stage Dir  Delivery  ⇉ Concurrent`, with undo/redo
stranded at the far right. Mixed icon and text treatments, no grouping, no separation from the
paper, and one control (`Delivery`) that C-10 deletes outright.

- Acceptance: controls are grouped (inline format · line type · structure · history) with
  separators; every control has a tooltip naming its keyboard shortcut; the active line type is
  visibly indicated; the toolbar is visually distinct from the page surface; nothing wraps at the
  narrowest supported pane width.


### C-16 · Identity is still duplicated — Lane S · Size S

The QoL pass (C-14 era) removed the duplicated *draft* header, but the **song title** still
appears twice: `Untitled Song` in the top bar and again as the left-nav heading. The same
argument applies — the top bar is the home for identity.

- Acceptance: the song title appears exactly once in the chrome; the left nav leads with its
  own content (Project / Drafts / View); no vertical space is wasted by the removal.


### C-18 · CI is weaker than the project thinks — Lane X · Size S

**Correction (2026-08-28):** this item originally claimed CI had no e2e step. That was wrong —
the claim came from reading only the first 60 lines of a 73-line file. E2E *was* already wired up
(install + run + report upload). The real gaps were smaller:

- Lint was `continue-on-error: true` with a stale comment about "~50 warnings to burn down", but
  lint now passes at `--max-warnings 0` — the exemption was hiding a gate that already works.
- The job name omitted lint.
- The Playwright install pulled all three browser engines; `playwright.config.ts` declares no
  `projects`, so the default is chromium-only and the other two were wasted CI minutes.

- Acceptance: the lint step is blocking; the job name matches what runs; the browser install is
  scoped to the engines actually used; stale comments removed.

---


### C-29 · No way to re-grant a lost file permission — Lane P · Size S · ⬜

C-02 made `tryReopenLastProject` correctly *keep* the file handle when the failure is
`NotAllowedError` (permission lost) rather than clearing it — but nothing in the UI lets the
writer act on that. Their only route back to their own file is `Open` and the picker again,
which is exactly the friction the handle was preserved to avoid.

Needs a shape decision before building: an inline banner above the editor, a modal on init, or a
control in the top bar next to the save indicator. Recommend the banner — it is non-blocking and
sits near the work.

- Acceptance: with a stored handle in `prompt`/`denied` state, the app surfaces a re-grant
  affordance; activating it calls `requestPermission` from the user gesture and, on success,
  resumes normal saving without re-picking the file; declining leaves the project usable and the
  save status honest.


### C-31 · Stop `FEATURE_COVERAGE.md` conflicting on every merge — Lane X · Size S · ✅

The generated ledger is regenerated by every agent as part of its gates, so it conflicts on
**every** merge and cherry-pick between branches. It has done so four times in one day. The only
correct resolution is to regenerate it from the merged tree — never to pick a side — which is
easy to get wrong under time pressure.

**Decided 2026-08-29:** the first option below. Keep it tracked, make CI the enforcement.

Two viable fixes, needs a call:
- **Keep it tracked** (you can read the ledger on GitHub without running anything) and make CI
  the real enforcement — fail the build when any criterion is `failing` or `no test` — so the
  committed copy is a convenience, not the gate. Add `linguist-generated=true` in
  `.gitattributes` so PR diffs collapse it.
- **Untrack it** and publish it as a CI artifact instead. Cleaner history, but the ledger stops
  being readable from the repo, which was part of the point.

Recommend the first. Either way `npm run coverage:features` stays the local check.

- Acceptance: a merge between two branches that both touched tests does not conflict on the
  ledger, or the conflict is resolved automatically; CI fails when a criterion regresses.


### C-34 · Close the three gaps that let a green suite ship broken features — Lane X · Size M · ⬜

115 passing Playwright tests coexisted with an export that produced an empty document for an
ordinary song. `docs/testing/TESTING.md` §"Catching the bugs this suite keeps missing" has the
analysis and seven concrete harnesses. Do at least the first four, in order — they are cheap and
they cover the classes that actually bit us:

1. **Fail any e2e on a console error** (~10 lines, one shared fixture). Free crash detection
   across all 115 existing tests.
2. **Golden-file snapshots of generated output** — each print profile and the Markdown exporter.
   Would have caught D-02 and D-11 the day they appeared.
3. **Visual regression** via Playwright's own `toHaveScreenshot`, ~8 baselines at two widths.
   The only thing that catches layout defects like D-07/D-08 without a human looking.
4. **One "write a song" journey test** through the whole loop, typed with a delay.

Then, when there is room: `@axe-core/playwright` gated at "no new violations", a concurrency
harness for races, and `fast-check` property tests over the document transforms.

- Acceptance: each of the four lands with CI running it; the golden files and screenshot
  baselines are committed; the journey test exercises section → speaker → lyrics → prosody →
  rhyme → collect → chord → draft switch → export, asserting the export contains the lyrics.


## Deliberately not doing

Out of scope for v1 per `docs/product/SCOPE.md`, and staying out until the core drafting
experience is excellent: AI generation or rewriting, real-time collaboration, track changes,
mobile UX, audio, chord playback/diagrams/voicings, DAW integration, notation features, a
cross-song idea vault, Nashville numbers, and cloud sync.

The project's own principle — *no speculative complexity before core drafting is excellent* — is
correct. Hold the line.
