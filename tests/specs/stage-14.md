# Stage 14 Test Spec — Quality-of-Life Pass

**Tags:** `[QOL] [UI] [STAGE-14]`

## Scope
Quality-of-life improvements to the UI: remove duplicate draft header, toggle switches
for view controls, consolidated chords control, organised project action toolbar, and
click-to-edit identity in the top bar.

## Required Test Files
- `tests/integration/ui/qol-draft-header.test.tsx`
- `tests/integration/ui/qol-view-toggles.test.tsx`
- `tests/integration/ui/qol-chords-reconcile.test.tsx`
- `tests/integration/ui/qol-project-actions.test.tsx`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-14.01 | Draft name appears only in the top bar, not as a separate header below it | integration | `tests/integration/ui/qol-draft-header.test.tsx` | [ ] | [ ] | |
| T-14.02 | View toggles are on/off switches with keyboard focus; state persists per draft | integration | `tests/integration/ui/qol-view-toggles.test.tsx` | [ ] | [ ] | |
| T-14.03 | Exactly one Chords control: enabling it enters chord mode, disabling it exits without data loss | integration | `tests/integration/ui/qol-chords-reconcile.test.tsx` | [ ] | [ ] | |
| T-14.04 | Project actions are in the top bar on one row; primary actions one click, secondary in overflow menu | integration | `tests/integration/ui/qol-project-actions.test.tsx` | [ ] | [ ] | |
