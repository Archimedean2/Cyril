/**
 * Integration tests for tool cache persistence and provider failure fallback.
 * Tests IndexedDB persistence, fallback behavior, and result shape preservation.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CachedToolLookupService } from '../../../src/domain/tools/cachedToolLookupService';
import { ToolService } from '../../../src/domain/tools/tool-service';
import { IndexedDBToolCacheStore } from '../../../src/persistence/indexeddb/toolCacheStore';
import { ToolMode, ToolResult } from '../../../src/domain/tools/types';

describe('Tool Cache Persistence and Fallback', () => {
  let mockToolService: ToolService;
  let cacheStore: IndexedDBToolCacheStore;
  let cachedService: CachedToolLookupService;

  beforeEach(async () => {
    // Create mock tool service
    mockToolService = {
      lookup: vi.fn(),
      isModeSupported: vi.fn(),
      addProvider: vi.fn(),
      clearCache: vi.fn(),
    } as unknown as ToolService;

    cacheStore = new IndexedDBToolCacheStore();
    cachedService = new CachedToolLookupService(mockToolService, cacheStore);

    // Clear cache before each test
    await cacheStore.clear();
  });

  afterEach(async () => {
    await cacheStore.clear();
  });

  describe('T-10.04: Cached lookup results persist across save/load or app reload', () => {
    it('should persist cached results to IndexedDB', async () => {
      const term = 'persist';
      const mode: ToolMode = 'rhyme-exact';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'exist', score: 100 },
        { word: 'assist', score: 90 },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      // First lookup - should cache
      await cachedService.lookup(term, mode, provider);

      // Verify cache has the entry
      const cacheKey = `${provider}:${mode}:${term}`;
      const cached = await cacheStore.get(cacheKey);

      expect(cached).not.toBeNull();
      expect(cached?.results).toEqual(mockResults);
      expect(cached?.term).toBe(term);
      expect(cached?.mode).toBe(mode);
      expect(cached?.provider).toBe(provider);
      expect(cached?.fetchedAt).toBeDefined();
      expect(cached?.lastUsedAt).toBeDefined();
    });

    it('should retrieve cached results after recreating service (simulating reload)', async () => {
      const term = 'reload';
      const mode: ToolMode = 'thesaurus';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'refresh', score: 100 },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      // First service instance - cache the result
      await cachedService.lookup(term, mode, provider);
      expect(mockToolService.lookup).toHaveBeenCalledTimes(1);

      // Create new service instance (simulating app reload)
      const newCacheStore = new IndexedDBToolCacheStore();
      const newCachedService = new CachedToolLookupService(mockToolService, newCacheStore);

      // Second lookup with new service - should hit cache without calling provider
      const result = await newCachedService.lookup(term, mode, provider);

      expect(result.source).toBe('cache');
      expect(result.results).toEqual(mockResults);
      // Provider should still only have been called once (from first service)
      expect(mockToolService.lookup).toHaveBeenCalledTimes(1);
    });
  });

  describe('T-10.05: Cached results are returned when provider fails', () => {
    it('should return cached result when provider throws error', async () => {
      const term = 'fallback';
      const mode: ToolMode = 'dictionary';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'fallback', definition: 'a reserve plan', partOfSpeech: 'noun' },
      ];

      // First call succeeds and caches
      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      await cachedService.lookup(term, mode, provider);

      // Second call fails but should return cached data
      vi.mocked(mockToolService.lookup).mockRejectedValueOnce(new Error('Network error'));

      const result = await cachedService.lookup(term, mode, provider);

      // Cache-first lookup returns the cached entry with source='cache'
      expect(result.source).toBe('cache');
      expect(result.results).toEqual(mockResults);
      expect(result.error).toBeUndefined();
    });

    it('should propagate error when provider fails and no cache exists', async () => {
      const term = 'nocache';
      const mode: ToolMode = 'rhyme-exact';
      const provider = 'datamuse';

      vi.mocked(mockToolService.lookup).mockRejectedValueOnce(new Error('Network error'));

      const result = await cachedService.lookup(term, mode, provider);

      expect(result.source).toBe('live');
      expect(result.results).toEqual([]);
      expect(result.error).toBe('Network error');
    });
  });

  describe('T-10.06: Cache-aware lookup flow preserves provider abstraction and internal result shape', () => {
    it('should return normalized ToolResult shape regardless of source', async () => {
      const term = 'shape';
      const mode: ToolMode = 'thesaurus';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'form', score: 100 },
        { word: 'structure', score: 90 },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValue({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      // Live result
      const liveResult = await cachedService.lookup(term, mode, provider);
      expect(liveResult.results).toEqual(mockResults);
      expect(liveResult.source).toBe('live');

      // Cached result
      const cachedResult = await cachedService.lookup(term, mode, provider);
      expect(cachedResult.results).toEqual(mockResults);
      expect(cachedResult.source).toBe('cache');

      // Both should have same normalized result shape
      expect(liveResult.results).toEqual(cachedResult.results);
    });

    it('should preserve ToolResult fields including optional metadata', async () => {
      const term = 'metadata';
      const mode: ToolMode = 'dictionary';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { 
          word: 'metadata', 
          definition: 'data about data', 
          partOfSpeech: 'noun',
          score: 100 
        },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result = await cachedService.lookup(term, mode, provider);

      expect(result.results[0].word).toBe('metadata');
      expect(result.results[0].definition).toBe('data about data');
      expect(result.results[0].partOfSpeech).toBe('noun');
      expect(result.results[0].score).toBe(100);
    });
  });
});
