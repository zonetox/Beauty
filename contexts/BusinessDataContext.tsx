
import { createContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Business, BlogPost, BlogComment, BlogCategory, MembershipPackage, Service, MediaItem, TeamMember, Deal, MediaType, Review } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { uploadFile } from '../lib/storage.ts';
import { toSnakeCase } from '../lib/utils.ts';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../lib/cache.ts';

// Optional admin logging - injected via props or context to avoid circular dependency
// AdminContext will be provided via App.tsx provider hierarchy, accessed at runtime

// --- CACHE CONSTANTS ---
// const PUBLIC_DATA_CACHE_KEY = 'publicDataCache';
// const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes (unused)


// --- CONTEXT TYPE DEFINITION ---
export interface PublicDataContextType {
  // Business Data
  businesses: Business[];
  businessMarkers: { id: number, name: string, latitude: number, longitude: number, categories: string[], is_active: boolean }[];
  businessLoading: boolean;
  totalBusinesses: number;
  currentPage: number;
  fetchBusinesses: (page?: number, options?: { search?: string, location?: string, district?: string, category?: string }) => Promise<void>;
  addBusiness: (newBusiness: Business) => Promise<Business | null>;
  updateBusiness: (updatedBusiness: Business) => Promise<void>;
  deleteBusiness: (business_id: number) => Promise<void>;
  getBusinessBySlug: (slug: string) => Business | undefined;
  fetchBusinessBySlug: (slug: string) => Promise<Business | null>;
  incrementBusinessview_count: (business_id: number) => Promise<void>;
  // Service Data
  addService: (newServiceData: Omit<Service, 'id' | 'position'>) => Promise<void>;
  updateService: (updatedService: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  updateServicesOrder: (orderedServices: Service[]) => Promise<void>;
  // Media/Gallery Data
  addMediaItem: (file: File, business_id: number) => Promise<void>;
  updateMediaItem: (updatedItem: MediaItem) => Promise<void>;
  deleteMediaItem: (itemToDelete: MediaItem) => Promise<void>;
  updateMediaOrder: (orderedMedia: MediaItem[]) => Promise<void>;
  // Team Data
  addTeamMember: (newMemberData: Omit<TeamMember, 'id'>) => Promise<void>;
  updateTeamMember: (updatedMember: TeamMember) => Promise<void>;
  deleteTeamMember: (memberId: string) => Promise<void>;
  // Deal Data
  addDeal: (newDealData: Omit<Deal, 'id'>) => Promise<void>;
  updateDeal: (updatedDeal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  // Blog Data
  blogPosts: BlogPost[];
  blogLoading: boolean;
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'view_count'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (post_id: number) => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementBlogview_count: (post_id: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsBypost_id: (post_id: number) => BlogComment[];
  addComment: (post_id: number, author_name: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => Promise<void>;
  updateBlogCategory: (id: string, name: string) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
  // Membership Packages
  packages: MembershipPackage[];
  addPackage: (newPackage: Omit<MembershipPackage, 'id'>) => Promise<void>;
  updatePackage: (package_id: string, updates: Partial<MembershipPackage>) => Promise<void>;
  deletePackage: (package_id: string) => Promise<void>;
}

// Export context so hooks file can use it
export const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

const COMMENTS_LOCAL_STORAGE_KEY = 'blog_comments';


export function PublicDataProvider({ children }: { children: ReactNode }) {
  // Initialize with cached data immediately if available
  // This ensures page renders immediately without blocking
  const getInitialCachedData = () => {
    const cachedBlogPosts = cacheManager.get<BlogPost[]>(CACHE_KEYS.BLOG_POSTS);
    const cachedCategories = cacheManager.get<BlogCategory[]>(CACHE_KEYS.BLOG_CATEGORIES);
    const cachedMarkers = cacheManager.get<any[]>(CACHE_KEYS.MARKERS);
    const cachedPackages = cacheManager.get<MembershipPackage[]>(CACHE_KEYS.PACKAGES);

    return {
      blogPosts: cachedBlogPosts || [],
      categories: cachedCategories || [],
      markers: cachedMarkers || [],
      packages: cachedPackages || [],
      hasCache: !!(cachedBlogPosts || cachedCategories || cachedMarkers || cachedPackages)
    };
  };

  const initialCache = getInitialCachedData();

  // --- STATES ---
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessMarkers, setBusinessMarkers] = useState<{ id: number, name: string, latitude: number, longitude: number, categories: string[], is_active: boolean }[]>(initialCache.markers);
  // Start with loading false if we have cached data (page can render immediately)
  const [businessLoading, setBusinessLoading] = useState(!initialCache.hasCache);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Prevent double fetch in React.StrictMode (development)
  const hasFetchedRef = useRef(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialCache.blogPosts);
  // Start with loading false if we have cached data (page can render immediately)
  const [blogLoading, setBlogLoading] = useState(!initialCache.hasCache);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>(initialCache.categories);
  const [packages, setPackages] = useState<MembershipPackage[]>(initialCache.packages);

  // Admin logging is optional - removed direct import to avoid circular dependency
  // Admin actions will be logged via AdminContext if available in the provider tree
  // This is handled at a higher level (App.tsx) where both contexts are available
  // const logAdminAction = () => { };
  // const currentAdmin = null; 
  /* const _unused = { logAdminAction: () => { }, currentAdmin: null }; */ // Silent unused vars

  // --- DATA FETCHING ---
  /**
   * Fetches businesses with pagination and optional filters
   * @param page - Page number (1-indexed)
   * @param options - Search and filter options
   * @returns Promise that resolves when fetch completes
   */
  const fetchBusinesses = useCallback(async (page: number = 1, options: {
    search?: string,
    location?: string,
    district?: string,
    category?: string
  } = {}): Promise<void> => {
    if (!isSupabaseConfigured) return;

    setBusinessLoading(true);
    const from = (page - 1) * PAGE_SIZE;

    try {
      // Use advanced RPC function for search with filters and pagination
      // This function supports: search text, category, city, district, tags, limit, offset
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_businesses_advanced', {
          p_search_text: (options.search && options.search.trim() ? options.search.trim() : null) as any,
          p_category: (options.category || null) as any,
          p_city: (options.location || null) as any,
          p_district: (options.district || null) as any,
          p_tags: undefined as string[] | undefined, // Tags filter not used in current frontend, but supported
          p_limit: PAGE_SIZE,
          p_offset: from
        });

      if (searchError) {
        console.error('Error searching businesses:', searchError.message);
        // Don't show toast during initial load - only show on user-initiated searches
        if (options.search || options.category || options.location) {
          toast.error('Lỗi tìm kiếm: ' + searchError.message);
        } else {
          console.error('Error searching businesses:', searchError.message);
        }
        // Fallback to regular query
      } else if (searchData && searchData.length > 0) {
        // search_businesses_advanced returns partial data, fetch full business data
        // IMPORTANT: Preserve database ranking order - do NOT sort results
        // Results from search_businesses_advanced are already sorted by final_score DESC
        // OPTIMIZE: Directory listing doesn't need full description, only summary fields
        interface SearchResult {
          id: number;
          [key: string]: unknown;
        }
        const business_ids = (searchData as SearchResult[]).map((b) => b.id);
        const { data: fullData, error: fetchError } = await supabase
          .from('businesses')
          .select('id, slug, name, logo_url, image_url, slogan, categories, address, city, district, ward, tags, phone, email, website, rating, review_count, view_count, membership_tier, is_verified, is_active, is_featured, joined_date, description, working_hours, socials, seo, hero_slides, hero_image_url, owner_id, landing_page_config, trust_indicators, staff, notification_settings', { count: 'exact' })
          .in('id', business_ids);

        // Preserve order from search_businesses_advanced (ranked by final_score)
        // Map results in the same order as searchData
        const orderedFullData = business_ids
          .map(id => fullData?.find(b => b.id === id))
          .filter((b): b is NonNullable<typeof b> => b !== undefined);

        if (fetchError) {
          console.error('Error fetching business details:', fetchError.message);
          toast.error('Failed to load businesses');
        } else if (orderedFullData && orderedFullData.length > 0) {
          const mapped = (orderedFullData as unknown as Business[]).map((b) => ({
            ...(b as Business),
            services: [],
            gallery: [],
            team: [],
            deals: [],
            reviews: []
          })) as Business[];

          setBusinesses(mapped);

          // Get total count using COUNT query instead of calling RPC function twice
          // This is much faster than fetching 10000 records just to count them
          // OPTIMIZE: Count query only needs id field
          const countStartTime = performance.now();
          let countQuery = supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('is_active', true);
          if (options.category) countQuery = countQuery.contains('categories', [options.category]);
          if (options.location) countQuery = countQuery.eq('city', options.location);
          if (options.district) countQuery = countQuery.eq('district', options.district);
          if (options.search && options.search.trim()) {
            countQuery = countQuery.or(`name.ilike.%${options.search.trim()}%,description.ilike.%${options.search.trim()}%`);
          }

          const { count, error: countError } = await countQuery;
          const countDuration = performance.now() - countStartTime;
           
          if (import.meta.env.MODE === 'development') console.warn(`[PERF] Businesses Count: ${countDuration.toFixed(2)}ms`);
          if (!countError && count !== null) {
            setTotalBusinesses(count);
          } else {
            // Fallback to mapped length if count query fails
            setTotalBusinesses(mapped.length);
          }

          setCurrentPage(page);
          setBusinessLoading(false);
          return;
        }
      } else {
        // No search results found (including when no search text but filters applied)
        setBusinesses([]);
        setTotalBusinesses(0);
        setCurrentPage(page);
        setBusinessLoading(false);
        return;
      }

      // Regular query (fallback or no search text)
      const to = from + PAGE_SIZE - 1;
      let query = supabase.from('businesses')
        .select('*', { count: 'exact' });

      // Apply filters if any
      if (options.location) query = query.eq('city', options.location);
      if (options.district) query = query.eq('district', options.district);
      if (options.category) query = query.contains('categories', [options.category]);
      if (options.search) query = query.ilike('name', `%${options.search}%`);

      const { data, count, error } = await query
        .order('is_featured', { ascending: false })
        .order('id', { ascending: true })
        .range(from, to);

      if (error) {
         
        if (import.meta.env.MODE === 'development') console.warn('Error fetching search results (best-effort):', error.message);
        // Fallback to cache or empty if search fails
        // toast.error('Failed to load businesses');
      } else if (data) {
        const mapped = (data as Business[]).map((b) => ({
          ...(b as Business),
          services: [],
          gallery: [],
          team: [],
          deals: [],
          reviews: []
        })) as Business[];

        setBusinesses(mapped);
        if (count !== null) setTotalBusinesses(count);
        setCurrentPage(page);
      }
    } catch (error: unknown) {
      console.error('Unexpected error fetching businesses:', error);
      // Don't show toast during initial load - silent fail with cache fallback
      // Only show toast for user-initiated fetches (when page > 1 or has search options)
      if (page > 1 || options.search || options.category || options.location) {
        toast.error('Failed to load businesses');
      }
    }
    setBusinessLoading(false);
  }, []);

  // CRITICAL DATA: Fetch only featured businesses for homepage initial render
  const fetchCriticalData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setBusinessLoading(false);
      return;
    }

