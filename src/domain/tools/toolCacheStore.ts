/**
 * Cache store abstraction for tool query results.
 * Defines the interface for persistent cache storage implementations.
 */

import { ToolQueryCacheEntry } from './types';

/**
 * Cache store interface for tool lookup results.
 * Implementations can use IndexedDB, localStorage, or other persistence mechanisms.
 */
export interface IToolCacheStore {
  /**
   * Retrieve a cached entry by composite key.
   * @param key - Composite cache key (provider:mode:query)
   * @returns The cached entry or null if not found
   */
  get(key: string): Promise<ToolQueryCacheEntry | null>;

  /**
   * Store a cache entry.
   * @param entry - The cache entry to persist
   */
  set(entry: ToolQueryCacheEntry): Promise<void>;

  /**
   * Update the lastUsedAt timestamp for an entry.
   * Called on cache hits to track usage patterns.
   * @param key - Composite cache key
   */
  touch(key: string): Promise<void>;

  /**
   * Delete a specific cache entry.
   * @param key - Composite cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cached entries.
   * Useful for testing or user-initiated cache clearing.
   */
  clear(): Promise<void>;

  /**
   * Get all entries (useful for debugging/inspection).
   * @returns Array of all cached entries
   */
  getAll(): Promise<ToolQueryCacheEntry[]>;
}

/**
 * In-memory cache store implementation for testing.
 * Does not persist across reloads.
 */
export class InMemoryToolCacheStore implements IToolCacheStore {
  private cache: Map<string, ToolQueryCacheEntry> = new Map();

  async get(key: string): Promise<ToolQueryCacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(entry: ToolQueryCacheEntry): Promise<void> {
    this.cache.set(entry.key, entry);
  }

  async touch(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastUsedAt = new Date().toISOString();
      this.cache.set(key, entry);
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async getAll(): Promise<ToolQueryCacheEntry[]> {
    return Array.from(this.cache.values());
  }
}
