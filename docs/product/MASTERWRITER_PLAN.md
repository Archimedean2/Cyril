# Cyril - Reaching and beating MasterWriter

_Written 2026-09-12 after reading the source, not the specs. This is a plan for the
**reference layer**: the dictionaries, the rhyme engine, the filters, and the collect loop.
It extends `docs/product/DESIGN_PROPOSAL.md` §6 and §13, which framed the competitive
position; this document says what is actually missing in the code and in what order to
build it._

`DESIGN_PROPOSAL.md` already declared the strategy: reach parity on the reference panel,
win on theatre, chords, alternates and print. Since it was written, §13 shipped in full.
The collect loop is done. What has not been touched is the thing the loop is meant to
collect *from*, and that is where the whole remaining gap sits.

---

## 1. The uncomfortable finding

**Cyril has one reference source pretending to be five.**

Every tab in the Tools pane resolves to the same Datamuse endpoint:

| Tab | What it actually queries |
|---|---|
| Rhyme | `rel_rhy` |
| Near | `rel_nry` |
| Thesaurus | `ml` (means-like) |
| Dict | `sp` + `md=d&md=p` |
| Related | `sl` (**sounds like**, not semantically related) |

Two observations follow. "Related" is mislabelled: `sl` is a phonetic query, so the tab a
writer reads as "words about this idea" returns words that *sound* like it. And the
Perfect / Close / Wide chips are not three tiers of rhyme at all. `rhymeFilter.ts` maps
Perfect to `rel_rhy`, and both Close and Wide to `rel_nry`, with Close keeping the
top-scoring 40% of whatever came back.

That is the same relative-threshold mistake C-45 removed from result emphasis, still alive
in the filter. A weak near-rhyme set still shows a "Close" tier, because 40% of junk is
still 40%. MasterWriter's four tiers are phonetic and absolute: a word is a close rhyme
because of how it sounds, not because of the company it keeps.

Cyril already has everything needed to fix this properly and it is sitting unused.

## 2. The pipeline that was built and abandoned

`scripts/build-rhyme-index.cjs` and `scripts/build-family-index.mjs` are tracked, working,
and **imported by zero source files**. Confirmed by grep: nothing in `src/` references
`rhyme-index` or `family-index`.

- `rhyme-index.json` (~9 MB, ~125k words from cmudict) carries, per word: the rime, the
  syllable count, the stress pattern, an **exact-rhyme key** (last stressed vowel to end of
  word) and an **assonance key** (the vowel spine, consonants dropped). Plus reverse indexes
  from each key to its word list.
- `family-index.json` (~24 MB, from the ConceptNet 5.7 dump) carries per-term facets:
  `things`, `actions`, `props`, `kinds`, `parts`.

This is not a nice-to-have. It is the answer to four separate problems at once:

1. **Phonetic rhyme tiers.** Exact key match, assonance key match, and partial rime overlap
   give genuine Perfect / Close / Wide without a network call.
2. **Offline.** MasterWriter's loudest and most-repeated user complaint, across Trustpilot,
   Gearspace and Sound on Sound, is that it is cloud-only and useless without internet.
   Cyril is local-first by principle; a reference panel that dies offline contradicts the
   product's own first rule.
3. **Latency.** Rhyme lookup becomes a synchronous in-memory read instead of a round trip,
   which matters because §13's whole design is "look up without leaving the line".
4. **Word Families**, which is the one MasterWriter module every reviewer singles out as
   genuinely differentiated, and which Cyril has no equivalent of.

**C-23 is the highest-leverage unbuilt item in the backlog and it is sitting at Pri 140**,
behind five things it should be in front of.

### The decision this needs before it starts

24 MB of JSON cannot be a Vite import. Two viable approaches, and `TASKING.md` says stop
and ask rather than pick one quietly:

- **Trim then bundle.** Raise `MIN_WEIGHT` to 1.5 and lower `PER_FACET` in the build script
  until the family index fits in a few MB, ship it as a lazily-imported asset alongside the
  rhyme index. Simple, works offline immediately, loses the long tail.
- **Seed IndexedDB on first run.** Keep the full index, stream it into the existing tool
  cache store keyed by term, read per-lookup. Keeps everything, costs a one-time install
  step and a migration path when the index is rebuilt.

The rhyme index at 9 MB raw and roughly 2.5 MB gzipped can be bundled lazily either way,
so it does not need to wait for this call.

### The licence condition

