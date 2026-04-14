/**
 * Query normalization utilities for tool cache key generation.
 */

import { ToolMode } from './types';

/**
 * Normalize a tool query string.
 * - Trims whitespace
 * - Converts to lowercase
 * - Ensures deterministic output
 */
export function normalizeToolQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Build a composite cache key for tool queries.
 * Key format: `${provider}:${mode}:${normalizedQuery}`
 * 
 * This ensures:
 * - Provider-specific caching (different providers may return different results)
 * - Mode-specific caching (rhyme vs thesaurus are different lookups)
 * - Case-insensitive query matching
 */
export function buildToolCacheKey(
  provider: string,
  mode: ToolMode,
  query: string
): string {
  const normalizedQuery = normalizeToolQuery(query);
  return `${provider}:${mode}:${normalizedQuery}`;
}

/**
 * Parse a cache key back into its components.
 * Useful for debugging and cache inspection.
 */
export function parseToolCacheKey(key: string): {
  provider: string;
  mode: ToolMode;
  query: string;
} | null {
  const parts = key.split(':');
  if (parts.length !== 3) {
    return null;
  }

  const [provider, mode, query] = parts;
  return { provider, mode: mode as ToolMode, query };
}
