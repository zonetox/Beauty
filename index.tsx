import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initSentry } from './sentry.client.config.ts';
import { initAnalytics } from './lib/analytics.ts';

// Initialize Sentry error tracking
initSentry();

// Initialize PostHog analytics
initAnalytics();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);