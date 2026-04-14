# Cyril — Agent Tasking Rules

## Purpose

This document defines how coding agents should behave while implementing Cyril.

It exists to prevent:
- scope creep
- speculative architecture
- giant uncontrolled refactors
- stage skipping
- schema drift
- accidental destruction of working code

---

## Core Rules

1. Work on one stage at a time.
2. Do not implement future-stage features early.
3. Do not change the data model unless explicitly required and documented.
4. Do not perform unrelated refactors while implementing a stage.
5. Keep changes small, modular, and reversible.
6. If a requirement is ambiguous, stop and ask instead of guessing.
7. If a technical constraint blocks the spec, implement the closest safe version and log the deviation in `PROGRESS.md`.
8. Every stage must include tests.
9. A stage is not complete until:
   - acceptance criteria are met
   - tests are implemented
   - tests are passing
10. Preserve working behavior from earlier stages.
11. UI work must follow the design and interaction docs (`WIREFRAMES.md`, `DESIGN_SYSTEM.md`, `UI_TOKENS.md`, `COMPONENT_MAP.md`).
12. Avoid generic dashboard/SaaS styling.
13. Preserve the desktop-editor feel:
    - compact top bar
    - left nav
    - center editor
    - right split sidebar
    - internal pane scrolling
    - restrained visual density
14. Interaction behavior should follow the `docs/interactions/*.md` files when relevant.

---

## Change Size Rules

For a normal task:
- prefer changes touching a small number of files
- avoid rewriting large modules unless necessary
- avoid changing both architecture and feature behavior in one pass

If a task requires broad changes:
- explain why
- identify impacted files before editing
- proceed only within the current stage scope

---

## When to Stop and Ask

Stop and ask for clarification if:
- the schema appears insufficient for the requested feature
- the stage requires a dependency not described in the specs
- the best implementation would violate `SCOPE.md`
- a provider/API/embedding assumption fails
- a feature appears to require a future-stage system
- an editor framework limitation changes the intended UX materially

Do not silently invent a new product direction.

---

## Allowed Deviations

A deviation is allowed only if:
1. the spec cannot be implemented literally
2. the alternative preserves product intent
3. the deviation is recorded in `PROGRESS.md`

Every deviation entry should include:
- stage
- affected document
- original expectation
- implemented alternative
- reason

---

## Senior Dev Consultation Workflow

Cyril uses a two-tier implementation workflow:

- the coding agent acts as a junior dev with direct repo visibility
- an external senior dev provides implementation plans, testing strategy, and unblock guidance based on the agent's summaries

The coding agent must not jump directly from vague task intent to implementation when the task has meaningful ambiguity, broad UI impact, schema implications, or multiple viable implementation paths.

### Mandatory Junior-to-Senior Handoff Before Significant Work

Before starting any significant task, prepare a structured handoff for the senior dev.

A task counts as significant if it involves any of the following:
- multiple files
- UI layout changes
- editor behavior changes
- persistence/data-flow changes
- test architecture changes
- stage interpretation
- spec reconciliation
- any ambiguity about the intended implementation

The handoff must be written in a structured format and should be concise but complete.

Required sections:
1. Current stage
2. Task goal
3. Relevant specs/docs reviewed
4. Relevant files/modules/components
5. Current implementation state observed in repo
6. Gaps/problems found
7. Constraints/risks
8. Recommended implementation direction
9. Specific questions for senior dev

The coding agent should then stop and wait for the senior dev plan unless explicitly instructed to proceed without consultation.

### Implementation Follow-Through

After receiving the senior dev plan, the coding agent should:
1. restate the plan as a short execution checklist
2. implement only within the approved scope
3. record deviations in `PROGRESS.md` if necessary
4. avoid expanding scope while coding

### Post-Implementation Report

After implementation and before writing or revising tests, prepare a structured implementation summary for the senior dev.

Required sections:
1. Task completed
2. Files changed
3. Key implementation decisions made
4. Deviations from requested plan
5. Open concerns / likely regression risk
6. Current test state
7. Any areas needing targeted regression coverage

