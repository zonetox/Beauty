
import { lazy, ComponentType } from 'react';

/**
 * A safe version of React.lazy that handles "Failed to fetch dynamically imported module" errors.
 * This common error happens when a new version of the app is deployed and the user's
 * browser tries to load a JS chunk that no longer exists (old hash).
 * 
 * @param factory A function that returns a dynamic import promise
 * @returns A lazy-loaded component with auto-reload logic on failure
 */
export function safeLazy<T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) {
    return lazy(async () => {
        try {
            return await factory();
        } catch (error: any) {
            // Check if it's a "Failed to fetch" or "Loading chunk XXX failed" error
            const isChunkError =
                error?.message?.includes('Failed to fetch dynamically imported module') ||
                error?.message?.includes('Loading chunk') ||
                error?.message?.includes('import');

            if (isChunkError) {
                console.warn('Chunk loading failed (likely due to new deployment). Reloading page...', error);

                // Use a small delay before reloading to avoid infinite loops if it's a real network error
                // Also check if we've already reloaded recently to prevent infinite loops
                const lastReload = sessionStorage.getItem('last_chunk_error_reload');
                const now = Date.now();

                if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('last_chunk_error_reload', now.toString());
                    window.location.reload();
                }
            }

            // Re-throw if it wasn't handled or if reload failed to trigger immediately
            throw error;
        }
    });
}
