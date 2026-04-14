# Stage 10 Test Spec

**Tags:** `[TOOLS] [CACHE] [LOCAL-FIRST] [STAGE-10]`

## Scope
Local-first cache for user-triggered lexical tool lookups, including normalized result persistence, cache hits, provider-failure fallback, and cache survival across reload/restart.

## Required Test Files
- `tests/unit/tools/tool-cache.lookup-and-normalization.test.ts`
- `tests/integration/tools/tool-cache.persistence-and-fallback.test.ts`
- `tests/integration/tools/tool-cache.ui-consumption.test.ts`
- `tests/e2e/tool-cache.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-10.01 | Cache hit avoids duplicate provider request for repeated lookup | unit | `tests/unit/tools/tool-cache.lookup-and-normalization.test.ts` | [ ] | [ ] | |
| T-10.02 | Provider response is normalized before persistence | unit | `tests/unit/tools/tool-cache.lookup-and-normalization.test.ts` | [ ] | [ ] | |
| T-10.03 | Repeated lookup updates cache usage metadata correctly | unit | `tests/unit/tools/tool-cache.lookup-and-normalization.test.ts` | [ ] | [ ] | Verify `lastUsedAt` behavior |
| T-10.04 | Cached lookup results persist across save/load or app reload | integration | `tests/integration/tools/tool-cache.persistence-and-fallback.test.ts` | [ ] | [ ] | |
| T-10.05 | Cached results are returned when provider fails | integration | `tests/integration/tools/tool-cache.persistence-and-fallback.test.ts` | [ ] | [ ] | |
| T-10.06 | Cache-aware lookup flow preserves provider abstraction and internal result shape | integration | `tests/integration/tools/tool-cache.persistence-and-fallback.test.ts` | [ ] | [ ] | Assert UI/service consumes normalized data, not raw provider payload shape |
| T-10.07 | Tool UI renders cached results correctly | integration | `tests/integration/tools/tool-cache.ui-consumption.test.ts` | [ ] | [ ] | |
| T-10.08 | Cached/offline result path works in UI workflow | e2e | `tests/e2e/tool-cache.spec.ts` | [ ] | [ ] | e2e may need provider mocking/stubbing |

## Regression Requirements
- Stage 8 tool workflows must remain passing
- Stage 9 chord workflows must remain passing
- Existing tool sidebar behavior must remain usable when cache is empty

## Test Notes
- Prefer provider mocking/stubbing over live network calls
- Do not rely on external provider availability in automated tests
- Assert normalized Cyril-owned result shapes rather than raw provider payloads