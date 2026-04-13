# Cyril — Build Progress

## Current Stage
- Stage: 1
- Status: Complete
- Started: 2026-04-14
- Completed: 2026-04-14

---

## Stage Summary

| Stage | Name | Status | Acceptance Complete | Tests Implemented | Tests Passing | Notes |
|------|------|--------|---------------------|-------------------|---------------|-------|
| 0 | Project Scaffolding and App Shell | Complete | [x] | [x] | [x] | Stage 0 shell implemented with passing integration and e2e smoke tests |
| 1 | Project CRUD and Local Persistence | Complete | [x] | [x] | [x] | Stage 1 local-first project management using File System Access API |
| 2 | Editor Foundation | Not Started | [ ] | [ ] | [ ] | |
| 3 | Workspaces and Multiple Drafts | Not Started | [ ] | [ ] | [ ] | |
| 4 | Structured Sections and Metadata | Not Started | [ ] | [ ] | [ ] | |
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

### Stage 1 Acceptance Checklist
- [x] Create project from default template
- [x] Open/load `.cyril` file
- [x] Save `.cyril` file
- [x] Rename project title
- [x] Duplicate project with new IDs
- [x] Close project to return to empty state
- [x] File loaded follows schema and normalizes defaults

---

## Active Stage Test Checklist

Copy the relevant checklist rows from `tests/specs/stage-N.md` here while working.

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-1.01 | New project template matches required schema | unit | `tests/unit/domain/project-defaults.test.ts` | [x] | [x] | |
| T-1.02 | Validation accepts valid minimal project | unit | `tests/unit/domain/project-validation.test.ts` | [x] | [x] | |
| T-1.03 | Validation rejects missing required fields | unit | `tests/unit/domain/project-validation.test.ts` | [x] | [x] | |
| T-1.04 | Missing optional fields are normalized to defaults | unit | `tests/unit/domain/project-migration.test.ts` | [x] | [x] | |
| T-1.05 | Unknown extra fields are preserved where expected | unit | `tests/unit/persistence/project-serialization.test.ts` | [x] | [x] | |
| T-1.06 | Save/load round trip preserves project content | integration | `tests/integration/project/project-crud-integration.test.ts` | [x] | [x] | |
| T-1.07 | Create project flow succeeds | integration | `tests/integration/project/project-crud-integration.test.ts` | [x] | [x] | |
| T-1.08 | Rename project title persists | integration | `tests/integration/project/project-crud-integration.test.ts` | [x] | [x] | |
| T-1.09 | Duplicate project generates new IDs | integration | `tests/integration/project/project-crud-integration.test.ts` | [x] | [x] | |
| T-1.10 | Invalid project file fails gracefully | integration | `tests/integration/project/project-crud-integration.test.ts` | [x] | [x] | |
| T-1.11 | Project CRUD smoke flow passes in UI | e2e | `tests/e2e/stage-1-project-crud.spec.ts` | [x] | [x] | |

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
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 3: Workspaces and Multiple Drafts
- Status:
- Completed:
- Notes:
- Deviations:
- Regression impact:

### Stage 4: Structured Sections and Metadata
- Status:
- Completed:
- Notes:
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