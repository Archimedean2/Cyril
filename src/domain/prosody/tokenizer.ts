/**
 * Tokenization and normalization for prosody analysis.
 * 
 * Responsibilities:
 * - Split lines into tokens (words)
 * - Normalize tokens for dictionary lookup
 * - Handle punctuation gracefully
 */

import { TokenProsody } from './types';

/**
 * Split a line into word tokens.
 * Preserves punctuation attached to words (e.g., "hello!" becomes "hello!").
 */
export function tokenize(line: string): string[] {
  if (!line || line.trim().length === 0) {
    return [];
  }
  
  // Split on whitespace, filter empty tokens
  return line.trim().split(/\s+/).filter(token => token.length > 0);
}

/**
 * Normalize a token for dictionary lookup.
 * 
 * Rules:
 * - Convert to lowercase
 * - Remove leading/trailing punctuation
 * - Remove possessive 's
 * - Handle common contractions (optional expansion)
 */
export function normalize(token: string): string {
  if (!token) return '';
  
  let normalized = token.toLowerCase();
  
  // Remove leading punctuation
  normalized = normalized.replace(/^[\p{P}\p{S}]+/u, '');
  
  // Remove trailing punctuation
  normalized = normalized.replace(/[\p{P}\p{S}]+$/u, '');
  
  // Remove possessive 's or s'
  normalized = normalized.replace(/['']s$/i, '');
  normalized = normalized.replace(/s['']$/i, 's');
  
  return normalized;
}

/**
 * Check if a token contains any alphabetic characters.
 */
export function hasLetters(token: string): boolean {
  return /[a-zA-Z]/.test(token);
}

/**
 * Create an initial TokenProsody with normalization applied.
 */
export function createTokenProsody(token: string): TokenProsody {
  const normalized = normalize(token);
  
  return {
    original: token,
    normalized,
    syllableCount: 0,
    source: 'unknown',
    hasLetters: hasLetters(token),
  };
}

/**
 * Process a full line into TokenProsody objects.
 */
export function tokenizeLine(line: string): TokenProsody[] {
  const tokens = tokenize(line);
  return tokens.map(createTokenProsody);
}
