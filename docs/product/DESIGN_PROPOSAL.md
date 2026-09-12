# Cyril — Design Proposal

_A design spec for making Cyril feel finished and reach usable parity with MasterWriter,
while winning on the things MasterWriter can't do: a slick look, real theatre structure
(characters + stage directions), chord notation, alternate lyrics, and beautiful print._

This document extends `docs/design/DESIGN_SYSTEM.md` and `docs/design/UI_TOKENS.md`; it does not replace them. Where
this proposes new visuals, they use the existing token palette. Every feature section ends
with **acceptance criteria** written so they can be turned into `T-`tagged tests per
`DEFINITION_OF_DONE.md`. Build order is deliberate: **theatre features first**, then chords,
alternates, reference tools, and print, on top of a refreshed visual foundation.

---

## 0. Implementation status (2026-07-05)

A first "ink-on-paper" visual pass has landed in the app. Use this section to see what's
already wired versus what still needs building, so work picks up cleanly. Gate status at
time of writing: `tsc` clean, `npm run lint` 0 errors; the vitest suite was observed passing
with zero failures but a single uninterrupted run should be re-confirmed locally (`npm test`).

**Done — live in the app**

- Fonts loaded in `index.html`: Newsreader (lyric serif), Fraunces (wordmark), Inter (UI).
- Warm ink-on-paper palette applied at the token layer (`src/index.css` `:root`) — background,
  text, border, accent, and status tokens all shifted; added `--font-lyric`, `--font-display`.
- Editor surface (`src/components/editor/editor.css`): warm paper background with a faint grain
  overlay; lyric body set in `--font-lyric`; speaker + section labels kept in `--font-ui`;
  chords float crisp and monospace (`--font-chord`, `--accent-strong`) instead of boxed pills.
- Logo: new `src/components/brand/CyrilLogo.tsx` exporting `CyrilMark` (feather tile) and
  `CyrilLogo` (stacked lockup). Reduced mark + Fraunces wordmark in the top bar; full stacked
  lockup with "Write · Draft · Score" on the empty/launch screen.

**Partially in place (infrastructure only)**

- Character colour: the `--speaker-color` token and the speaker identity dot exist, defaulting
  to the accent. The per-character *assignment* (registry + auto-colour + autocomplete) is NOT
  built yet — see §3.1.
- Section colour: `.section-label` has a `--section-color` accent bar defaulting to gold; the
  per-section-type mapping is not wired — see §3.3.

**Not started** — §3.1 character registry, §3.4 delivery rework (none/sung/spoken with
customisable, settings-editable styling), §5 alternates peek/compare, §6 reference tabs +
filters + collect + the click model and §6.1 contextual (follow-selection) results — note
single-click-to-clipboard and a manual "populate from selection" button already exist; the
double-click-to-Inventory and automatic follow-selection are the new parts — plus the
Phrases / Word Families dictionaries, §4 chord transpose + chord sheet, §7 print profiles,
§8 focus mode / command menu / autosave-backed save state, §9 Hook Lab structured workspace
(hook list + comments + groups; expands v1 scope).

**Foundation clean-up still open:** four danger-red hex values in the chord/alternate delete
states need a `--bg-danger` / `--border-danger` token pair (see §2).

---

## 1. Competitive frame — parity, then advantage

MasterWriter's strength is a dense **reference suite** (Rhymes with perfect/close/wide filters,
Phrases, Word Families, Synonyms, Speech Types) plus a **"collecting"** workflow: double-click any
result to gather it into a palette while you write. Its weakness is that it is pop-song oriented,
visually dated, and has no concept of characters, stage directions, chords-in-context, or print
that looks like a score or a libretto.

Cyril's strategy:

- **Reach parity** on the reference panel and the collect-while-you-write loop (Cyril already has a
  Tools pane and an Inventory pane — they need to become one loop; see §6).
- **Win** on a slicker, calmer editor (§2), on theatre structure (§3), chords (§4), alternates (§5),
  and print (§7) — none of which MasterWriter does well or at all.

---

## 2. Visual foundation (partially done)

The design intent in `docs/design/DESIGN_SYSTEM.md` — a calm, light-mode "IDE for lyricists" — is right. The
gap was execution: the editor CSS referenced token names that were never defined (`--accent-color`,
`--border-color`, …) and silently fell back to an off-palette blue (`#4a90d9`), so the editor never
matched the shell.

