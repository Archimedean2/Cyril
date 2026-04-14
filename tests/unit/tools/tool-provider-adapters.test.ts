import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DatamuseProvider } from '../../../src/domain/tools/datamuse-provider';
import { ToolService } from '../../../src/domain/tools/tool-service';
import { ToolMode } from '../../../src/domain/tools/types';

describe('Tool Provider Adapters', () => {
  describe('DatamuseProvider', () => {
    let provider: DatamuseProvider;

    beforeEach(() => {
      provider = new DatamuseProvider();
    });

    test('T-7.01: supports expected tool modes', () => {
      expect(provider.supportsMode('rhyme-exact')).toBe(true);
      expect(provider.supportsMode('rhyme-near')).toBe(true);
      expect(provider.supportsMode('thesaurus')).toBe(true);
      expect(provider.supportsMode('dictionary')).toBe(true);
      expect(provider.supportsMode('related')).toBe(true);
      expect(provider.supportsMode('idioms')).toBe(false);
    });

    test('T-7.01: returns normalized rhyme results', async () => {
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { word: 'cat', score: 1000 },
          { word: 'bat', score: 950 },
          { word: 'hat', score: 900 },
        ],
      });
      global.fetch = mockFetch;

      const results = await provider.lookup('mat', 'rhyme-exact');

      expect(results).toHaveLength(3);
      expect(results[0].word).toBe('cat');
      expect(results[0].score).toBe(1000);
      
      // Verify correct API endpoint was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('rel_rhy=mat')
      );
    });

    test('T-7.01: returns normalized thesaurus results', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { word: 'happy', score: 5000 },
          { word: 'joyful', score: 4000 },
        ],
      });
      global.fetch = mockFetch;

      const results = await provider.lookup('glad', 'thesaurus');

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('ml=glad')
      );
    });

    test('T-7.01: returns normalized dictionary results with definitions', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { 
            word: 'example', 
            score: 100000,
            defs: ['n\ta representative form or pattern'],
            tags: ['n']
          },
        ],
      });
      global.fetch = mockFetch;

      const results = await provider.lookup('example', 'dictionary');

      expect(results).toHaveLength(1);
      expect(results[0].word).toBe('example');
      expect(results[0].definition).toBe('a representative form or pattern');
      expect(results[0].partOfSpeech).toBe('n');
    });

    test('T-7.02: handles provider failure gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      await expect(provider.lookup('test', 'rhyme-exact')).rejects.toThrow('Network error');
    });

    test('T-7.02: handles HTTP error responses', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      await expect(provider.lookup('test', 'rhyme-exact')).rejects.toThrow('HTTP error! status: 500');
    });

    test('T-7.02: returns empty array for unsupported mode', async () => {
      const results = await provider.lookup('test', 'idioms' as ToolMode);
      expect(results).toEqual([]);
    });
  });

  describe('ToolService', () => {
    test('uses first provider that supports the mode', async () => {
      const mockProvider = {
        name: 'mock',
        supportsMode: vi.fn().mockReturnValue(true),
        lookup: vi.fn().mockResolvedValue([
          { word: 'result', score: 100 }
        ]),
      };

      const service = new ToolService([mockProvider]);
      const result = await service.lookup('test', 'rhyme-exact');

      expect(result.results).toHaveLength(1);
      expect(result.results[0].word).toBe('result');
      expect(mockProvider.lookup).toHaveBeenCalledWith('test', 'rhyme-exact');
    });

    test('returns error when no provider supports mode', async () => {
      const service = new ToolService([]);
      const result = await service.lookup('test', 'rhyme-exact');

      expect(result.error).toContain('No provider available');
      expect(result.results).toHaveLength(0);
    });

    test('returns error for empty search term', async () => {
      const service = new ToolService();
      const result = await service.lookup('   ', 'rhyme-exact');

      expect(result.error).toContain('Please enter a search term');
    });

    test('caches results and returns cached on subsequent calls', async () => {
      const mockProvider = {
        name: 'mock',
        supportsMode: vi.fn().mockReturnValue(true),
        lookup: vi.fn().mockResolvedValue([{ word: 'cached', score: 100 }]),
      };

      const service = new ToolService([mockProvider]);
      
      // First call
      await service.lookup('test', 'rhyme-exact');
      expect(mockProvider.lookup).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await service.lookup('test', 'rhyme-exact');
      expect(mockProvider.lookup).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(result.results[0].word).toBe('cached');
    });

    test('clearCache removes all cached entries', async () => {
      const mockProvider = {
        name: 'mock',
        supportsMode: vi.fn().mockReturnValue(true),
        lookup: vi.fn().mockResolvedValue([{ word: 'result' }]),
      };

      const service = new ToolService([mockProvider]);
      await service.lookup('test', 'rhyme-exact');
      
      service.clearCache();
      
      // Next call should hit provider again
      await service.lookup('test', 'rhyme-exact');
      expect(mockProvider.lookup).toHaveBeenCalledTimes(2);
    });

    test('isModeSupported returns true when provider supports mode', () => {
      const mockProvider = {
        name: 'mock',
        supportsMode: vi.fn((mode) => mode === 'rhyme-exact'),
        lookup: vi.fn(),
      };

      const service = new ToolService([mockProvider]);
      expect(service.isModeSupported('rhyme-exact')).toBe(true);
      expect(service.isModeSupported('thesaurus')).toBe(false);
    });
  });
});
