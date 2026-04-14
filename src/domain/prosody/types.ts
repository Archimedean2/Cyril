/**
 * Prosody types for dictionary-first syllable counting.
 * 
 * Designed to support:
 * - Total line syllable counts
 * - Token-by-token syllable breakdown
 * - Source tracking (dictionary vs fallback)
 * - Future stress pattern extraction
 */

/**
 * Source of syllable count for a token.
 */
export type SyllableSource = 'dictionary' | 'fallback' | 'unknown';

/**
 * Phoneme representation from CMUdict format.
 * ARPAbet phonemes with optional stress markers (0=unstressed, 1=primary, 2=secondary).
 * Example: ['AH', 'B', 'OW', 'D'] for "abode"
 */
export type Phoneme = string;

/**
 * Stress pattern extracted from phonemes.
 * 'S' = stressed, 'u' = unstressed, '?' = unknown
 */
export type StressMark = 'S' | 'u' | '?';

/**
 * Individual token analysis result.
 */
export interface TokenProsody {
  /** The original token text */
  original: string;
  
  /** Normalized form used for lookup */
  normalized: string;
  
  /** Number of syllables */
  syllableCount: number;
  
  /** Source of the count */
  source: SyllableSource;
  
  /** Phonemes if available from dictionary */
  phonemes?: Phoneme[];
  
  /** Stress pattern if available */
  stressPattern?: StressMark[];
  
  /** Whether this token contains letters (not just punctuation) */
  hasLetters: boolean;
}

/**
 * Complete line prosody analysis.
 */
export interface LineProsody {
  /** The original line text */
  originalLine: string;
  
  /** All tokens analyzed */
  tokens: TokenProsody[];
  
  /** Total syllable count for the line */
  totalSyllables: number;
  
  /** Number of tokens that were found in dictionary */
  dictionaryHits: number;
  
  /** Number of tokens that used fallback heuristic */
  fallbackCount: number;
  
  /** Overall stress pattern for the line (if available) */
  stressPattern?: StressMark[];
  
  /** Whether any tokens were found */
  hasCountableTokens: boolean;
}

/**
 * Configuration for prosody analysis.
 */
export interface ProsodyConfig {
  /** Whether to use dictionary lookup */
  useDictionary: boolean;
  
  /** Whether to use fallback heuristic for unknown words */
  useFallback: boolean;
  
  /** Whether to extract stress patterns (requires dictionary) */
  extractStress: boolean;
}

/**
 * Default configuration.
 */
export const DEFAULT_PROSODY_CONFIG: ProsodyConfig = {
  useDictionary: true,
  useFallback: true,
  extractStress: false, // Disabled by default for v1 performance
};