**Already refreshed in this pass** (`src/index.css`, `src/components/editor/editor.css`):

- Added the missing tokens to `:root`: section accent colours, rhyme-highlight pairs, `--status-error`,
  a `--font-chord` mono stack, and a `--speaker-color` hook. Added compatibility aliases so the editor's
  legacy token names resolve to the canonical palette.
- Migrated ~40 hardcoded hex values in `editor.css` to tokens (toolbar, active states, section, speaker,
  stage-direction rules). The editor now shares the app accent instead of a second blue.
- Elevated the theatre rules: speaker labels get a per-character colour dot; section labels are legible
  (were `opacity: 0.45`) with a subtle accent bar.

**Remaining foundation work (small):** four danger-red hex values in the chord/alternate delete states
still need a `--bg-danger` / `--border-danger` token pair; one `rgba(74,158,255,…)` selection tint should
move to `--accent-soft`. Then the editor is 100% tokenised.

Acceptance criteria:

- No hardcoded hex colours remain in `editor.css` (grep clean); all colours resolve to `:root` tokens.
- The editor's active/selected states use `--accent-*`, visually identical to the shell's nav active state.

---

## 3. Theatre structure — the headline differentiator (PRIORITY 1)

The goal: a page should instantly read as a piece of musical theatre — who sings, who speaks, what
happens on stage — not as a generic poem. Three pieces: characters, stage directions, and sections.

### 3.1 Characters / speakers

Today a speaker line is just bold uppercase text. Make each character a first-class, coloured identity.

Design:

- **Character registry** lives in the Structure workspace: a small list of characters in the song, each
  with a name and an auto-assigned colour drawn from the section-accent family (`--section-blue`, `-green`,
  `-gold`, `-rose`, `-violet`). The writer can rename and recolour.
- **In the editor**, a speaker line shows the character's colour as the identity dot (already wired via
  `--speaker-color`) and the name in small caps. Consecutive lines by the same character don't repeat the
  label — a thin colour tick in the left gutter carries the identity, script-style.
