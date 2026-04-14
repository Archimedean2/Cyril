/**
 * Tools domain types for rhyme, dictionary, and thesaurus lookups.
 */

export type ToolMode = 'rhyme-exact' | 'rhyme-near' | 'thesaurus' | 'dictionary' | 'idioms' | 'related';

export interface ToolResult {
  /** Display word/phrase */
  word: string;
  /** Optional score/frequency info */
  score?: number;
  /** For dictionary: definition */
  definition?: string;
  /** For dictionary: part of speech */
  partOfSpeech?: string;
  /** For idioms: the full idiom */
  idiom?: string;
}

export interface ToolLookupResponse {
  /** The search term */
  term: string;
  /** The tool mode used */
  mode: ToolMode;
  /** Results array */
  results: ToolResult[];
  /** Error message if lookup failed */
  error?: string;
  /** Whether request is still loading */
  loading: boolean;
}

export interface ToolProvider {
  /** Unique provider name */
  name: string;
  /** Lookup method - returns promise of results */
  lookup(term: string, mode: ToolMode): Promise<ToolResult[]>;
  /** Whether this provider supports the given mode */
  supportsMode(mode: ToolMode): boolean;
}

/**
 * Source of a tool lookup result
 */
export type ToolResultSource = 'cache' | 'live' | 'cache-fallback';

/**
 * Extended lookup response with cache metadata
 */
export interface ToolLookupResult extends ToolLookupResponse {
  /** Where this result came from */
  source: ToolResultSource;
  /** When the result was originally fetched (ISO timestamp) */
  fetchedAt?: string;
  /** When this result was last used (ISO timestamp) */
  lastUsedAt?: string;
}

/**
 * Cache entry for persistent storage
 */
export interface ToolQueryCacheEntry {
  /** Composite cache key */
  key: string;
  /** Normalized search term */
  term: string;
  /** Tool mode used */
  mode: ToolMode;
  /** Provider identifier */
  provider: string;
  /** Normalized results payload */
  results: ToolResult[];
  /** When originally fetched (ISO timestamp) */
  fetchedAt: string;
  /** When last used (ISO timestamp) */
  lastUsedAt: string;
}
