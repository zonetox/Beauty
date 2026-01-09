// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Export for diagnostic purposes on the error page.
// The new logic prioritizes Vite's `import.meta.env` and falls back to `process.env`.
export const supabaseUrlFromEnv =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL);

// Export for diagnostic purposes on the error page.
export const supabaseAnonKeyFromEnv =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY);


// Check if the credentials are truly configured and not just placeholders.
// Supports both new keys (sb_publishable_...) and legacy keys (eyJ... JWT)
export const isSupabaseConfigured =
    !!supabaseUrlFromEnv &&
    !!supabaseAnonKeyFromEnv &&
    !supabaseUrlFromEnv.includes('your-project-url') &&
    !supabaseAnonKeyFromEnv.includes('your-public-anon-key') &&
    !supabaseAnonKeyFromEnv.includes('sb_publishable_YOUR_KEY_HERE');

// Use real credentials if configured; otherwise, use valid-looking dummy credentials.
// This prevents the client from throwing an 'Invalid supabaseUrl' error on initialization
// before the app has a chance to render the configuration error page.
const supabaseUrl = isSupabaseConfigured ? supabaseUrlFromEnv : 'https://dummy-url.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? supabaseAnonKeyFromEnv : 'dummy-key-for-initialization-to-prevent-crash-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// The client is created. The app's entry point (`App.tsx`) uses `isSupabaseConfigured`
// to prevent any real API calls from being made with the dummy client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        // Explicitly bind the global fetch to ensure it works in all environments (especially Vite/Edge)
        fetch: (...args) => fetch(...args)
    }
});