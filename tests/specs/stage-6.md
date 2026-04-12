# Stage 6 Test Spec

**Tags:** `[PROSODY] [DISPLAY] [RHYME] [STAGE-6]`

## Scope
Syllable counts and optional manual rhyme visualization.

## Required Test Files
- `tests/unit/prosody/prosody-syllables.test.ts`
- `tests/integration/editor/prosody-integration.test.ts`
- `tests/e2e/stage-6-prosody.spec.ts`

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-6.01 | Syllable utility computes expected count for simple line | unit | `tests/unit/prosody/prosody-syllables.test.ts` | [ ] | [ ] | |
| T-6.02 | Syllable utility handles punctuation reasonably | unit | `tests/unit/prosody/prosody-syllables.test.ts` | [ ] | [ ] | |
| T-6.03 | Missing or unknown words fail gracefully | unit | `tests/unit/prosody/prosody-syllables.test.ts` | [ ] | [ ] | |
| T-6.04 | Syllable counts display for lyric lines only | integration | `tests/integration/editor/prosody-integration.test.ts` | [ ] | [ ] | |
| T-6.05 | Syllable counts update after lyric edit | integration | `tests/integration/editor/prosody-integration.test.ts` | [ ] | [ ] | |
| T-6.06 | Syllable display toggle works | integration | `tests/integration/editor/prosody-integration.test.ts` | [ ] | [ ] | |
| T-6.07 | If rhyme mode is included, rhyme annotations persist | integration | `tests/integration/editor/prosody-integration.test.ts` | [ ] | [ ] | |
| T-6.08 | Prosody workflow passes in UI | e2e | `tests/e2e/stage-6-prosody.spec.ts` | [ ] | [ ] | |

## Regression Requirements
- Stages 0–5 must remain passing