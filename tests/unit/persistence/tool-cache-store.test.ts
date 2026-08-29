import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { IndexedDBToolCacheStore } from '../../../src/persistence/indexeddb/toolCacheStore';
import { ToolQueryCacheEntry } from '../../../src/domain/tools/types';

/**
 * Per EDGE_CASES.md §8 (🟠 "IndexedDB unavailable/quota-exceeded ... tool cache must
 * degrade, no crash"): `IndexedDBToolCacheStore` previously let every method reject when
 * `indexedDB.open` failed, and its consumer (`CachedToolLookupService.lookup`) has no
 * try/catch around its cache calls — so a rejection here would crash the whole tool lookup
 * instead of gracefully falling back to a live-only result. Fixed to degrade gracefully,
 * matching the established pattern in `recoveryStore.ts`.
 */
describe('IndexedDBToolCacheStore degrades gracefully when IndexedDB is unavailable (HARDENING-adjacent, C-08 lane)', () => {
  afterEach(() => {
    const store = new IndexedDBToolCacheStore();
    store.close();
  });

  it('T-1.35: get() resolves null (not a rejection) when IndexedDB.open fails, e.g. quota exceeded/private browsing', async () => {
    const realOpen = indexedDB.open;
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const store = new IndexedDBToolCacheStore();
      await expect(store.get('datamuse:rhyme-exact:moon')).resolves.toBeNull();
    } finally {
      (indexedDB as unknown as { open: unknown }).open = realOpen;
    }
  });

  it('T-1.35: set() resolves (does not throw) when IndexedDB.open fails — a cache write is best-effort only', async () => {
    const realOpen = indexedDB.open;
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const store = new IndexedDBToolCacheStore();
      const entry: ToolQueryCacheEntry = {
        key: 'datamuse:rhyme-exact:moon',
        term: 'moon',
        mode: 'rhyme-exact',
        provider: 'datamuse',
        results: [{ word: 'june', score: 100 }],
        fetchedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };
      await expect(store.set(entry)).resolves.toBeUndefined();
    } finally {
      (indexedDB as unknown as { open: unknown }).open = realOpen;
    }
  });

  it('T-1.35: touch(), delete(), clear() and getAll() all degrade to no-ops/empty results instead of rejecting', async () => {
    const realOpen = indexedDB.open;
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const store = new IndexedDBToolCacheStore();
      await expect(store.touch('some:key')).resolves.toBeUndefined();
      await expect(store.delete('some:key')).resolves.toBeUndefined();
      await expect(store.clear()).resolves.toBeUndefined();
      await expect(store.getAll()).resolves.toEqual([]);
    } finally {
      (indexedDB as unknown as { open: unknown }).open = realOpen;
    }
  });

  it('T-1.35: a cache-store degraded to no-ops still lets a fresh lookup succeed on a healthy IndexedDB afterward (no lingering broken connection)', async () => {
    const realOpen = indexedDB.open;
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
    const degradedStore = new IndexedDBToolCacheStore();
    await degradedStore.get('some:key');
    (indexedDB as unknown as { open: unknown }).open = realOpen;

    // A fresh store instance (as the app would create after IndexedDB recovers, e.g. private
    // browsing exited) works normally — the earlier failure left no bad shared state.
    const healthyStore = new IndexedDBToolCacheStore();
    const entry: ToolQueryCacheEntry = {
      key: 'datamuse:thesaurus:happy',
      term: 'happy',
      mode: 'thesaurus',
      provider: 'datamuse',
      results: [{ word: 'joyful', score: 90 }],
      fetchedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    await healthyStore.set(entry);
    await expect(healthyStore.get(entry.key)).resolves.toMatchObject({ term: 'happy' });
    healthyStore.close();
  });
});
