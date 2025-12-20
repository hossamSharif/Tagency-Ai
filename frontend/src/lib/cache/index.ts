/**
 * Data Caching Utilities
 *
 * Provides caching layer for server-side data fetching
 * Uses Next.js unstable_cache for server-side caching
 * and a simple in-memory cache for client-side deduplication
 */

import { unstable_cache } from 'next/cache';

// Cache tags for invalidation
export const CACHE_TAGS = {
  packages: 'packages',
  customers: 'customers',
  bookings: 'bookings',
  invoices: 'invoices',
  payments: 'payments',
  partners: 'partners',
  settlements: 'settlements',
  notifications: 'notifications',
  auditLogs: 'audit-logs',
  reports: 'reports',
  tenant: 'tenant',
  user: 'user',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Cache durations in seconds
export const CACHE_DURATIONS = {
  short: 60, // 1 minute - for frequently changing data
  medium: 300, // 5 minutes - for moderately changing data
  long: 3600, // 1 hour - for rarely changing data
  day: 86400, // 24 hours - for static data
} as const;

/**
 * Create a cached server function with automatic tags
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: {
    tags: CacheTag[];
    revalidate?: number;
    keyPrefix?: string;
  }
): (...args: TArgs) => Promise<TResult> {
  const { tags, revalidate = CACHE_DURATIONS.medium, keyPrefix = 'cache' } = options;

  return unstable_cache(fn, [keyPrefix, ...tags], {
    tags,
    revalidate,
  });
}

/**
 * Simple in-memory cache for client-side request deduplication
 * Useful for preventing duplicate requests in a short time window
 */
class RequestCache {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly maxAge: number;

  constructor(maxAgeMs: number = 5000) {
    this.maxAge = maxAgeMs;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.maxAge;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or fetch data with automatic caching
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data);
    return data;
  }
}

// Singleton instance for client-side request deduplication
export const requestCache = new RequestCache(5000); // 5 second cache

/**
 * Create a cache key from tenant ID and additional parts
 */
export function createCacheKey(tenantId: string, ...parts: (string | number | undefined)[]): string {
  return [tenantId, ...parts.filter(Boolean)].join(':');
}

/**
 * SWR-like fetcher wrapper with built-in error handling
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    dedupe?: boolean;
    maxAge?: number;
  } = {}
): Promise<T> {
  const { dedupe = true, maxAge = 5000 } = options;

  if (dedupe) {
    const cache = new RequestCache(maxAge);
    return cache.getOrFetch(key, fetcher);
  }

  return fetcher();
}

/**
 * Batch multiple requests to prevent N+1 queries
 */
export class RequestBatcher<TKey, TResult> {
  private pending: Map<TKey, Promise<TResult>> = new Map();
  private batch: TKey[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchFn: (keys: TKey[]) => Promise<Map<TKey, TResult>>;
  private readonly delay: number;

  constructor(
    batchFn: (keys: TKey[]) => Promise<Map<TKey, TResult>>,
    delay: number = 10
  ) {
    this.batchFn = batchFn;
    this.delay = delay;
  }

  async load(key: TKey): Promise<TResult> {
    // Check if already pending
    const existing = this.pending.get(key);
    if (existing) return existing;

    // Add to batch
    this.batch.push(key);

    // Create promise for this key
    const promise = new Promise<TResult>((resolve, reject) => {
      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(async () => {
          const batch = [...this.batch];
          this.batch = [];
          this.batchTimeout = null;

          try {
            const results = await this.batchFn(batch);
            batch.forEach((k) => {
              const result = results.get(k);
              if (result !== undefined) {
                this.pending.delete(k);
              }
            });
          } catch (error) {
            batch.forEach((k) => this.pending.delete(k));
          }
        }, this.delay);
      }

      // Store resolver to be called by batch execution
      const checkResult = setInterval(() => {
        if (!this.pending.has(key)) {
          clearInterval(checkResult);
          // Result was resolved by batch
        }
      }, 5);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkResult);
        reject(new Error('Request timeout'));
      }, 30000);
    });

    this.pending.set(key, promise);
    return promise;
  }
}
