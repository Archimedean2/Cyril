# Stage 0 Test Spec

**Tags:** `[SCAFFOLD] [NAV] [STAGE-0]`

## Scope
App shell and layout only.

## Required Test Files
- `tests/integration/app-shell-integration.test.ts`
- `tests/e2e/stage-0-shell.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-0.01 | App boots without runtime error | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.02 | Left nav renders | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.03 | Center pane renders | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.04 | Right sidebar renders | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.05 | Right sidebar has top and bottom sections | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.06 | Empty state renders when no project is loaded | integration | `tests/integration/app-shell-integration.test.ts` | [ ] | [ ] | |
| T-0.07 | App shell smoke test passes in browser | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | Updated for launch screen |
| T-0.08 | With no project open, launch screen renders full-screen with no top bar | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | |
| T-0.09 | Stacked logo sits top-left on launch screen | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | |
| T-0.10 | Three actions are text-link buttons wired to create/open/share | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | |
| T-0.11 | Pull-quote panel renders on the right third | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | |
| T-0.12 | No filled button exists on the launch screen | e2e | `tests/e2e/stage-0-shell.spec.ts` | [x] | [x] | |

## Regression Requirements
None yet.