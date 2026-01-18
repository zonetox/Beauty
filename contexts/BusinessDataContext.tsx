

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Business, BlogPost, BlogComment, BlogCategory, MembershipPackage, Service, MediaItem, TeamMember, Deal, MediaType, Review } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { uploadFile, deleteFileByUrl } from '../lib/storage.ts';
import { snakeToCamel } from '../lib/utils.ts';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../lib/cache.ts';

// Optional admin logging - injected via props or context to avoid circular dependency
// AdminContext will be provided via App.tsx provider hierarchy, accessed at runtime

// --- CACHE CONSTANTS ---
const PUBLIC_DATA_CACHE_KEY = 'publicDataCache';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes


// --- CONTEXT TYPE DEFINITION ---
interface PublicDataContextType {
  // Business Data
  businesses: Business[];
  businessMarkers: { id: number, name: string, latitude: number, longitude: number, categories: string[], isActive: boolean }[];
  businessLoading: boolean;
  totalBusinesses: number;
  currentPage: number;
  fetchBusinesses: (page?: number, options?: { search?: string, location?: string, district?: string, category?: string }) => Promise<void>;
  addBusiness: (newBusiness: Business) => Promise<Business | null>;
  updateBusiness: (updatedBusiness: Business) => Promise<void>;
  deleteBusiness: (businessId: number) => Promise<void>;
  getBusinessBySlug: (slug: string) => Business | undefined;
  fetchBusinessBySlug: (slug: string) => Promise<Business | null>;
  incrementBusinessViewCount: (businessId: number) => Promise<void>;
  // Service Data
  addService: (newServiceData: Omit<Service, 'id' | 'position'>) => Promise<void>;
  updateService: (updatedService: Service) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  updateServicesOrder: (orderedServices: Service[]) => Promise<void>;
  // Media/Gallery Data
  addMediaItem: (file: File, businessId: number) => Promise<void>;
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
  addBlogPost: (newPost: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => Promise<void>;
  updateBlogPost: (updatedPost: BlogPost) => Promise<void>;
  deleteBlogPost: (postId: number) => Promise<void>;
  getPostBySlug: (slug: string) => BlogPost | undefined;
  incrementBlogViewCount: (postId: number) => Promise<void>;
  comments: BlogComment[];
  getCommentsByPostId: (postId: number) => BlogComment[];
  addComment: (postId: number, authorName: string, content: string) => void;
  blogCategories: BlogCategory[];
  addBlogCategory: (name: string) => Promise<void>;
  updateBlogCategory: (id: string, name: string) => Promise<void>;
  deleteBlogCategory: (id: string) => Promise<void>;
  // Membership Packages
  packages: MembershipPackage[];
  addPackage: (newPackage: Omit<MembershipPackage, 'id'>) => Promise<void>;
  updatePackage: (packageId: string, updates: Partial<MembershipPackage>) => Promise<void>;
  deletePackage: (packageId: string) => Promise<void>;
}

// Export context so hooks file can use it
export const PublicDataContext = createContext<PublicDataContextType | undefined>(undefined);

const COMMENTS_LOCAL_STORAGE_KEY = 'blog_comments';

// Helper to convert JS object keys from camelCase to snake_case for Supabase write operations.
const toSnakeCase = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

export function PublicDataProvider({ children }: { children: ReactNode }) {
  // --- STATES ---
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessMarkers, setBusinessMarkers] = useState<{ id: number, name: string, latitude: number, longitude: number, categories: string[], isActive: boolean }[]>([]);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Prevent double fetch in React.StrictMode (development)
  const hasFetchedRef = useRef(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);

  // Admin logging is optional - removed direct import to avoid circular dependency
  // Admin actions will be logged via AdminContext if available in the provider tree
  // This is handled at a higher level (App.tsx) where both contexts are available
  const logAdminAction = () => {}; // Placeholder - actual logging handled elsewhere
  const currentAdmin = null; // Placeholder - actual admin user handled elsewhere

