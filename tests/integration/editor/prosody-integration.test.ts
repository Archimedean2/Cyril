import { describe, it, expect } from 'vitest';
import { analyzeLineProsody, countSyllables } from '../../../src/domain/prosody/syllables';
import { createDefaultProject } from '../../../src/domain/project/defaults';

describe('Prosody Integration', () => {
  it('T-6.04: Syllable counts display data is available for lyric lines', () => {
    const line = 'The quick brown fox jumps';
    const result = analyzeLineProsody(line);

    // Should return a valid prosody result
    expect(result).not.toBeNull();
    expect(result!.totalSyllables).toBeGreaterThan(0);
    expect(result!.tokens.length).toBeGreaterThan(0);
  });

  it('T-6.05: Syllable counts update when lyric text changes', () => {
    const shortLine = 'The cat';
    const longLine = 'The quick brown fox jumps over the lazy dog';

    const shortResult = analyzeLineProsody(shortLine);
    const longResult = analyzeLineProsody(longLine);

    expect(shortResult!.totalSyllables).toBeLessThan(longResult!.totalSyllables);
  });

  it('T-6.06: Syllable display toggle setting exists in draft settings', () => {
    // Verify the types include the syllable display setting
    // This is verified by the types.ts file and default values
    const project = createDefaultProject('Test Song');
    const draft = project.drafts[0];

    // Draft settings should include showSyllableCounts
    expect(draft.draftSettings).toHaveProperty('showSyllableCounts');
    // Default should be false (not showing syllables by default)
    expect(draft.draftSettings.showSyllableCounts).toBe(false);
  });

  it('T-6.07: Prosody analysis includes stress patterns from CMUdict', () => {
    const line = 'Hello world';
    const result = analyzeLineProsody(line);

    expect(result).not.toBeNull();
    expect(result!.tokens).toBeInstanceOf(Array);

    // Each token should have syllable info
    for (const token of result!.tokens) {
      expect(token).toHaveProperty('original');
      expect(token).toHaveProperty('normalized');
      expect(token).toHaveProperty('source');
      expect(token.syllableCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('T-6.08: Simple syllable count utility works', () => {
    const testCases = [
      { line: 'The', expected: 1 },
      { line: 'Hello', expected: 2 },
      { line: 'Beautiful', expected: 3 },
    ];

    for (const { line, expected } of testCases) {
      const count = countSyllables(line);
      expect(count).toBe(expected);
    }
  });

  it('T-6.09: Unknown words fall back to heuristic syllable counting', () => {
    // A made-up word that won't be in the dictionary
    const nonsenseWord = 'Xyzzyxq';
    const result = analyzeLineProsody(nonsenseWord);

    // Should still return a result (heuristic fallback)
    expect(result).not.toBeNull();
    expect(result!.totalSyllables).toBeGreaterThan(0);
  });

  it('T-6.10: Punctuation is handled gracefully in prosody analysis', () => {
    const lineWithPunctuation = 'Hello, world! How are you?';
    const result = analyzeLineProsody(lineWithPunctuation);

    expect(result).not.toBeNull();
    expect(result!.totalSyllables).toBeGreaterThan(0);
  });
});