    try {
      setBusinessLoading(true);

      // Only fetch featured businesses for homepage initial render (limit to 10-20 for performance)
      // OPTIMIZE: Select only fields needed for homepage display
      const [businessesResult, countResult] = await Promise.all([
        supabase.from('businesses')
          .select('id, slug, name, logo_url, image_url, slogan, categories, address, city, district, ward, tags, phone, email, website, rating, review_count, view_count, membership_tier, is_verified, is_active, is_featured, joined_date, description, working_hours, socials, seo, hero_slides, hero_image_url, owner_id, landing_page_config, trust_indicators, staff, notification_settings', { count: 'exact' })
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('id', { ascending: true })
          .limit(20),
        supabase.from('businesses')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('is_featured', true)
      ]);

      if (businessesResult.error) {
        console.error('Error fetching critical businesses:', businessesResult.error);
        setBusinesses([]);
        setTotalBusinesses(0);
      } else if (businessesResult.data) {
        const mapped = (businessesResult.data as any[]).map((b) => ({
          ...(b as Business),
          services: [],
          gallery: [],
          team: [],
          deals: [],
          reviews: []
        })) as Business[];
        setBusinesses(mapped);
        setTotalBusinesses(countResult.count || 0);
      }
    } catch (error: unknown) {
      console.error('Error in fetchCriticalData:', error);
      setBusinesses([]);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  /**
   * NON-CRITICAL DATA: Lazy-load blog posts, categories, markers, packages, and all businesses
   * MANDATORY: If cached data exists → NEVER fetch on page load, only refresh in background
   * Cached data is already loaded in initial state, so loading is already false
   * @param backgroundRefresh - If true, fetch even if cache exists
   * @returns Promise that resolves when fetch completes
   */
  const fetchNonCriticalData = useCallback(async (backgroundRefresh = false): Promise<void> => {
    if (!isSupabaseConfigured) {
      setBlogLoading(false);
      return;
    }

    // MANDATORY RULE: If cached data exists and not background refresh → use cache, skip fetch
    // Note: Cached data is already loaded in initial state, so we only need to check if we should fetch
    const cachedBlogPosts = cacheManager.get<BlogPost[]>(CACHE_KEYS.BLOG_POSTS);
    const cachedCategories = cacheManager.get<BlogCategory[]>(CACHE_KEYS.BLOG_CATEGORIES);
    const cachedMarkers = cacheManager.get<any[]>(CACHE_KEYS.MARKERS);
    const cachedPackages = cacheManager.get<MembershipPackage[]>(CACHE_KEYS.PACKAGES);

    // If all cached and not background refresh, return early (no fetch on page load)
    if (!backgroundRefresh && cachedBlogPosts && cachedCategories && cachedMarkers && cachedPackages) {
      // Background refresh in next tick (non-blocking)
      setTimeout(() => {
        fetchNonCriticalData(true);
      }, 0);
      return;
    }

    // Fetch data (either no cache, or background refresh)
    // Only set loading if we don't have cached data (to avoid flicker)
    try {
      if (!backgroundRefresh && !cachedBlogPosts) {
        setBlogLoading(true);
      }

      // Create all query promises for non-critical data
      const allBusinessesPromise = fetchBusinesses(1).catch(e => {
        console.warn('All businesses fetch error:', e);
        return null;
      });

      const markerPromise = supabase.from('businesses')
        .select('id, name, latitude, longitude, categories, is_active')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(2000);

      // OPTIMIZE: Homepage doesn't need full content, only excerpt
      const blogPromise = supabase.from('blog_posts')
        .select('id, slug, title, image_url, excerpt, author, date, category, view_count, status, is_featured, seo')
        .eq('status', 'Published')
        .order('date', { ascending: false })
        .order('id', { ascending: false })
        .limit(50);

      const catPromise = supabase.from('blog_categories')
        .select('id, name')
        .order('name');

      const pkgPromise = supabase.from('membership_packages')
        .select('id, name, description, price, duration_months, features, is_active')
        .eq('is_active', true)
        .order('price');

      // Timeout policy: Each request has its own specific timeout (no shared timeout)
      const TIMEOUTS = {
        BUSINESSES: 10000,  // 10 seconds
        BLOG: 10000,        // 10 seconds
        MARKERS: 12000,     // 12 seconds
        PACKAGES: 8000,     // 8 seconds
      };

      const createTimeoutPromise = (timeoutMs: number, rejectMsg: string) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error(rejectMsg)), timeoutMs));

      /**
       * Measures query execution time and handles timeouts
       * @param name - Query name for logging
       * @param queryPromise - The query promise to measure
       * @param timeoutMs - Timeout in milliseconds
       * @returns The query result
       */
      const measureQuery = async <T,>(name: string, queryPromise: Promise<T> | any, timeoutMs: number): Promise<T> => {
        const startTime = performance.now();
        try {
          const result = await Promise.race([queryPromise, createTimeoutPromise(timeoutMs, `${name} timeout`)]);
          const duration = performance.now() - startTime;
           
          console.warn(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
          return result as T;
        } catch (error: unknown) {
          // Silent timeout - has fallback to cache/empty data
          // Only log if not a timeout error
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('timeout')) {
            const duration = performance.now() - startTime;
            console.warn(`[PERF] ${name}: ERROR after ${duration.toFixed(2)}ms`, error);
          }
          throw error;
        }
      };

      // Execute all non-critical queries in parallel with specific timeouts
      const [businessesResult, markersResult, blogResult, catResult, pkgResult] = await Promise.allSettled([
        measureQuery('All Businesses', allBusinessesPromise, TIMEOUTS.BUSINESSES),
        measureQuery('Markers', markerPromise as any, TIMEOUTS.MARKERS),
        measureQuery('Blog Posts', blogPromise as any, TIMEOUTS.BLOG),
        measureQuery('Categories', catPromise as any, TIMEOUTS.BLOG), // Same timeout as blog
        measureQuery('Packages', pkgPromise as any, TIMEOUTS.PACKAGES)
      ]);

      // Helper to check if error is a timeout
      const isTimeoutError = (error: unknown): boolean => {
        if (!error) return false;
        const msg = (error as { message?: string }).message || error.toString() || '';
        return msg.toLowerCase().includes('timeout') || msg.includes('TIMEOUT');
      };

      // Process all businesses (expand from featured only)
      if (businessesResult.status === 'fulfilled' && businessesResult.value !== null) {
        // fetchBusinesses already sets businesses and totalBusinesses
      } else if (businessesResult.status === 'rejected') {
        // Silent timeout - has fallback (cache or empty data)
        if (!isTimeoutError(businessesResult.reason)) {
          // Only log non-timeout errors (unhandled exceptions)
          console.error('All businesses fetch failed:', businessesResult.reason);
        }
      }

      // Process markers
      if (markersResult.status === 'fulfilled') {
        const markerData = markersResult.value as any;
        if (markerData?.data) {
          const markers = markerData.data as any[];
          setBusinessMarkers(markers);
          // Cache markers: 1 hour
          cacheManager.set(CACHE_KEYS.MARKERS, markers, CACHE_TTL.MARKERS);
        }
      } else {
        // Silent timeout - has fallback (cache or empty data)
        if (!isTimeoutError(markersResult.reason)) {
          console.error('Failed to fetch markers:', markersResult.reason);
        }
      }

      // Process blog posts
      interface BlogResponse {
        error: { message: string } | null;
        data: unknown;
      }
      let blogRes: BlogResponse = { error: null, data: null };
      if (blogResult.status === 'fulfilled') {
        const result = blogResult.value as BlogResponse;
        blogRes = result;
      } else {
        // Silent timeout - has fallback (cache or empty data)
        blogRes = { error: { message: 'Timeout' }, data: null };
      }

      if (blogRes.error) {
        // Only log non-timeout errors (schema mismatch, auth failure, unhandled exception)
        if (!isTimeoutError(blogRes.error)) {
          console.error("Error fetching blog posts:", blogRes.error.message);
        }
      } else if (blogRes.data) {
        const posts = blogRes.data as BlogPost[];
        setBlogPosts(posts);
        // Cache blog posts: 10 minutes
        cacheManager.set(CACHE_KEYS.BLOG_POSTS, posts, CACHE_TTL.BLOG_POSTS);
      }
      if (!backgroundRefresh) {
        setBlogLoading(false);
      }

      // Process categories
      let catRes: { error: { message: string } | null; data: unknown } = { error: null, data: null };
      if (catResult.status === 'fulfilled') {
        const result = catResult.value as any;
        catRes = result;
      } else {
        // Silent timeout - has fallback (cache or empty data)
        catRes = { error: { message: 'Timeout' }, data: null };
      }

      if (catRes.error) {
        // Only log non-timeout errors (schema mismatch, auth failure, unhandled exception)
        if (!isTimeoutError(catRes.error)) {
          console.error("Error fetching blog categories:", catRes.error.message);
        }
      } else if (catRes.data) {
        const categories = catRes.data as BlogCategory[];
        setBlogCategories(categories);
        // Cache categories: 30 minutes
        cacheManager.set(CACHE_KEYS.BLOG_CATEGORIES, categories, CACHE_TTL.BLOG_CATEGORIES);
      }

      // Process packages
      let pkgRes: { error: { message: string } | null; data: unknown } = { error: null, data: null };
      if (pkgResult.status === 'fulfilled') {
        const result = pkgResult.value as any;
        pkgRes = result;
      } else {
        // Silent timeout - has fallback (cache or empty data)
        pkgRes = { error: { message: 'Timeout' }, data: null };
      }

      if (pkgRes.error) {
        // Only log non-timeout errors (schema mismatch, auth failure, unhandled exception)
        if (!isTimeoutError(pkgRes.error)) {
          console.error("Error fetching packages:", pkgRes.error.message);
        }
      } else if (pkgRes.data) {
        const packages = pkgRes.data as MembershipPackage[];
        setPackages(packages);
        // Cache packages: 1 hour
        cacheManager.set(CACHE_KEYS.PACKAGES, packages, CACHE_TTL.PACKAGES);
      }
    } catch (error: unknown) {
      // Only log unhandled exceptions (not timeouts with fallbacks)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('timeout') && !errorMessage.includes('Timeout')) {
        console.error('Error in fetchNonCriticalData (unhandled exception):', error);
      }
      if (!backgroundRefresh) {
        setBlogLoading(false);
      }
    }
  }, [fetchBusinesses]);

  // Legacy: fetchAllPublicData for backwards compatibility (admin, other pages)
  // This fetches ALL data (critical + non-critical)
  /**
   * Fetches all public data (critical + non-critical)
   * Used for initial page load
   * @returns Promise that resolves when all data is fetched
   */
  const fetchAllPublicData = useCallback(async (): Promise<void> => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Fetch both critical and non-critical in parallel
    await Promise.all([
      fetchCriticalData(),
      fetchNonCriticalData()
    ]);
  }, [fetchCriticalData, fetchNonCriticalData]);

  // Helper to reset and refetch (for after add/update/delete operations)
  /**
   * Refetches all public data (forces refresh)
   * Used after mutations to keep data in sync
   * @returns Promise that resolves when all data is refetched
   */
  const refetchAllPublicData = useCallback(async (): Promise<void> => {
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllPublicData();
  }, [fetchAllPublicData]);

  // CRITICAL DATA: Fetch only on mount (featured businesses for homepage initial render)
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCriticalData();
  }, [fetchCriticalData]); // Only fetch critical data on mount

  // NON-CRITICAL DATA: Lazy-load after app initialization (blog posts, categories, markers, packages)
  useEffect(() => {
    // Delay non-critical data fetching until after app initialization completes
    // This prevents too many requests on app startup
    const timer = setTimeout(() => {
      fetchNonCriticalData();
    }, 2000); // 2 seconds delay to let app initialize first

    return () => clearTimeout(timer);
  }, [fetchNonCriticalData]); // Lazy-load non-critical data after app initialization

  // --- BUSINESS LOGIC ---
  /**
   * Adds a new business to the database
   * @param newBusiness - Complete business object
   * @returns Promise resolving to the created business or null if failed
   */
  const addBusiness = async (newBusiness: Business): Promise<Business | null> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add business."); return null; }
    const { id: _id, services: _services, gallery: _gallery, team: _team, deals: _deals, reviews: _reviews, ...businessData } = newBusiness;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.from('businesses').insert(toSnakeCase(businessData) as any).select().single();
    if (error) { console.error('Error adding business:', error.message); return null; }
    if (data) {
      const mappedData = data;
      await refetchAllPublicData();
      // Admin logging removed to avoid circular dependency
      // Admin actions are logged at a higher level where both contexts are available
      return mappedData as Business;
    }
    return null;
  };

  const updateBusiness = async (updatedBusiness: Business) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update business."); return; }

    // Strip relational fields and internal fields that are NOT columns in the businesses table
    // to prevent "400 Bad Request" errors from Supabase
    const {
      id,
      services: _s,
      gallery: _g,
      team: _t,
      deals: _d,
      reviews: _r,
      business_blog_posts: _b,
       
      ...businessToUpdate
    } = updatedBusiness;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('businesses').update(toSnakeCase(businessToUpdate) as any).eq('id', id);
    if (error) {
      console.error('Error updating business:', error.message);
      toast.error('Lỗi khi lưu thông tin: ' + error.message);
      throw error;
    } else {
      await refetchAllPublicData();
    }
  };

  /**
   * Deletes a business record from the database
   * @param business_id - The ID of the business to delete
   * @returns Promise that resolves when delete completes
   */
  const deleteBusiness = async (business_id: number): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete business."); return; }
    const { error } = await supabase.from('businesses').delete().eq('id', business_id);
    if (!error) await refetchAllPublicData();
  };

  /**
   * Gets a business by slug from the loaded businesses list
   * For detailed data, use fetchBusinessBySlug instead
   * @param slug - Business slug identifier
   * @returns Business object or undefined if not found
   */
  const getBusinessBySlug = (slug: string): Business | undefined => {
    return businesses.find(b => b.slug === slug);
  };

  // Use useRef to access businesses without causing function recreation
  const businessesRef = useRef(businesses);
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  /**
   * Fetches a complete business record by slug with all related data
   * Includes services, gallery, team, deals, and reviews
   * @param slug - Business slug identifier
   * @returns Promise resolving to Business object or null if not found
   */
  const fetchBusinessBySlug = useCallback(async (slug: string): Promise<Business | null> => {
    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Starting fetch for slug:', slug);

    if (!isSupabaseConfigured) {
      if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Supabase not configured, using cached data');
      // Fallback to businesses list if available
      const cached = businessesRef.current.find(b => b.slug === slug);
      return cached || null;
    }

    // 1. Fetch the main business record with selective fields
    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Fetching business data from database...');
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('id, slug, name, logo_url, image_url, slogan, categories, address, city, district, ward, latitude, longitude, tags, phone, email, website, youtube_url, rating, review_count, view_count, membership_tier, membership_expiry_date, is_verified, is_active, is_featured, joined_date, description, working_hours, socials, seo, notification_settings, hero_slides, hero_image_url, staff, owner_id')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData) {
      console.error("[fetchBusinessBySlug] Error fetching business details:", businessError?.message, businessError);
      // Fallback to cached businesses list
      const cached = businessesRef.current.find(b => b.slug === slug);
      if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Using cached data:', cached ? cached.name : 'Not found');
      return cached || null;
    }

    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Business found:', businessData.name, 'ID:', businessData.id);

    // 2. Parallel fetch for relations with selective fields
    const business_id = businessData.id;
    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Fetching related data for business ID:', business_id);
    const [servicesRes, mediaRes, teamRes, dealsRes, reviewsRes] = await Promise.all([
      supabase.from('services')
        .select('id, business_id, name, price, description, image_url, duration_minutes, position')
        .eq('business_id', business_id)
        .order('position', { ascending: true }),
      supabase.from('media_items')
        .select('id, business_id, url, type, category, title, description, position')
        .eq('business_id', business_id)
        .order('position', { ascending: true }),
      supabase.from('team_members')
        .select('id, business_id, name, role, image_url')
        .eq('business_id', business_id),
      supabase.from('deals')
        .select('id, business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status')
        .eq('business_id', business_id),
      supabase.from('reviews')
        .select('id, user_id, business_id, user_name, user_avatar_url, rating, comment, submitted_date, status, reply')
        .eq('business_id', business_id)
        .order('submitted_date', { ascending: false })
    ]);

    // Log any errors in related data
    if (servicesRes.error) console.error('[fetchBusinessBySlug] Services error:', servicesRes.error.message);
    if (mediaRes.error) console.error('[fetchBusinessBySlug] Media error:', mediaRes.error.message);
    if (teamRes.error) console.error('[fetchBusinessBySlug] Team error:', teamRes.error.message);
    if (dealsRes.error) console.error('[fetchBusinessBySlug] Deals error:', dealsRes.error.message);
    if (reviewsRes.error) console.error('[fetchBusinessBySlug] Reviews error:', reviewsRes.error.message);

    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Related data counts:', {
      services: servicesRes.data?.length || 0,
      media: mediaRes.data?.length || 0,
      team: teamRes.data?.length || 0,
      deals: dealsRes.data?.length || 0,
      reviews: reviewsRes.data?.length || 0
    });

    // 3. Assemble full object
    const fullBusiness: Business = {
      ...(businessData as unknown as Business),
      services: (servicesRes.data || []) as unknown as Service[],
      gallery: (mediaRes.data || []) as unknown as MediaItem[], // Map to 'gallery'
      team: (teamRes.data || []) as unknown as TeamMember[],
      deals: (dealsRes.data || []) as unknown as Deal[],
      reviews: (reviewsRes.data || []) as unknown as Review[]
    };

    if (import.meta.env.MODE === 'development') console.warn('[fetchBusinessBySlug] Full business object assembled:', fullBusiness.name, {
      servicesCount: fullBusiness.services?.length || 0,
      galleryCount: fullBusiness.gallery?.length || 0,
      dealsCount: fullBusiness.deals?.length || 0,
      reviewsCount: fullBusiness.reviews?.length || 0
    });

    return fullBusiness;
  }, [isSupabaseConfigured]); // Remove businesses dependency to prevent function recreation

  // D2.2 FIX: Use safe RPC function for view count increment
  const incrementBusinessview_count = async (business_id: number) => {
    if (!isSupabaseConfigured) return; // Silent fail in preview
    try {
      const { error } = await supabase.rpc('increment_business_view_count', { p_business_id: business_id });
      if (error) {
        // CRITICAL: Tracking failures are silent - only debug log in development
        if (import.meta.env.MODE === 'development') {
           
          console.warn('[Tracking] Business view count increment failed (best-effort):', error.message);
        }
      } else {
        // Optimistically update UI
        setBusinesses(prev => prev.map((b: any) => b.id === business_id ? { ...b, view_count: (b.view_count || 0) + 1 } : b));
      }
    } catch (error) {
      // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
      if (import.meta.env.MODE === 'development') {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('[Tracking] Business view count increment failed (best-effort):', errorMessage);
      }
      // NEVER rethrow - tracking must never affect app flow
    }
  };

  // --- SERVICES LOGIC ---
  /**
   * Adds a new service to a business
   * @param newServiceData - Service data without id and position
   * @returns Promise that resolves when service is added
   * @throws Error if Supabase is not configured or operation fails
   */
  const addService = async (newServiceData: Omit<Service, 'id' | 'position'>): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot add service.");
      throw new Error("Preview Mode: Cannot add service.");
    }
    const currentServices = businesses.find(b => b.id === newServiceData.business_id)?.services || [];
    const newPosition = currentServices.length > 0 ? Math.max(...currentServices.map(s => s.position)) + 1 : 1;
    const { error } = await supabase.from('services').insert({ ...toSnakeCase(newServiceData), position: newPosition });
    if (error) {
      console.error("Error adding service:", error.message);
      toast.error(`Failed to add service: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
  };

  const updateService = async (updatedService: Service) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update service.");
      throw new Error("Preview Mode: Cannot update service.");
    }
    const { id, ...serviceToUpdate } = updatedService;
    const { error } = await supabase.from('services').update(toSnakeCase(serviceToUpdate)).eq('id', id);
    if (error) {
      console.error("Error updating service:", error.message);
      toast.error(`Failed to update service: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
  };

  /**
   * Deletes a service
   * @param serviceId - Service ID to delete
   * @returns Promise that resolves when deletion completes
   * @throws Error if Supabase is not configured or operation fails
   */
  const deleteService = async (serviceId: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot delete service.");
      throw new Error("Preview Mode: Cannot delete service.");
    }
    // Get service to delete image
    const serviceToDelete = businesses
      .flatMap(b => b.services || [])
      .find(s => s.id === serviceId);

    // Delete service from database
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      console.error("Error deleting service:", error.message);
      toast.error(`Failed to delete service: ${error.message}`);
      throw error;
    }

    // Delete image from Storage if exists
    if (serviceToDelete?.image_url && serviceToDelete.image_url.startsWith('http')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('business-gallery', serviceToDelete.image_url);
      } catch (deleteError) {
        // Log but don't fail the delete operation
        console.warn('Failed to delete service image from storage:', deleteError);
      }
    }

    await fetchAllPublicData();
  };

  /**
   * Updates the order/position of services
   * @param orderedServices - Array of services with updated positions
   * @returns Promise that resolves when order is updated
   */
  const updateServicesOrder = async (orderedServices: Service[]): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot reorder services.");
      throw new Error("Preview Mode: Cannot reorder services.");
    }
    const updates = orderedServices.map((service, index) => ({
      ...toSnakeCase(service),
      position: index + 1
    }));
    const { error } = await supabase.from('services').upsert(updates);
    if (error) {
      console.error("Error updating service order:", error.message);
      toast.error(`Failed to save service order: ${error.message}`);
      throw error;
    }
  };

  // --- MEDIA/GALLERY LOGIC ---
  /**
   * Adds a new media item (image/video) to a business gallery
   * @param file - The file to upload
   * @param business_id - Business ID
   * @returns Promise that resolves when media is added
   * @throws Error if Supabase is not configured or operation fails
   */
  const addMediaItem = async (file: File, business_id: number): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot upload media.");
      throw new Error("Preview Mode: Cannot upload media.");
    }
    // FIX: Use business-gallery bucket instead of business-assets
    const folder = `business/${business_id}/gallery`;
    const publicUrl = await uploadFile('business-gallery', file, folder);
    const isImage = file.type.startsWith('image/');
    const currentMedia = businesses.find(b => b.id === business_id)?.gallery || [];
    const newPosition = currentMedia.length > 0 ? Math.max(...currentMedia.map(m => m.position)) + 1 : 1;
    const newItem = {
      business_id: business_id,
      url: publicUrl,
      type: isImage ? MediaType.IMAGE : MediaType.VIDEO,
      title: file.name,
      position: newPosition
    };
    const { error } = await supabase.from('media_items').insert(toSnakeCase(newItem));
    if (error) {
      console.error("Error adding media item:", error.message);
      toast.error(`Failed to upload media: ${error.message}`);
      throw error;
    }
    await fetchAllPublicData();
  };

  /**
   * Updates a media item
   * @param updatedItem - Updated media item data
   * @returns Promise that resolves when update completes
   * @throws Error if Supabase is not configured or operation fails
   */
  const updateMediaItem = async (updatedItem: MediaItem): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update media.");
      throw new Error("Preview Mode: Cannot update media.");
    }
    const { id, ...itemToUpdate } = updatedItem;
    const { error } = await supabase.from('media_items').update(toSnakeCase(itemToUpdate)).eq('id', id);
    if (error) {
      console.error("Error updating media item:", error.message);
      toast.error(`Failed to update media: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
    toast.success('Media updated successfully!');
  };

  const deleteMediaItem = async (itemToDelete: MediaItem) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot delete media.");
      throw new Error("Preview Mode: Cannot delete media.");
    }
    // Delete file from Storage first
    if (itemToDelete.url && itemToDelete.url.startsWith('http')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        // FIX: Use business-gallery bucket instead of business-assets
        await deleteFileByUrl('business-gallery', itemToDelete.url);
      } catch (deleteError) {
        // Log but don't fail the delete operation
        console.warn('Failed to delete media file from storage:', deleteError);
      }
    }

    // Delete record from database
    const { error } = await supabase.from('media_items').delete().eq('id', itemToDelete.id);
    if (error) {
      console.error("Error deleting media item record:", error.message);
      toast.error(`Failed to delete media: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
    toast.success('Media deleted successfully!');
  };

  /**
   * Updates the order/position of media items
   * @param orderedMedia - Array of media items with updated positions
   * @returns Promise that resolves when order is updated
   */
  const updateMediaOrder = async (orderedMedia: MediaItem[]): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot reorder media.");
      throw new Error("Preview Mode: Cannot reorder media.");
    }
    const updates = orderedMedia.map((item, index) => ({
      ...toSnakeCase(item),
      position: index + 1
    }));
    const { error } = await supabase.from('media_items').upsert(updates);
    if (error) {
      console.error("Error updating media order:", error.message);
      toast.error(`Failed to save media order: ${error.message}`);
      throw error;
    }
  };

  const addTeamMember = async (newMemberData: Omit<TeamMember, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add team member."); return; }
    const { error } = await supabase.from('team_members').insert(toSnakeCase(newMemberData));
    if (error) console.error("Error adding team member:", error.message);
    else await refetchAllPublicData();
  };
  const updateTeamMember = async (updatedMember: TeamMember) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update team member.");
      throw new Error("Preview Mode: Cannot update team member.");
    }
    const { id, ...memberToUpdate } = updatedMember;
    const { error } = await supabase.from('team_members').update(toSnakeCase(memberToUpdate)).eq('id', id);
    if (error) {
      console.error("Error updating team member:", error.message);
      toast.error(`Failed to update team member: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
    toast.success('Team member updated successfully!');
  };
  /**
 * Deletes a team member
 * @param memberId - Team member ID to delete
 * @returns Promise that resolves when deletion completes
 */
  const deleteTeamMember = async (memberId: string): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete team member."); return; }
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) console.error("Error deleting team member:", error.message);
    else await refetchAllPublicData();
  };

  // --- DEALS LOGIC ---
  /**
   * Adds a new deal to a business
   * @param newDealData - Deal data without id
   * @returns Promise that resolves when deal is added
   * @throws Error if Supabase is not configured or operation fails
   */
  const addDeal = async (newDealData: Omit<Deal, 'id'>): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot add deal.");
      throw new Error("Preview Mode: Cannot add deal.");
    }
    const { error } = await supabase.from('deals').insert(toSnakeCase(newDealData));
    if (error) {
      console.error("Error adding deal:", error.message);
      toast.error(`Failed to add deal: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
    toast.success('Deal added successfully!');
  };

  const updateDeal = async (updatedDeal: Deal) => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot update deal.");
      throw new Error("Preview Mode: Cannot update deal.");
    }
    const { id, ...dealToUpdate } = updatedDeal;
    const { error } = await supabase.from('deals').update(toSnakeCase(dealToUpdate)).eq('id', id);
    if (error) {
      console.error("Error updating deal:", error.message);
      toast.error(`Failed to update deal: ${error.message}`);
      throw error;
    }
    await refetchAllPublicData();
    toast.success('Deal updated successfully!');
  };

  /**
   * Deletes a deal and its image from storage
   * @param dealId - Deal ID to delete
   * @returns Promise that resolves when deletion completes
   * @throws Error if Supabase is not configured or operation fails
   */
  const deleteDeal = async (dealId: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot delete deal.");
      throw new Error("Preview Mode: Cannot delete deal.");
    }
    // Get deal to delete image
    const dealToDelete = businesses
      .flatMap(b => b.deals || [])
      .find(d => d.id === dealId);

    // Delete deal from database
    const { error } = await supabase.from('deals').delete().eq('id', dealId);
    if (error) {
      console.error("Error deleting deal:", error.message);
      toast.error(`Failed to delete deal: ${error.message}`);
      throw error;
    }

    // Delete image from Storage if exists
    if (dealToDelete?.image_url && dealToDelete.image_url.startsWith('http')) {
      try {
        const { deleteFileByUrl } = await import('../lib/storage.ts');
        await deleteFileByUrl('business-gallery', dealToDelete.image_url);
      } catch (deleteError) {
        // Log but don't fail the delete operation
        console.warn('Failed to delete deal image from storage:', deleteError);
      }
    }

    await refetchAllPublicData();
    toast.success('Deal deleted successfully!');
  };

  // --- BLOG LOGIC ---
  /**
   * D2.1 FIX: Fetch comments from database instead of localStorage
   * Fetches all blog comments from the database
   * @returns Promise that resolves when comments are fetched
   */
  const fetchComments = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
        setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
      } catch (e) {
        console.error('Error loading comments from localStorage:', e);
        setComments([]);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        // Fallback to localStorage
        const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
        setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
      } else {
        // Convert database format to BlogComment format
        const formattedComments: BlogComment[] = (data || []).map((comment) => ({
          id: comment.id,
          post_id: comment.post_id,
          author_name: comment.author_name,
          author_avatar_url: '', // Not stored in DB, can be added later
          content: comment.content,
          date: comment.date || comment.created_at || new Date().toISOString(),
        }));
        setComments(formattedComments);
        // Cache in localStorage for offline/fallback
        try {
          localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(formattedComments));
        } catch (e) {
          console.warn('Failed to cache comments:', e);
        }
      }
    } catch (error) {
      console.error('Error in fetchComments:', error);
      // Fallback to localStorage
      try {
        const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
        setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
      } catch (e) {
        setComments([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /**
   * Adds a new blog post
   * @param newPostData - Blog post data without id, slug, date, view_count
   * @returns Promise that resolves when post is added
   */
  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'view_count'>): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add blog post."); return; }
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = {
      ...newPostData,
      slug: slug,
      view_count: 0,
      date: new Date().toISOString()
    };
    const { error } = await supabase.from('blog_posts').insert(toSnakeCase(postToAdd));
    if (!error) await refetchAllPublicData();
  };

  const updateBlogPost = async (updatedPost: BlogPost) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update blog post."); return; }
    const { error } = await supabase.from('blog_posts').update(toSnakeCase(updatedPost)).eq('id', updatedPost.id);
    if (!error) await refetchAllPublicData();
  };
  /**
   * Deletes a blog post
   * @param post_id - Post ID to delete
   * @returns Promise that resolves when deletion completes
   */
  const deleteBlogPost = async (post_id: number): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete blog post."); return; }
    const { error } = await supabase.from('blog_posts').delete().eq('id', post_id);
    if (!error) await refetchAllPublicData();
  };
  /**
   * Gets a blog post by slug from the loaded posts list
   * @param slug - Blog post slug identifier
   * @returns Blog post object or undefined if not found
   */
  const getPostBySlug = (slug: string): BlogPost | undefined => {
    return blogPosts.find(p => p.slug === slug);
  };
  // D2.2 FIX: Use safe RPC function for view count increment (already using RPC, just ensure consistency)
  const incrementBlogview_count = async (post_id: number) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase.rpc('increment_blog_view_count', { p_post_id: post_id });
      if (error) {
        // CRITICAL: Tracking failures are silent - only debug log in development
        if (import.meta.env.MODE === 'development') {
          console.warn('[Tracking] Blog view count increment failed (best-effort):', error.message);
        }
      } else {
        // Optimistically update UI
        setBlogPosts(prev => prev.map((b: any) => b.id === post_id ? { ...b, view_count: (b.view_count || 0) + 1 } : b));
      }
    } catch (error) {
      // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
      if (import.meta.env.MODE === 'development') {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('[Tracking] Blog view count increment failed (best-effort):', errorMessage);
      }
      // NEVER rethrow - tracking must never affect app flow
    }
  };
  /**
   * Gets comments for a specific blog post, sorted by date
   * @param post_id - Blog post ID
   * @returns Array of comments sorted by date (oldest first)
   */
  const getCommentsBypost_id = (post_id: number): BlogComment[] => {
    return comments
      .filter(c => c.post_id === post_id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // D2.1 FIX: Save comments to database instead of localStorage
  const addComment = async (post_id: number, author_name: string, content: string) => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      const newComment: BlogComment = {
        id: crypto.randomUUID(),
        post_id,
        author_name,
        author_avatar_url: '',
        content,
        date: new Date().toISOString(),
      };
      const updatedComments = [newComment, ...comments];
      setComments(updatedComments);
      try {
        localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(updatedComments));
      } catch (e) {
        console.error('Failed to save comment to localStorage:', e);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: post_id,
          author_name: author_name,
          author_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author_name}`,
          content: content,
          date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        // Fallback to localStorage
        const newComment: BlogComment = {
          id: crypto.randomUUID(),
          post_id,
          author_name,
          author_avatar_url: '',
          content,
          date: new Date().toISOString(),
        };
        const updatedComments = [newComment, ...comments];
        setComments(updatedComments);
        try {
          localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(updatedComments));
        } catch (e) {
          console.error('Failed to save comment to localStorage:', e);
        }
      } else if (data) {
        // Convert database format to BlogComment format
        const newComment: BlogComment = {
          id: data.id,
          post_id: data.post_id,
          author_name: data.author_name,
          author_avatar_url: (data as any).author_avatar_url || '',
          content: data.content,
          date: data.date || data.created_at || new Date().toISOString(),
        };
        const updatedComments = [newComment, ...comments];
        setComments(updatedComments);
        // Cache in localStorage for offline/fallback
        try {
          localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(updatedComments));
        } catch (e) {
          console.warn('Failed to cache comments:', e);
        }
        toast.success('Bình luận đã được gửi');
      }
    } catch (error) {
      console.error('Error in addComment:', error);
      // Fallback to localStorage
      const newComment: BlogComment = {
        id: crypto.randomUUID(),
        post_id,
        author_name,
        author_avatar_url: '',
        content,
        date: new Date().toISOString(),
      };
      const updatedComments = [newComment, ...comments];
      setComments(updatedComments);
      try {
        localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(updatedComments));
      } catch (e) {
        console.error('Failed to save comment to localStorage:', e);
      }
    }
  };

  const addBlogCategory = async (name: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot add category.");
      throw new Error("Preview Mode: Cannot add category.");
    }

    // Validate input (should already be validated in component, but double-check)
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Tên danh mục không được để trống.");
      throw new Error("Category name cannot be empty.");
    }

    // Check for duplicate (case-insensitive, trim both sides)
    const isDuplicate = blogCategories.some(
      c => c.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`Danh mục "${trimmedName}" đã tồn tại.`);
      throw new Error("Category name is duplicate.");
    }

    // Insert to database
    const { error } = await supabase.from('blog_categories').insert({ name: trimmedName });

    if (error) {
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        toast.error(`Danh mục "${trimmedName}" đã tồn tại trong database.`);
      } else {
        toast.error(`Không thể thêm danh mục: ${error.message}`);
      }
      throw error;
    }

    // Success - refresh data and show success message
    await refetchAllPublicData();
    toast.success(`Đã thêm danh mục "${trimmedName}" thành công.`);
  };
  /**
   * Updates a blog category
   * @param id - Category ID
   * @param name - New category name
   * @returns Promise that resolves when update completes
   */
  const updateBlogCategory = async (id: string, name: string): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update category."); return; }
    const { error } = await supabase.from('blog_categories').update({ name }).eq('id', id);
    if (!error) { await refetchAllPublicData(); toast.success("Category updated."); }
    else { toast.error(`Failed to update category: ${error.message}`); }
  };
  /**
   * Deletes a blog category
   * @param id - Category ID to delete
   * @returns Promise that resolves when deletion completes
   */
  const deleteBlogCategory = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete category."); return; }
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (!error) { await refetchAllPublicData(); toast.success("Category deleted."); }
    else { toast.error(`Failed to delete category: ${error.message}`); }
  };

  // --- PACKAGES LOGIC ---
  /**
   * Adds a new membership package
   * @param newPackage - Package data without ID
   * @returns Promise that resolves when package is added
   */
  const addPackage = async (newPackage: Omit<MembershipPackage, 'id'>): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add package."); return; }
    const packageToAdd = {
      ...newPackage,
      id: `pkg_${crypto.randomUUID()}`
    };
    const { error } = await supabase.from('membership_packages').insert(toSnakeCase(packageToAdd));
    if (!error) { await refetchAllPublicData(); toast.success("Package added."); }
    else { toast.error(`Failed to add package: ${error.message}`); }
  };
  /**
   * Updates a membership package
   * @param package_id - Package ID to update
   * @param updates - Partial package data to update
   * @returns Promise that resolves when update completes
   */
  const updatePackage = async (package_id: string, updates: Partial<MembershipPackage>): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update package."); return; }
    const { error } = await supabase.from('membership_packages').update(toSnakeCase(updates)).eq('id', package_id);
    if (!error) { await refetchAllPublicData(); toast.success("Package updated."); }
    else { toast.error(`Failed to update package: ${error.message}`); }
  };
  /**
   * Deletes a membership package
   * @param package_id - Package ID to delete
   * @returns Promise that resolves when deletion completes
   */
  const deletePackage = async (package_id: string): Promise<void> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete package."); return; }
    const { error } = await supabase.from('membership_packages').delete().eq('id', package_id);
    if (!error) { await refetchAllPublicData(); toast.success("Package deleted."); }
    else { toast.error(`Failed to delete package: ${error.message}`); }
  };

  // --- COMBINED VALUE ---
  const value = {
    businesses, businessMarkers, businessLoading, totalBusinesses, currentPage, fetchBusinesses,
    addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessview_count,
    addService, updateService, deleteService, updateServicesOrder,
    addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addDeal, updateDeal, deleteDeal,
    blogPosts, blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementBlogview_count,
    comments, getCommentsBypost_id, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory,
    packages, addPackage, updatePackage, deletePackage,
  };

  return (
    <PublicDataContext.Provider value={value}>
      {children}
    </PublicDataContext.Provider>
  );
}

// Re-export hooks from separate file to avoid initialization order issues
export { useBusinessData, useBlogData, useMembershipPackageData } from './hooks/useBusinessDataHooks.ts';
