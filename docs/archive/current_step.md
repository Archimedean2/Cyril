# Current Step

## Step 3: Write migration tests

**Do:** Create `tests/unit/domain/migration.test.ts`. Test that `migrateProject` correctly handles: legacy `speakerLine` nodes, legacy `stageDirection` nodes, missing `draftSettings` fields, missing `exportSettings.concurrentLayout`, projects with no `schemaVersion`. Also test that migration preserves unknown fields.

**Measurable outcome:**
- At least 6 migration tests pass
- Each test uses a hand-crafted legacy fixture (not generated from `createDefaultProject`)
- `npm run test` passes with no regressions


