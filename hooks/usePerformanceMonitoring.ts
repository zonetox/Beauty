// Performance Monitoring Hook
// Track component render performance, API calls, and user interactions

import { useEffect, useRef, useCallback } from 'react';
import * as Sentry from '@sentry/react';
import { trackEvent } from '../lib/analytics.ts';

interface PerformanceMetrics {
  componentName: string;
  renderTime?: number;
  mountTime?: number;
  apiCallTime?: number;
  interactionTime?: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  // eslint-disable-next-line react-hooks/purity
  const mountStartTime = useRef<number>(Date.now());
  // eslint-disable-next-line react-hooks/purity
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
  const trackApiCall = useCallback(async <T,>(
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
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      if (navigation) {
        const metrics = {
          dns: (navigation.domainLookupEnd || 0) - (navigation.domainLookupStart || 0),
          tcp: (navigation.connectEnd || 0) - (navigation.connectStart || 0),
          request: (navigation.responseStart || 0) - (navigation.requestStart || 0),
          response: (navigation.responseEnd || 0) - (navigation.responseStart || 0),
          dom: (navigation.domContentLoadedEventEnd || 0) - (navigation.domContentLoadedEventStart || 0),
          load: (navigation.loadEventEnd || 0) - (navigation.loadEventStart || 0),
          total: (navigation.loadEventEnd || 0) - (navigation.fetchStart || 0),
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
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const initTimeout = setTimeout(() => {
      let lcpObserver: PerformanceObserver | null = null;
      let fidObserver: PerformanceObserver | null = null;
      let clsObserver: PerformanceObserver | null = null;

      try {
        lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry | undefined;
          const lcp = lastEntry && ((lastEntry as any).renderTime ?? (lastEntry as any).startTime) || 0;
          trackEvent('web_vital', { metric: 'LCP', value: lcp });
          if (lcp > 2500) Sentry.addBreadcrumb({ category: 'performance', message: 'Poor LCP', level: 'warning', data: { lcp } });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true } as any);
      } catch {
        // Ignore error if observer is not supported
      }

      try {
        fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any[];
          entries.forEach((entry) => {
            const fid = (entry as any).processingStart - (entry as any).startTime;
            trackEvent('web_vital', { metric: 'FID', value: fid });
            if (fid > 100) Sentry.addBreadcrumb({ category: 'performance', message: 'Poor FID', level: 'warning', data: { fid } });
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true } as any);
      } catch {
        // Ignore error if observer is not supported
      }

      try {
        let clsValue = 0;
        clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any[];
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) clsValue += entry.value ?? 0;
          });
          trackEvent('web_vital', { metric: 'CLS', value: clsValue });
          if (clsValue > 0.25) Sentry.addBreadcrumb({ category: 'performance', message: 'Poor CLS', level: 'warning', data: { cls: clsValue } });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true } as any);
      } catch {
        // Ignore error if observer is not supported
      }

      // no-op: observers will be cleaned up in cleanup
      return () => {
        lcpObserver?.disconnect();
        fidObserver?.disconnect();
        clsObserver?.disconnect();
      };
    }, 500);

    return () => clearTimeout(initTimeout);
  }, []);
};