- **Entry**: the existing `[[NAME]]` input rule stays; add an autocomplete against the character registry
  so names stay consistent (a typo shouldn't create a new character).
- **Duet / concurrent** lines (Stage 13's concurrent block) inherit each column's character colour.

Acceptance criteria:

- Assigning a character a colour updates every line spoken/sung by that character in the editor and in print.
- Typing `[[JAC` offers `JACK` from the registry; selecting it does not create a duplicate character.
- Consecutive same-character lines render the label once; the gutter tick persists on the continuation lines.

### 3.2 Stage directions

Design: keep the quiet italic muted treatment (now tokenised). A stage direction is never indented and
never carries a character colour. In print it renders in parentheses, centered or right-set depending on
the print profile (§7). Provide the `((text))` input rule (exists) plus a toolbar toggle.

**Sticky (multi-line) mode.** Today pressing Enter inside a stage direction drops the new line back to
`lyric` (the unified-line-model reset). Change it so stage-direction mode **persists across Enter** —
once you're writing a stage direction, each new line stays a stage direction until you explicitly turn
it off (toggle the control again, or an empty-line/Escape exit). This lets a writer type a multi-line
stage direction without re-invoking it every line. Speaker mode keeps its current one-line behaviour.

Acceptance criteria:

- A stage direction is visually distinct from every lyric and speaker line at a glance (italic, muted, no dot).
- Pressing Enter within a stage direction creates another stage-direction line; the writer stays in
  stage-direction mode until they toggle it off (or exit via an empty line / Escape).
- Toggling "show stage directions" off hides them in the editor and omits them from lyric-sheet print, but
  keeps them in libretto print.

### 3.3 Sections

Design: section labels are now legible with a left accent bar. Give each section **type** its own accent
colour (verse = gold, chorus = blue, bridge = violet, etc.) via a `--section-color` set per block. Keep the
label compact and uppercase; never fill the whole section with colour (per `docs/design/DESIGN_SYSTEM.md`).

Acceptance criteria:

- Each section type maps to a distinct, muted accent colour used only on the label bar.
- The section outline in the Structure workspace uses the same colour coding.

### 3.4 Remove "delivery" entirely

Decision (2026-07-05): **remove the `delivery` feature.** It's a binary `sung | spoken` line
attribute whose only effect is italicising spoken lines — opaque in the UI ("delivery" means nothing
to a writer) and redundant with stage directions, which already cover "this is spoken". Cut it rather
than rework it.

Remove, together:

- the `delivery` attribute from the `lyricLine` node and the `DeliveryMode` type in `docs/engineering/DATA_MODEL.md`;
- the `toggleDelivery` command and its "Delivery" toolbar button (`DraftToolbar`);
- the `[data-delivery="spoken"] { font-style: italic }` rule and the `data-delivery` render attr;
- any `delivery` references in fixtures/tests, export selectors, and defaults.

Migration: loading an older project should simply drop the `delivery` attribute (a no-op — it was
purely cosmetic). Record the removal in `docs/archive/PROGRESS.md`.

Acceptance criteria:

- No `delivery` / `DeliveryMode` remains in the codebase (grep-clean), and the "Delivery" control is
  gone from the toolbar.
- Opening a legacy project that had `delivery` on lines loads cleanly with no error and no visible
  change beyond the (now-removed) italic.
- Build, lint, tests, and feature coverage stay green.

---

## 4. Chords

Chords sit above the lyric in the `--font-chord` mono stack and the app accent — crisp, not bold or
oversized. Anchoring is already character-precise (widget decorations at a `charOffset`, so pixel
position follows the font); the work is fixing alignment and making entry pleasant for the ways
musicians actually write chords.

### 4.1 Placement & alignment

Target look (per the reference chord sheet the maintainer supplied): each chord in a **subtle grey
rounded pill, dark and bold, left-aligned above the first letter** of its word; a chord line above
each lyric line; a trailing chord free-floating in the empty space after the last word.

- **Left-align to the character.** A chord's left edge sits above the first letter of its anchor.
  Fix the current centering (`transform: translateX(-50%)` on `.cyril-chord-marker`) that makes
  chords float slightly off the letter. (Also tracked as a bug in `docs/archive/NEXT_STEPS.md`.)
- **Visual treatment:** small grey pill (`--bg-subtle` background, `--text-primary`, medium weight),
  `--font-chord` mono. This supersedes the earlier transparent/blue chord styling — match the
  reference. Chord line height above the lyric matches the reference's clear one-line separation.
- **Monospace for alignment.** In the reference the lyric is monospace, which makes column alignment
  exact and lets a trailing chord land in a predictable column. Decision to confirm when building:
  render lyric lines in monospace **while chords are shown** (cleanest alignment, most chord-sheet-
  like), vs. keep the serif and rely on per-character offset anchoring. Recommend monospace-when-
  chords-shown for the chord-sheet fidelity the reference demonstrates.
- **Snap to word start.** When a chord is added, snap its offset to the first letter of the nearest
  word by default — the common case. The writer can nudge it off-snap for the exceptions below.

### 4.2 Entry gestures (two ways, both precise)

- **Keyboard-first:** with the text caret in a word, a chord shortcut (e.g. ⌘/Ctrl+K) opens a small
  input above that character; type the symbol, Enter commits. Caret at a word start → chord above
  the first letter.
- **Click the chord lane:** click the space above the line; the chord snaps to the letter under the
  click. Click above a later letter to place another.
- Editing: click a chord to edit/replace; drag left/right to nudge its offset (the move commands
  exist); Backspace or an ✕ removes it. Tab moves to the next chord slot.

### 4.3 More than one chord on a word

Already expressible (two chords at different offsets within one word, e.g. `C` on the "r" of
"running", `G` on the "n"). Needs: easy entry (click above the specific letter, or caret-at-letter +
shortcut) and **collision-aware rendering** — each chord left-aligns to its letter, and if two would
overlap, hold a minimum gap so both stay readable.

### 4.4 Wordless measures — trailing runs and instrumental lines (chosen: both)

The renderer currently clamps every chord to the text length (`Math.min(offset, textLength)`), so
nothing can sit past the last word. Add two ways to notate chords without lyrics:

- **Trailing chord run** — an ordered list of chords anchored *after* a line's text, rendered evenly
  spaced in the empty space to the right of the last word (one per beat/measure). For end-of-line
  fills. Entry: click in the empty area after the line, or press the chord shortcut repeatedly with
  the caret at line end — each press drops the next chord to the right.
- **Instrumental line** — a lyric line with no text that holds only chords, evenly spaced across the
  line. For intros, solos, and standalone bars anywhere in the song. Entry: a "chords-only line"
  affordance (e.g. an empty line + chord shortcut), rendered as a row of evenly spaced chords.

Data model: extend `ChordMarker.position` beyond `{ anchorType: 'char', charOffset }` with an
anchor type for trailing/instrumental chords — an ordered slot index (and optional beat/spacing)
rather than a character offset — and stop clamping char offsets so trailing anchors survive. Update
`docs/engineering/DATA_MODEL.md` intentionally. Squash/print export must emit these in reading order.

### 4.5 Also

- **Transpose** the whole draft (± semitone), rewriting symbols, with a display-only "capo" option.
- A dedicated **chord-sheet** print profile (§7).

Acceptance criteria:

- A chord's left edge renders above the first letter of its anchor word, and stays aligned as the
  line reflows at different pane widths.
- Two chords on one word render at their respective letters without overlapping.
- A trailing chord (after the last word) and an instrumental line (no lyrics) can both be created,
  render evenly spaced, and survive save/load; neither is clamped back onto the text.
- Transposing up two semitones turns every `C` into `D` (etc.) and survives save/load.
- Toggling "show chords" off hides them without deleting the data (already covered by T-9.05).

---

## 5. Alternate lyrics

MasterWriter offers side-by-side versions; Cyril can do this at the **line** level, which is more precise.

Design:

- A line with alternates shows the quiet `n alts` badge (see the mockup). Clicking it opens an inline peek
  listing each alternate with a one-click **"use this"** that swaps the active line (the swapped-out text is
  preserved as an alternate — behaviour already implemented in Stage 8).
- A **compare view** puts two drafts side by side, aligned by section, for reviewing whole-song variants —
  the theatre analogue of MasterWriter's "versions side by side."

Acceptance criteria:

- The alternates badge appears only on lines that have alternates and states the count.
- "Use this" swaps active/alternate content without data loss and updates the badge count.
- Compare view aligns two drafts by section and highlights lines that differ.

---

## 6. Reference tools + collect (MasterWriter parity)

Make the right rail the reference workhorse. Cyril has the Tools pane (Datamuse) and Inventory; unify them.

Design:

- **Mode tabs**: Rhymes · Thesaurus · Phrases · Word Families · Speech Types. (Rhymes/Thesaurus exist via
  Datamuse; Phrases and Word Families are the two dictionaries to add for real parity.)
- **Filter chips** under the search: for Rhymes, `Perfect / Close / Wide`; for others, part-of-speech and
  positive/negative where available.
- **Interaction model** on each result — fast, keyboard-free capture while writing:
  - **Single click → clipboard.** (Already implemented: clicking a result copies the word.)
  - **Double click → Inventory.** Add the word to the active draft's Inventory (the "collect"
    action). A visible `+ collect` affordance should also exist for discoverability, but the
    double-click is the power-user path. Give brief feedback on both (e.g. a quick "copied" /
    "collected" flash) so the two gestures are distinguishable.

### 6.1 Contextual results — follow the editor selection

The right rail should react to what the writer is doing. When a reference tool is open and the
writer **highlights a word in the editor**, the active tool re-queries for that word and updates
its results automatically — no need to retype or press a button.

Today this is manual: `ToolsSearchInput` has an `onPopulateFromSelection` button that pulls the
current editor selection into the search box. The work is to make it **automatic and live**:
subscribe to editor selection changes, debounce, and when the selection is a single word (or short
phrase), feed it to the active tool's query. Guard rails: only fire on a settled selection (not
mid-drag), ignore empty/multi-line selections, and don't clobber a search the user typed by hand
(e.g. pause auto-follow while the search box is focused, or offer a small "follow selection" toggle).

