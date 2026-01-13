// Sentry Client Configuration
// Error tracking for frontend application

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Filter out common non-critical errors
    beforeSend(event, hint) {
      // Filter out network errors that are not critical
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Ignore common browser extension errors
          if (error.message.includes('chrome-extension://') || 
              error.message.includes('moz-extension://')) {
            return null;
          }
          // Ignore ResizeObserver errors (common and non-critical)
          if (error.message.includes('ResizeObserver')) {
            return null;
          }
        }
      }
      return event;
    },
  });
};

export default Sentry;
