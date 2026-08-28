# Claude Code — Kickoff Prompt for Cyril

Paste the block below into Claude Code (or your Sonnet agent) at the repo root. It points the
agent at the current orchestration and holds it to the Definition of Done. Updated 2026-07-05 —
Phase 1 stabilization is shipped; the agent now works the `NEXT_STEPS.md` active backlog.

---

You are a coding agent working on Cyril, a local-first musical-theatre lyric editor (React +
TypeScript + Vite + Tiptap + Zustand). Before writing any code, read `CLAUDE.md`,
`DEFINITION_OF_DONE.md`, and `NEXT_STEPS.md`.

Operating rules — non-negotiable:

- The backlog is `NEXT_STEPS.md` → "Active backlog (pick from the top)." Work the top unstarted
  item unless I tell you otherwise. Its acceptance criteria live in the linked spec section
  (`DESIGN_REVIEW.md` or `DESIGN_PROPOSAL.md`).
- Nothing is "done" until all four gates pass: `npm run build` (exits 0), `npm run lint` (0
  errors), `npm test` (passes AND terminates), and `npm run coverage:features` (your acceptance
  criteria show ✅ in `FEATURE_COVERAGE.md`). Every criterion gets a test whose title contains its
  spec ID (e.g. `it('T-…: …')`); use the `T-` scheme, never invent a new one.
- Write honest tests: make them exercise the real behaviour, let them fail first, then fix the
  code. Never weaken a test or assert only what the code already does.
- Work in small increments. One item (or sub-step) at a time → run the four gates → commit with a
  message naming what you did → update `PROGRESS.md` (only boxes the ledger backs) and regenerate
  `FEATURE_COVERAGE.md`. Then take the next.
- Ignore the retired stage/step files (`STAGES.md`, `ACTION_PLAN.md`, `current_step.md`,
  `last_step.md`) — they are history. `tests/specs/stage-*.md` is still the criteria reference for
  features that already exist.
- Stay within `SCOPE.md`. If an item is ambiguous, needs a `DATA_MODEL.md` change, or has multiple
  viable approaches, stop and give me a short handoff (per `TASKING.md`) before coding.

First task — the Quality-of-life pass (`DESIGN_REVIEW.md`), backlog item #1. Do the sub-steps in
order, each as its own small change, gates green and committed before moving on:

  (a) Remove the duplicated draft header (`DraftView` renders `Draft: {name}` under a top bar that
      already shows it) and reclaim the vertical space.
  (b) Turn the View controls (`DisplayControls`) from raw checkboxes into on/off toggle switches.
  (c) Reconcile the doubled Chords control into a single switch (see `DESIGN_REVIEW.md` item 4).
      Confirm the "one switch enables chord mode AND shows the lane" approach with me before you
      remove the Lyrics / Lyrics + Chords mode selector.
  (d) Organise the Save / Open / Save As / Duplicate / Close / Import actions into one
      non-wrapping top-bar toolbar with an overflow "⋯" menu; move hover states to CSS.
  (e) Make the song title and the draft name in the top bar individually click-to-edit (reuse the
      existing click-to-rename pattern in `LeftNav`).

Start by reading the three docs and running the four gates to confirm the current baseline is
green. Report the baseline and your plan for (a) before writing any code.

---

## Notes for you (Ariel), not part of the prompt

- The prompt makes the agent **report the baseline and its plan before coding**, and **check with
  you on sub-step (c)** — that's the one design decision still open (single Chords switch vs.
  keeping an explicit mode selector). If you'd rather it just proceed, delete those two clauses.
- To point an agent at a different item, replace the "First task" paragraph with the backlog item
  you want (e.g. "First task — Characters/speakers, `DESIGN_PROPOSAL.md` §3.1").
- For a planning/senior pass instead of coding, ask an Opus agent to read `NEXT_STEPS.md` + the
  relevant spec and hand down an implementation plan, then feed that to the Sonnet agent.
