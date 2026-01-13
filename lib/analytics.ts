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
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isInitialized) {
    console.warn('Analytics not initialized. Event not tracked:', eventName);
    return;
  }
  posthog.capture(eventName, properties);
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
export const trackPageView = (path: string) => {
  if (!isInitialized) {
    return;
  }
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
  });
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
export const trackConversion = (type: string, value?: number, properties?: Record<string, any>) => {
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
