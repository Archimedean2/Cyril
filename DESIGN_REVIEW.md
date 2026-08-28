# Cyril — Design Review & Quality-of-Life Backlog

_Expert heuristic review, 2026-07-05. Scores are a designer's read of the current build
(components + the ink-on-paper visual pass), not a pixel audit of the running app — treat them
as direction, not gospel. This is guidance for the implementing agents; **nothing here is built
yet.** Every item, when built, follows `DEFINITION_OF_DONE.md` (gates green, `T-`tagged tests)._

## How to read the scores

Each surface gets **Look** (visual craft, hierarchy, polish) and **Function** (usability,
clarity, does-the-right-thing) out of 10. 7+ is good; 4–6 needs work; ≤3 is a problem.

| Surface | Look | Function | One-line verdict |
|---|---|---|---|
| Brand / logo | 8 | 7 | Strong, distinctive; needs real favicon + consistent use. |
| Visual token system (warm paper, type) | 8 | 8 | The recent pass paid off; coherent and calm. |
| Center editor / paper surface | 8 | 7 | The hero. Serif + paper feels right; needs the gutter/line polish. |
| Empty / launch screen | 8 | 6 | Lockup looks great; actions are plain and could guide more. |
| Right sidebar — Tools | 6 | 5 | Works, but not contextual; capture gestures half-there. |
| Workspace nav | 6 | 6 | Clean list; active state fine; Hook Lab still bare. |
| Draft list | 6 | 6 | Readable; rename/active affordances thin. |
| Right sidebar — Inventory | 5 | 5 | A raw textarea; fine as a scratchpad, no more. |
| Top bar | 6 | 4 | Looks ok now, but names aren't editable and duplicate the draft header. |
| Display controls (View toggles + Mode) | 4 | 4 | Checkboxes, not switches; Chords shown twice; confusing disabled state. |
| Project actions (Save/Open/…) | 3 | 5 | Six wrapping buttons in a narrow rail — the messiest surface in the app. |
| Draft header ("Draft: {name}") | 3 | 2 | Redundant with the top bar; wrong font; wastes vertical space. |

**Worst offenders to fix first:** project actions row, display controls, and the duplicated
draft header — all three are cheap wins with outsized impact on "feels finished."

---

## Quality-of-life backlog

Grouped roughly by impact. Items 1–5 are the ones you called out; 6+ are expert additions.
Where an item overlaps existing spec sections, it's cross-referenced.

### 1. Editable identity in the top bar
Make the song title and the draft name **individually click-to-edit** in the top bar (click the
song name → inline input; click the draft name → inline input). The project title is already
click-to-rename in the left sidebar (`LeftNav`), so reuse that pattern. After this, the top bar
is the single home for identity.
- Acceptance: clicking the song name edits it in place and persists; clicking the draft name
  edits that draft's name and persists; Escape cancels, Enter/blur commits.

### 2. Kill the duplicated draft header
`DraftView` renders `<h2>Draft: {draft.name}</h2>` directly under a top bar that already shows
`song — draft`. Remove the `draft-view-header` entirely and reclaim the vertical space for the
paper. Identity lives in the top bar (item 1).
- Acceptance: the draft name appears exactly once (top bar); the editor starts higher on the page.

### 3. View toggles become real on/off switches
Replace the raw `<input type="checkbox">` controls in `DisplayControls` with proper toggle
switches (a small styled switch component), labelled, in a tidy stack. This is purely visual/
interaction — the underlying `toggleDraftSetting` calls stay.
- Acceptance: each view option (Sections, Speakers, Stage Dir, Syllables, Stress, Chords) is a
  switch with a clear on/off state and keyboard focus; state still persists per draft.

### 4. Reconcile the Chords double-control
Today Chords appears twice: as the **Mode** segmented buttons ("Lyrics" / "Lyrics + Chords")
*and* as a separate **Chords** checkbox that's disabled unless the mode is chord mode. Collapse
this into one mental model. Recommended: a single **"Chords"** switch that, when turned on, both
enables chord mode and shows the chord lane; turning it off hides the lane (data preserved, per
T-9.05). Drop the separate Mode selector, or demote it to draft settings — don't show two
controls for one concept.
- Acceptance: there is exactly one control for chords in the View panel; enabling it shows chords
  and disabling it hides them without data loss; no disabled/greyed checkbox remains.

