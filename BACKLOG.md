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

## P0 — Trust. Nothing else matters until this is true.

Cyril is a writing tool that a lyricist will keep a year of work in. Today it can lose that work
in at least four ordinary ways, and the save indicator will say "Saved" while it happens. This
block comes first.

Full spec with sub-task detail: **`docs/engineering/HARDENING_PERSISTENCE.md`**.
Verified 2026-08-28: **none of H1–H7 is implemented** — `grep` finds no `queryPermission`,
no `beforeunload`, no recovery snapshot anywhere in `src/`.

| # | Item | Lane | Status | Size | Depends on | Spec | Tests |
|---|---|---|:--:|:--:|---|---|---|
| C-01 | Check/request write permission before every write | P | 🚧 lane-P | S | — | HARDENING §H1 | `T-1.20`, `T-1.21` |
| C-02 | Validate on load; handle corrupt + newer-schema files | P | ⬜ | M | — | HARDENING §H5 | `T-1.26`, `T-1.27` |
| C-03 | `beforeunload` guard when dirty | P | 🚧 lane-P | S | — | HARDENING §H3 | `T-1.24` |
| C-04 | **IndexedDB recovery snapshot** — the durability win | P | ⬜ | L | C-01 | HARDENING §H2 | `T-1.22`, `T-1.23` |
| C-05 | Download/upload fallback when File System Access API is absent | P | ⬜ | M | C-04 | HARDENING §H4 | `T-1.25` |
| C-06 | Save status never says "Saved" without a durable copy | P | ⬜ | S | C-04 | HARDENING §H7 | `T-1.29` |
| C-07 | Warn before overwriting a file changed outside Cyril | P | ⬜ | S | C-01 | HARDENING §H6 | `T-1.28` |

> **C-04 is the one that matters most.** A project the writer has never manually saved currently
> has *zero* durability — autosave no-ops when there is no file handle, silently. A snapshot on
> the same debounce, written regardless of handle, closes that hole and softens every other one.

### C-08 · Deal with the uncommitted word-data pile — Lane X · Size S · ⬜

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

## P1 — The "feels unfinished" list

These are the things a lyricist notices in the first two minutes. Each was observed in the
running app on 2026-08-28 (screenshots and findings in `docs/design/DESIGN_REVIEW.md` §"Live
app audit"). They are small, independent, and they are most of the distance between "a capable
prototype" and "built by professionals".

| # | Item | Lane | Status | Size | Depends on | Spec |
|---|---|---|:--:|:--:|---|---|
| C-09 | `[[NAME]]` / `((text))` must accept the closing brackets | E | 🚧 lane-E | S | — | below |
| C-10 | Remove the `delivery` feature | E | ⬜ | M | — | DESIGN_PROPOSAL §3.4 |
| C-11 | Inventory: real collected-words surface, not a raw `<textarea>` | S | ⬜ | M | — | DESIGN_REVIEW §9 |
| C-12 | Give the editor a real page: measure, edges, elevation | S | 🚧 lane-S | M | — | below |
| C-13 | Rebuild the editor toolbar as grouped icon+label controls | S | ⬜ | M | C-10 | below |
| C-14 | Tools pane: filter chips, honest empty/offline states | S | ⬜ | M | — | DESIGN_PROPOSAL §6 |
| C-15 | Group View toggles under Structure / Sound sub-labels | S | ⬜ | S | — | DESIGN_REVIEW §6 |
| C-16 | Stop showing the song title twice (top bar + left nav) | S | 🚧 lane-S | S | — | below |
| C-17 | Chords left-align to their anchor letter (currently centred) | E | ⬜ | S | — | DESIGN_PROPOSAL §4.1 |
| C-18 | CI: actually run e2e; make lint blocking | X | 🚧 lane-X | S | — | below |

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

`.github/workflows/ci.yml` names its job *"Build, test, coverage, e2e"* and **has no e2e step**.
Lint is `continue-on-error: true` with a comment about "~50 warnings to burn down" — but lint now
passes at `--max-warnings 0`, so the exemption is stale and is hiding a gate that already works.

- Acceptance: CI runs `npm run test:e2e` (with the Playwright browser install step) and fails the
  build on e2e failure; the lint step is blocking; the stale comments are removed.

---

## P2 — Finish the product

The feature spec is `docs/product/DESIGN_PROPOSAL.md`; its §11 build sequence is preserved below
with the ordering the audit suggests. Each of these is a stage of work in its own right — take
one, don't take three.

| # | Item | Lane | Status | Size | Depends on | Spec |
|---|---|---|:--:|:--:|---|---|
| C-19 | Finish the token sweep (danger + selection tints) | D | ⬜ | S | — | DESIGN_PROPOSAL §2 |
| C-20 | **Characters registry** — colour identity + autocomplete | S | ⬜ | L | C-09 | DESIGN_PROPOSAL §3.1 |
| C-21 | Section type colour-coding + sticky stage-direction mode | D | ⬜ | M | C-20 | DESIGN_PROPOSAL §3.2–3.3 |
| C-22 | **Print profiles** — lyric / chord / libretto / annotated | S | ⬜ | L | C-21 | DESIGN_PROPOSAL §7 |
| C-23 | Reference tools: offline indexes, tabs, filters, collect loop | D | ⬜ | L | C-08, C-14 | DESIGN_PROPOSAL §6, §6.1 |
| C-24 | Alternates peek + draft compare view | S | ⬜ | M | — | DESIGN_PROPOSAL §5 |
| C-25 | Chords: transpose, trailing runs, instrumental lines | E | ⬜ | L | C-17 | DESIGN_PROPOSAL §4.4–4.5 |
| C-26 | Unified right-click context menu | E | ⬜ | L | C-20, C-25 | DESIGN_PROPOSAL §10 |
| C-27 | Hook Lab as a structured workspace | X | ⬜ | L | — | DESIGN_PROPOSAL §9 |

**Priority read:** C-20 (characters) is the headline differentiator — it is the reason a musical-
theatre writer picks Cyril over MasterWriter, and it is currently only a CSS token with nothing
behind it. C-22 (print) is the highest-value item this audience actually pays for. C-23 turns the
abandoned word-data pipeline (C-08) into the thing that makes the right rail worth having.

**Scope warnings:** C-27 expands v1 scope and requires `docs/product/SCOPE.md`,
`docs/product/FEATURES.md`, and `docs/engineering/DATA_MODEL.md` to be updated in the same
change. C-25 changes `ChordMarker.position` and needs a deliberate `docs/engineering/DATA_MODEL.md` edit. Do not
start either without confirming with the maintainer.

---

## P3 — Standing work

### C-28 · Burn down the edge-case register — Lane X · Size ongoing · ⬜

`docs/engineering/EDGE_CASES.md` is an adversarial-QA list of ~70 hazards, prioritised
🔴/🟠/🟡. It is not a task in itself: **when you build any item above, cover that item's
neighbouring hazards as part of it.** Building chords (C-17, C-25) means covering §1 in full.
Building persistence (C-01…C-07) means §8. Building the context menu (C-26) means §12.

An item is not done while its adjacent 🔴 hazards are untested.

---

## Deliberately not doing

Out of scope for v1 per `docs/product/SCOPE.md`, and staying out until the core drafting
experience is excellent: AI generation or rewriting, real-time collaboration, track changes,
mobile UX, audio, chord playback/diagrams/voicings, DAW integration, notation features, a
cross-song idea vault, Nashville numbers, and cloud sync.

The project's own principle — *no speculative complexity before core drafting is excellent* — is
correct. Hold the line.
