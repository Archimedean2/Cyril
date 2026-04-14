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