### 5. Organise the project actions into one clean line
The six actions (Open, Save, Save As, Duplicate, Close, Import Share) currently `flex-wrap` into a
jumble at the top of the left sidebar. Move them into a single tidy toolbar — recommended home is
the **top-bar right**, as compact icon buttons with tooltips, with the secondary ones (Save As,
Duplicate, Import Share, Close) tucked behind an overflow "⋯" menu. Keep Save and Export as the
visible primaries. Also replace the per-button inline `onMouseEnter/onMouseLeave` hover handlers
with CSS classes.
- Acceptance: actions sit on one row that never wraps; primary actions are one click, secondary
  actions are in an overflow menu; hover/focus states come from CSS, not inline JS.

### 6. Segmented control + grouping for View controls
If the Mode selector survives item 4, style it as a true segmented control. Group the View panel
under quiet sub-labels (Structure: Sections/Speakers/Stage Dir · Sound: Chords/Syllables/Stress)
so it scans instead of reading as a flat checklist.

### 7. Keyboard shortcuts + tooltips
Cmd/Ctrl+S save, Cmd/Ctrl+O open, shortcuts for toggling panes and view options, all surfaced in
a command menu. (Overlaps `DESIGN_PROPOSAL.md` §8 feel layer.)

### 8. Draft list affordances
Inline rename on double-click, a clear active-draft marker, and an always-visible "New draft"
affordance rather than burying it.

### 9. Right-sidebar polish
Give the Tools and Inventory panes proper collapsible section headers, and make Inventory feel
like a collected-words surface (chips) rather than a bare textarea — this dovetails with the
`DESIGN_PROPOSAL.md` §6 collect loop.

### 10. Save-state clarity
Wire the top-bar save dot to real autosave state (saved / saving / unsaved) — the store already
tracks it (`saveStatusStore`); make it unmissable. (Overlaps §8.)

---

## Sequencing suggestion

Do items **2, 3, 4, 5** first — they're small, visible, and directly answer the "feels
half-baked" complaint. Then **1** (editable identity), then **6–10** as part of the broader feel
pass in `DESIGN_PROPOSAL.md` §8. None of these expand data scope except where noted, so they're
low-risk, high-polish work.

---

## Title screen — a bold brochure-style launch page

Replace the current centered card empty-state with a full-bleed title page that reads like a
brochure, not a 90s dialog. It renders when no project is open, **without the app-shell top bar or
any chrome** (a distinct full-screen layout, not the normal shell with an empty centre).

Layout, on warm paper with the faint grain:

- **Top-left corner:** the stacked `CyrilLogo` lockup exactly as today — the quill mark with "Cyril"
  in Fraunces italic *underneath* it — just anchored to the top-left rather than centred. The
  "Write · Draft · Score" descriptor can be omitted here to keep the corner quiet.
- **Left, lower:** three understated **text links** (not buttons), each with a hover underline:
  - "Create something" → `createProject`
  - "Improve something" → `openProject`
  - "Collaborate" → the existing share/import flow.
  A small tracked "BEGIN" label may sit above them.
- **Right third (~⅓ width):** a large pull-quote — a poetry snippet in Newsreader italic (~28–30px)
  framed by **oversized quotation marks** in a very light tint (`#e4d9c4`-ish) so they frame rather
  than compete, with a faint tracked caption beneath.
- **Bottom:** a large, faint **line-art quill illustration** lying across the lower area (ink at
  ~5–6% opacity) with a small blue nib-drop echoing the logo accent. Not a photograph — a drawn
  mark, to keep it brochure-modern.

Poem source: default to **a random line pulled from the writer's own recent drafts** each launch (so
the title screen quietly shows you your own words), with a fixed house line as fallback when there
are no drafts yet. (Confirm this vs. a always-fixed line.)

Scope note: **"Collaborate" must not over-promise.** Real-time collaboration is out of scope
(`SCOPE.md`); this link points at Cyril's existing lightweight share/import. If that framing feels
misleading, relabel to something like "Share" — flag for the maintainer.

Acceptance criteria:

- With no project open, the launch page renders full-screen with no top bar; opening or creating a
  project switches to the normal editor shell.
- The stacked logo sits top-left; the three actions are text links (hover-underlined) wired to
  create / open / share-import respectively.
- The pull-quote renders on the right third with oversized quotation marks and a line drawn from a
  recent draft (or the fallback line when none exist).
- No layout element is a filled button; the screen has no visible app chrome.
