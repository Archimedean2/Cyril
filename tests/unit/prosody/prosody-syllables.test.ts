import { describe, test, expect } from 'vitest';
import { countSyllables, computeStressPattern, analyzeLineProsody } from '../../../src/domain/prosody/syllables';

describe('Prosody Syllable Counting - Dictionary First', () => {
  test('T-6.01: Dictionary provides accurate syllable counts for common words', () => {
    // Simple one-syllable words - from CMUdict
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('dog')).toBe(1);
    expect(countSyllables('fish')).toBe(1);
    
    // Two syllable words - from CMUdict
    expect(countSyllables('water')).toBe(2);
    expect(countSyllables('moment')).toBe(2);
    
    // Multi-word lines - dictionary counts
    expect(countSyllables('The cat sat')).toBe(3);
    expect(countSyllables('Hello world')).toBe(3);
    
    // Complex words with known CMUdict entries
    expect(countSyllables('table')).toBe(2);
    expect(countSyllables('beautiful')).toBe(3);
    expect(countSyllables('computer')).toBe(3);
    expect(countSyllables('pronunciation')).toBe(5);
  });

  test('T-6.02: Tokenizer handles punctuation and normalizes for lookup', () => {
    // Punctuation should be stripped before dictionary lookup
    expect(countSyllables('Hello!')).toBe(2);
    expect(countSyllables('What?')).toBe(1);
    expect(countSyllables('The cat.')).toBe(2);
    expect(countSyllables('Hello, world!')).toBe(3);
    expect(countSyllables('The quick brown fox.')).toBe(4); // the(1) + quick(1) + brown(1) + fox(1)
    
    // Punctuation-only should return null
    expect(countSyllables('!!!')).toBeNull();
    expect(countSyllables('...')).toBeNull();
    expect(countSyllables('?!')).toBeNull();
  });

  test('T-6.03: Missing or unknown words fail gracefully', () => {
    // Empty and whitespace-only lines return null
    expect(countSyllables('')).toBeNull();
    expect(countSyllables('   ')).toBeNull();
    expect(countSyllables('\t\n')).toBeNull();
    
    // Numbers-only: returns null (no tokens with letters)
    expect(countSyllables('123')).toBeNull();
    expect(countSyllables('42')).toBeNull();
    
    // Mixed with no letters returns null
    expect(countSyllables('123 !!! ???')).toBeNull();
  });

  test('Dictionary lookup takes priority over heuristics', () => {
    // These words are in CMUdict with precise counts
    // Silent 'e' words get correct dictionary count
    expect(countSyllables('make')).toBe(1);
    expect(countSyllables('take')).toBe(1);
    expect(countSyllables('love')).toBe(1);
    expect(countSyllables('abode')).toBe(2);
    
    // Verify dictionary is being used (not heuristic guessing)
    const prosody = analyzeLineProsody('make love abode');
    expect(prosody).not.toBeNull();
    expect(prosody!.dictionaryHits).toBeGreaterThanOrEqual(1);
  });

  test('Complex multi-syllable words from dictionary', () => {
    // Complex words with known CMUdict entries
    // Verified against CMUdict phonemes (vowel markers = syllables)
    expect(countSyllables('unbelievable')).toBe(5);    // AH2 N B AH0 L IY1 V AH0 B AH0 L
    expect(countSyllables('extraordinary')).toBe(6);    // EH2 K S T R AH0 AO1 R D AH0 N EH2 R IY0
    expect(countSyllables('characterization')).toBe(6);  // K EH2 R AH0 K T ER0 IH0 Z EY1 SH AH0 N
    expect(countSyllables('pronunciation')).toBe(5);     // P R OW0 N AH2 N S IY0 EY1 SH AH0 N
  });

  test('T-6.04: analyzeLineProsody provides detailed token breakdown', () => {
    const prosody = analyzeLineProsody('The cat sat');
    expect(prosody).not.toBeNull();
    expect(prosody!.totalSyllables).toBe(3);
    expect(prosody!.tokens).toHaveLength(3);
    expect(prosody!.hasCountableTokens).toBe(true);
    
    // Check token structure
    expect(prosody!.tokens[0].original).toBe('The');
    expect(prosody!.tokens[0].normalized).toBe('the');
    expect(prosody!.tokens[0].syllableCount).toBe(1);
    
    // Dictionary should be primary source
    expect(prosody!.dictionaryHits + prosody!.fallbackCount).toBe(3);
  });

  test('T-6.05: Fallback heuristic for unknown words', () => {
    // Words not in CMUdict should use fallback
    const prosody = analyzeLineProsody('xyz unknownword');
    expect(prosody).not.toBeNull();
    expect(prosody!.fallbackCount).toBeGreaterThanOrEqual(1);
    
    // Fallback should still produce reasonable counts
    expect(prosody!.totalSyllables).toBeGreaterThanOrEqual(1);
  });

  test('T-6.06: Stress pattern extraction from phonemes', () => {
    // 'HELLO' = HH AH0 L OW1 = ['u', 'S']
    expect(computeStressPattern('hello')).toEqual(['u', 'S']);
    
    // 'THE' = DH AH0 = ['u']
    // 'CAT' = K AE1 T = ['S']
    // 'SAT' = S AE1 T = ['S']
    // Total: ['u', 'S', 'S']
    expect(computeStressPattern('the cat sat')).toEqual(['u', 'S', 'S']);
    
    // Empty/null cases
    expect(computeStressPattern('')).toBeNull();
    expect(computeStressPattern('   ')).toBeNull();
    expect(computeStressPattern('123')).toBeNull();
  });
});