Then stop and wait for the senior dev testing plan unless explicitly instructed otherwise.

### Test Planning Handoff

After receiving the test plan, the coding agent should:
1. implement the specified tests
2. prefer stable `data-testid` selectors where available
3. avoid brittle exact-text selectors when a stable test id is appropriate
4. run relevant tests
5. summarize results

### Break-Glass Escalation

If the coding agent becomes blocked, confused, or uncertain, it must stop and prepare a break-glass handoff for the senior dev.

Use break-glass when:
- implementation no longer matches the expected repo reality
- multiple attempts fail
- tests are failing for unclear reasons
- editor/framework behavior is fighting the intended UX
- a spec contradiction is discovered
- the smallest safe implementation is unclear

Break-glass handoff format:
1. What was attempted
2. Exact failure/blocker
3. Files involved
4. Evidence (error output, failing test, UI behavior)
5. Hypotheses
6. Smallest decision needed from senior dev

Do not continue guessing after break-glass is triggered.

---

## Required Workflow for Every Task

1. Identify the current stage in `PROGRESS.md`
2. Read the matching section in `STAGES.md`
3. Read only the relevant features in `FEATURES.md`
4. Check schema dependencies in `DATA_MODEL.md`
5. Identify test files required by `tests/specs/stage-N.md`
6. Implement the smallest complete version of the task
7. Add/update tests
8. Run tests
9. Update `PROGRESS.md`

---

## Testing Rules

1. Add tests as part of implementation, not afterthought
2. Mark tests as:
   - implemented
   - passing
3. Add regression tests for bugs
4. Do not mark a stage complete with failing tests
5. Maintain coverage discipline from the start

---

## Editor-Specific Rules

1. Do not use raw HTML as canonical document storage
2. Do not encode semantic metadata using formatting-only hacks
3. Do not store chords as plain text spacing hacks
4. Do not delete hidden metadata when toggling visibility
5. Structural editor actions should be undoable cleanly
6. Preserve copy/paste fidelity as much as possible

---

## Persistence Rules

1. Treat `.cyril` as canonical project data
2. Validate and normalize loaded files
3. Preserve unknown fields where practical
4. Do not silently drop user data
5. Keep local-first behavior intact

---

## Tool Integration Rules

1. Use a provider abstraction
2. Do not couple UI directly to one external source
3. Handle provider failure gracefully
4. If embedding is blocked, use a fallback and record the deviation

---

## Definition of Done

A task is done only when:
- implementation is complete for current stage scope
- tests exist
- tests pass
- regressions are checked
- documentation/progress is updated where required

--- 

## Git Workflow Rules

1. Initialize a git repository if one does not already exist.
2. Make a commit at the completion of each major milestone, at minimum:
   - after Stage 0
   - after Stage 1
   - after every subsequent completed stage
3. Do not create giant catch-all commits spanning multiple stages unless explicitly requested.
4. Before starting a stage, ensure the working tree is clean or explain why it is not.
5. After completing a stage:
   - verify acceptance criteria
   - verify required tests are implemented
   - verify required tests are passing
   - update `PROGRESS.md`
   - then create a commit
6. Commit messages should be explicit and stage-based.

### Commit Message Format

Use one of these formats:

- `stage-0: scaffold app shell`
- `stage-1: implement project CRUD and local persistence`
- `stage-2: add rich text editor foundation`
- `stage-3: add workspaces and multiple drafts`

If a commit is not tied to a stage, use:
- `chore: ...`
- `test: ...`
- `docs: ...`
- `refactor: ...` only when refactor is within current stage scope

### Branching Rule

Unless instructed otherwise, work on the current branch and keep commits small and meaningful.
Do not create speculative branches automatically.

### GitHub / Remote Rule

GitHub username: `Archimedean2`

If instructed to create a remote repository:
- prefer a repository name like `cyril`
- do not publish secrets
- do not assume authentication is already configured
- stop and ask if GitHub CLI authentication is required