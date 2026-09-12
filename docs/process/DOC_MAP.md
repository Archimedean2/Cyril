# Cyril — Document Map

Every markdown file in the repo, what it's for, and when to read it. If you're an agent starting
work, you want `CLAUDE.md` → `STATUS.md` → `BACKLOG.md` and nothing else until a task sends you
somewhere specific.

## The working set — repo root

These five are the only documents you read *every* session.

| Document | Purpose | Read when |
|---|---|---|
| `CLAUDE.md` | Operating guide: the gates, how to work, where to look, landmines | **First, every session** |
| `STATUS.md` | Live state + where the last session stopped + session log | **Second, every session.** Refresh with `npm run status` |
| `BACKLOG.md` | The single ordered work queue, with lanes for parallel agents | To choose what to do |
| `DEFINITION_OF_DONE.md` | The contract for "done" | Before starting, and before calling anything done |
| `FEATURE_COVERAGE.md` | Generated ledger: which acceptance criteria are actually verified | To check real status. **Generated — never hand-edit** (`npm run coverage:features`) |
| `README.md` | Human-facing project readme | If you're a person, not an agent |

## Product — `docs/product/`

| Document | Purpose | Read when |
|---|---|---|
| `SCOPE.md` | Goals, principles, in-scope/out-of-scope boundaries | Once at the start; revisit for any scope question |
| `FEATURES.md` | Detailed feature behaviour specs | Read only the sections your task touches |
| `DESIGN_PROPOSAL.md` | The forward spec: characters, chords, alternates, reference tools, print profiles, context menu, Hook Lab. Includes acceptance criteria per section | Before building any P2 backlog item |

## Design — `docs/design/`

| Document | Purpose | Read when |
|---|---|---|
| `DESIGN_SYSTEM.md` | Core aesthetic rules, typography, visual principles | Before applying any CSS |
| `UI_TOKENS.md` | The CSS custom properties for colour, spacing, type | Constantly, while styling. Never hardcode a hex |
| `WIREFRAMES.md` | Structural layout rules and the major visual zones | Before implementing layout or structural components |
| `DESIGN_REVIEW.md` | Heuristic review + the 2026-08-28 **live app audit** of the running build | Before any UI polish work |

## Engineering — `docs/engineering/`

| Document | Purpose | Read when |
|---|---|---|
| `ARCHITECTURE.md` | Stack, app structure, persistence approach, decisions | Once at the start; revisit for architecture questions |
| `DATA_MODEL.md` | The canonical `.cyril` schema and its rules | **Before any persistence or schema work.** Changing the model means changing this file deliberately |
| `COMPONENT_MAP.md` | Component hierarchy and responsibility boundaries | Before creating or refactoring components |
| `EDGE_CASES.md` | ~70 prioritised hazards (🔴/🟠/🟡) where features interact badly | When building any feature — cover its neighbouring hazards as part of the work |
| `HARDENING_PERSISTENCE.md` | The concrete, test-first spec for the P0 data-safety block (H1–H7) | Before `BACKLOG.md` C-01 … C-07 |

## Testing — `docs/testing/`

| Document | Purpose | Read when |
|---|---|---|
| `TESTING.md` | Strategy, conventions, how the two coverage metrics differ | Before writing tests |
| `TEST_IDS.md` | Stable `data-testid` selectors | While writing component or e2e tests |

Also live, though not in `docs/`: **`tests/specs/stage-*.md`** — the criterion ↔ test map. This
is what `scripts/feature-coverage.mjs` parses to build the ledger, so a new acceptance criterion
must be added there to be counted.

## Process — `docs/process/`

| Document | Purpose | Read when |
|---|---|---|
| `TASKING.md` | Rules for agents: scope control, change size, when to stop and ask | Once, early. The "when to stop" section is the important part |
| `DOC_MAP.md` | This file | When you can't find something |
| `AGENT_BRIEF.md` | Copy-paste prompts for starting agents on this repo, single or fleet | When spinning up an agent |

## Deep reference

| Path | Purpose |
|---|---|
| `docs/interactions/*.md` | Detailed user flows and interaction rules — read before implementing complex state changes |
| `docs/features/feature-concurrent-speakers.md` | Full spec for the concurrent-speakers feature (the most interaction-dense part of the editor) |
| `docs/agent-workflow/` | The junior→senior consultation loop, a repo recon checklist, and handoff prompt templates |

## Archive — `docs/archive/`

**History. Do not work from it.** See `docs/archive/README.md` for what each file was and what
replaced it. Contains `STAGES.md`, `PROGRESS.md`, `NEXT_STEPS.md`, `ACTION_PLAN.md`,
`HANDOFF.md`, `RECOMMENDATIONS.md`, `current_step.md`, `last_step.md`, `completed_steps.md`.

`HANDOFF.md` is the one worth opening anyway — its notes on the unified line-model refactor and
the ProseMirror NodeView stale-closure bug will save you real debugging time if you touch
`src/editor/nodes/`.

## Files that are not documentation

- `.windsurfrules` — describes a Windows/PowerShell setup for a different tool. **Ignore it.**
- `scripts/README.md` — how to build the offline rhyme and word-family indexes.
