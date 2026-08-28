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
- `tests/integration/ui/qol-topbar-inline-edit.test.tsx`
- `tests/integration/ui/qol-single-title.test.tsx`
- `tests/integration/ui/qol-editor-page.test.tsx`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-14.01 | Draft name appears only in the top bar, not as a separate header below it | integration | `tests/integration/ui/qol-draft-header.test.tsx` | [ ] | [ ] | |
| T-14.02 | View toggles are on/off switches with keyboard focus; state persists per draft | integration | `tests/integration/ui/qol-view-toggles.test.tsx` | [ ] | [ ] | |
| T-14.03 | Exactly one Chords control: enabling it enters chord mode, disabling it exits without data loss | integration | `tests/integration/ui/qol-chords-reconcile.test.tsx` | [ ] | [ ] | |
| T-14.04 | Project actions are in the top bar on one row; primary actions one click, secondary in overflow menu | integration | `tests/integration/ui/qol-project-actions.test.tsx` | [ ] | [ ] | |
| T-14.05 | Song title and draft name in the top bar are click-to-edit; Enter/blur commits, Escape cancels | integration | `tests/integration/ui/qol-topbar-inline-edit.test.tsx` | [ ] | [ ] | |
| T-14.06 | The song title renders exactly once in the chrome (top bar); the left nav leads with Project/Drafts/View instead of a repeated title, with no leftover gap | integration | `tests/integration/ui/qol-single-title.test.tsx` | [ ] | [ ] | C-16 |
| T-14.07 | The editor page reads as a page: measure-constrained lyric column centred within it, a defined border/elevation edge distinct from the shell, a deliberate gap below the toolbar, and the grain overlay preserved | integration | `tests/integration/ui/qol-editor-page.test.tsx` | [ ] | [ ] | C-12 |
