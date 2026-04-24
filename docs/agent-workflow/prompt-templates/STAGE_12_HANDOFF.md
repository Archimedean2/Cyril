# Stage 12: Lightweight Sharing — Pre-Implementation Handoff

## Context

Stage 11 (Export and Print) is complete. All 174 tests pass. Stage 12 is optional and may be deferred.

## Step 1: Read These Files In Order

1. `STAGES.md` — Section `## Stage 12: Lightweight Sharing` (line ~819). Master stage definition.
2. `FEATURES.md` — Section `## Feature 12: Lightweight Sharing` (line ~812). Feature spec. Note excluded behaviors.
3. `SCOPE.md` — Search for "share", "collaboration", "offline" to find scope limits.
4. `ARCHITECTURE.md` — Search for "local-first", "export", "share" to understand where sharing fits.
5. `DATA_MODEL.md` — Search for "share", "export" to see schema requirements.
6. `PROGRESS.md` — Verify Stage 11 is Complete before proceeding.
7. `tests/specs/stage-12.md` — Test checklist (currently has only T-12.01 stub).

## Step 2: Study Stage 11 Infrastructure to Reuse

Before designing Stage 12, read the existing export code that provides the sharing foundation:

- `src/domain/export/exportSelectors.ts`
- `src/domain/export/markdownTransformer.ts`
- `src/domain/export/printRenderer.ts`
- `src/features/export-panel/ExportDialog.tsx`
- `src/components/layout/TopBar.tsx`

## Step 3: Pick One Path (Mandatory)

Path A — Skip: Mark Stage 12 `Deferred` in PROGRESS.md, update the test spec with a note, and stop.

Path B — File-based Share: Add a "Share" option in ExportDialog that bundles export data into a single file another Cyril instance can import. No network layer.

Path C — Clipboard/URL Share: Compress exported data into a base64 or JSON blob, provide "Copy Share Link" in ExportDialog. No network layer.

Path D — Backend Share: Only if ARCHITECTURE.md explicitly describes a backend or sync service. Cite the decision. Do not invent one.

## Step 4: Rules

- Local-first core must remain intact. App must work fully offline.
- Do not add external dependencies unless absolutely necessary.
- No real-time collaboration, no identity/permission system.
- Create tests: `tests/unit/sharing/`, `tests/integration/sharing/`, `tests/e2e/stage-12-sharing.spec.ts`.
- Update `PROGRESS.md` and `tests/specs/stage-12.md`.
- Do not start if Stage 11 has failures. Run `npx vitest run` and `npx playwright test` first.

## Step 5: Acceptance Criteria

- All Stages 0–11 tests still pass.
- PROGRESS.md and stage-12.md updated.
- If implementing: unit, integration, and e2e tests exist and pass.
- If skipping: both docs clearly state "Deferred" with reason.
