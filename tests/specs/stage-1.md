# Stage 1 Test Spec

**Tags:** `[PROJECT] [PERSISTENCE] [STAGE-1]`

## Scope
Project CRUD and local persistence.

## Required Test Files
- `tests/unit/domain/project-defaults.test.ts`
- `tests/unit/domain/project-validation.test.ts`
- `tests/unit/domain/project-migration.test.ts`
- `tests/unit/persistence/project-serialization.test.ts`
- `tests/integration/project/project-crud-integration.test.ts`
- `tests/e2e/stage-1-project-crud.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-1.01 | New project template matches required schema | unit | `tests/unit/domain/project-defaults.test.ts` | [ ] | [ ] | |
| T-1.02 | Validation accepts valid minimal project | unit | `tests/unit/domain/project-validation.test.ts` | [ ] | [ ] | |
| T-1.03 | Validation rejects missing required fields | unit | `tests/unit/domain/project-validation.test.ts` | [ ] | [ ] | |
| T-1.04 | Missing optional fields are normalized to defaults | unit | `tests/unit/domain/project-migration.test.ts` | [ ] | [ ] | |
| T-1.05 | Unknown extra fields are preserved where expected | unit | `tests/unit/persistence/project-serialization.test.ts` | [ ] | [ ] | |
| T-1.06 | Save/load round trip preserves project content | integration | `tests/integration/project/project-crud-integration.test.ts` | [ ] | [ ] | |
| T-1.07 | Create project flow succeeds | integration | `tests/integration/project/project-crud-integration.test.ts` | [ ] | [ ] | |
| T-1.08 | Rename project title persists | integration | `tests/integration/project/project-crud-integration.test.ts` | [ ] | [ ] | |
| T-1.09 | Duplicate project generates new IDs | integration | `tests/integration/project/project-crud-integration.test.ts` | [ ] | [ ] | |
| T-1.10 | Invalid project file fails gracefully | integration | `tests/integration/project/project-crud-integration.test.ts` | [ ] | [ ] | |
| T-1.11 | Project CRUD smoke flow passes in UI | e2e | `tests/e2e/stage-1-project-crud.spec.ts` | [ ] | [ ] | |
| T-1.20 | Save on a 'prompt' permission handle requests permission, then writes | unit | `tests/unit/persistence/fileManager.test.ts` | [x] | [x] | HARDENING §H1 (C-01) |
| T-1.21 | A 'denied' handle never reports 'saved'; status ends 'error' | unit | `tests/unit/persistence/fileManager.test.ts` | [x] | [x] | HARDENING §H1 (C-01); also `tests/integration/persistence/write-permission.test.ts` |
| T-1.24 | Dirty state registers the beforeunload guard and sets returnValue; clean state removes it | unit | `tests/unit/persistence/beforeUnloadGuard.test.ts` | [x] | [x] | HARDENING §H3 (C-03) |
| T-1.22 | Editing with no file handle writes a recovery snapshot | unit, integration | `tests/unit/persistence/recovery-store.test.ts`, `tests/integration/persistence/recovery-snapshot.test.ts` | [x] | [x] | HARDENING §H2 (C-04) |
| T-1.23 | On init with a newer snapshot, recovery is offered; accepting restores it exactly; declining discards it | integration | `tests/integration/persistence/recovery-offer.test.ts` | [x] | [x] | HARDENING §H2 (C-04) |
| T-1.26 | Opening corrupt JSON surfaces a validation error and does not throw to a crash | unit, integration | `tests/unit/persistence/load-validation.test.ts`, `tests/integration/persistence/load-validation.test.ts` | [x] | [x] | HARDENING §H5 (C-02) |
| T-1.27 | A newer schemaVersion is handled (warned, not blindly loaded) | unit, integration | `tests/unit/persistence/load-validation.test.ts`, `tests/integration/persistence/load-validation.test.ts` | [x] | [x] | HARDENING §H5 (C-02) |
| T-1.30 | A tab closed mid-write ('saving') is warned like any other dirty state | unit | `tests/unit/persistence/beforeUnloadGuard.test.ts` | [x] | [x] | C-30 |
| T-1.29 | No file handle + edits pending → status never reads 'saved'/clean 'idle'; reports honest 'local-only' | integration | `tests/integration/persistence/save-status-honesty.test.tsx` | [x] | [x] | HARDENING §H7 (C-06) |
| T-1.28 | A changed lastModified triggers the overwrite warning; autosave never clobbers, it fails | unit, integration | `tests/unit/persistence/fileManager.test.ts`, `tests/integration/persistence/external-change-guard.test.ts`, `tests/integration/persistence/save-cancel-vs-error.test.ts` | [x] | [x] | HARDENING §H6 (C-07) |

## Regression Requirements
- Stage 0 tests must remain passing