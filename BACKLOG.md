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
| **S — Shell & styling** | `src/components/layout/**`, `src/features/**`, `src/index.css` | C-11 … C-16, C-20, C-22, C-24, C-50, C-52, C-57, C-58, C-59 |
| **D — Domain & export** | `src/domain/**` | C-19, C-21, C-23, C-49, C-51, C-53 … C-56 |
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
| 15 | C-48 | **Editor command bridge** — let the rail read and write the caret | E | ✅ | S | — | §13.0 |
| 20 | C-41 | **Double-click a word in the lyric to look it up** | S | ✅ | M | C-48 | §13.1 |
| 30 | C-42 | **Click an Inventory chip to insert it at the caret** | S | ✅ | S | C-48 | §13.2 |
| 40 | C-45 | Emphasise results by an absolute score, not a relative one | S | ✅ | S | — | §13.5 |
| 41 | C-49 | Retire the dead `'idioms'` ToolMode; relabel or repoint "Related" | D | ✅ | S | - | MW §Phase 0 |
| 42 | C-50 | Syllable filter on rhyme results | S | ✅ | S | - | MW §Phase 0 |
| 45 | C-23 | **Wire the offline rhyme + family indexes** (was Pri 140) | D | ⬜ | L | C-08 | MW §Phase 1 |
| 46 | C-51 | Phonetic rhyme tiers from the rime index, retiring the 40% heuristic | D | ⬜ | M | C-23 | MW §Phase 1 |
| 50 | C-35 | Speaker picker on the character colour dot | E | ✅ | S | C-20 | §12.1 |
| 60 | C-36 | **Speaker gutter — click a cell, drag to paint a range** | E | ✅ | M | C-35 | §12.2 |
| 70 | C-43 | Clicking a result collects it; copy becomes secondary | S | ✅ | S | — | §13.3 |
| 80 | C-44 | Dim collected words once they appear in the draft | S | ✅ | S | — | §13.4 |
| 90 | C-47 | Empty states teach the double-click gesture | S | ✅ | S | C-41 | §13.7 |
| 47 | C-60 | **Chords must follow their letters through an edit** (D-28, D-29) | E | ⬜ | L | C-25 | below |
| 95 | C-25 | **Chords: transpose, trailing runs, instrumental lines** | E | ✅ | L | C-17 | §4.4–4.5 |
| 196 | C-61 | Capo — a display-only transpose for guitarists | E | ⬜ | M | C-25 | §4.5 |
| 100 | C-24 | Alternates peek + draft compare view | S | ⬜ | M | — | §5 |
| 105 | C-52 | Word Families tab, facet results, ConceptNet attribution | S | ⬜ | M | C-23 | MW §Phase 1 |
| 110 | C-21 | Section type colour-coding + sticky stage-direction mode | D | ⬜ | M | C-20 | §3.2–3.3 |
| 115 | C-53 | Phrases corpus + Phrases tab | D | ⬜ | L | C-49 | MW §Phase 2 |
| 116 | C-54 | Rhymed Phrases, the corpus indexed by final-word rime | D | ⬜ | M | C-53, C-51 | MW §Phase 2 |
| 120 | C-37 | Structure outline with drag-reorder and jump-to | S | ⬜ | M | C-21 | §12.3 |
| 125 | C-55 | Cross-cutting filters: part of speech, positive/negative | D | ⬜ | L | C-52 | MW §Phase 3 |
| 130 | C-39 | Smart paste — detect `NAME:` prefixes into speaker lines | E | ⬜ | M | C-20 | §12.5 |
| 135 | C-56 | **Automatic rhyme-scheme detection and colouring** | D | ⬜ | L | C-23 | MW §Phase 4 |
| 136 | C-57 | Scheme labels + break detection in the prosody gutter | S | ⬜ | M | C-56 | MW §Phase 4 |
| 150 | C-26 | Unified right-click context menu | E | ⬜ | L | C-35 | §10 |
| 160 | C-38 | Bulk line-type conversion on a multi-line selection | E | ⬜ | S | C-26 | §12.4 |
| 170 | C-40 | Make `Cmd+K` selection-aware | S | ⬜ | S | C-38 | §12.5 |
| 175 | C-58 | Keyboard navigation through results (arrow, Enter, Cmd+Enter) | S | ⬜ | S | - | §13.2 |
| 180 | C-46 | One shared word-bank component (Inventory + Vocabulary World) | S | ⬜ | M | C-44 | §13.6 |
| 182 | C-59 | Drag a result or a chip into a line | S | ⬜ | M | C-46 | §13.2 |
| 185 | C-27 | **Hook Lab as a structured workspace** | X | ⬜ | L | — | §9 |
| 190 | C-33 | A suppressed duplicate speaker label leaves a blank row | S | ⬜ | S | C-20 | below |
| 200 | C-28 | Burn down the edge-case register (ongoing) | X | ⬜ | — | — | below |

