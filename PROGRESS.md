# Cyril — Build Progress

## Current Stage
- Stage: 5
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
| 5 | Inventory Pane | Complete | [x] | [x] | [x] | Stage 5 draft-specific scratchpad in right sidebar |
| 6 | Prosody and Lightweight Visualization | Not Started | [ ] | [ ] | [ ] | |
| 7 | Tools Sidebar | Not Started | [ ] | [ ] | [ ] | |
| 8 | Alternate Lyrics | Not Started | [ ] | [ ] | [ ] | |
| 9 | Chord Lane | Not Started | [ ] | [ ] | [ ] | |
| 10 | Export and Print | Not Started | [ ] | [ ] | [ ] | |
| 11 | Lightweight Sharing | Deferred | [ ] | [ ] | [ ] | Optional |

---

## Active Stage Acceptance Checklist

Copy the acceptance criteria for the current stage from `STAGES.md` and track them here.

### Stage 5 Acceptance Checklist
- [x] User can view inventory pane in right sidebar
- [x] Inventory content persists per draft
- [x] Editing inventory does not alter draft document
- [x] Inventory follows duplication modes correctly

---

## Active Stage Test Checklist

Copy the relevant checklist rows from `tests/specs/stage-N.md` here while working.

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-5.01 | Inventory persists as draft-specific data | unit | `tests/unit/domain/inventory-persistence.test.ts` | [x] | [x] | |
| T-5.02 | Inventory duplication follows selected draft creation mode | unit | `tests/unit/domain/inventory-persistence.test.ts` | [x] | [x] | |
| T-5.03 | Inventory pane renders in bottom-right panel | integration | `tests/integration/inventory/inventory-pane-integration.test.tsx` | [x] | [x] | |
| T-5.04 | Switching drafts switches inventory content correctly | integration | `tests/integration/inventory/inventory-pane-integration.test.tsx` | [x] | [x] | |
| T-5.05 | Editing inventory does not alter draft document | integration | `tests/integration/inventory/inventory-pane-integration.test.tsx` | [x] | [x] | |
| T-5.06 | Inventory workflow passes in UI | e2e | `tests/e2e/stage-5-inventory.spec.ts` | [x] | [x] | |

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
- Status: Complete
- Completed: 2026-04-14
- Notes: Implemented draft-specific inventory pane using a simple textarea that persists per draft. Added `updateDraftInventory` action to the project store. Inventory follows duplication modes (text only, inventory only, both, blank).
- Deviations: None
- Regression impact: Fixed Stage 0 app shell tests to reflect new InventoryPane component in right sidebar.

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