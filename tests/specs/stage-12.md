# Stage 12 Test Spec

**Tags:** `[SHARING] [STAGE-12]`

## Scope
Lightweight sharing implemented via clipboard-based share blobs. Copy Share Link in ExportDialog creates a base64-encoded share blob. Import from Share dialog accepts share blobs and creates new projects with imported drafts.

## Required Test Files
- `tests/unit/domain/share-encoder.test.ts` - Unit tests for share encoding/decoding
- `tests/integration/share/share-service.test.ts` - Integration tests for share service
- `tests/e2e/stage-12-sharing.spec.ts` - E2E tests for share workflow

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-12.01 | Encodes a draft to a share blob with correct prefix | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.02 | Decodes a valid share blob back to payload | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.03 | Returns null for invalid share blob without prefix | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.04 | Returns null for malformed base64 data | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.05 | isShareBlob correctly identifies valid share blobs | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.06 | buildProjectFromShare creates valid CyrilFile | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.07 | Imported draft preserves doc structure | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.08 | Imported draft gets new timestamps | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.09 | Handles drafts with chords and metadata | unit | `tests/unit/domain/share-encoder.test.ts` | [x] | [ ] | |
| T-12.10 | Returns error when no active draft | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.11 | Returns error when clipboard write fails | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.12 | Successfully copies share link to clipboard | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.13 | Returns error for invalid share format | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.14 | Returns error for malformed base64 | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.15 | Successfully imports valid share blob | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.16 | Imported project has new draft ID | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.17 | Returns error when clipboard read fails | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.18 | Successfully imports from clipboard | integration | `tests/integration/share/share-service.test.ts` | [x] | [ ] | |
| T-12.19 | Share button is visible in ExportDialog | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.20 | Copy Share button shows feedback on click | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.21 | Import Share dialog can be opened from left nav | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.22 | Import Share dialog has input field and submit button | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.23 | Import Share dialog validates input format | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.24 | Import Share dialog closes on close button click | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |
| T-12.25 | Export settings are not affected by share | e2e | `tests/e2e/stage-12-sharing.spec.ts` | [x] | [ ] | |

## Regression Requirements
- Stages 0–11 must remain passing