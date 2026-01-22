/**
 * Lazy Data Loading Hook
 * 
 * Loads non-critical data (blog, markers, packages) after page render
 * Uses safeFetch with proper timeouts and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { prioritySafeFetch } from '../lib/safeFetch.ts';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../lib/cache.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { snakeToCamel } from '../lib/utils.ts';
import { BlogPost, BlogCategory, MembershipPackage } from '../types.ts';

interface LazyDataState {
  blogPosts: BlogPost[];
  blogCategories: BlogCategory[];
  packages: MembershipPackage[];
  markers: Array<{ id: number; name: string; latitude: number; longitude: number; categories: string[]; isActive: boolean }>;
  loading: {
    blog: boolean;
    packages: boolean;
    markers: boolean;
  };
}

export function useLazyData() {
  const [state, setState] = useState<LazyDataState>({
    blogPosts: [],
    blogCategories: [],
    packages: [],
    markers: [],
    loading: {
      blog: false,
      packages: false,
      markers: false,
    }
  });

  const loadBlogData = useCallback(async () => {
    // Check cache first
    const cached = cacheManager.get<{ posts: BlogPost[]; categories: BlogCategory[] }>(CACHE_KEYS.BLOG_HOMEPAGE);
    if (cached) {
      setState(prev => ({
        ...prev,
        blogPosts: cached.posts,
        blogCategories: cached.categories,
        loading: { ...prev.loading, blog: false }
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: { ...prev.loading, blog: true } }));

    if (!isSupabaseConfigured) {
      setState(prev => ({ ...prev, loading: { ...prev.loading, blog: false } }));
      return;
    }

    // Fetch blog posts and categories in parallel
    const [postsResult, categoriesResult] = await Promise.all([
      prioritySafeFetch(
        async () => {
          const { data, error } = await supabase
            .from('blog_posts')
            .select('id, slug, title, image_url, excerpt, author, date, category, content, view_count')
            .order('date', { ascending: false })
            .limit(50);

          if (error) throw error;
          return data;
        },
        {
          timeout: 10000, // 10s for blog
          priority: 'low',
          silent: true // Don't log timeouts
        }
      ),
      prioritySafeFetch(
        async () => {
          const { data, error } = await supabase
            .from('blog_categories')
            .select('id, name')
            .order('name');

          if (error) throw error;
          return data;
        },
        {
          timeout: 8000, // 8s for categories
          priority: 'low',
          silent: true
        }
      )
    ]);

    const posts = postsResult.data ? (snakeToCamel(postsResult.data) as BlogPost[]) : [];
    const categories = categoriesResult.data ? (snakeToCamel(categoriesResult.data) as BlogCategory[]) : [];

    // Cache the result
    if (posts.length > 0 || categories.length > 0) {
      cacheManager.set(CACHE_KEYS.BLOG_HOMEPAGE, { posts, categories }, CACHE_TTL.BLOG_POSTS);
    }

    setState(prev => ({
      ...prev,
      blogPosts: posts,
      blogCategories: categories,
      loading: { ...prev.loading, blog: false }
    }));
  }, []);

  const loadPackages = useCallback(async () => {
    // Check cache first
    const cached = cacheManager.get<MembershipPackage[]>(CACHE_KEYS.PACKAGES);
    if (cached) {
      setState(prev => ({
        ...prev,
        packages: cached,
        loading: { ...prev.loading, packages: false }
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: { ...prev.loading, packages: true } }));

    if (!isSupabaseConfigured) {
      setState(prev => ({ ...prev, loading: { ...prev.loading, packages: false } }));
      return;
    }

    const result = await prioritySafeFetch(
      async () => {
        const { data, error } = await supabase
          .from('membership_packages')
          .select('id, name, description, price, duration_months, features, is_active')
          .eq('is_active', true)
          .order('price');

        if (error) throw error;
        return data;
      },
      {
        timeout: 10000, // 10s for packages
        priority: 'low',
        silent: true
      }
    );

    const packages = result.data ? (snakeToCamel(result.data) as MembershipPackage[]) : [];

    // Cache the result
    if (packages.length > 0) {
      cacheManager.set(CACHE_KEYS.PACKAGES, packages, CACHE_TTL.PACKAGES);
    }

    setState(prev => ({
      ...prev,
      packages,
      loading: { ...prev.loading, packages: false }
    }));
  }, []);

  const loadMarkers = useCallback(async () => {
    // Check cache first
    const cached = cacheManager.get<LazyDataState['markers']>(CACHE_KEYS.MARKERS);
    if (cached) {
      setState(prev => ({
        ...prev,
        markers: cached,
        loading: { ...prev.loading, markers: false }
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: { ...prev.loading, markers: true } }));

    if (!isSupabaseConfigured) {
      setState(prev => ({ ...prev, loading: { ...prev.loading, markers: false } }));
      return;
    }

    const result = await prioritySafeFetch(
      async () => {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, latitude, longitude, categories, is_active')
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(2000);

        if (error) throw error;
        return data;
      },
      {
        timeout: 10000, // 10s for markers
        priority: 'low',
        silent: true
      }
    );

    const markers = result.data ? (snakeToCamel(result.data) as LazyDataState['markers']) : [];

    // Cache the result
    if (markers.length > 0) {
      cacheManager.set(CACHE_KEYS.MARKERS, markers, CACHE_TTL.MARKERS);
    }

    setState(prev => ({
      ...prev,
      markers,
      loading: { ...prev.loading, markers: false }
    }));
  }, []);

  // Load all lazy data after initial render
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const loadData = () => {
      // Load in order of priority (blog first, then packages, then markers)
      loadBlogData();
      setTimeout(() => loadPackages(), 100);
      setTimeout(() => loadMarkers(), 200);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadData, { timeout: 2000 });
    } else {
      setTimeout(loadData, 100);
    }
  }, [loadBlogData, loadPackages, loadMarkers]);

  return {
    ...state,
    loadBlogData,
    loadPackages,
    loadMarkers
  };
}
