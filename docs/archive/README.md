# Archive — history, not instructions

**Do not work from anything in this directory.** These files are kept because they record how
Cyril got to where it is, and occasionally because they contain a detail worth recovering. They
are not a backlog, not a plan, and several of them describe problems that were fixed months ago.

The live equivalents are:

| If you came here looking for… | Read instead |
|---|---|
| What to work on | **`BACKLOG.md`** (repo root) |
| Where things stand / where the last session stopped | **`STATUS.md`** (repo root) |
| What is actually verified | **`FEATURE_COVERAGE.md`** (repo root, generated) |
| What "done" means | **`DEFINITION_OF_DONE.md`** (repo root) |

## What's in here

| File | What it was | Why it's archived |
|---|---|---|
| `STAGES.md` | The original 13-stage implementation plan with acceptance criteria | All stages built. The criteria still live in `tests/specs/stage-*.md`, which is what the coverage script reads. |
| `PROGRESS.md` | Stage-by-stage build log | Superseded by `FEATURE_COVERAGE.md` (generated, can't drift) and `STATUS.md`. Its own header warns that its checkboxes were never verified. |
| `NEXT_STEPS.md` | The 2026-07-03 stabilization roadmap | Its Phase 0–2 work is all shipped. Phase 3–4 content was folded into `BACKLOG.md`. Genuinely useful as the story of how the quality gates were repaired. |
| `ACTION_PLAN.md` | An earlier step-by-step remediation plan | Superseded twice over. |
| `HANDOFF.md` | Numbered engineering handoff notes | Valuable technical history — the unified line-model refactor (§11) and the NodeView stale-closure fix (§12) are worth reading before touching those files. |
| `RECOMMENDATIONS.md` | An honest assessment of weak spots | Most items addressed; the rest were folded into `BACKLOG.md` and `docs/engineering/EDGE_CASES.md`. |
| `current_step.md`, `last_step.md`, `completed_steps.md` | A three-file "what am I doing" convention | Replaced by `STATUS.md`, which does the same job in one file and stamps the parts that can be checked automatically. |

## A note on why this directory exists

The recurring failure on this project was **documents claiming more than the code delivered** —
13 stages marked complete on top of a failing build. The second-order version of that failure is
*documents that were true once and are now quietly wrong*. Six files at the repo root all
describing "what to do next", each from a different month, is how an agent ends up confidently
working from a stale plan.

So: one backlog, one status file, and everything that used to compete with them moved in here
with this note on top.
