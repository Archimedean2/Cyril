# Agent Brief — starting work on Cyril

Copy-paste prompts for putting an agent (or several) to work on this repo. Updated 2026-08-28
for the `STATUS.md` / `BACKLOG.md` structure.

---

## A. Single agent — the default

Paste this at the repo root.

> You are a coding agent working on Cyril, a local-first musical-theatre lyric editor
> (React + TypeScript + Vite + Tiptap + Zustand).
>
> Before writing any code:
> 1. Run `npm run status` and read `STATUS.md` — it tells you the gate state, what's
>    uncommitted, and what the last session was doing.
> 2. Read `CLAUDE.md` and `DEFINITION_OF_DONE.md`.
> 3. Open `BACKLOG.md` and take the **lowest-numbered unclaimed item whose dependencies are
>    met**. Claim it by setting its Status to `🚧` and committing that one-line change first.
>
> Operating rules — non-negotiable:
>
> - `BACKLOG.md` is the only backlog. Anything in `docs/archive/` is history; do not work from it.
> - Nothing is "done" until all four gates pass: `npm run build` (exits 0), `npm run lint`
>   (0 errors), `npm test` (passes AND terminates), and `npm run coverage:features` (your
>   criteria show ✅ in `FEATURE_COVERAGE.md`). Run `npm run test:e2e` too if you touched UI.
> - Every acceptance criterion gets a test whose title contains its spec ID, e.g.
>   `it('T-1.20: save requests permission on a prompt-state handle', …)`. Use the `T-` scheme;
>   never invent a new one. New criteria go in `tests/specs/stage-*.md` or they aren't counted.
> - Write honest tests: make them exercise the real behaviour, let them fail first, then fix the
>   code. Never weaken a test or assert only what the code already does.
> - Work in small increments. One item (or sub-step) at a time → gates green → commit with the
>   item ID in the message → mark the item ✅ → **append a session-log entry to `STATUS.md`** →
>   `npm run status`. Then take the next item.
> - Stay within `docs/product/SCOPE.md`. If an item is ambiguous, needs a
>   `docs/engineering/DATA_MODEL.md` change, or has two viable approaches — **stop and hand back
>   a short summary of the options** rather than guessing. That rule is in
>   `docs/process/TASKING.md` and it is the one that keeps this codebase from drifting.
>
> Start by running the gates and reporting the baseline plus which item you're taking, before
> writing any code.

---

## B. A fleet — several agents in parallel

`BACKLOG.md` assigns every item to a **lane**. Lanes own disjoint file paths, so one agent per
lane is safe to run concurrently. **Two agents in the same lane will conflict** over the same
files — don't do it.

| Lane | Owns | Good first item |
|---|---|---|
| **P — Persistence** | `src/persistence/**`, `src/app/state/saveStatusStore.ts` | C-01 |
| **E — Editor** | `src/editor/**`, `src/components/editor/**` | C-09 |
| **S — Shell & styling** | `src/components/layout/**`, `src/features/**`, `src/index.css` | C-12 |
| **D — Domain & export** | `src/domain/**` | C-19 |
| **X — Repo / process** | config, CI, docs, scripts | C-18 |

Give each agent the prompt in §A, with this paragraph appended:

> You are working **lane `<P|E|S|D|X>`** only. Take items from that lane in `BACKLOG.md`, in
> order, respecting the `Depends on` column. Do not edit files outside your lane's paths — if
> your item genuinely requires a change elsewhere, stop and say so rather than reaching across.
> Other agents are working the other lanes at the same time, so: pull before you start, claim
> your item with a committed one-line edit before you build it, and keep commits small.

**Shared files to be careful with.** These are outside every lane and get touched by everyone —
`BACKLOG.md`, `STATUS.md`, `FEATURE_COVERAGE.md`, `package.json`. Edit them in their own small
commits, never bundled into a feature commit, and pull first.

**Suggested opening fleet.** Three agents is the sweet spot for this backlog:

- **P** on C-01 → C-04. This is the data-safety block and the highest-value work in the repo.
- **S** on C-12 → C-13 → C-16 → C-15. Visual craft, all independent of P.
- **E** on C-09 → C-10 → C-17. Small editor defects, all independent of P and S.

Hold **D** and **X** until those land; C-23 depends on C-08 and C-14, and C-18 (CI) is best done
once, at a quiet moment, by whoever is free.

---

## C. Planning pass instead of coding

For a senior/architecture review rather than implementation:

> Read `STATUS.md`, `BACKLOG.md`, and the spec linked from `BACKLOG.md` item `<ID>`. Do not
> write code. Produce an implementation plan: the files you'd touch, the order, the `T-` test
> IDs you'd add and what each would assert, the edge cases from
> `docs/engineering/EDGE_CASES.md` that this item should cover, and any decision you'd want the
> maintainer to make before work starts.

Then hand that plan to an implementing agent using the §A prompt with "take item `<ID>`"
substituted for the "lowest unclaimed item" instruction.

---

## D. Notes for the maintainer

- The §A prompt makes an agent **report a baseline before coding**. That's deliberate — it
  catches "the tree was already red when I started" before it becomes "the agent broke the build".
- Two backlog items expand v1 scope and should not be started without you: **C-27** (Hook Lab
  structured workspace) and **C-25** (chord data-model change). Both say so in `BACKLOG.md`.
- If you want an agent to just proceed without the check-in clauses, delete the last line of §A
  and the "stop and hand back" clause. The trade is speed against drift, and this project's
  history argues for the check-ins.
