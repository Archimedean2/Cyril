/**
 * IndexedDB implementation of tool cache store.
 * Provides persistent storage for tool query results across app reloads.
 *
 * Per EDGE_CASES.md §8 (🟠 "IndexedDB unavailable/quota-exceeded ... tool cache must
 * degrade, no crash") and matching the pattern in `../indexeddb/recoveryStore.ts`: every
 * public method here degrades gracefully — resolving a harmless empty-ish value — rather
 * than rejecting, when `indexedDB.open` (or a transaction) fails (private browsing, quota
 * exceeded, another storage failure). `cachedToolLookupService.ts` has no try/catch around
 * its cache calls, so a rejection here would previously propagate as a crash of the whole
 * tool lookup instead of a graceful live-only fallback.
 */

import { IToolCacheStore } from '../../domain/tools/toolCacheStore';
import { ToolQueryCacheEntry } from '../../domain/tools/types';

const DB_NAME = 'cyril-tool-cache';
const DB_VERSION = 1;
const STORE_NAME = 'tool-queries';

/**
 * IndexedDB-backed cache store for tool lookup results.
 */
export class IndexedDBToolCacheStore implements IToolCacheStore {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database connection.
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('provider', 'provider', { unique: false });
          store.createIndex('mode', 'mode', { unique: false });
          store.createIndex('lastUsedAt', 'lastUsedAt', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<ToolQueryCacheEntry | null> {
    try {
      const db = await this.initDB();

      return await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get cache entry: ${request.error}`));
        };
      });
    } catch {
      // IndexedDB unavailable/quota-exceeded/etc — a cache miss is always a safe fallback.
      return null;
    }
  }

  async set(entry: ToolQueryCacheEntry): Promise<void> {
    try {
      const db = await this.initDB();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(entry);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to set cache entry: ${request.error}`));
        };
      });
    } catch {
      // Best-effort cache write only — never block a live lookup on a storage failure.
    }
  }

  async touch(key: string): Promise<void> {
    const entry = await this.get(key);
    if (entry) {
      entry.lastUsedAt = new Date().toISOString();
      await this.set(entry);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to delete cache entry: ${request.error}`));
        };
      });
    } catch {
      // Best-effort cleanup only.
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.initDB();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new Error(`Failed to clear cache: ${request.error}`));
        };
      });
    } catch {
      // Best-effort cleanup only.
    }
  }

  async getAll(): Promise<ToolQueryCacheEntry[]> {
    try {
      const db = await this.initDB();

      return await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`Failed to get all cache entries: ${request.error}`));
        };
      });
    } catch {
      return [];
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