### Done

34 items. Detail for the ones with a written-up rationale is kept below.

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
- **C-35** — Speaker picker on the character colour dot
- **C-36** — Speaker gutter — click a cell, drag to paint a range
- **C-41** — Double-click a word in the lyric to look it up
- **C-42** — Click an Inventory chip to insert it at the caret
- **C-47** — The Tools empty state teaches the double-click gesture
- **C-48** — Editor command bridge — `insertAtCaret` / `getFocusedWord`
- **C-49** — Retired the dead `'idioms'` mode; "Related" now returns related words
- **C-50** — Syllable filter on rhyme results
- **C-25** — Chords: transpose, trailing runs, instrumental lines

---

## Item detail

Only items that needed more than a table row. Everything else is specified in the linked
`docs/product/DESIGN_PROPOSAL.md` or `docs/product/MASTERWRITER_PLAN.md` section.


### The reference-layer block (C-23, C-49 … C-57) - Lanes D and S

Added 2026-09-12 from `docs/product/MASTERWRITER_PLAN.md`, which has the full argument,
the competitive read and the licence analysis. Read it before taking any of these. The
short version of why they exist:

**Cyril has one reference source pretending to be five.** Every Tools tab resolves to the
same Datamuse endpoint. "Related" queries `sl` (sounds-like), not relatedness. Perfect /
Close / Wide are not three tiers of rhyme: `rhymeFilter.ts` maps Perfect to `rel_rhy` and
both Close and Wide to `rel_nry`, with Close keeping the top-scoring 40% of whatever came
back. That is the relative-threshold mistake C-45 removed from result emphasis, still alive
in the filter chips.

**And the fix is already built and unused.** `scripts/build-rhyme-index.cjs` and
`scripts/build-family-index.mjs` are tracked, working, and imported by zero source files
(grep `src/` for `rhyme-index` or `family-index`: nothing). C-08 stopped them being a
half-gigabyte commit hazard and deliberately left the wiring to C-23.


### C-23 · Wire the offline rhyme + family indexes - Lane D · Size L · ⬜ · unblocked

**Promoted from Pri 140 to 45 on 2026-09-12.** It was behind C-25, C-24, C-21, C-37 and
C-39, and it unblocks five of the items below. The argument for moving it is not that
chords matter less: it is that C-23 is the only item in the queue that changes what the
product *is* rather than how well it does something it already does. Everything now above
it is small and independent, so the promotion costs nothing in flight.

One item, four wins: phonetic rhyme tiers, a reference panel that works offline (which is
MasterWriter's single most-complained-about weakness and Cyril's own stated first
principle), no network round trip inside the writing loop, and Word Families.

Build behind the existing `ToolProvider` abstraction so nothing above the service layer
changes. Datamuse is demoted from critical path to enrichment and fallback: proper nouns,
coinages and anything cmudict does not know still go to the network when it is there.

**Both decisions are settled (maintainer, 2026-09-12). This item is unblocked.**

1. **Ship the full 24 MB family index. No trimming, no IndexedDB seeding.** Cyril is a
   desktop-first app, not a website on a phone budget, and 24 MB of local data is not a
   size worth designing around. The original framing of this as a hard choice applied
   web-bundle instincts to the wrong product.

   **The one constraint that survives the decision is the shape, not the size: it must not
   be a Vite `import`.** `import index from './family-index.json'` makes Vite transform the
   file into a JavaScript module at build time, which blows up build memory, puts it in the
   bundle graph, and parses it eagerly at boot. Instead ship it as a **static asset** (in
   `public/`, or an `import ... ?url`), `fetch` and `JSON.parse` it on first lookup, and
   hold the parsed object in a module-level variable so the cost is paid once.

   Expect roughly 4 to 6 MB gzipped over a local read and a few hundred milliseconds to
   parse. That is acceptable precisely because it happens on a user-initiated lookup rather
   than on the boot path, which is what the "lazily on first lookup, never at boot" rule in
   the acceptance criteria is protecting. If that parse turns out to be felt in the UI, the
   fix is a worker or a keyed store, not a smaller index.

   Splitting C-23 so the rhyme half lands first is still allowed and still probably wise.

