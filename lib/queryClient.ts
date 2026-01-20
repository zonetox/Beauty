/**
 * React Query Client Setup
 * 
 * Replaces manual caching with @tanstack/react-query
 * Provides automatic caching, background refetching, and stale-while-revalidate pattern
 */

import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache data for 10 minutes (longer than staleTime for better UX)
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      
      // Retry failed requests 2 times
      retry: 2,
      
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus (good for keeping data fresh)
      refetchOnWindowFocus: true,
      
      // Don't refetch on reconnect (data is still fresh)
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data exists (use cached data)
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
