/**
 * Cache-aware tool lookup service.
 * Wraps the existing ToolService with persistent caching and provider failure fallback.
 */

import { ToolService } from './tool-service';
import { IToolCacheStore } from './toolCacheStore';
import { ToolMode, ToolLookupResult, ToolQueryCacheEntry } from './types';
import { buildToolCacheKey } from './queryNormalization';

export class CachedToolLookupService {
  constructor(
    private toolService: ToolService,
    private cacheStore: IToolCacheStore
  ) {}

  /**
   * Lookup a term with caching and fallback.
   * 
   * Flow:
   * 1. Normalize query and build cache key
   * 2. Check cache
   * 3. If hit: update lastUsedAt, return cached result with source='cache'
   * 4. If miss: call provider, normalize result, persist, return with source='live'
   * 5. If provider fails and cached entry exists: return cached with source='cache-fallback'
   * 6. If provider fails and no cache: propagate error
   */
  async lookup(term: string, mode: ToolMode, provider: string = 'datamuse'): Promise<ToolLookupResult> {
    const normalizedTerm = term.trim();
    const cacheKey = buildToolCacheKey(provider, mode, normalizedTerm);

    // Check cache first
    const cached = await this.cacheStore.get(cacheKey);
    
    if (cached) {
      // Cache hit - update usage metadata
      await this.cacheStore.touch(cacheKey);
      
      return {
        term: cached.term,
        mode: cached.mode,
        results: cached.results,
        loading: false,
        source: 'cache',
        fetchedAt: cached.fetchedAt,
        lastUsedAt: cached.lastUsedAt,
      };
    }

    // Cache miss - call provider
    try {
      const response = await this.toolService.lookup(normalizedTerm, mode);
      
      // Only cache successful responses
      if (!response.error) {
        const entry: ToolQueryCacheEntry = {
          key: cacheKey,
          term: normalizedTerm,
          mode,
          provider,
          results: response.results,
          fetchedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        };
        
        await this.cacheStore.set(entry);
      }

      return {
        ...response,
        source: 'live',
        fetchedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Provider failed - check if we have cached data to fallback to
      const fallbackEntry = await this.cacheStore.get(cacheKey);
      
      if (fallbackEntry) {
        return {
          term: fallbackEntry.term,
          mode: fallbackEntry.mode,
          results: fallbackEntry.results,
          loading: false,
          source: 'cache-fallback',
          fetchedAt: fallbackEntry.fetchedAt,
          lastUsedAt: fallbackEntry.lastUsedAt,
        };
      }

      // No cache available - propagate error
      const errorMessage = error instanceof Error ? error.message : 'Lookup failed';
      return {
        term: normalizedTerm,
        mode,
        results: [],
        loading: false,
        error: errorMessage,
        source: 'live',
      };
    }
  }

  /**
   * Clear the cache.
   */
  async clearCache(): Promise<void> {
    await this.cacheStore.clear();
  }

  /**
   * Get all cached entries (useful for debugging/inspection).
   */
  async getAllCachedEntries(): Promise<ToolQueryCacheEntry[]> {
    return this.cacheStore.getAll();
  }
}