2. **The ConceptNet licence is deferred, deliberately.** The index derives from ConceptNet
   5, CC BY-SA 4.0, and ShareAlike propagates to the derived index. The maintainer's call is
   that this is sortable later and is not a reason to hold the feature. Build it.

   Two things keep that cheap to unwind, and both are conditions of this item: **keep the
   derived index in its own file** so it never contaminates Cyril's own licence, and **put
   the attribution string the build script prints into the app now** rather than
   retrofitting it. If Cyril is ever sold and ShareAlike turns out to be unacceptable, the
   escape is to rebuild the families index from a differently-licensed source behind the
   same provider interface, which is a data swap rather than a rewrite.

- Acceptance: a rhyme lookup returns results with the network disabled; the index loads
  lazily on first lookup and never at boot, and is **not** a Vite JSON import; Datamuse is
  still consulted for terms the index does not know, and its absence degrades to local-only
  rather than to an error; the ConceptNet attribution string is visible in the app; the
  derived index sits in its own file.


### C-49 · Retire the dead `'idioms'` ToolMode; relabel or repoint "Related" - Lane D · Size S · ⬜

Two small honesty fixes, both in the reference layer, both independent of C-23.

`'idioms'` is declared in `src/domain/tools/types.ts`, supported by no provider, and exposed
by no tab: dead code documenting a missing feature. Delete it here; C-53 re-adds the seam
deliberately when there is a corpus behind it.

The "Related" tab queries Datamuse `sl`, sounds-like. A writer reads that tab as "words
about this idea" and gets words that sound like it. Repoint it at `rel_trg` (triggers),
which is what the label promises, or rename the tab "Sounds like". Repointing is better and
is a one-line change.

- Acceptance: `ToolMode` no longer declares a mode no provider supports; the tab labelled
  "Related" returns semantically related words, or is labelled for what it actually returns.


### C-51 · Phonetic rhyme tiers - Lane D · Size M · ⬜

Replace the 40%-of-whatever-came-back heuristic with tiers defined by sound, using the
index C-23 wires: Perfect is an exact-key match (last stressed vowel to end of word), Close
is an assonance-key match with consonant agreement, Wide is the assonance key alone.

Follow C-45's precedent exactly: an empty tier renders empty. Do not promote weak results
to fill a tier, and do not hide low-scoring words. Prominence is the tool, not exclusion.

- Acceptance: each tier is computed from phonetics, not from the score distribution of the
  result set; a term whose Close tier is genuinely empty renders an empty Close tier; no
  result is removed on the basis of score.


### C-53 · Phrases corpus + Phrases tab - Lane D · Size L · ⬜

MasterWriter ships 33,000 idioms, sayings and collocations searchable by any word they
contain, and it is the module its critics keep. This item is mostly a **data-acquisition**
problem, not a code one: candidate sources are Wiktionary's English idioms category (CC
BY-SA, same condition as ConceptNet), WordNet multiword expressions (permissive), and open
collocation lists. **Check the licence before ingesting anything** and record the choice.

- Acceptance: a Phrases tab returns phrases containing the search term, from a local index,
  offline; the corpus's source and licence are recorded in `scripts/README.md` and attributed
  in-app if the licence requires it.


### C-54 · Rhymed Phrases - Lane D · Size M · ⬜

The cheapest high-value item in this block, and the one nothing free offers. MasterWriter's
36,000-entry table (it returns "stuck in the eighties" as a rhyme for *baby*) is
structurally just **a phrase corpus indexed by the rime key of each phrase's last word**.
Both halves will exist by then: C-53 brings the corpus, and `build-rhyme-index.cjs`'s
`analyse()` already computes rime keys. The work is a build script of perhaps fifty lines
reusing it, plus a results renderer that handles multi-word entries.

For a theatre writer working in longer lines this is more useful than another list of
single words.

- Acceptance: a rhyme search returns multi-word phrases alongside single words, tiered by
  the same phonetic rules as C-51; a phrase collects into the Inventory and inserts at the
  caret as one undo step, like any other result.


### C-55 · Cross-cutting filters - Lane D · Size L · ⬜

MasterWriter's real structural advantage is not any one dictionary: it is that part of
speech, positive/negative and intensity apply *across* dictionaries. Cyril has three chips
that apply to one tab.

- **Part of speech** is available from Datamuse `md=p`, from WordNet locally, or derivable
  at index-build time. Applies to rhymes, families, thesaurus and phrases.
- **Positive / negative** needs a sentiment lexicon (AFINN, NRC and VADER all have usable
  licences). Coverage will be partial, so the filter must degrade to "no opinion" rather
  than silently dropping every word it has no data for, which would quietly hide results.