The family index derives from ConceptNet 5, CC BY-SA 4.0. **ShareAlike propagates to the
derived index.** Shipping it obliges an in-app attribution string and keeps that index file
under CC BY-SA, separate from Cyril's own source licence. The build script prints the
required text. This is a real product decision if Cyril is ever sold, and it should be made
deliberately rather than discovered later.

## 3. What MasterWriter has that Cyril does not

Ranked by value to a musical theatre lyricist, which is not the same as MasterWriter's own
ranking. MasterWriter is built for American pop writers.

### Worth building

**Rhymed Phrases (36,000 entries).** Multi-word phrases that rhyme with your term: "stuck
in the eighties" as a rhyme for *baby*. No free API does this, and for a theatre writer
working in longer lines it is more useful than another list of single words. It is also
much cheaper than it sounds: **a phrase corpus indexed by the rime key of its last word is
exactly this feature**, and the rime key machinery already exists in the build script. The
work is acquiring the corpus, not writing an algorithm.

**Phrases (33,000 idioms, sayings, collocations containing your word).** MasterWriter's own
marketing calls it "your personal idea factory" and reviewers who dislike everything else
tend to keep this one. Cyril has a vestige of the intent: `ToolMode` declares `'idioms'`,
no provider supports it, and no tab exposes it. Dead code that documents a missing feature.

**Word Families.** Branching a concept across parts of speech and intensity rather than
flat synonymy: *pretty* yields *cute* and *gorgeous*, with an Extended setting that widens
to looser substitutions. The ConceptNet facets are not the same shape, but they are the
same class of thing, and the facet split (`kinds`, `parts`, `props`, `actions`) is arguably
more useful for imagery than MasterWriter's intensity ladder.

**Syllable filtering on rhymes.** MasterWriter has it on every rhyme search. Cyril has
syllable counts in `numSyllables` from Datamuse and in cmudict locally, displays them in
the prosody gutter, and does not filter by them. This is the cheapest high-value item in
this document: the data is already in the result objects.

**A cross-cutting filter layer.** MasterWriter's real structural advantage is not any one
dictionary, it is that part of speech, positive/negative and intensity apply *across*
dictionaries. Cyril has three chips that apply to one tab.

### Worth skipping, deliberately

- **Pop Culture / The World / The Bible** (~12,000 American cultural icons). US-centric,
  licensing-awkward, and close to useless for a writer setting a scene in a fictional
  world. Sound on Sound flags the American bias as a weakness even for MasterWriter's own
  audience.
- **Audio recorder and drum loops.** Out of scope per `SCOPE.md`, and MasterWriter dropped
  the loops in v3 anyway.
- **Alliterations as a browse list.** Sound on Sound: "produces excessive results". A
  wall of words beginning with the same letter is a worse tool than it sounds.
- **Parts of Speech as a browse module.** Browsing all intense negative adjectives is a
  crossword-solver's feature, not a writer's.

### Where Cyril is already ahead, and should stay there

| | MasterWriter | Cyril |
|---|---|---|
| Collected words go back into the lyric | No. Copy and paste. | **Yes.** C-42, click a chip, inserts at the caret, one undo step. |
| Writing surface | "Extremely barebones" (Kindlepreneur) | Tiptap, section blocks, speaker gutter, concurrent columns |
| Characters, stage directions, libretto | None | The whole point |
| Chords | None at all | Character-anchored, printable |
| Versions | Whole-lyric, side by side | **Line-level alternates**, which is finer-grained |
| Structure | None. Reviewers repeatedly ask for it. | Sections, outline planned |
| Print | Weak | Four profiles shipped (C-22) |
| Offline | Impossible | Possible, and not yet done |
| Ownership | Subscription; lapse locks the tools behind "Limited Mode" | Local `.cyril` files the writer owns |

The last row is the strategic position and it is worth writing down: MasterWriter charges
$9.95 a month and disables its dictionaries when you stop paying. Every hour spent moving
Cyril's reference layer offline widens the one gap that cannot be closed by a competitor's
next release.

### The thing neither of them does, which Cyril should do

**MasterWriter never looks at your lyric.** It is a lookup tool sitting beside a text box.
It cannot tell you what your rhyme scheme is, where a scheme breaks, or that two lines you
wrote an hour apart already rhyme.

Cyril is one wired index away from all of that. `FEATURES.md` Feature 10 currently scopes
rhyme visualisation to **manual** group assignment, with automatic detection explicitly out
of v1. That was the right call when rhyme detection meant a network call per word. With the
rime index in memory it is a local computation over a document the app already parses for
syllable counts.

