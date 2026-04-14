# Senior Dev Loop

## Purpose

This document defines the operating loop between:
- the coding agent acting as junior dev with repo visibility
- the external senior dev providing implementation and testing direction

The goal is to improve implementation quality without giving the coding agent permission to speculate broadly.

## Standard Loop

1. Read current stage and relevant specs
2. Inspect repo state
3. Produce Junior-to-Senior Handoff
4. Pause for senior plan
5. Implement approved scope
6. Produce Post-Implementation Report
7. Pause for senior test plan
8. Implement tests
9. Run tests
10. Update `PROGRESS.md`
11. Commit if the milestone is complete

## Junior-to-Senior Handoff Template

### 1. Current stage
### 2. Task goal
### 3. Relevant specs/docs reviewed
### 4. Relevant files/modules/components
### 5. Current implementation state observed in repo
### 6. Gaps/problems found
### 7. Constraints/risks
### 8. Recommended implementation direction
### 9. Specific questions for senior dev

*Use the relay-ready prompt in `prompt-templates/TEMPLATE_A_PRE_IMPLEMENTATION_HANDOFF.md` when sending this to the senior dev.*

## Post-Implementation Report Template

### 1. Task completed
### 2. Files changed
### 3. Key implementation decisions made
### 4. Deviations from requested plan
### 5. Open concerns / likely regression risk
### 6. Current test state
### 7. Areas needing targeted regression coverage

*Use the relay-ready prompt in `prompt-templates/POST_IMPLEMENTATION_TEST_PLAN.md` when sending this to the senior dev.*

## Break-Glass Template

### 1. What was attempted
### 2. Exact failure/blocker
### 3. Files involved
### 4. Evidence
### 5. Hypotheses
### 6. Smallest decision needed from senior dev

*Use the relay-ready prompt in `prompt-templates/TEMPLATE_B_BREAK_GLASS_ESCALATION.md` when sending this to the senior dev.*

## Behavior Rules

- Keep handoffs factual and repo-grounded
- Do not ask the senior dev to infer repo state that can be observed directly
- Prefer quoting exact file names, components, and failing tests
- Keep recommendations narrow and stage-bounded
- Never skip the post-implementation report before requesting a test plan on significant tasks