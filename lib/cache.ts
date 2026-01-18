/**
 * Client-Side Cache with Safe Invalidation (localStorage-based)
 * 
 * Implements persistent caching for blog, markers, packages with TTL and invalidation
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private prefix = 'app_cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data from localStorage if valid
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        // Expired, remove it
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      // Invalid cache entry, remove it
      try {
        localStorage.removeItem(`${this.prefix}${key}`);
      } catch (e) {
        // Ignore errors during cleanup
      }
      return null;
    }
  }

  /**
   * Set cache entry in localStorage
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));
    } catch (error) {
      // localStorage quota exceeded or disabled
      console.warn(`Failed to cache ${key}:`, error);
    }
  }

  /**
   * Check if cache exists and is valid (without getting data)
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): void {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      const keys: string[] = [];
      
      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const cacheKey = key.replace(this.prefix, '');
          if (regex.test(cacheKey)) {
            keys.push(key);
          }
        }
      }

      // Remove matching keys
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys: string[] = [];
      
      // Get all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }

      // Remove all cache keys
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Get cache size (number of cached entries)
   */
  size(): number {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      return 0;
    }
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

// Cache TTLs (in milliseconds) - MANDATORY client-side cache
export const CACHE_TTL = {
  BLOG_POSTS: 10 * 60 * 1000,      // 10 minutes
  BLOG_CATEGORIES: 30 * 60 * 1000,  // 30 minutes
  MARKERS: 60 * 60 * 1000,          // 1 hour
  PACKAGES: 60 * 60 * 1000,         // 1 hour
} as const;