- **Intensity** (MasterWriter's *pretty to gorgeous* ladder) has no open-data equivalent.
  `MASTERWRITER_PLAN.md` §Phase 3 recommends skipping it and saying so rather than shipping
  a weak imitation of the one module MasterWriter is consistently praised for. **Do not
  build it without a decision.**

- Acceptance: a filter applies to every tab that has data for it, and is absent rather than
  inert on tabs that do not; a word with no sentiment data is never dropped by the
  positive/negative filter.


### C-56 · Automatic rhyme-scheme detection and colouring - Lane D · Size L · ⬜

**This is the item that makes Cyril feel smarter than MasterWriter rather than equal to it.**
MasterWriter never looks at your lyric: it is a lookup tool beside a text box, and it cannot
tell you what your rhyme scheme is or where it breaks.

`FEATURES.md` Feature 10 scopes rhyme visualisation to *manual* group assignment, with
automatic detection explicitly out of v1. That was right when detection meant a network call
per word. With the rime index in memory it is a local computation over a document the app
already walks for syllable counts.

Compute end-word rime keys across a section, group them, colour them. Feature 10's
`rhymeColorMode` gains `automatic` alongside `off` and `manual`, and **manual assignment
takes precedence over detection** so nothing a writer set by hand is overwritten.

Guard rails, because this is the class of feature that becomes annoying fast, and Feature
10's own warning about noisy prosody diagnostics is the right instinct:

- Detection is **derived, never stored**. This is C-44's rule and it applies unchanged.
- It is **off by default**.
- It **never rewrites the document**.

`DATA_MODEL.md` changes only for the `rhymeColorMode` value and, if it is built, C-57's
tolerance dial. `FEATURES.md` and `SCOPE.md` move with the code. Note while you are in
`FEATURES.md` that it numbers two different features 10, and 11, 12 and 13 twice over; fix
that in the same pass.

- Acceptance: with automatic mode on, lines whose end words share a rime render in the same
  rhyme colour, and the grouping updates as the draft changes; a manually assigned group
  wins over a detected one; turning the mode off removes no stored data; nothing is written
  to the `.cyril` file as a result of detection.


### C-57 · Scheme labels + break detection - Lane S · Size M · ⬜

Beside the existing syllable counts, in the same quiet register: the section's scheme
(ABAB, AABB) and a marker where an established scheme breaks. Plus a **near-rhyme tolerance
dial**, because how close counts as a rhyme differs between a theatre writer and a rap
writer, and the assonance key makes the dial cheap.

Internal rhyme (the same computation across all words in a line, not just line-final ones)
belongs here too if the item has room. No competitor in this price bracket does it.

- Acceptance: the label reflects the detected scheme and updates with the document; a line
  that breaks an established scheme is marked without being corrected; the tolerance dial
  changes what counts as a rhyme in both the gutter and the Tools pane, consistently.


### C-58 / C-59 · The two unbuilt bullets in §13.2 - Lane S · ⬜

`DESIGN_PROPOSAL.md` §13.2 lists keyboard navigation through results and drag-a-result-into-
a-line as prose bullets that were never turned into acceptance criteria. The 2026-09-12
session log flags the drag one explicitly as unbuilt and deliberately not scope-crept into
C-42. They finish the collect loop, which is the gesture MasterWriter is proudest of and the
one place Cyril is already ahead (MasterWriter's collected list cannot put a word back into
the lyric; C-42 can).

- Acceptance (C-58): arrow keys move through the results list, `Enter` collects the focused
  result, `Cmd/Ctrl+Enter` inserts it at the caret; focus never leaves the list unexpectedly
  and the editor's caret is untouched by navigation.
- Acceptance (C-59): a result or an Inventory chip can be dragged into a lyric line and
  drops at the insertion point under the cursor, as one undo step; a drop outside a draft
  editor is a no-op, not an error.


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


### C-25 · Chords: transpose, trailing runs, instrumental lines — Lane E · Size L · ⬜

**Unblocked 2026-09-12. The maintainer approved the file-format change**, on the answer to the
question that had been left open: *Cyril's chord sheets are played from by musicians.* That
settles it — a sheet that cannot notate an intro, a solo or an end-of-line fill is incomplete
for the person holding it, so wordless measures are a requirement and not a nicety.

Build in this order; the first part ships without touching the file at all.

1. **Transpose** (no schema change). Rewrites `ChordMarker.symbol` across the draft, ± semitones.
   Independent of everything below — land it first, on its own commit, so the format work is not
   holding up a feature that needs none of it.
2. **Stop clamping.** Three call sites currently pull a chord back onto the text:
   `src/editor/extensions/chords/chordDecorations.ts:58`, `src/domain/export/printRenderer.ts:234`,
   `src/domain/export/markdownTransformer.ts:112`. All three must learn the new anchor.
3. **Trailing runs and instrumental lines.** Extend `ChordMarker.position` with a second anchor
   type — an ordered slot index rather than a character offset — as a **discriminated union on
   `anchorType`**, so every existing `{ anchorType: 'char' }` marker stays valid and no migration
   is needed for old files. Bump `SCHEMA_VERSION` (minor). `docs/engineering/DATA_MODEL.md` must
   be updated in the same commit — this is the deliberate update TASKING.md requires, not drift.
4. **Capo** (display-only) needs a genuinely new stored field. Smallest and most skippable of the
   four; do it last, and skip it if the item is running long.

The chord-sheet print profile named in §4.5 already exists — C-22 shipped `chordSheet`.

- Acceptance: the criteria in `docs/product/DESIGN_PROPOSAL.md` §4.4–4.5, plus
  `docs/engineering/EDGE_CASES.md` §1 (chords) covered in full, per C-28's rule.


### C-27 · Hook Lab as a structured workspace — Lane X · Size L · ⬜

**Unblocked 2026-09-12. The maintainer approved expanding v1 scope** to build the structured
version specced in §9 — hooks, groups, per-hook notes, drag-reorder, and a migration from the
legacy rich-text document. Hook Lab is a headline concept in the design docs that currently
renders an unexplained empty box; that gap is the reason for the decision.

Because this changes what v1 *is*, three documents move with the code, in the same PR:
`docs/product/SCOPE.md`, `docs/product/FEATURES.md`, `docs/engineering/DATA_MODEL.md`.

The one sub-decision §9 leaves open and the builder must settle deliberately (and record): what
happens to a legacy project's existing Hook Lab prose — split it by line into individual hooks in
an "Imported" group, or preserve it whole as a single note. Either is defensible; silently losing
it is not.

- Acceptance: the criteria in `docs/product/DESIGN_PROPOSAL.md` §9.


### C-60 · Chords must follow their letters through an edit — Lane E · Size L · ⬜

**Found 2026-09-12 while finishing C-25, and it is the most serious open defect in the app.**
Two 🔴 hazards from `docs/engineering/EDGE_CASES.md` §1, both reproduced, both logged as
`D-28` and `D-29`:

- **Typing before a chord does not move it.** The stored `charOffset` is never remapped, so
  the chord silently ends up over the wrong word while the writer types.
- **Splitting a line duplicates its chords onto both halves**, because the new node inherits
  the original's attrs wholesale.

Deleting the anchored character and merging two chorded lines are the other two 🔴 entries in
§1 and almost certainly fail the same way; test them as part of this.

This is data corruption a writer cannot see happening, in the one feature where being over
the right letter is the whole point. It is **pre-existing** — it predates C-25, which changed
none of this — but C-25 is what uncovered it.

The fix is an `appendTransaction` plugin that maps each chord's absolute position (line start
+ offset) through the transaction's mapping, re-bases it onto whichever line it lands in, and
drops chords whose anchor was deleted. Slot-anchored chords (C-25 §4.4) carry no offset and
need no mapping, but they must follow their line through a split.

