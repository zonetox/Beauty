/**
 * Cache Manager - Unified caching strategy for React Context
 * 
 * Features:
 * - In-memory cache with TTL (Time To Live)
 * - localStorage persistence option
 * - Cache invalidation helpers
 * - TypeScript support
 * 
 * Usage:
 * const cache = new CacheManager('businessData', 5 * 60 * 1000); // 5 minutes TTL
 * 
 * // Get or set
 * const data = cache.get() || await fetchData();
 * cache.set(data);
 * 
 * // Invalidate
 * cache.clear();
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager<T> {
  private cacheKey: string;
  private ttl: number;
  private memoryCache: CacheEntry<T> | null = null;
  private useLocalStorage: boolean;

  /**
   * Initialize cache manager
   * @param cacheKey - Unique identifier for this cache (also used for localStorage)
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   * @param useLocalStorage - Whether to persist to localStorage (default: true)
   */
  constructor(cacheKey: string, ttl: number = 5 * 60 * 1000, useLocalStorage: boolean = true) {
    this.cacheKey = `cache_${cacheKey}`;
    this.ttl = ttl;
    this.useLocalStorage = useLocalStorage;
    this.loadFromStorage();
  }

  /**
   * Get cached data if valid, return null if expired
   */
  get(): T | null {
    // Check memory cache first
    if (this.memoryCache && !this.isExpired(this.memoryCache)) {
      return this.memoryCache.data;
    }

    // Check localStorage if enabled
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.cacheKey);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (!this.isExpired(entry)) {
            // Restore to memory cache
            this.memoryCache = entry;
            return entry.data;
          }
        }
      } catch (e) {
        console.warn(`Failed to load cache ${this.cacheKey} from localStorage:`, e);
      }
    }

    return null;
  }

  /**
   * Set cache data
   */
  set(data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: this.ttl
    };

    // Store in memory
    this.memoryCache = entry;

    // Store in localStorage if enabled
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.cacheKey, JSON.stringify(entry));
      } catch (e) {
        console.warn(`Failed to save cache ${this.cacheKey} to localStorage:`, e);
      }
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.memoryCache = null;
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.cacheKey);
      } catch (e) {
        console.warn(`Failed to clear cache ${this.cacheKey} from localStorage:`, e);
      }
    }
  }

  /**
   * Check if cache exists and is valid
   */
  isValid(): boolean {
    const data = this.memoryCache || this.loadFromStorageSync();
    return data !== null && !this.isExpired(data);
  }

  /**
   * Get remaining TTL in milliseconds
   */
  getRemainingTTL(): number {
    if (!this.memoryCache) return 0;
    const elapsed = Date.now() - this.memoryCache.timestamp;
    const remaining = Math.max(0, this.memoryCache.ttl - elapsed);
    return remaining;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(): number {
    if (!this.memoryCache) return -1;
    return Date.now() - this.memoryCache.timestamp;
  }

  /**
   * Force invalidation after specified time
   * Useful for scheduled cache refresh
   */
  setRefreshTimer(callback: () => void): () => void {
    const timer = setTimeout(() => {
      this.clear();
      callback();
    }, this.ttl);

    // Return cleanup function
    return () => clearTimeout(timer);
  }

  /**
   * Private: Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Private: Load from storage synchronously
   */
  private loadFromStorageSync(): CacheEntry<T> | null {
    if (this.useLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.cacheKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        // Silently fail
      }
    }
    return null;
  }

  /**
   * Private: Load from storage asynchronously
   */
  private loadFromStorage(): void {
    const data = this.loadFromStorageSync();
    if (data) {
      this.memoryCache = data;
    }
  }
}

/**
 * Create a cache-enabled async function wrapper
 * 
 * Usage:
 * const cachedFetch = withCache(
 *   async () => await fetchBusinesses(),
 *   'businessesData',
 *   5 * 60 * 1000 // 5 minutes
 * );
 * 
 * const data = await cachedFetch(); // First call fetches, caches result
 * const data2 = await cachedFetch(); // Second call returns cached result
 */
export function withCache<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  ttl: number = 5 * 60 * 1000,
  useLocalStorage: boolean = true
): () => Promise<T> {
  const cache = new CacheManager<T>(cacheKey, ttl, useLocalStorage);

  return async () => {
    // Return cached data if available
    const cached = cache.get();
    if (cached !== null) {
      return cached;
    }

    // Fetch new data
    const data = await fetcher();

    // Cache the result
    cache.set(data);

    return data;
  };
}

/**
 * Create cache manager for a specific context
 * Centralized place to manage all cache instances
 */
export const createContextCache = {
  // Homepage cache (5-10 minutes)
  homepage: () => new CacheManager('homepage', 7 * 60 * 1000),
  
  // Business directory cache (5-10 minutes)
  businesses: () => new CacheManager('businessesData', 10 * 60 * 1000),
  
  // Business detail cache (10 minutes per business)
  businessDetail: (slug: string) => new CacheManager(`businessDetail_${slug}`, 10 * 60 * 1000),
  
  // Blog posts cache (15 minutes)
  blogPosts: () => new CacheManager('blogPostsData', 15 * 60 * 1000),
  
  // Blog categories cache (30 minutes - less frequently changes)
  blogCategories: () => new CacheManager('blogCategoriesData', 30 * 60 * 1000),
  
  // Membership packages cache (30 minutes - rarely changes)
  packages: () => new CacheManager('membershipPackagesData', 30 * 60 * 1000),
  
  // Map markers cache (10 minutes)
  markers: () => new CacheManager('businessMarkersData', 10 * 60 * 1000),
  
  // Search results cache (5 minutes - user-specific)
  search: (searchKey: string) => new CacheManager(`search_${searchKey}`, 5 * 60 * 1000),
};

/**
 * Global cache invalidation
 * Call this when data changes (e.g., after creating/updating/deleting business)
 */
export function invalidateRelatedCaches(...cacheKeys: string[]): void {
  cacheKeys.forEach(key => {
    try {
      const cacheKey = `cache_${key}`;
      localStorage.removeItem(cacheKey);
    } catch (e) {
      console.warn(`Failed to invalidate cache ${key}:`, e);
    }
  });
}

/**
 * Batch invalidate common cache keys
 */
export const invalidateCacheBatches = {
  // When a business is created/updated/deleted
  business: () => {
    invalidateRelatedCaches(
      'businessesData',
      'businessMarkersData',
      'homepage',
      'search_general' // generic search
    );
  },

  // When blog data changes
  blog: () => {
    invalidateRelatedCaches(
      'blogPostsData',
      'blogCategoriesData',
      'homepage'
    );
  },

  // When packages change
  packages: () => {
    invalidateRelatedCaches(
      'membershipPackagesData',
      'homepage'
    );
  },

  // Full cache clear
  all: () => {
    if (typeof window !== 'undefined') {
      const keysToDelete = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keysToDelete.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove cache key ${key}:`, e);
        }
      });
    }
  }
};
