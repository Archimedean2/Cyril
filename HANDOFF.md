# Stage 10 Implementation Handoff

**Date:** 2026-04-14
**Current Stage:** 10 (Local Tool Result Cache)
**Previous Stage:** 9 (Chord Lane - Complete)

---

## Task Completed

Renumbered stages and features to insert Stage 10 (Local Tool Result Cache) between Stage 9 (Chord Lane) and Stage 11 (Export and Print).

## Changes Made

### Documentation Files
- **STAGES.md**
  - Renamed Stage 9.5 → Stage 10
  - Renamed Stage 10 → Stage 11
  - Renamed Stage 11 → Stage 12
  - Updated feature references in Read First and Feature Sections to Read

- **FEATURES.md**
  - Renamed Feature 18 → Feature 10 (Local Tool Result Cache)
  - Renamed Feature 16 → Feature 11 (Export and Print)
  - Renamed Feature 17 → Feature 12 (Lightweight Sharing)
  - Updated stage dependencies

- **PROGRESS.md**
  - Updated Current Stage from 9.5 to 10
  - Updated Stage Summary table (9.5 → 10, 10 → 11, 11 → 12)
  - Updated Active Stage Acceptance Checklist from Stage 9.5 to Stage 10
  - Updated Active Stage Test Checklist from T-9.5.* to T-10.*
  - Updated Completed Stages section (Stage 9.5 → Stage 10, Stage 10 → Stage 11, Stage 11 → Stage 12)

### Test Spec Files
- **tests/specs/stage-10.md** (renamed from stage-9.5.md)
  - Updated header from Stage 9.5 to Stage 10
  - Updated tags from `[STAGE-9.5]` to `[STAGE-10]`
  - Updated test IDs from T-9.5.* to T-10.*

- **tests/specs/stage-11.md** (renamed from stage-10.md)
  - Updated header from Stage 10 to Stage 11
  - Updated tags from `[STAGE-10]` to `[STAGE-11]`
  - Updated test IDs from T-10.* to T-11.*
  - Updated e2e file reference
  - Updated regression requirements

- **tests/specs/stage-12.md** (renamed from stage-11.md)
  - Updated header from Stage 11 to Stage 12
  - Updated tags from `[STAGE-11]` to `[STAGE-12]`
  - Updated test ID from T-11.01 to T-12.01
  - Updated regression requirements

---

## Current Implementation State

**Stage 10 (Local Tool Result Cache) Status:** In Progress
**Implementation:** Not started

### Existing Foundation
- Stage 7 (Tools Sidebar) is complete with provider abstraction (ToolProvider interface, DatamuseProvider implementation, ToolService)
- Current tools: exact rhyme, near rhyme, thesaurus, dictionary, related words
- Provider abstraction layer is intact

### Data Model
- `DATA_MODEL.md` already includes "Local Tool Cache Model" section with `ToolQueryCacheEntry` schema
- Schema includes: id, toolType, query, provider, normalizedResults, fetchedAt, lastUsedAt, version?, projectIds?, sourceMeta?
- Cache is defined as supporting reference data, not canonical song draft content

### Architecture
- `ARCHITECTURE.md` already includes "Tool Provider Caching" section
- Notes clarify: provider abstraction remains intact, normalized results stored, cache is local-first and user-triggered

---

## Stage 10 Objective

Persist normalized results from user-triggered lexical tool lookups so repeated lookups can be served locally and cached data can be reused when a provider is unavailable.

---

## Relevant Specs Reviewed

- **STAGES.md** - Stage 10 section
- **FEATURES.md** - Feature 10 section
- **DATA_MODEL.md** - Local Tool Cache Model section
- **ARCHITECTURE.md** - Tool Provider Caching section
- **tests/specs/stage-10.md** - Test checklist

---

## Files to Create

- Cache store interface and implementation
- Cache-aware lookup service wrapper
- Normalized result persistence utilities

---

## Files to Modify

- Tool service layer to route through cache
- Provider integration path to persist on response

---

## Key Constraints

1. **Provider abstraction must remain intact** - cache sits inside the service layer, not in UI components
2. **Store normalized results only** - not raw provider response payloads
3. **Local-first** - cache stored in app-local persistent storage (IndexedDB or equivalent)
4. **User-triggered only** - no bulk ingestion, background pre-fetching, or autonomous scraping
5. **UI transparency** - UI components must not need to know whether result came from cache or live provider
6. **Supporting reference data** - cache is not part of canonical song draft content

---

## Acceptance Criteria

- Repeated lookup for the same term and tool type is served from local cache without calling the provider
- Provider response is normalized before being stored in cache
- Cached results are returned when the provider is unavailable or fails
- Cache entries persist across app reload
- Existing tools sidebar behavior is unchanged when cache is empty
- Provider abstraction layer is not bypassed by the cache implementation

---

## Test Requirements

Per `tests/specs/stage-10.md`:
- 3 unit tests in `tests/unit/tools/tool-cache.lookup-and-normalization.test.ts`
- 3 integration tests in `tests/integration/tools/tool-cache.persistence-and-fallback.test.ts`
- 1 integration test in `tests/integration/tools/tool-cache.ui-consumption.test.ts`
- 1 e2e test in `tests/e2e/tool-cache.spec.ts`

---

## Open Questions / Clarifications Needed

1. **ToolResultPayload shape** - The normalized result shape is referenced in both FEATURES.md and DATA_MODEL.md but not explicitly defined. Should this be defined in the tool service layer or in DATA_MODEL.md?

2. **Cache storage implementation** - IndexedDB is suggested in DATA_MODEL.md. Is there a preferred IndexedDB wrapper library, or should we use the native API directly?

3. **Query normalization** - Stage spec mentions "consistent casing/trimming" for cache keys. Should this be case-insensitive for all tool types, or only for some (e.g., rhyme lookups may be case-sensitive)?

4. **Empty result caching** - Stage spec notes empty results may be cached. Is this desired behavior for all tool types, or should we avoid caching empty results?

5. **Project association** - DATA_MODEL.md includes optional `projectIds` field. Should v1 implement app-local cache only (no project partitioning), or should project association be included from the start?

---

## Recommended Implementation Direction

1. Start with cache store interface (simple key-value with metadata)
2. Implement cache-aware lookup wrapper around existing ToolService
3. Add normalization layer between provider response and cache storage
4. Implement provider-failure fallback path
5. Add persistence layer (IndexedDB)
6. Update tool service layer to route through cache
7. Implement tests incrementally as each component is built

---

## Regression Requirements

- Stage 8 tool workflows must remain passing
- Stage 9 chord workflows must remain passing
- Existing tool sidebar behavior must remain usable when cache is empty
