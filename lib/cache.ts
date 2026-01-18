/**
 * Client-Side Cache with Safe Invalidation
 * 
 * Implements caching for blog, markers, packages with TTL and invalidation
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
  BLOG_HOMEPAGE: 'blog:homepage',
  MARKERS: 'markers:all',
  PACKAGES: 'packages:active',
  BLOG_POSTS: 'blog:posts',
  BLOG_CATEGORIES: 'blog:categories',
} as const;

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  BLOG: 10 * 60 * 1000, // 10 minutes
  MARKERS: 15 * 60 * 1000, // 15 minutes
  PACKAGES: 30 * 60 * 1000, // 30 minutes
} as const;