Acceptance criteria:

- Switching mode tabs re-queries and shows results appropriate to that mode.
- A rhyme search respects the active filter chip (perfect vs close vs wide changes results).
- With a tool open, highlighting a single word in the editor updates the results to that word
  automatically (debounced); clearing the selection leaves the last results in place.
- Single-clicking a result copies it to the clipboard; double-clicking a result adds it to the
  active draft's Inventory and persists it. Each gesture gives distinct visual feedback.

---

## 7. Print — a first-class output, not a CSS afterthought

This audience prints. Offer named **print profiles** from the Export/Print dialog, each with its own layout,
using a literary serif and generous margins (print styling is intentionally more spacious than the app):

1. **Lyric sheet** — lyrics only, section labels optional, no chords/stage directions. Clean and literary.
2. **Chord sheet** — chords above lyrics, mono chord font, section labels; for rehearsal/accompaniment.
3. **Script / libretto** — characters and stage directions in theatre format; the differentiator.
4. **Annotated** — lyric sheet with alternates and notes in the margin, for collaboration.

Each profile is a preview before print/PDF; settings persist per project (the export-settings schema exists).

Acceptance criteria:

- Each profile produces visibly different output from the same draft (e.g. chord sheet shows chords, lyric
  sheet omits them).
- Libretto print includes speakers and stage directions with theatre formatting; lyric sheet omits stage
  directions.