This is the item that makes Cyril feel smarter than MasterWriter rather than merely equal
to it, and it is the natural continuation of C-44's dim-what-you-have-used instinct: the
app reading the draft and reflecting it back.

---

## 4. The plan

Five phases. Each is ordinary backlog work under the existing gates and `T-` criteria; none
of it needs a new process.

### Phase 0 - Stop the reference panel from lying (small, do first)

Three small items that make the current panel honest before anything is added to it.

1. **Retire or implement `'idioms'`.** It is a declared `ToolMode` with no provider and no
   tab. Either delete it from `types.ts`, or leave it as the seam Phase 2 fills. Deleting is
   cleaner; Phase 2 can re-add it deliberately.
2. **Rename "Related".** It queries `sl`, sounds-like. Either label it honestly ("Sounds
   like") or repoint it at Datamuse `rel_trg` (triggers), which is what a writer expects
   from the word "related". The second is better and is a one-line change.
3. **Syllable filter on rhyme results.** The counts are already on every `ToolResult`.

### Phase 1 - Wire the indexes (C-23, promoted)

Behind the existing `ToolProvider` abstraction, so nothing above the service layer changes.

- A `LocalRhymeProvider` that answers `rhyme-exact` and `rhyme-near` from `rhyme-index.json`,
  lazily loaded on first lookup, never at boot.
- Datamuse demoted from critical path to **enrichment and fallback**: proper nouns, recent
  coinages and anything cmudict does not know still go to the network when it is available.
- **Phonetic tiers replace the 40% heuristic.** Perfect is an exact-key match. Close is an
  assonance-key match with consonant agreement. Wide is the assonance key alone. Each tier
  is defined by sound, so an empty tier renders empty rather than promoting weak results,
  exactly as C-45 established for emphasis.
- The offline copy the Tools pane already shows (C-14) becomes almost unreachable for rhyme,
  which is a product claim worth making in the UI.

### Phase 2 - The two dictionaries that need data, not code

**Phrases.** A corpus of idioms, sayings and collocations, indexed by every content word
they contain. Candidate sources, all needing a licence check before use: Wiktionary's
English idioms category (CC BY-SA, same condition as ConceptNet), WordNet multiword
expressions (permissive), and open collocation lists. Target a few tens of thousands of
entries; MasterWriter ships 33,000.

**Rhymed Phrases.** Once the phrase corpus exists, take the rime key of each phrase's final
word and build the reverse index. This is a build script of perhaps fifty lines reusing
`build-rhyme-index.cjs`'s `analyse()`, and it produces the feature MasterWriter charges for
and no free tool offers.

**Speech Types** (similes, metaphors, onomatopoeia, oxymorons, intensifiers) is the weakest
of the group and has no good open source. Either hand-curate a small theatre-flavoured set
or drop it. Do not build a thin version for the sake of tab parity.

### Phase 3 - The filter layer

Make filters cross-cutting rather than rhyme-only:

- **Part of speech.** Available from Datamuse `md=p`, from WordNet locally, or derivable
  during index build. Applies to rhymes, families, thesaurus, phrases.
- **Positive / negative.** Needs a sentiment lexicon. AFINN and NRC have usable licences;
  VADER is permissive. Coverage will be partial, so the filter must degrade to "no opinion"
  rather than silently dropping words it has no data for.
- **Intensity.** MasterWriter's *pretty to gorgeous* ladder has no open-data equivalent.
  Approximating it with sentiment magnitude will be noticeably worse than the real thing.
  Recommend skipping it and saying so, rather than shipping a weak imitation of the one
  feature MasterWriter is praised for.

### Phase 4 - Read the lyric (the part that wins)

- **Automatic rhyme-scheme detection.** Compute end-word rime keys across a section, group
  them, colour them. Extends Feature 10 from `off | manual` to `off | manual | automatic`,
  so manual assignment survives and takes precedence over detection.
- **Scheme labels in the gutter.** ABAB, AABB, or a warning where an established scheme
  breaks. Beside the existing syllable counts, in the same quiet register.
- **A near-rhyme tolerance dial.** How close counts as a rhyme. A theatre writer and a rap
  writer want different answers, and the assonance key makes the dial cheap.
- **Internal rhyme.** Same computation across all words in a line rather than line-final
  words only. No competitor in this price bracket does it.

Guard rails, because this is the class of feature that becomes annoying fast: detection is
**derived, never stored** (the C-44 rule), it is **off by default**, and it never rewrites
the document. `FEATURES.md` Feature 10's warning about noisy prosody diagnostics is the
right instinct and applies here.

---

## 5. Proposed backlog items

Paste-ready rows for `BACKLOG.md`. Priorities use existing gaps; nothing is renumbered.

| Pri | # | Item | Lane | Status | Size | Depends | Spec |
|--:|---|---|:--:|:--:|:--:|---|---|
| 41 | C-49 | Retire the dead `'idioms'` ToolMode and relabel "Related" | D | ⬜ | S | - | §Phase 0 |
| 42 | C-50 | Syllable filter on rhyme results | S | ⬜ | S | - | §Phase 0 |
| 45 | C-23 | **Wire the offline rhyme + family indexes** (promoted from 140) | D | ⬜ | L | C-08 | §Phase 1 |
| 46 | C-51 | Phonetic rhyme tiers from the rime index, retiring the 40% heuristic | D | ⬜ | M | C-23 | §Phase 1 |
| 105 | C-52 | Word Families tab, facet results, ConceptNet attribution | S | ⬜ | M | C-23 | §Phase 1 |
| 115 | C-53 | Phrases corpus + Phrases tab | D | ⬜ | L | C-49 | §Phase 2 |
| 116 | C-54 | Rhymed Phrases, phrase corpus indexed by final-word rime | D | ⬜ | M | C-53, C-51 | §Phase 2 |
| 125 | C-55 | Cross-cutting filters: part of speech, positive/negative | D | ⬜ | L | C-52 | §Phase 3 |
| 135 | C-56 | Automatic rhyme-scheme detection and colouring | D | ⬜ | L | C-23 | §Phase 4 |
| 136 | C-57 | Scheme labels + break detection in the prosody gutter | S | ⬜ | M | C-56 | §Phase 4 |
| 175 | C-58 | Keyboard navigation through results (arrow, Enter, Cmd+Enter) | S | ⬜ | S | - | §13.2 |
| 182 | C-59 | Drag a result or a chip into a line | S | ⬜ | M | C-46 | §13.2 |

C-58 and C-59 are the two bullets §13.2 lists in prose but never turned into acceptance
criteria; the 2026-09-12 session log flags the drag one explicitly as unbuilt and
deliberately not scope-crept into C-42. They belong to this plan because they complete the
collect loop, which is the gesture MasterWriter is proudest of.

### Re-prioritisation this implies

**C-23 moves from 140 to 45.** It is currently behind C-25 (chords), C-24 (alternates),
C-21 (sections), C-37 (outline) and C-39 (smart paste), and it unblocks five of the items
above. The argument for moving it is not that chords matter less, it is that C-23 is the
only item in the queue that changes what the product *is* rather than how well it does
something it already does.

Everything above C-23's new position is small and independent, so the promotion costs
nothing already in flight.

### Documents that move with the code

- `FEATURES.md` Feature 10 gains an `automatic` rhyme colour mode (C-56), and Feature 12
  and 13 gain the new dictionaries. Feature 10's number is used twice in that file already,
  which should be fixed while it is open.
- `SCOPE.md`'s in-scope list gains the offline reference layer.
- `DATA_MODEL.md` changes only if `displaySettings.rhymeColorMode` gains a value and the
  tolerance dial is stored. Detection results are derived and stored nowhere.
- `DESIGN_PROPOSAL.md` §6's tab list (Rhymes, Thesaurus, Phrases, Word Families, Speech
  Types) is the target shape and does not change; this plan says how the last three arrive.

---

## 6. What this does not fix

Honest limits, so nobody reads this as a complete answer.

- **Coverage.** cmudict is ~125k words. MasterWriter claims 100k rhyme entries plus 36k
  rhymed phrases, hand-curated. An automated index will have a rougher long tail: proper
  nouns, slang and theatre-specific vocabulary will need the Datamuse fallback or manual
  additions.
- **Curation.** MasterWriter's dictionaries were assembled by people. D-22 already
  documents junk in the Datamuse rhyme results (*klepht*, *antitheft*), and a derived index
  will have its own version of that problem. C-45's answer, prominence rather than
  exclusion, is the right pattern to carry forward.
- **Intensity** has no open-data answer, as above.
- **None of this is worth anything if the writing surface regresses.** The project's own
  principle holds: no speculative complexity before core drafting is excellent. C-25, C-24,
  C-21 and C-37 are all still the right work and this plan does not displace them, with the
  single exception of C-23's promotion.
