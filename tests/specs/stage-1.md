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

## Regression Requirements
- Stage 0 tests must remain passing