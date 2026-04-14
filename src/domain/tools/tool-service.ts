/**
 * Tool service - orchestrates provider lookups with caching and error handling.
 */

import { ToolProvider, ToolMode, ToolLookupResponse } from './types';

interface CacheEntry {
  response: ToolLookupResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class ToolService {
  private providers: ToolProvider[] = [];
  private cache: Map<string, CacheEntry> = new Map();

  constructor(providers: ToolProvider[] = []) {
    this.providers = providers;
  }

  addProvider(provider: ToolProvider): void {
    this.providers.push(provider);
  }

  /**
   * Lookup a term using the first provider that supports the mode.
   */
  async lookup(term: string, mode: ToolMode): Promise<ToolLookupResponse> {
    const trimmedTerm = term.trim().toLowerCase();
    
    if (!trimmedTerm) {
      return {
        term,
        mode,
        results: [],
        loading: false,
        error: 'Please enter a search term',
      };
    }

    // Check cache
    const cacheKey = `${trimmedTerm}:${mode}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      return { ...cached, loading: false };
    }

    // Find a provider that supports this mode
    const provider = this.providers.find(p => p.supportsMode(mode));
    
    if (!provider) {
      return {
        term,
        mode,
        results: [],
        loading: false,
        error: `No provider available for mode: ${mode}`,
      };
    }

    try {
      const results = await provider.lookup(trimmedTerm, mode);
      
      const response: ToolLookupResponse = {
        term,
        mode,
        results,
        loading: false,
      };

      // Cache the result
      this.setCached(cacheKey, response);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lookup failed';
      
      return {
        term,
        mode,
        results: [],
        loading: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if a mode is supported by any registered provider.
   */
  isModeSupported(mode: ToolMode): boolean {
    return this.providers.some(p => p.supportsMode(mode));
  }

  private getCached(key: string): ToolLookupResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  private setCached(key: string, response: ToolLookupResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/** Default service instance with Datamuse provider */
import { datamuseProvider } from './datamuse-provider';

export const toolService = new ToolService([datamuseProvider]);
