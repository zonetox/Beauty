// lib/usePageTracking.ts
// Hook to track page views for analytics

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.ts';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import { PageView, Conversion } from '../types.ts';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get page type from pathname
const getPageType = (pathname: string): PageView['page_type'] => {
  if (pathname === '/') return 'homepage';
  if (pathname.startsWith('/business/')) return 'business';
  if (pathname.startsWith('/blog/') || pathname === '/blog') return 'blog';
  if (pathname === '/directory') return 'directory';
  return 'homepage'; // Default
};

// Get page ID from pathname
const getPageId = (pathname: string): string | undefined => {
  if (pathname.startsWith('/business/')) {
    return pathname.split('/business/')[1]?.split('/')[0];
  }
  if (pathname.startsWith('/blog/')) {
    return pathname.split('/blog/')[1]?.split('/')[0];
  }
  return undefined;
};

// Track page view
// CRITICAL: Tracking is best-effort ONLY. Failures must NEVER surface as errors.
const trackPageView = async (
  pageType: PageView['page_type'],
  pageId?: string,
  userId?: string
): Promise<void> => {
  try {
    const sessionId = getSessionId();
    
    // Get referrer from document
    const referrer = document.referrer || undefined;
    
    // Get user agent
    const userAgent = navigator.userAgent || undefined;
    
    // Note: IP address should be captured server-side for security
    // We'll leave it null and let Supabase Edge Function or trigger handle it if needed
    
    const { error } = await supabase.from('page_views').insert({
      page_type: pageType,
      page_id: pageId || null,
      user_id: userId || null,
      session_id: sessionId,
      referrer: referrer || null,
      user_agent: userAgent || null,
      // ip_address: null, // Should be captured server-side
      viewed_at: new Date().toISOString(),
    });

    // CRITICAL: Tracking failures are silent - never log as error
    // Only debug log in development mode
    if (error && import.meta.env.MODE === 'development') {
      console.debug('[Tracking] Page view tracking failed (best-effort):', error.message);
    }
  } catch (error) {
    // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
    // Only debug log in development mode
    if (import.meta.env.MODE === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.debug('[Tracking] Page view tracking failed (best-effort):', errorMessage);
    }
    // NEVER rethrow - tracking must never affect app flow
  }
};

/**
 * Hook to automatically track page views
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   usePageTracking();
 *   return <div>...</div>;
 * }
 * ```
 */
export const usePageTracking = (): void => {
  const location = useLocation();
  const { currentUser } = useUserSession();
  const previousPathname = useRef<string>(location.pathname);

  useEffect(() => {
    // Only track if pathname changed (not on initial mount if same)
    if (previousPathname.current === location.pathname) {
      return;
    }

    previousPathname.current = location.pathname;

    const pageType = getPageType(location.pathname);
    const pageId = getPageId(location.pathname);
    const userId = currentUser?.id;

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(() => {
      trackPageView(pageType, pageId, userId);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname, currentUser?.id]);
};

/**
 * Manual function to track a page view
 * Useful for tracking specific events or pages not covered by the hook
 */
export const trackPageViewManually = async (
  pageType: PageView['page_type'],
  pageId?: string,
  userId?: string
): Promise<void> => {
  await trackPageView(pageType, pageId, userId);
};

/**
 * Track a conversion event
 * Standalone function that can be used anywhere (doesn't require React hooks)
 * 
 * @param conversionType - Type of conversion: 'click', 'booking', 'contact', 'call'
 * @param businessId - Business ID (optional, for business-specific conversions)
 * @param source - Source of conversion: 'landing_page', 'directory', 'search'
 * @param metadata - Additional metadata (optional)
 * @param userId - User ID (optional, will try to get from session if not provided)
 */
export const trackConversion = async (
  conversionType: Conversion['conversion_type'],
  businessId?: number,
  source?: Conversion['source'],
  metadata?: Record<string, any>,
  userId?: string
): Promise<void> => {
  try {
    const sessionId = getSessionId();

    // Determine source from current page if not provided
    let determinedSource = source;
    if (!determinedSource && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/business/')) {
        determinedSource = 'landing_page';
      } else if (pathname === '/directory') {
        determinedSource = 'directory';
      } else {
        determinedSource = 'landing_page'; // Default
      }
    }

    const { error } = await supabase.from('conversions').insert({
      business_id: businessId || null,
      conversion_type: conversionType,
      source: determinedSource || null,
      user_id: userId || null,
      session_id: sessionId,
      metadata: metadata || null,
      converted_at: new Date().toISOString(),
    });

    // CRITICAL: Tracking failures are silent - never log as error
    // Only debug log in development mode
    if (error && import.meta.env.MODE === 'development') {
      console.debug('[Tracking] Conversion tracking failed (best-effort):', error.message);
    }
  } catch (error) {
    // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
    // Only debug log in development mode
    if (import.meta.env.MODE === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.debug('[Tracking] Conversion tracking failed (best-effort):', errorMessage);
    }
    // NEVER rethrow - tracking must never affect app flow
  }
};
