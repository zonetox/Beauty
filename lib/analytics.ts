// Analytics Integration with PostHog
// User behavior tracking and analytics

import posthog from 'posthog-js';

const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let isInitialized = false;

export const initAnalytics = () => {
  if (!POSTHOG_API_KEY) {
    // Only show warning in development mode
    if (import.meta.env.MODE === 'development') {
      console.warn('PostHog API key not configured. Analytics disabled.');
    }
    return;
  }

  if (isInitialized) {
    return;
  }

  posthog.init(POSTHOG_API_KEY, {
    api_host: POSTHOG_HOST,
    loaded: (posthog) => {
      if (import.meta.env.MODE === 'development') {
        posthog.debug();
      }
    },
    // Capture pageviews automatically
    capture_pageview: true,
    // Capture pageleaves
    capture_pageleave: true,
    // Disable autocapture in development for cleaner data
    autocapture: import.meta.env.MODE === 'production',
    // Respect user privacy
    respect_dnt: true,
    // Disable session recording by default (can be enabled per user)
    disable_session_recording: true,
  });

  isInitialized = true;
};

// Track custom events
// CRITICAL: Tracking is best-effort ONLY. Failures must NEVER surface as errors.
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    // Only show warning in development mode, and only for non-critical events
    // Web vitals are non-critical, so we silently skip them if analytics isn't ready
    if (import.meta.env.MODE === 'development' && !eventName.includes('web_vital') && !eventName.includes('component_')) {
      console.debug('[Tracking] Analytics not initialized. Event not tracked:', eventName);
    }
    return;
  }
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
    if (import.meta.env.MODE === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.debug('[Tracking] Event tracking failed (best-effort):', eventName, errorMessage);
    }
    // NEVER rethrow - tracking must never affect app flow
  }
};

// Check if analytics is initialized
export const isAnalyticsReady = (): boolean => {
  return isInitialized;
};

// Identify user
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    return;
  }
  posthog.identify(userId, properties);
};

// Reset user (on logout)
export const resetUser = () => {
  if (!isInitialized) {
    return;
  }
  posthog.reset();
};

// Track page views manually (if needed)
// CRITICAL: Tracking is best-effort ONLY. Failures must NEVER surface as errors.
export const trackPageView = (path: string) => {
  if (!isInitialized) {
    return;
  }
  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path,
    });
  } catch (error) {
    // CRITICAL: Catch ALL errors (network, CORS, adblock, etc.) and silently fail
    if (import.meta.env.MODE === 'development') {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.debug('[Tracking] Page view tracking failed (best-effort):', errorMessage);
    }
    // NEVER rethrow - tracking must never affect app flow
  }
};

// Track business actions
export const trackBusinessAction = (action: string, businessId: number, properties?: Record<string, any>) => {
  trackEvent('business_action', {
    action,
    business_id: businessId,
    ...properties,
  });
};

// Track conversion events
// CRITICAL: Tracking is best-effort ONLY. Failures must NEVER surface as errors.
export const trackConversion = (type: string, value?: number, properties?: Record<string, any>) => {
  // trackEvent already has fail-safe error handling
  trackEvent('conversion', {
    conversion_type: type,
    value,
    ...properties,
  });
};

// Track booking events
export const trackBooking = (businessId: number, serviceId?: string, properties?: Record<string, any>) => {
  trackEvent('booking', {
    business_id: businessId,
    service_id: serviceId,
    ...properties,
  });
};

// Track search events
export const trackSearch = (query: string, filters?: Record<string, any>) => {
  trackEvent('search', {
    query,
    ...filters,
  });
};

export default posthog;
