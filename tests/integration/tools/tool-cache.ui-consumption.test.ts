/**
 * Integration tests for tool cache UI consumption.
 * Tests that UI correctly renders cached results and maintains compatibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedToolLookupService } from '../../../src/domain/tools/cachedToolLookupService';
import { ToolService } from '../../../src/domain/tools/tool-service';
import { InMemoryToolCacheStore } from '../../../src/domain/tools/toolCacheStore';
import { ToolMode, ToolResult, ToolLookupResponse } from '../../../src/domain/tools/types';

describe('Tool Cache UI Consumption', () => {
  let mockToolService: ToolService;
  let cacheStore: InMemoryToolCacheStore;
  let cachedService: CachedToolLookupService;

  beforeEach(() => {
    mockToolService = {
      lookup: vi.fn(),
      isModeSupported: vi.fn(),
      addProvider: vi.fn(),
      clearCache: vi.fn(),
    } as unknown as ToolService;

    cacheStore = new InMemoryToolCacheStore();
    cachedService = new CachedToolLookupService(mockToolService, cacheStore);
  });

  describe('T-10.07: Tool UI renders cached results correctly', () => {
    it('should return ToolLookupResult compatible with ToolLookupResponse', async () => {
      const term = 'render';
      const mode: ToolMode = 'rhyme-exact';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'tender', score: 100 },
        { word: 'splendor', score: 90 },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result = await cachedService.lookup(term, mode, provider);

      // Verify result has all ToolLookupResponse fields
      expect(result.term).toBe(term);
      expect(result.mode).toBe(mode);
      expect(result.results).toEqual(mockResults);
      expect(result.loading).toBe(false);
      expect(result.error).toBeUndefined();

      // Verify it also has cache metadata
      expect(result.source).toBeDefined();
      expect(result.fetchedAt).toBeDefined();
      expect(result.lastUsedAt).toBeDefined();
    });

    it('should handle empty results from cache', async () => {
      const term = 'empty';
      const mode: ToolMode = 'thesaurus';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result = await cachedService.lookup(term, mode, provider);

      expect(result.results).toEqual([]);
      expect(result.source).toBe('live');
      expect(result.loading).toBe(false);
    });

    it('should handle error responses from cache-fallback', async () => {
      const term = 'error';
      const mode: ToolMode = 'dictionary';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'error', definition: 'a mistake', partOfSpeech: 'noun' },
      ];

      // First call succeeds and caches
      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      await cachedService.lookup(term, mode, provider);

      // Second call fails
      vi.mocked(mockToolService.lookup).mockRejectedValueOnce(new Error('Network error'));

      const result = await cachedService.lookup(term, mode, provider);

      // Cache-first lookup returns the cached entry with source='cache'
      expect(result.source).toBe('cache');
      expect(result.results).toEqual(mockResults);
      expect(result.error).toBeUndefined();
      expect(result.loading).toBe(false);
    });

    it('should preserve result shape for different tool modes', async () => {
      const testCases: Array<{ mode: ToolMode; results: ToolResult[] }> = [
        {
          mode: 'rhyme-exact',
          results: [{ word: 'test', score: 100 }],
        },
        {
          mode: 'thesaurus',
          results: [{ word: 'exam', score: 100 }],
        },
        {
          mode: 'dictionary',
          results: [{ word: 'word', definition: 'a unit', partOfSpeech: 'noun' }],
        },
        {
          mode: 'related',
          results: [{ word: 'similar', score: 100 }],
        },
      ];

      for (const { mode, results } of testCases) {
        vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
          term: 'test',
          mode,
          results,
          loading: false,
        });

        const result = await cachedService.lookup('test', mode, 'datamuse');

        expect(result.mode).toBe(mode);
        expect(result.results).toEqual(results);
        expect(result.loading).toBe(false);
      }
    });
  });

  describe('UI compatibility', () => {
    it('should be assignable to ToolLookupResponse for UI components', async () => {
      const term = 'compatible';
      const mode: ToolMode = 'rhyme-exact';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [{ word: 'fit', score: 100 }];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result = await cachedService.lookup(term, mode, provider);

      // This simulates how UI components would use the result
      const uiResponse: ToolLookupResponse = {
        term: result.term,
        mode: result.mode,
        results: result.results,
        loading: result.loading,
        error: result.error,
      };

      expect(uiResponse.term).toBe(term);
      expect(uiResponse.mode).toBe(mode);
      expect(uiResponse.results).toEqual(mockResults);
      expect(uiResponse.loading).toBe(false);
    });

    it('should maintain loading state correctly', async () => {
      const term = 'loading';
      const mode: ToolMode = 'thesaurus';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [{ word: 'load', score: 100 }];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result = await cachedService.lookup(term, mode, provider);

      // Cached results should never be in loading state
      expect(result.loading).toBe(false);
    });
  });
});
