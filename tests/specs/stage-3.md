# Stage 3 Test Spec

**Tags:** `[WORKSPACES] [DRAFTS] [NAV] [STAGE-3]`

## Scope
Workspaces and multiple named drafts.

## Required Test Files
- `tests/unit/domain/draft-duplication.test.ts`
- `tests/integration/drafts/workspaces-and-drafts-integration.test.ts`
- `tests/e2e/stage-3-workspaces-drafts.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-3.01 | Draft duplication creates new draft IDs | unit | `tests/unit/domain/draft-duplication.test.ts` | [ ] | [ ] | |
| T-3.02 | Draft duplication regenerates nested entity IDs where required | unit | `tests/unit/domain/draft-duplication.test.ts` | [ ] | [ ] | |
| T-3.03 | Switching workspaces preserves independent content | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.04 | Switching drafts updates editor content correctly | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.05 | Create blank draft works | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.06 | Duplicate text only works | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.07 | Duplicate inventory only works | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.08 | Duplicate both text and inventory works | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.09 | Deleting one draft does not corrupt remaining drafts | integration | `tests/integration/drafts/workspaces-and-drafts-integration.test.ts` | [ ] | [ ] | |
| T-3.10 | Workspace/draft flow passes in UI | e2e | `tests/e2e/stage-3-workspaces-drafts.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–2 must remain passing