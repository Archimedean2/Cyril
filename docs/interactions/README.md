# Cyril — Interaction Specs

## Purpose

This folder contains focused interaction-flow specifications for Cyril.

These docs are intentionally split into small files for:
- coding agent readability
- scoped implementation
- lower context overhead

Read only the interaction file relevant to the feature or stage being built.

---

## Files

| File | Covers |
|------|--------|
| `project-flows.md` | Project creation, opening, saving, renaming, duplicating, deleting |
| `workspace-and-draft-flows.md` | Workspace switching, draft creation, draft switching, draft duplication, draft deletion |
| `draft-editing-flows.md` | Draft editing, formatting, section insertion, metadata insertion, display behavior |
| `sidebar-flows.md` | Tools pane, inventory pane, display toggles |
| `advanced-draft-flows.md` | Alternates, chords, syllables, rhyme display, export entry points |

---

## Conventions

Each interaction section should include:
- trigger
- preconditions
- main flow
- alternate flows
- postconditions
- notes

---

## Rules

1. Do not implement interactions from future stages early.
2. Respect `STAGES.md` stage boundaries.
3. If implementation must differ, record deviation in `PROGRESS.md`.