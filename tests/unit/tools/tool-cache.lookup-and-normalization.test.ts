/**
 * Unit tests for tool cache lookup and normalization.
 * Tests cache hit behavior, normalization, and usage metadata updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CachedToolLookupService } from '../../../src/domain/tools/cachedToolLookupService';
import { ToolService } from '../../../src/domain/tools/tool-service';
import { InMemoryToolCacheStore } from '../../../src/domain/tools/toolCacheStore';
import { ToolMode, ToolResult } from '../../../src/domain/tools/types';
import { normalizeToolQuery, buildToolCacheKey } from '../../../src/domain/tools/queryNormalization';

describe('Tool Cache Lookup and Normalization', () => {
  let mockToolService: ToolService;
  let cacheStore: InMemoryToolCacheStore;
  let cachedService: CachedToolLookupService;

  beforeEach(() => {
    // Create mock tool service
    mockToolService = {
      lookup: vi.fn(),
      isModeSupported: vi.fn(),
      addProvider: vi.fn(),
      clearCache: vi.fn(),
    } as unknown as ToolService;

    cacheStore = new InMemoryToolCacheStore();
    cachedService = new CachedToolLookupService(mockToolService, cacheStore);
  });

  describe('T-10.01: Cache hit avoids duplicate provider request', () => {
    it('should return cached result without calling provider on second lookup', async () => {
      const term = 'hello';
      const mode: ToolMode = 'rhyme-exact';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'yellow', score: 100 },
        { word: 'fellow', score: 90 },
      ];

      // First call - cache miss
      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      const result1 = await cachedService.lookup(term, mode, provider);
      expect(result1.source).toBe('live');
      expect(result1.results).toEqual(mockResults);
      expect(mockToolService.lookup).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const result2 = await cachedService.lookup(term, mode, provider);
      expect(result2.source).toBe('cache');
      expect(result2.results).toEqual(mockResults);
      // Provider should not be called again
      expect(mockToolService.lookup).toHaveBeenCalledTimes(1);
    });
  });

  describe('T-10.02: Provider response normalized before persistence', () => {
    it('should persist normalized result shape from provider', async () => {
      const term = 'test';
      const mode: ToolMode = 'thesaurus';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'exam', score: 100 },
        { word: 'trial', score: 80 },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      await cachedService.lookup(term, mode, provider);

      // Verify cache entry has normalized shape
      const cacheKey = buildToolCacheKey(provider, mode, term);
      const cached = await cacheStore.get(cacheKey);

      expect(cached).not.toBeNull();
      expect(cached?.results).toEqual(mockResults);
      expect(cached?.term).toBe(term);
      expect(cached?.mode).toBe(mode);
      expect(cached?.provider).toBe(provider);
      expect(cached?.fetchedAt).toBeDefined();
      expect(cached?.lastUsedAt).toBeDefined();
    });
  });

  describe('T-10.03: Repeated lookup updates cache usage metadata', () => {
    it('should update lastUsedAt on cache hit while preserving fetchedAt', async () => {
      const term = 'word';
      const mode: ToolMode = 'dictionary';
      const provider = 'datamuse';

      const mockResults: ToolResult[] = [
        { word: 'word', definition: 'a unit of language', partOfSpeech: 'noun' },
      ];

      vi.mocked(mockToolService.lookup).mockResolvedValueOnce({
        term,
        mode,
        results: mockResults,
        loading: false,
      });

      // First lookup
      const result1 = await cachedService.lookup(term, mode, provider);
      const originalFetchedAt = result1.fetchedAt;
      const originalLastUsedAt = result1.lastUsedAt;

      expect(originalFetchedAt).toBeDefined();
      expect(originalLastUsedAt).toBeDefined();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second lookup (cache hit)
      const result2 = await cachedService.lookup(term, mode, provider);

      // fetchedAt should remain the same
      expect(result2.fetchedAt).toBe(originalFetchedAt);
      // lastUsedAt should be updated
      expect(result2.lastUsedAt).not.toBe(originalLastUsedAt);
    });
  });
});

describe('Query Normalization', () => {
  describe('normalizeToolQuery', () => {
    it('should trim whitespace', () => {
      expect(normalizeToolQuery('  hello  ')).toBe('hello');
    });

    it('should convert to lowercase', () => {
      expect(normalizeToolQuery('HELLO')).toBe('hello');
    });

    it('should handle both trim and lowercase', () => {
      expect(normalizeToolQuery('  HELLO WORLD  ')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(normalizeToolQuery('')).toBe('');
      expect(normalizeToolQuery('   ')).toBe('');
    });
  });

  describe('buildToolCacheKey', () => {
    it('should build composite key with provider, mode, and normalized query', () => {
      const key = buildToolCacheKey('datamuse', 'rhyme-exact', '  HELLO  ');
      expect(key).toBe('datamuse:rhyme-exact:hello');
    });

    it('should produce same key for equivalent inputs', () => {
      const key1 = buildToolCacheKey('datamuse', 'thesaurus', 'test');
      const key2 = buildToolCacheKey('datamuse', 'thesaurus', '  TEST  ');
      expect(key1).toBe(key2);
    });

    it('should produce different keys for different providers', () => {
      const key1 = buildToolCacheKey('datamuse', 'rhyme-exact', 'test');
      const key2 = buildToolCacheKey('other', 'rhyme-exact', 'test');
      expect(key1).not.toBe(key2);
    });

    it('should produce different keys for different modes', () => {
      const key1 = buildToolCacheKey('datamuse', 'rhyme-exact', 'test');
      const key2 = buildToolCacheKey('datamuse', 'thesaurus', 'test');
      expect(key1).not.toBe(key2);
    });
  });
});