- Chosen profile and options survive save/load.

---

## 8. Feel & usability wins (apply throughout)

- **Focus mode**: a keystroke collapses both rails to leave only the centred lyric column — the "serious
  instrument" feeling.
- **Keyboard-first**: shortcuts for new line-type (speaker/stage direction), collect-selected-word, toggle
  panes, transpose, and draft switching. Show them in a discoverable command menu.
- **Save feedback**: wire the top-bar save dot to real autosave state (`saved` / `saving` / `unsaved`) using
  `--status-*` tokens. (Autosave itself is `docs/archive/NEXT_STEPS.md` Phase 2.)
- **Empty & error states**: the error boundaries exist — give their fallbacks helpful copy and a working
  Reload, and give empty drafts an inviting first-run state (sentence-case, verb-first copy).
- **Motion**: keep the existing 120ms functional transitions; no decorative animation (per `docs/design/DESIGN_SYSTEM.md`).

---

## 9. Hook Lab — a structured hook workspace

Today Hook Lab is just a rich-text `WorkspaceDocument` like Brief and Vocabulary (v1 explicitly
excluded "structured behavior beyond base rich text" — see `docs/product/FEATURES.md`). Upgrade it into a proper
place to develop hooks: a list of candidates the writer can annotate and organise. This intentionally
expands v1 scope, so `docs/product/SCOPE.md`, `docs/product/FEATURES.md`, and `docs/engineering/DATA_MODEL.md` must be updated together when it's
built.

Design:

- **Hook list.** Hook Lab holds an ordered list of *hooks*, each a short line of text (the hook itself),
  editable inline. Add / reorder (drag) / delete. This replaces the freeform doc for Hook Lab only;
  Brief and Vocabulary stay rich text.
- **Comments per hook.** Each hook can carry one or more short notes (e.g. "this is funnier",
  "too on-the-nose") — a lightweight annotation, shown quietly beneath or beside the hook, expandable.
  Not full threaded comments; just the writer's own margin notes.
- **Grouping.** Hooks can be organised into named groups (e.g. "Best", "Verse ideas", "Rejects").
  A hook belongs to a group (or an "Ungrouped" default); groups can be renamed, reordered, collapsed.
  Simple single-group membership first; multi-tag is a later option, not now.
