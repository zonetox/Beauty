/**
 * LEGACY Auth Provider Wrapper
 * 
 * This file is kept for backward compatibility while migrating to src/features/auth.
 * It re-exports and wraps the new Auth feature to ensure existing pages don't break.
 */

// React handled by vite-plugin-react
export { useAuth, AuthProvider } from '../src/features/auth';
export type { AuthState, AuthContextType } from '../src/features/auth';
