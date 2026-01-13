// Performance Monitoring Hook
// Track component render performance, API calls, and user interactions

import { useEffect, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { trackEvent } from '../lib/analytics.ts';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime?: number;
  apiCallTime?: number;
  interactionTime?: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  const mountStartTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());
  const apiCallTimes = useRef<Map<string, number>>(new Map());

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountStartTime.current;
    
    if (mountTime > 1000) { // Only track slow mounts (>1s)
      const metrics: PerformanceMetrics = {
        componentName,
        mountTime,
      };
      
      // Send to Sentry if mount is very slow (>3s)
      if (mountTime > 3000) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Slow component mount: ${componentName}`,
          level: 'warning',
          data: metrics,
        });
      }
      
      // Track in analytics
      trackEvent('component_mount', {
        component: componentName,
        mount_time: mountTime,
      });
    }
  }, [componentName]);

  // Track render performance
  const trackRender = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current;
    renderStartTime.current = Date.now();
    
    if (renderTime > 100) { // Only track slow renders (>100ms)
      trackEvent('component_render', {
        component: componentName,
        render_time: renderTime,
      });
    }
  }, [componentName]);

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> => {
    const startTime = Date.now();
    const callId = `${callName}_${Date.now()}`;
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      apiCallTimes.current.set(callId, duration);
      
      // Track slow API calls
      if (duration > 1000) {
        trackEvent('slow_api_call', {
          component: componentName,
          api_call: callName,
          duration,
        });
        
        // Send to Sentry if very slow (>5s)
        if (duration > 5000) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Slow API call: ${callName}`,
            level: 'warning',
            data: {
              component: componentName,
              duration,
            },
          });
        }
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackEvent('api_call_error', {
        component: componentName,
        api_call: callName,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [componentName]);

  // Track user interaction performance
  const trackInteraction = useCallback((interactionName: string, handler: () => void | Promise<void>) => {
    return async () => {
      const startTime = Date.now();
      
      try {
        await handler();
        const duration = Date.now() - startTime;
        
        if (duration > 500) { // Track slow interactions (>500ms)
          trackEvent('slow_interaction', {
            component: componentName,
            interaction: interactionName,
            duration,
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        trackEvent('interaction_error', {
          component: componentName,
          interaction: interactionName,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    };
  }, [componentName]);

  // Track page load performance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          dns: navigation.dnsLookupEnd - navigation.dnsLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          request: navigation.responseStart - navigation.requestStart,
          response: navigation.responseEnd - navigation.responseStart,
          dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.fetchStart,
        };
        
        // Track slow page loads
        if (metrics.total > 3000) {
          trackEvent('slow_page_load', {
            component: componentName,
            ...metrics,
          });
        }
      }
    }
  }, [componentName]);

  return {
    trackRender,
    trackApiCall,
    trackInteraction,
  };
};

// Hook for tracking Web Vitals
export const useWebVitals = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Small delay to ensure analytics is initialized
    const initTimeout = setTimeout(() => {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        
        if (lastEntry) {
          const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
          // Only track if analytics is ready, otherwise skip silently
          trackEvent('web_vital', {
            metric: 'LCP',
            value: lcp,
          });
        
        if (lcp > 2500) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Poor LCP',
            level: 'warning',
            data: { lcp },
          });
        }
      }
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // Track First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        trackEvent('web_vital', {
          metric: 'FID',
          value: fid,
        });
        
        if (fid > 100) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Poor FID',
            level: 'warning',
            data: { fid },
          });
        }
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      trackEvent('web_vital', {
        metric: 'CLS',
        value: clsValue,
      });
      
      if (clsValue > 0.25) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: 'Poor CLS',
          level: 'warning',
          data: { cls: clsValue },
        });
      }
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }, 500); // 500ms delay to ensure analytics is initialized

    return () => {
      clearTimeout(initTimeout);
    };
  }, []);
};
