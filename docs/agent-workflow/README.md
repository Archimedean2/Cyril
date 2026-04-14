# Agent Workflow Docs

## Purpose

This folder defines the operating workflow for coding agents on Cyril.

It governs how the agent (junior dev) coordinates with the external senior dev before and after significant implementation work.

Read `SENIOR_DEV_LOOP.md` first. The other files are referenced from it.

---

## Files

| File | Purpose | Read when |
|------|---------|-----------|
| `SENIOR_DEV_LOOP.md` | The full consultation loop: recon → handoff → implement → report → test | Start of any significant task |
| `REPO_RECON_CHECKLIST.md` | Checklist for inspecting repo state before writing a handoff | Before producing Pre-Implementation Handoff |
| `prompt-templates/TEMPLATE_A_PRE_IMPLEMENTATION_HANDOFF.md` | Prompt template: request implementation plan | Use when preparing Pre-Implementation Handoff |
| `prompt-templates/TEMPLATE_C_POST_IMPLEMENTATION_TEST_PLAN.md` | Prompt template: request test plan | Use after implementation, before writing tests |
| `prompt-templates/TEMPLATE_B_BREAK_GLASS_ESCALATION.md` | Prompt template: escalate when blocked | Use when blocked or deeply uncertain |

---

## When to use this workflow

Use the full loop (recon → handoff → implement → report → test) for any task that involves:
- multiple files
- UI layout changes
- editor behavior changes
- persistence or data-flow changes
- test architecture changes
- spec ambiguity or stage interpretation
- any meaningful implementation uncertainty

Skip for trivial isolated fixes (single-file, clearly bounded, no ambiguity).

---

## Behavior rules

- Do all repo inspection before writing the handoff — do not ask the senior dev to infer state that can be observed directly.
- Keep handoffs factual and file-specific.
- Do not skip the post-implementation report before requesting a test plan on significant tasks.
- Trigger break-glass promptly — do not continue guessing after repeated failures.
