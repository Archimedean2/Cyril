# Cyril — Testing Guide

## Purpose

This document defines the testing strategy for Cyril.

It is the source of truth for:
- test organization
- test levels
- test naming
- stage test workflow
- regression rules
- coverage expectations

Do not place all test cases in one giant file.
Use the stage-specific spec files in `tests/specs/`.

---

## Testing Principles

1. Every stage must add tests
2. A stage is not complete until required tests are:
   - implemented
   - passing
3. Bugs should add regression tests
4. Critical transforms and persistence logic require unit coverage
5. User workflows require integration or e2e coverage
6. Test files should remain small and focused for AI readability
7. Test IDs should be stable and documented in `TEST_IDS.md`

---

## Test Layers

### Unit Tests
Use for:
- schema validation
- defaults
- migrations
- ID generation
- serialization
- transform functions
- export transforms
- prosody helpers
- tool provider adapters

### Integration Tests
Use for:
- load/save flows
- project state transitions
- draft duplication
- section insertion/reorder
- metadata visibility
- alternates behavior
- chord persistence
- export settings interactions

### E2E Tests
Use for:
- major stage workflows
- create/open/save project
- edit content in UI
- switch drafts
- use inventory
- use tools pane
- export output

---

## Coverage Expectations

### Minimum targets
- Domain and persistence code: 90%+
- Transform/export/prosody code: 90%+
- UI/components: 70%+
- Overall project coverage: 80%+

### Rules
- Do not write meaningless tests just to inflate coverage
- Prefer behavior-focused tests
- Uncovered critical code is not acceptable

---

## Regression Rules

1. Every bug fixed should add at least one regression test
2. Regression tests must be tagged in test names or comments
3. Stage completion requires all previous completed-stage tests to remain passing

---

## Stage Test Files

Each stage has a checklist file in `tests/specs/`.

Example:
- `tests/specs/stage-0.md`
- `tests/specs/stage-1.md`

These files are not executable tests.
They are implementation checklists and test inventories for agents.

---

## Checklist Status Format

Each checklist item must include two statuses:

- `Implemented`
- `Passing`

Use this format:

| ID | Test | Type | Implemented | Passing | Notes |
|----|------|------|-------------|---------|-------|
| T-1.01 | Create project from template | integration | [ ] | [ ] | |

Rules:
- `Implemented` = test code exists
- `Passing` = test currently passes
- Both boxes must be checked before stage completion

---

## Required Test Naming

### Unit
`<module>.test.ts`

Examples:
- `project-validation.test.ts`
- `draft-duplication.test.ts`
- `prosody-syllables.test.ts`

### Integration
`<feature>-integration.test.ts`

Examples:
- `project-crud-integration.test.ts`
- `draft-switching-integration.test.ts`

### E2E
`stage-<n>-<feature>.spec.ts`

Examples:
- `stage-1-project-crud.spec.ts`
- `stage-4-sections-metadata.spec.ts`

---

## Required Mapping

Each stage spec file in `tests/specs/` must map checklist items to:
- expected test file(s)
- relevant feature tag(s)

This keeps stage-level testing modular and grepable.

---

## E2E Testing Guidelines (Playwright)

- **Use robust selectors**: Prefer `getByRole`, `getByLabel`, or explicit `data-testid` attributes over brittle `getByText` calls when possible. If you must use `getByText`, consider `{ exact: true }` to avoid partial matches.
- **Avoid ambiguous locators**: Be aware that `getByText('Draft 1')` might match both a navigation link and a header. Use `getByRole('button', { name: 'Draft 1' })` or `getByRole('heading', { name: 'Draft 1' })` to be specific and avoid "strict mode violations".
- **Action Timeouts**: Actions like clicks and fills are set to timeout at 10s locally. Expects timeout at 5s. This ensures tests fail fast rather than hanging when elements are truly missing.
- **Retries**: Local tests do not retry. CI tests retry twice.
- **Trace Viewer**: Traces are only recorded on the first retry in CI to save time and disk space.

---

## Stage Completion Rule

A stage is complete only when:
1. all stage acceptance criteria are met
2. all stage checklist tests are implemented
3. all stage checklist tests are passing
4. all prior-stage regression tests still pass

---

## Minimum CI Expectation

When CI is introduced, it should run:
- unit tests
- integration tests
- e2e smoke tests
- coverage report

If CI is not yet configured, the same suite should still be runnable locally.

---

## Bug Tracking Rule

When a bug is found:
1. add or identify a failing test
2. fix the bug
3. confirm the test now passes
4. record the regression in `PROGRESS.md` if relevant
5. record the test ID in `TEST_IDS.md` if relevant