Do not start this at the end of a long session: it touches the editor's core transaction
handling, and a bad fix here breaks typing itself.

- Acceptance: all four 🔴 hazards in `EDGE_CASES.md` §1 have passing tests — type before/after,
  delete the anchor, split, merge — plus the 🟠 paste case; `D-28` and `D-29` close.


### C-61 · Capo — a display-only transpose for guitarists — Lane E · Size M · ⬜

`docs/product/DESIGN_PROPOSAL.md` §4.5 mentions a display-only capo alongside transpose, but
it is **not** one of the section's acceptance criteria, and it is the only part of C-25 that
would have needed a second schema field. Split out rather than scope-crept in.

A capo is a clamp on a guitar neck that raises every string's pitch, letting a player use easy
shapes in an awkward key. Display-only means the file keeps the real chords and the sheet
shows the easier shapes with "Capo N" at the top — a lens over the data, not a change to it.

Needs a new stored field (`capo` on the draft, most likely) and a `DATA_MODEL.md` update, so
it is a deliberate schema change like C-25's was.

- Acceptance: setting a capo changes what the editor and print show without changing a single
  stored `ChordMarker.symbol`; the capo position is stated on the page and in print; clearing
  it restores the written chords exactly.


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

**One deliberate exception, 2026-09-12:** Hook Lab (C-27) leaves this list by the maintainer's
decision. It was never speculative complexity — it is a concept the design docs already lead
with, shipped as an empty box.
