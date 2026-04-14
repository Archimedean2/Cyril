/**
 * Dictionary lookup for prosody analysis using CMUdict.
 * 
 * Uses the 'cmudict' npm package (CJS wrapper around CMU Pronouncing Dictionary).
 * Provides dictionary-first syllable counting with stress pattern extraction.
 */

import { TokenProsody, StressMark } from './types';

// Lazy-loaded dictionary instance
let dictionary: any = null;

/**
 * Get or create the CMUdict instance.
 * Lazy initialization to avoid loading at import time.
 */
function getDictionary(): any {
  if (!dictionary) {
    // Dynamic require for CJS compatibility
    const cmudict = require('cmudict');
    dictionary = new cmudict.CMUDict();
  }
  return dictionary;
}

/**
 * Parse ARPAbet phonemes and extract syllable count and stress pattern.
 * 
 * CMUdict format: phonemes with stress markers (0=unstressed, 1=primary, 2=secondary)
 * Example: "HH AH0 L OW1" = 2 syllables, stress pattern ['u', 'S']
 * 
 * @param phonemesStr - Space-separated phonemes from CMUdict
 * @returns Object with syllable count and stress pattern
 */
function parsePhonemes(phonemesStr: string): { syllables: number; stressPattern: StressMark[]; phonemes: string[] } {
  const phonemes = phonemesStr.split(/\s+/);
  const stressPattern: StressMark[] = [];
  
  for (const phoneme of phonemes) {
    // Vowel phonemes end with stress marker: 0, 1, or 2
    const stressMatch = phoneme.match(/^(\D+)([012])$/);
    if (stressMatch) {
      const stress = parseInt(stressMatch[2], 10);
      // 0 = unstressed ('u'), 1/2 = stressed ('S')
      stressPattern.push(stress === 0 ? 'u' : 'S');
    }
  }
  
  return {
    syllables: stressPattern.length,
    stressPattern,
    phonemes,
  };
}

/**
 * Look up a word in the CMUdict.
 * 
 * @param word - Uppercase word to look up
 * @returns Phoneme string or undefined if not found
 */
export function lookup(word: string): string | undefined {
  const dict = getDictionary();
  return dict.get(word);
}

/**
 * Check if a word exists in the dictionary.
 */
export function hasWord(word: string): boolean {
  const dict = getDictionary();
  return dict.get(word) !== undefined;
}

/**
 * Enrich a TokenProsody with dictionary data if available.
 * Modifies the token in place and returns it.
 * 
 * @param token - TokenProsody to enrich
 * @returns The enriched token (modified in place)
 */
export function enrichTokenFromDictionary(token: TokenProsody): TokenProsody {
  if (!token.normalized || !token.hasLetters) {
    token.source = 'unknown';
    return token;
  }
  
  const phonemesStr = lookup(token.normalized.toUpperCase());
  
  if (phonemesStr) {
    const parsed = parsePhonemes(phonemesStr);
    token.syllableCount = parsed.syllables;
    token.phonemes = parsed.phonemes;
    token.stressPattern = parsed.stressPattern;
    token.source = 'dictionary';
  }
  // If not found, source remains 'unknown' for fallback handling
  
  return token;
}

/**
 * Get the raw phoneme string for a word.
 * Useful for debugging or advanced analysis.
 */
export function getRawPhonemes(word: string): string | undefined {
  return lookup(word.toUpperCase());
}

/**
 * Count syllables in a word using the dictionary.
 * Returns null if word not found.
 */
export function countSyllablesInWord(word: string): number | null {
  const phonemesStr = lookup(word.toUpperCase());
  if (!phonemesStr) return null;
  
  const parsed = parsePhonemes(phonemesStr);
  return parsed.syllables;
}