- **Optional niceties (flag, don't over-build):** a star/favourite on a hook, and a one-click send of a
  hook into the active draft or the Inventory — but keep the first version to list + comments + groups.
- **Data model.** Replace `workspaces.hookLab: WorkspaceDocument` with a structured shape, roughly:
  `hookLab: { groups: { id, name, order, collapsed }[], hooks: { id, text, groupId, order, notes: string[], starred? }[] }`.
  Add a migration from the old rich-text doc (either drop legacy content into an "Imported" group as
  individual hooks split by line, or preserve it as a single note — decide deliberately and record it).
- **Persistence & feel.** Lives in the project (workspaces are project-level, shared across drafts).
  Editing must autosave like everything else; styling follows the paper/token aesthetic — hooks in the
  lyric serif, group headers and notes in the sans UI font, muted.

Acceptance criteria:

- Hook Lab shows a list of hooks; a writer can add, edit inline, reorder, and delete a hook, and it
  persists through save/load.
- A hook can hold one or more short comments that persist and can be added/removed.
- Hooks can be assigned to named groups; creating/renaming/reordering a group and moving a hook between
  groups persists through save/load.
- Opening a legacy project migrates the old Hook Lab rich-text content per the chosen rule without data loss.

---

## 10. Right-click contextual menu

Cyril has partial context menus (`LineContextMenu`, `SectionContextMenu` — convert/delete) but no
unified, discoverable **right-click** menu. Build one context-aware menu: right-clicking anywhere in
the editor suppresses the native browser menu and opens a Cyril menu whose items depend on **what was
clicked**. Reuse the existing `lineMenuStore` / `sectionMenuStore`. Items that don't apply are hidden;
destructive items sit last, styled as danger; a separator groups families. It must reposition to stay
on-screen near edges, be keyboard-navigable (arrows, Enter, Escape; open via the Menu key), and return
focus to a sane caret position on close (the caret-jump class of bug — see `docs/engineering/EDGE_CASES.md` §12).

Contents by what's under the cursor (⟳ = depends on planned features; the rest can ship now):

- **Lyric line:** Convert to speaker · Convert to stage direction · Insert line above / below ·
  Add chord here ⟳ · Add / show alternates ⟳ · Duplicate line · Cut · Copy · Delete line.
- **Speaker line:** Convert to lyric · Convert to stage direction · Rename speaker (→ character ⟳) ·
  Delete line.
- **Stage-direction line:** Convert to lyric · Convert to speaker · Delete line.
- **Section header:** Rename section · Change type (Verse / Chorus / Bridge / Pre / Outro …) ·
  Insert line · Duplicate section · Move up / down · Delete section.
- **A chord ⟳:** Edit chord · Nudge left / right · Transpose this chord · Add chord after · Delete chord.
- **Selected word / text:** Look up → Rhymes / Thesaurus / Phrases (sends to Tools, §6.1) · Collect to
  Inventory · Add chord over this word ⟳ · Cut · Copy · Paste.
- **Concurrent block / column:** Add speaker column · Rename speaker · Remove this column · Delete row ·
  Delete block · Convert block to plain lines (squash in place).
- **Empty area / between lines:** Insert lyric line · Insert section · Insert concurrent block · Paste.
- **Inventory item:** Copy · Send to draft ⟳ · Remove.
- **Tools result:** Copy · Collect to Inventory · Search this word.
- **Draft (in the draft list):** Rename · Duplicate (blank / text / inventory / both) · Export this
  draft · Delete draft.
- **Always available:** Undo · Redo · Select all (as a fallback group).

Acceptance criteria:

- Right-clicking a target opens a Cyril menu (native menu suppressed) whose items match that target;
  inapplicable items are absent.
- Each item performs its action and the menu closes, returning the caret sensibly; Escape closes with
  no action.
- The menu never renders off-screen near an edge; it is fully keyboard-operable.
- Destructive items are visually distinct and (for block/section/draft deletes) confirm when content
  would be lost.

## 11. Suggested build sequence

Each step is a stage of work that must pass all four gates and land `T-`tagged tests before it's "done".

1. **Finish the token sweep** (§2 remainder) — small, unblocks consistent theming.
2. **Characters/speakers** (§3.1) — the headline differentiator; registry + colour identity + autocomplete.
3. **Sections colour-coding + stage-direction polish** (§3.2, §3.3).
4. **Print profiles** (§7) — high user value, currently weakest.
5. **Alternates peek + compare view** (§5).
6. **Reference tools tabs + filters + collect** (§6); add Phrases / Word Families dictionaries.
7. **Chords: transpose + chord-sheet** (§4).
8. **Right-click contextual menu** (§10) — ties the existing actions together; grows as features land.
9. **Feel layer**: focus mode, command menu, save feedback, empty states (§8).
10. **Hook Lab structured workspace** (§9) — hook list + comments + groups; expands v1 scope, so
    update `docs/product/SCOPE.md` / `docs/product/FEATURES.md` / `docs/engineering/DATA_MODEL.md` alongside it.

Theatre (steps 2–3) leads because it's what makes Cyril unmistakably itself and is the clearest reason a
musical-theatre writer would choose it over MasterWriter.
