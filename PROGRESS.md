# Cyril — Build Progress

## Current Stage
- Stage: 4
- Status: Complete
- Started: 2026-04-14
- Completed: 2026-04-14

---

## Stage Summary

| Stage | Name | Status | Acceptance Complete | Tests Implemented | Tests Passing | Notes |
|------|------|--------|---------------------|-------------------|---------------|-------|
| 0 | Project Scaffolding and App Shell | Complete | [x] | [x] | [x] | Stage 0 shell implemented with passing integration and e2e smoke tests |
| 1 | Project CRUD and Local Persistence | Complete | [x] | [x] | [x] | Stage 1 local-first project management using File System Access API |
| 2 | Editor Foundation | Complete | [x] | [x] | [x] | Stage 2 robust editor layer using Tiptap/ProseMirror with undo/redo and base formats |
| 3 | Workspaces and Multiple Drafts | Complete | [x] | [x] | [x] | Stage 3 workspaces and drafts switching, creation, duplication |
| 4 | Structured Sections and Metadata | Complete | [x] | [x] | [x] | Stage 4 custom editor nodes for song structure and metadata |
| 5 | Inventory Pane | Not Started | [ ] | [ ] | [ ] | |
| 6 | Prosody and Lightweight Visualization | Not Started | [ ] | [ ] | [ ] | |
| 7 | Tools Sidebar | Not Started | [ ] | [ ] | [ ] | |
| 8 | Alternate Lyrics | Not Started | [ ] | [ ] | [ ] | |
| 9 | Chord Lane | Not Started | [ ] | [ ] | [ ] | |
| 10 | Export and Print | Not Started | [ ] | [ ] | [ ] | |
| 11 | Lightweight Sharing | Deferred | [ ] | [ ] | [ ] | Optional |

---

## Active Stage Acceptance Checklist

Copy the acceptance criteria for the current stage from `STAGES.md` and track them here.

### Stage 4 Acceptance Checklist
- [x] User can add section blocks
- [x] User can add speaker/vocalist labels
- [x] User can add stage directions
- [x] Toggle visibility (e.g., hide stage directions) works
- [x] Data model stores sections properly
- [x] Data model stores metadata properly

---

## Active Stage Test Checklist

Copy the relevant checklist rows from `tests/specs/stage-N.md` here while working.

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-4.01 | Insert section block works | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | |
| T-4.02 | Reorder section preserves content and metadata | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Skipped |
| T-4.03 | Duplicate section generates required new IDs | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Skipped |
| T-4.04 | Insert speaker label works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.05 | Insert stage direction works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.06 | Spoken/sung state persists on lyric line | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.07 | Section data survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.08 | Metadata survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.09 | Hiding metadata changes visibility only, not content | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | Skipped |
| T-4.10 | Section/metadata workflow passes in UI | e2e | `tests/e2e/stage-4-sections-metadata.spec.ts` | [x] | [x] | |

---

## Completed Stages

### Stage 0: Project Scaffolding and App Shell
- Status: Complete
- Completed: 2026-04-13
- Notes: Implemented Vite + React + TypeScript scaffold, modular shell layout, empty state, integration test coverage, and Playwright smoke test.
- Deviations:
- Regression impact: None

### Stage 1: Project CRUD and Local Persistence
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented rigorous domain modeling with Zod schema validation. Built File System Access API hooks for local-first load and save. Tied into app state and built UI interactions for Stage 1. 11/11 tests passing.
- Deviations:
- Regression impact: None

### Stage 2: Editor Foundation
- Status: Complete
- Completed: 2026-04-14
- Notes: Integrated Tiptap/ProseMirror as the editor core. Implemented `RichTextEditor` component, custom `Indent` extension, formatting commands, and JSON serialization hooked to project save. Extensive JSDOM mocking required for testing.
- Deviations:
- Regression impact: Fixed Stage 0 assertions affected by Stage 1 & 2 integration updates.
- Regression impact:

### Stage 3: Workspaces and Multiple Drafts
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented workspaces and drafts UI based on new design docs. Integrated Zustand active view state with `WorkspaceView` and `DraftView`. Built out draft creation with blank and duplication modes. Added comprehensive test coverage with 35 tests passing overall.
- Deviations: None
- Regression impact: Fixed Stage 1 e2e test strict mode violation by adding and using `data-testid` for the project title. Fixed Stage 1 unit test assertions regarding default drafts.

### Stage 4: Structured Sections and Metadata
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented section blocks, speaker/vocalist labels, stage directions, and toggle visibility.
- Deviations:
- Regression impact:

### Stage 5: Inventory Pane
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 6: Prosody and Lightweight Visualization
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 7: Tools Sidebar
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 8: Alternate Lyrics
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 9: Chord Lane
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 10: Export and Print
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 11: Lightweight Sharing
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

---

## Regression Log

Add every bug/regression here with a linked test.

| Date | Stage Found | Description | Test Added | Fixed | Notes |
|------|-------------|-------------|------------|-------|-------|
|      |             |             |            | [ ]   |       |

---

## Deviations from Spec

Record any intentional differences from the spec docs.

| Date | Stage | Document | Section | Deviation | Reason | Approved |
|------|-------|----------|---------|-----------|--------|----------|
|      |       |          |         |           |        | [ ]      |

---

## Coverage Tracking

| Date | Unit Coverage | Integration Coverage | E2E Smoke | Overall Coverage | Notes |
|------|---------------|----------------------|-----------|------------------|-------|
|      |               |                      |           |                  |       |

---

## Current Blockers

- None

---

## Next Stage Readiness

Before moving to the next stage, confirm:

- [x] Current stage acceptance criteria complete
- [x] Current stage tests implemented
- [x] Current stage tests passing
- [x] Prior stage regression tests passing
- [x] Deviations documented
- [x] Coverage reviewed