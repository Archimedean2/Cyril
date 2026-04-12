# Cyril — Agent Navigation Guide

## Purpose

This repository contains a staged specification pack for Cyril, a desktop-first, local-first lyric editor for musical theatre lyricists and songwriters.

Build strictly one stage at a time.

Do not attempt to implement the whole product from a single reading.

---

## Document Inventory

| Document | Purpose | Read when |
|----------|---------|-----------|
| `SCOPE.md` | Product goals, constraints, non-goals, release boundaries | Read once at the start, then revisit for scope questions |
| `ARCHITECTURE.md` | Engineering decisions, stack, app structure, persistence approach | Read once at the start, then revisit for architecture questions |
| `DATA_MODEL.md` | Canonical `.cyril` data model and schema rules | Read before any persistence or feature work |
| `FEATURES.md` | Detailed feature behavior specs | Read only the relevant feature sections for the current stage |
| `STAGES.md` | Sequential implementation plan and acceptance criteria | Primary working document |
| `TESTS.md` | Tests by stage and feature tag | Read for the current stage only |
| `PROGRESS.md` | Build status, deviations, blockers | Update after each stage |

---

## Source-of-Truth Priority

If documents conflict, use this order:

1. `SCOPE.md`
2. `DATA_MODEL.md`
3. `ARCHITECTURE.md`
4. `STAGES.md`
5. `FEATURES.md`
6. `TESTS.md`
7. `PROGRESS.md`

Do not let a feature implementation violate product scope or the data model.

---

## How to Work

For each stage:

1. Read the stage section in `STAGES.md`
2. Note the feature tags used in that stage
3. Read only those feature sections in `FEATURES.md`
4. Check any schema dependencies in `DATA_MODEL.md`
5. Implement only what is in scope for the stage
6. Run the relevant tests from `TESTS.md`
7. Record completion, issues, and deviations in `PROGRESS.md`
8. Do not continue until all acceptance criteria pass

---

## Rules

1. Build one stage at a time.
2. Do not implement future-stage features early.
3. Do not invent new schema fields unless `DATA_MODEL.md` is updated intentionally.
4. Do not add AI features.
5. Do not add real-time collaboration.
6. Do not add mobile-specific functionality unless explicitly requested.
7. Prefer small, modular files.
8. Preserve undo/redo integrity for all editor actions.
9. Record deviations in `PROGRESS.md`.
10. When uncertain, stop and consult the relevant spec rather than guessing.
11. Use git constructively: initialize the repository if needed and commit at each completed stage milestone.

---

## Tag Lookup

Use grep/search by tag in `FEATURES.md`, `STAGES.md`, and `TESTS.md`.

Core tags include:

- `[PROJECT]`
- `[WORKSPACES]`
- `[EDITOR]`
- `[SECTIONS]`
- `[METADATA]`
- `[DRAFTS]`
- `[INVENTORY]`
- `[TOOLS]`
- `[RHYME]`
- `[DICTIONARY]`
- `[PROSODY]`
- `[ALTERNATES]`
- `[CHORDS]`
- `[DISPLAY]`
- `[EXPORT]`
- `[SHARING]`
- `[PERSISTENCE]`
- `[NAV]`
- `[PRINT]`
- `[UNDO]`

Stage tags:

- `[STAGE-0]`
- `[STAGE-1]`
- `[STAGE-2]`
- etc.

---

## Quick Start

Start with:

1. `SCOPE.md`
2. `ARCHITECTURE.md`
3. `DATA_MODEL.md`
4. `STAGES.md` → Stage 0 only

Do not read the whole repository spec at once unless explicitly asked.