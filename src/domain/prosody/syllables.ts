/**
 * Syllable counting utility for prosody analysis.
 * 
 * Uses a dictionary-first approach with CMUdict as the primary source,
 * falling back to heuristic rules only for unknown words.
 * 
 * Provides:
 * - Total line syllable counts
 * - Token-by-token syllable breakdown
 * - Source tracking (dictionary vs fallback)
 * - Future support for stress pattern extraction
 */

import { LineProsody, TokenProsody, StressMark, ProsodyConfig, DEFAULT_PROSODY_CONFIG } from './types';
import { tokenizeLine } from './tokenizer';
import { enrichTokenFromDictionary } from './dictionary';

// Fallback heuristic: vowel groups for unknown words
const VOWEL_REGEX = /[aeiouy]+/gi;
const SILENT_E_REGEX = /e$/i;

/**
 * Count syllables using heuristic fallback.
 * Used only for words not found in the dictionary.
 */
function countSyllablesHeuristic(word: string): number {
  if (!word || word.length === 0) return 0;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  
  // Count vowel groups
  const vowelGroups = cleanWord.match(VOWEL_REGEX);
  if (!vowelGroups) return 0;
  
  let count = vowelGroups.length;
  
  // Adjust for silent e at end
  if (SILENT_E_REGEX.test(cleanWord) && count > 1) {
    count--;
  }
  
  // Handle 'le' ending (like 'candle', 'table')
  if (/[^aeiouy]le$/.test(cleanWord) && !SILENT_E_REGEX.test(cleanWord)) {
    count++;
  }
  
  return Math.max(1, count);
}

/**
 * Apply fallback heuristic to tokens not found in dictionary.
 */
function applyFallback(tokens: TokenProsody[]): TokenProsody[] {
  return tokens.map(token => {
    if (token.source === 'unknown' && token.hasLetters) {
      token.syllableCount = countSyllablesHeuristic(token.normalized);
      token.source = 'fallback';
    }
    return token;
  });
}

/**
 * Analyze a line of text for prosody.
 * 
 * This is the primary function for dictionary-first prosody analysis.
 * Returns structured data including:
 * - Total syllable count
 * - Token-by-token breakdown
 * - Source of each count (dictionary vs fallback)
 * - Stress patterns (if enabled)
 */
export function analyzeLineProsody(
  line: string,
  config: ProsodyConfig = DEFAULT_PROSODY_CONFIG
): LineProsody | null {
  if (!line || line.trim().length === 0) {
    return null;
  }
  
  // Tokenize
  let tokens = tokenizeLine(line);
  
  if (config.useDictionary) {
    // Dictionary lookup for all tokens
    tokens = tokens.map(enrichTokenFromDictionary);
  }
  
  if (config.useFallback) {
    // Apply heuristic fallback for unknown words
    tokens = applyFallback(tokens);
  }
  
  // Calculate totals
  let totalSyllables = 0;
  let dictionaryHits = 0;
  let fallbackCount = 0;
  let hasCountableTokens = false;
  
  for (const token of tokens) {
    if (token.syllableCount > 0) {
      totalSyllables += token.syllableCount;
      hasCountableTokens = true;
    }
    if (token.source === 'dictionary') dictionaryHits++;
    if (token.source === 'fallback') fallbackCount++;
  }
  
  // Build stress pattern if we have dictionary data
  let stressPattern: StressMark[] | undefined;
  if (config.extractStress && config.useDictionary) {
    stressPattern = tokens
      .filter(t => t.stressPattern && t.stressPattern.length > 0)
      .flatMap(t => t.stressPattern!);
  }
  
  return {
    originalLine: line,
    tokens,
    totalSyllables,
    dictionaryHits,
    fallbackCount,
    stressPattern,
    hasCountableTokens,
  };
}

/**
 * Simple syllable count for a line.
 * Backward-compatible API - returns just the total count or null.
 */
export function countSyllables(line: string): number | null {
  const prosody = analyzeLineProsody(line, { 
    useDictionary: true, 
    useFallback: true,
    extractStress: false 
  });
  if (!prosody || !prosody.hasCountableTokens) {
    return null;
  }
  return prosody.totalSyllables;
}

/**
 * Compute stress pattern for a line.
 * 
 * Uses actual phonetic stress data from dictionary when available.
 * Falls back to simple alternating pattern for fallback-only words.
 */
export function computeStressPattern(line: string): StressMark[] | null {
  const prosody = analyzeLineProsody(line, { 
    useDictionary: true, 
    useFallback: true,
    extractStress: true 
  });
  
  if (!prosody || prosody.totalSyllables === 0) {
    return null;
  }
  
  // If we have dictionary stress data, use it
  if (prosody.stressPattern && prosody.stressPattern.length > 0) {
    return prosody.stressPattern;
  }
  
  // Fallback: simple alternating pattern
  const pattern: StressMark[] = [];
  for (let i = 0; i < prosody.totalSyllables; i++) {
    pattern.push(i % 2 === 0 ? 'u' : 'S');
  }
  return pattern;
}

// Re-export types for consumers
export type { LineProsody, TokenProsody, ProsodyConfig, StressMark } from './types';