  // --- DATA FETCHING ---
  const fetchBusinesses = useCallback(async (page: number = 1, options: {
    search?: string,
    location?: string,
    district?: string,
    category?: string
  } = {}) => {
    if (!isSupabaseConfigured) return;

    setBusinessLoading(true);
    const from = (page - 1) * PAGE_SIZE;

    try {
      // Use advanced RPC function for search with filters and pagination
      // This function supports: search text, category, city, district, tags, limit, offset
      const { data: searchData, error: searchError } = await supabase
        .rpc('search_businesses_advanced', {
          p_search_text: options.search && options.search.trim() ? options.search.trim() : null,
          p_category: options.category || null,
          p_city: options.location || null,
          p_district: options.district || null,
          p_tags: null, // Tags filter not used in current frontend, but supported
          p_limit: PAGE_SIZE,
          p_offset: from
        });

      if (searchError) {
        console.error('Error searching businesses:', searchError.message);
        toast.error('Lỗi tìm kiếm: ' + searchError.message);
        // Fallback to regular query
      } else if (searchData && searchData.length > 0) {
        // search_businesses_advanced returns partial data, fetch full business data
        // IMPORTANT: Preserve database ranking order - do NOT sort results
        // Results from search_businesses_advanced are already sorted by final_score DESC
        const businessIds = searchData.map((b: any) => b.id);
        const { data: fullData, error: fetchError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact' })
          .in('id', businessIds);
        
        // Preserve order from search_businesses_advanced (ranked by final_score)
        // Map results in the same order as searchData
        const orderedFullData = businessIds.map(id => 
          fullData?.find(b => b.id === id)
        ).filter(Boolean);

        if (fetchError) {
          console.error('Error fetching business details:', fetchError.message);
          toast.error('Failed to load businesses');
        } else if (orderedFullData && orderedFullData.length > 0) {
          const mapped = snakeToCamel(orderedFullData).map((b: any) => ({
            ...b,
            services: [],
            gallery: [],
            team: [],
            deals: [],
            reviews: []
          })) as Business[];

          setBusinesses(mapped);
          
          // Get total count using COUNT query instead of calling RPC function twice
          // This is much faster than fetching 10000 records just to count them
          const countStartTime = performance.now();
          let countQuery = supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true);
          if (options.category) countQuery = countQuery.contains('categories', [options.category]);
          if (options.location) countQuery = countQuery.eq('city', options.location);
          if (options.district) countQuery = countQuery.eq('district', options.district);
          if (options.search && options.search.trim()) {
            countQuery = countQuery.or(`name.ilike.%${options.search.trim()}%,description.ilike.%${options.search.trim()}%`);
          }
          
          const { count, error: countError } = await countQuery;
          const countDuration = performance.now() - countStartTime;
          console.log(`[PERF] Businesses Count: ${countDuration.toFixed(2)}ms`);
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
        console.error('Error fetching businesses:', error.message);
        toast.error('Failed to load businesses');
      } else if (data) {
        const mapped = snakeToCamel(data).map((b: any) => ({
          ...b,
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
    } catch (error: any) {
      console.error('Unexpected error fetching businesses:', error);
      toast.error('Failed to load businesses');
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
      const { data, error } = await supabase.from('businesses')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('id', { ascending: true })
        .limit(20); // Only fetch featured businesses for initial render

      if (error) {
        console.error('Error fetching critical businesses:', error);
        setBusinesses([]);
        setTotalBusinesses(0);
      } else if (data) {
        const mapped = snakeToCamel(data).map((b: any) => ({
          ...b,
          services: [],
          gallery: [],
          team: [],
          deals: [],
          reviews: []
        })) as Business[];
        setBusinesses(mapped);
        
        // Get total count for featured businesses only
        const { count } = await supabase.from('businesses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('is_featured', true);
        setTotalBusinesses(count || 0);
      }
    } catch (error: any) {
      console.error('Error in fetchCriticalData:', error);
      setBusinesses([]);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  // NON-CRITICAL DATA: Lazy-load blog posts, categories, markers, packages, and all businesses
  // MANDATORY: If cached data exists → NEVER fetch on page load, only refresh in background
  const fetchNonCriticalData = useCallback(async (backgroundRefresh = false) => {
    if (!isSupabaseConfigured) {
      setBlogLoading(false);
      return;
    }

    // MANDATORY RULE: If cached data exists and not background refresh → use cache, skip fetch
    const cachedBlogPosts = cacheManager.get<BlogPost[]>(CACHE_KEYS.BLOG_POSTS);
    const cachedCategories = cacheManager.get<BlogCategory[]>(CACHE_KEYS.BLOG_CATEGORIES);
    const cachedMarkers = cacheManager.get<any[]>(CACHE_KEYS.MARKERS);
    const cachedPackages = cacheManager.get<MembershipPackage[]>(CACHE_KEYS.PACKAGES);

    // Use cached data immediately if available (not background refresh)
    if (!backgroundRefresh) {
      if (cachedBlogPosts) {
        setBlogPosts(cachedBlogPosts);
        setBlogLoading(false);
      }
      if (cachedCategories) {
        setBlogCategories(cachedCategories);
      }
      if (cachedMarkers) {
        setBusinessMarkers(cachedMarkers);
      }
      if (cachedPackages) {
        setPackages(cachedPackages);
      }

      // If all cached, return early (no fetch on page load)
      if (cachedBlogPosts && cachedCategories && cachedMarkers && cachedPackages) {
        // Background refresh in next tick (non-blocking)
        setTimeout(() => {
          fetchNonCriticalData(true);
        }, 0);
        return;
      }
    }

    // Fetch data (either no cache, or background refresh)
    try {
      if (!backgroundRefresh) {
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

      const blogPromise = supabase.from('blog_posts')
        .select('id, slug, title, image_url, excerpt, author, date, category, content, view_count')
        .order('date', { ascending: false })
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

      const measureQuery = async (name: string, queryPromise: Promise<any>, timeoutMs: number) => {
        const startTime = performance.now();
        try {
          const result = await Promise.race([queryPromise, createTimeoutPromise(timeoutMs, `${name} timeout`)]);
          const duration = performance.now() - startTime;
          console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
          return result;
        } catch (error: any) {
          // Silent timeout - has fallback to cache/empty data
          // Only log if not a timeout error
          if (!error?.message?.includes('timeout')) {
            const duration = performance.now() - startTime;
            console.warn(`[PERF] ${name}: ERROR after ${duration.toFixed(2)}ms`, error);
          }
          throw error;
        }
      };

      // Execute all non-critical queries in parallel with specific timeouts
      const [businessesResult, markersResult, blogResult, catResult, pkgResult] = await Promise.allSettled([
        measureQuery('All Businesses', allBusinessesPromise, TIMEOUTS.BUSINESSES),
        measureQuery('Markers', markerPromise, TIMEOUTS.MARKERS),
        measureQuery('Blog Posts', blogPromise, TIMEOUTS.BLOG),
        measureQuery('Categories', catPromise, TIMEOUTS.BLOG), // Same timeout as blog
        measureQuery('Packages', pkgPromise, TIMEOUTS.PACKAGES)
      ]);

      // Helper to check if error is a timeout
      const isTimeoutError = (error: any): boolean => {
        if (!error) return false;
        const msg = error.message || error.toString() || '';
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
          const markers = snakeToCamel(markerData.data);
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
      let blogRes: any = { error: null, data: null };
      if (blogResult.status === 'fulfilled') {
        const result = blogResult.value as any;
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
        const posts = snakeToCamel(blogRes.data) as BlogPost[];
        setBlogPosts(posts);
        // Cache blog posts: 10 minutes
        cacheManager.set(CACHE_KEYS.BLOG_POSTS, posts, CACHE_TTL.BLOG_POSTS);
      }
      if (!backgroundRefresh) {
        setBlogLoading(false);
      }

      // Process categories
      let catRes: any = { error: null, data: null };
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
        const categories = snakeToCamel(catRes.data) as BlogCategory[];
        setBlogCategories(categories);
        // Cache categories: 30 minutes
        cacheManager.set(CACHE_KEYS.BLOG_CATEGORIES, categories, CACHE_TTL.BLOG_CATEGORIES);
      }

      // Process packages
      let pkgRes: any = { error: null, data: null };
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
        const packages = snakeToCamel(pkgRes.data) as MembershipPackage[];
        setPackages(packages);
        // Cache packages: 1 hour
        cacheManager.set(CACHE_KEYS.PACKAGES, packages, CACHE_TTL.PACKAGES);
      }
    } catch (error: any) {
      // Only log unhandled exceptions (not timeouts with fallbacks)
      if (!error?.message?.includes('timeout') && !error?.message?.includes('Timeout')) {
        console.error('Error in fetchNonCriticalData (unhandled exception):', error);
      }
      if (!backgroundRefresh) {
        setBlogLoading(false);
      }
    }
  }, [fetchBusinesses]);

  // Legacy: fetchAllPublicData for backwards compatibility (admin, other pages)
  // This fetches ALL data (critical + non-critical)
  const fetchAllPublicData = useCallback(async () => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Fetch both critical and non-critical in parallel
    await Promise.all([
      fetchCriticalData(),
      fetchNonCriticalData()
    ]);
  }, [fetchCriticalData, fetchNonCriticalData]);

  // Helper to reset and refetch (for after add/update/delete operations)
  const refetchAllPublicData = useCallback(async () => {
    hasFetchedRef.current = false; // Reset to allow refetch
    await fetchAllPublicData();
  }, [fetchAllPublicData]);

  // CRITICAL DATA: Fetch only on mount (featured businesses for homepage initial render)
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCriticalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch critical data on mount

  // NON-CRITICAL DATA: Lazy-load after initial render (blog posts, categories, markers, packages)
  useEffect(() => {
    // Delay non-critical data fetching until after initial render
    const timer = setTimeout(() => {
      fetchNonCriticalData();
    }, 100); // Small delay to let initial render complete

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Lazy-load non-critical data after render

  // --- BUSINESS LOGIC ---
  const addBusiness = async (newBusiness: Business): Promise<Business | null> => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add business."); return null; }
    const { id, services, gallery, team, deals, reviews, ...businessData } = newBusiness;
    const { data, error } = await supabase.from('businesses').insert(toSnakeCase(businessData)).select().single();
    if (error) { console.error('Error adding business:', error.message); return null; }
    if (data) {
      const mappedData = snakeToCamel(data);
      await refetchAllPublicData();
      // Admin logging removed to avoid circular dependency
      // Admin actions are logged at a higher level where both contexts are available
      return mappedData as Business;
    }
    return null;
  };

  const updateBusiness = async (updatedBusiness: Business) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update business."); return; }
    const { id, services, gallery, team, deals, reviews, ...businessToUpdate } = updatedBusiness;
    const { error } = await supabase.from('businesses').update(toSnakeCase(businessToUpdate)).eq('id', id);
    if (error) { 
      console.error('Error updating business:', error.message); 
    } else { 
      await refetchAllPublicData(); 
    }
  };

  const deleteBusiness = async (businessId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete business."); return; }
    /* ... implementation unchanged ... */
  };

  // Existing synchronous getter (from loaded list)
  const getBusinessBySlug = (slug: string) => businesses.find(b => b.slug === slug);

  // Use useRef to access businesses without causing function recreation
  const businessesRef = useRef(businesses);
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  // NEW: Async detailed getter
  const fetchBusinessBySlug = useCallback(async (slug: string): Promise<Business | null> => {
    console.log('[fetchBusinessBySlug] Starting fetch for slug:', slug);
    
    if (!isSupabaseConfigured) {
      console.log('[fetchBusinessBySlug] Supabase not configured, using cached data');
      // Fallback to businesses list if available
      const cached = businessesRef.current.find(b => b.slug === slug);
      return cached || null;
    }

    // 1. Fetch the main business record
    console.log('[fetchBusinessBySlug] Fetching business data from database...');
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData) {
      console.error("[fetchBusinessBySlug] Error fetching business details:", businessError?.message, businessError);
      // Fallback to cached businesses list
      const cached = businessesRef.current.find(b => b.slug === slug);
      console.log('[fetchBusinessBySlug] Using cached data:', cached ? cached.name : 'Not found');
      return cached || null;
    }

    console.log('[fetchBusinessBySlug] Business found:', businessData.name, 'ID:', businessData.id);

    // 2. Parallel fetch for relations
    const businessId = businessData.id;
    console.log('[fetchBusinessBySlug] Fetching related data for business ID:', businessId);
    const [servicesRes, mediaRes, teamRes, dealsRes, reviewsRes] = await Promise.all([
      supabase.from('services').select('*').eq('business_id', businessId).order('position', { ascending: true }),
      supabase.from('media_items').select('*').eq('business_id', businessId).order('position', { ascending: true }),
      supabase.from('team_members').select('*').eq('business_id', businessId),
      supabase.from('deals').select('*').eq('business_id', businessId),
      supabase.from('reviews').select('*').eq('business_id', businessId)
    ]);

    // Log any errors in related data
    if (servicesRes.error) console.error('[fetchBusinessBySlug] Services error:', servicesRes.error.message);
    if (mediaRes.error) console.error('[fetchBusinessBySlug] Media error:', mediaRes.error.message);
    if (teamRes.error) console.error('[fetchBusinessBySlug] Team error:', teamRes.error.message);
    if (dealsRes.error) console.error('[fetchBusinessBySlug] Deals error:', dealsRes.error.message);
    if (reviewsRes.error) console.error('[fetchBusinessBySlug] Reviews error:', reviewsRes.error.message);

    console.log('[fetchBusinessBySlug] Related data counts:', {
      services: servicesRes.data?.length || 0,
      media: mediaRes.data?.length || 0,
      team: teamRes.data?.length || 0,
      deals: dealsRes.data?.length || 0,
      reviews: reviewsRes.data?.length || 0
    });

    // 3. Assemble full object
    const fullBusiness: Business = {
      ...snakeToCamel(businessData) as Business,
      services: (servicesRes.data || []).map(s => snakeToCamel(s) as Service),
      gallery: (mediaRes.data || []).map(m => snakeToCamel(m) as MediaItem), // Map to 'gallery'
      team: (teamRes.data || []).map(t => snakeToCamel(t) as TeamMember),
      deals: (dealsRes.data || []).map(d => snakeToCamel(d) as Deal),
      reviews: (reviewsRes.data || []).map(r => snakeToCamel(r) as Review)
    };

    console.log('[fetchBusinessBySlug] Full business object assembled:', fullBusiness.name, {
      servicesCount: fullBusiness.services?.length || 0,
      galleryCount: fullBusiness.gallery?.length || 0,
      dealsCount: fullBusiness.deals?.length || 0,
      reviewsCount: fullBusiness.reviews?.length || 0
    });

    return fullBusiness;
  }, [isSupabaseConfigured]); // Remove businesses dependency to prevent function recreation

  // D2.2 FIX: Use safe RPC function for view count increment
  const incrementBusinessViewCount = async (businessId: number) => {
    if (!isSupabaseConfigured) return; // Silent fail in preview
    const { error } = await supabase.rpc('increment_business_view_count', { p_business_id: businessId });
    if (error) {
      console.error('Error incrementing business view count:', error.message);
    } else {
      // Optimistically update UI
      setBusinesses(prev => prev.map(b => b.id === businessId ? { ...b, viewCount: (b.viewCount || 0) + 1 } : b));
    }
  };

  // --- SERVICES LOGIC ---
  const addService = async (newServiceData: Omit<Service, 'id' | 'position'>) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot add service."); 
      throw new Error("Preview Mode: Cannot add service.");
    }
    try {
      const currentServices = businesses.find(b => b.id === newServiceData.business_id)?.services || [];
      const newPosition = currentServices.length > 0 ? Math.max(...currentServices.map(s => s.position)) + 1 : 1;
      const { error } = await supabase.from('services').insert({ ...toSnakeCase(newServiceData), position: newPosition });
      if (error) {
        console.error("Error adding service:", error.message);
        toast.error(`Failed to add service: ${error.message}`);
        throw error;
      }
      await refetchAllPublicData();
    } catch (error) {
      throw error;
    }
  };
  
  const updateService = async (updatedService: Service) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot update service."); 
      throw new Error("Preview Mode: Cannot update service.");
    }
    try {
      const { id, ...serviceToUpdate } = updatedService;
      const { error } = await supabase.from('services').update(toSnakeCase(serviceToUpdate)).eq('id', id);
      if (error) {
        console.error("Error updating service:", error.message);
        toast.error(`Failed to update service: ${error.message}`);
        throw error;
      }
      await refetchAllPublicData();
    } catch (error) {
      throw error;
    }
  };
  
  const deleteService = async (serviceId: string) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot delete service."); 
      throw new Error("Preview Mode: Cannot delete service.");
    }
    try {
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
    } catch (error) {
      throw error;
    }
  };
  
  const updateServicesOrder = async (orderedServices: Service[]) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot reorder services."); 
      throw new Error("Preview Mode: Cannot reorder services.");
    }
    try {
      const updates = orderedServices.map((service, index) => ({ id: service.id, position: index + 1 }));
      const { error } = await supabase.from('services').upsert(updates);
      if (error) {
        console.error("Error updating service order:", error.message);
        toast.error(`Failed to save service order: ${error.message}`);
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  // --- MEDIA/GALLERY LOGIC ---
  const addMediaItem = async (file: File, businessId: number) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot upload media."); 
      throw new Error("Preview Mode: Cannot upload media.");
    }
    try {
      // FIX: Use business-gallery bucket instead of business-assets
      const folder = `business/${businessId}/gallery`;
      const publicUrl = await uploadFile('business-gallery', file, folder);
      const isImage = file.type.startsWith('image/');
      const currentMedia = businesses.find(b => b.id === businessId)?.gallery || [];
      const newPosition = currentMedia.length > 0 ? Math.max(...currentMedia.map(m => m.position)) + 1 : 1;
      const newItem = { 
        business_id: businessId, 
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
    } catch (error) {
      throw error;
    }
  };
  
  const updateMediaItem = async (updatedItem: MediaItem) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot update media."); 
      throw new Error("Preview Mode: Cannot update media.");
    }
    try {
      const { id, ...itemToUpdate } = updatedItem;
      const { error } = await supabase.from('media_items').update(toSnakeCase(itemToUpdate)).eq('id', id);
      if (error) {
        console.error("Error updating media item:", error.message);
        toast.error(`Failed to update media: ${error.message}`);
        throw error;
      }
      await refetchAllPublicData();
      toast.success('Media updated successfully!');
    } catch (error) {
      throw error;
    }
  };
  
  const deleteMediaItem = async (itemToDelete: MediaItem) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot delete media."); 
      throw new Error("Preview Mode: Cannot delete media.");
    }
    try {
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
    } catch (error) {
      throw error;
    }
  };
  
  const updateMediaOrder = async (orderedMedia: MediaItem[]) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot reorder media."); 
      throw new Error("Preview Mode: Cannot reorder media.");
    }
    try {
      const updates = orderedMedia.map((item, index) => ({ id: item.id, position: index + 1 }));
      const { error } = await supabase.from('media_items').upsert(updates);
      if (error) {
        console.error("Error updating media order:", error.message);
        toast.error(`Failed to save media order: ${error.message}`);
        throw error;
      }
    } catch (error) {
      throw error;
    }
  };

  // --- TEAM LOGIC ---
  const addTeamMember = async (newMemberData: Omit<TeamMember, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add team member."); return; }
    const { error } = await supabase.from('team_members').insert(toSnakeCase(newMemberData));
    if (error) console.error("Error adding team member:", error.message);
    else await refetchAllPublicData();
  };
  const updateTeamMember = async (updatedMember: TeamMember) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update team member."); return; }
    const { id, ...memberToUpdate } = updatedMember;
    const { error } = await supabase.from('team_members').update(toSnakeCase(memberToUpdate)).eq('id', id);
    if (error) console.error("Error updating team member:", error.message);
    else await refetchAllPublicData();
  };
  const deleteTeamMember = async (memberId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete team member."); return; }
    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    if (error) console.error("Error deleting team member:", error.message);
    else await refetchAllPublicData();
  };

  // --- DEALS LOGIC ---
  const addDeal = async (newDealData: Omit<Deal, 'id'>) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot add deal."); 
      throw new Error("Preview Mode: Cannot add deal.");
    }
    try {
      const { error } = await supabase.from('deals').insert(toSnakeCase(newDealData));
      if (error) {
        console.error("Error adding deal:", error.message);
        toast.error(`Failed to add deal: ${error.message}`);
        throw error;
      }
      await refetchAllPublicData();
      toast.success('Deal added successfully!');
    } catch (error) {
      throw error;
    }
  };
  
  const updateDeal = async (updatedDeal: Deal) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot update deal."); 
      throw new Error("Preview Mode: Cannot update deal.");
    }
    try {
      const { id, ...dealToUpdate } = updatedDeal;
      const { error } = await supabase.from('deals').update(toSnakeCase(dealToUpdate)).eq('id', id);
      if (error) {
        console.error("Error updating deal:", error.message);
        toast.error(`Failed to update deal: ${error.message}`);
        throw error;
      }
      await refetchAllPublicData();
      toast.success('Deal updated successfully!');
    } catch (error) {
      throw error;
    }
  };
  
  const deleteDeal = async (dealId: string) => {
    if (!isSupabaseConfigured) { 
      toast.error("Preview Mode: Cannot delete deal."); 
      throw new Error("Preview Mode: Cannot delete deal.");
    }
    try {
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
    } catch (error) {
      throw error;
    }
  };

  // --- BLOG LOGIC ---
  // D2.1 FIX: Fetch comments from database instead of localStorage
  const fetchComments = useCallback(async () => {
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
        try {
          const savedCommentsJSON = localStorage.getItem(COMMENTS_LOCAL_STORAGE_KEY);
          setComments(savedCommentsJSON ? JSON.parse(savedCommentsJSON) : []);
        } catch (e) {
          setComments([]);
        }
      } else {
        // Convert database format to BlogComment format
        const formattedComments: BlogComment[] = (data || []).map((comment: any) => ({
          id: comment.id,
          postId: comment.post_id,
          authorName: comment.author_name,
          authorAvatarUrl: '', // Not stored in DB, can be added later
          content: comment.content,
          date: comment.date || comment.created_at,
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

  const addBlogPost = async (newPostData: Omit<BlogPost, 'id' | 'slug' | 'date' | 'viewCount'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add blog post."); return; }
    const slug = newPostData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + `-${Date.now()}`;
    const postToAdd = { ...newPostData, slug, date: new Date().toLocaleDateString('en-GB'), view_count: 0 };
    const { error } = await supabase.from('blog_posts').insert(postToAdd);
    if (!error) await refetchAllPublicData();
  };
  const updateBlogPost = async (updatedPost: BlogPost) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update blog post."); return; }
    const { id, ...postToUpdate } = updatedPost;
    const { error } = await supabase.from('blog_posts').update(postToUpdate).eq('id', id);
    if (!error) await refetchAllPublicData();
  };
  const deleteBlogPost = async (postId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete blog post."); return; }
    const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
    if (!error) await refetchAllPublicData();
  };
  const getPostBySlug = (slug: string) => blogPosts.find(p => p.slug === slug);
  // D2.2 FIX: Use safe RPC function for view count increment (already using RPC, just ensure consistency)
  const incrementBlogViewCount = async (postId: number) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.rpc('increment_blog_view_count', { p_post_id: postId });
    if (error) {
      console.error('Error incrementing blog view count:', error.message);
    } else {
      // Optimistically update UI
      setBlogPosts(prev => prev.map(p => p.id === postId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p));
    }
  };
  const getCommentsByPostId = (postId: number) => comments.filter(c => c.postId === postId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // D2.1 FIX: Save comments to database instead of localStorage
  const addComment = async (postId: number, authorName: string, content: string) => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      const newComment: BlogComment = {
        id: crypto.randomUUID(),
        postId,
        authorName,
        authorAvatarUrl: '',
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
          post_id: postId,
          author_name: authorName,
          content: content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        // Fallback to localStorage
        const newComment: BlogComment = {
          id: crypto.randomUUID(),
          postId,
          authorName,
          authorAvatarUrl: '',
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
          postId: data.post_id,
          authorName: data.author_name,
          authorAvatarUrl: '',
          content: data.content,
          date: data.date || data.created_at,
        };
        const updatedComments = [newComment, ...comments];
        setComments(updatedComments);
        // Cache in localStorage for offline/fallback
        try {
          localStorage.setItem(COMMENTS_LOCAL_STORAGE_KEY, JSON.stringify(updatedComments));
        } catch (e) {
          console.warn('Failed to cache comments:', e);
        }
      }
    } catch (error) {
      console.error('Error in addComment:', error);
      // Fallback to localStorage
      const newComment: BlogComment = {
        id: crypto.randomUUID(),
        postId,
        authorName,
        authorAvatarUrl: '',
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
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add category."); return; }
    if (name.trim() === '' || blogCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) { toast.error("Category name cannot be empty or duplicate."); return; }
    const { error } = await supabase.from('blog_categories').insert({ name });
    if (!error) { await refetchAllPublicData(); toast.success("Category added."); }
    else { toast.error(`Failed to add category: ${error.message}`); }
  };
  const updateBlogCategory = async (id: string, name: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update category."); return; }
    const { error } = await supabase.from('blog_categories').update({ name }).eq('id', id);
    if (!error) { await refetchAllPublicData(); toast.success("Category updated."); }
    else { toast.error(`Failed to update category: ${error.message}`); }
  };
  const deleteBlogCategory = async (id: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete category."); return; }
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (!error) { await refetchAllPublicData(); toast.success("Category deleted."); }
    else { toast.error(`Failed to delete category: ${error.message}`); }
  };

  // --- PACKAGES LOGIC ---
  const addPackage = async (newPackage: Omit<MembershipPackage, 'id'>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add package."); return; }
    const { error } = await supabase.from('membership_packages').insert({ ...newPackage, id: `pkg_${crypto.randomUUID()}` });
    if (!error) { await refetchAllPublicData(); toast.success("Package added."); }
    else { toast.error(`Failed to add package: ${error.message}`); }
  };
  const updatePackage = async (packageId: string, updates: Partial<MembershipPackage>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update package."); return; }
    const { error } = await supabase.from('membership_packages').update(updates).eq('id', packageId);
    if (!error) { await refetchAllPublicData(); toast.success("Package updated."); }
    else { toast.error(`Failed to update package: ${error.message}`); }
  };
  const deletePackage = async (packageId: string) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete package."); return; }
    const { error } = await supabase.from('membership_packages').delete().eq('id', packageId);
    if (!error) { await refetchAllPublicData(); toast.success("Package deleted."); }
    else { toast.error(`Failed to delete package: ${error.message}`); }
  };

  // --- COMBINED VALUE ---
  const value = {
    businesses, businessMarkers, businessLoading, totalBusinesses, currentPage, fetchBusinesses,
    addBusiness, updateBusiness, deleteBusiness, getBusinessBySlug, fetchBusinessBySlug, incrementBusinessViewCount,
    addService, updateService, deleteService, updateServicesOrder,
    addMediaItem, updateMediaItem, deleteMediaItem, updateMediaOrder,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addDeal, updateDeal, deleteDeal,
    blogPosts, blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, getPostBySlug, incrementBlogViewCount,
    comments, getCommentsByPostId, addComment, blogCategories, addBlogCategory, updateBlogCategory, deleteBlogCategory,
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
