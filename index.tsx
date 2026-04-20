
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { initSentry } from './sentry.client.config.ts';
import { initAnalytics } from './lib/analytics.ts';

// Initialize Sentry error tracking
initSentry();

// Initialize PostHog analytics
initAnalytics();

// Handle "Failed to fetch dynamically imported module" errors globally (e.g. for CSS or other assets)
window.addEventListener('error', (event) => {
  const isChunkError =
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.error?.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Loading chunk') ||
    event.error?.message?.includes('Loading chunk');

  if (isChunkError) {
    console.warn('Global chunk error detected. Reloading page...', event);
    const lastReload = sessionStorage.getItem('last_index_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('last_index_error_reload', now.toString());
      window.location.reload();
    }
  }
}, true);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// NOTE: React.StrictMode disabled to prevent double render in development
// This is safe because we already have hasFetchedRef guards in all contexts
root.render(
  <App />
);
