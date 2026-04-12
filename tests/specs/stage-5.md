# Stage 5 Test Spec

**Tags:** `[INVENTORY] [NAV] [STAGE-5]`

## Scope
Draft-specific inventory pane.

## Required Test Files
- `tests/unit/domain/inventory-persistence.test.ts`
- `tests/integration/inventory/inventory-pane-integration.test.ts`
- `tests/e2e/stage-5-inventory.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-5.01 | Inventory persists as draft-specific data | unit | `tests/unit/domain/inventory-persistence.test.ts` | [ ] | [ ] | |
| T-5.02 | Inventory duplication follows selected draft creation mode | unit | `tests/unit/domain/inventory-persistence.test.ts` | [ ] | [ ] | |
| T-5.03 | Inventory pane renders in bottom-right panel | integration | `tests/integration/inventory/inventory-pane-integration.test.ts` | [ ] | [ ] | |
| T-5.04 | Switching drafts switches inventory content correctly | integration | `tests/integration/inventory/inventory-pane-integration.test.ts` | [ ] | [ ] | |
| T-5.05 | Editing inventory does not alter draft document | integration | `tests/integration/inventory/inventory-pane-integration.test.ts` | [ ] | [ ] | |
| T-5.06 | Inventory workflow passes in UI | e2e | `tests/e2e/stage-5-inventory.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–4 must remain passing