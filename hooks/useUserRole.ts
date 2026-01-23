/**
 * useUserRole Hook
 * 
 * Provides current user role based on resolved operational state.
 * Uses roleResolution logic to determine role from database.
 * 
 * Returns:
 * - role: Current user role (anonymous, user, business_owner, business_staff, admin)
 * - isLoading: Whether role is being resolved
 * - error: Any error during role resolution
 */

import { useAuth } from '../providers/AuthProvider.tsx';
import { useProfile } from '../providers/ProfileProvider.tsx';
import { UserRole } from '../lib/roleResolution.ts';

export interface UseUserRoleResult {
  role: UserRole;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  isBusinessStaff: boolean;
  businessId: number | null;
}

/**
 * useUserRole Hook (Deterministic)
 * 
 * Lightweight wrapper around useProfile to maintain compatibility.
 * Returns pre-resolved role data from global ProfileContext.
 */
export function useUserRole(): UseUserRoleResult {
  const { state: authState } = useAuth();
  const { role, isLoaded, businessId, error } = useProfile();

  return {
    role,
    isLoading: authState === 'loading' || !isLoaded,
    error: error,
    isAdmin: role === 'admin',
    isBusinessOwner: role === 'business_owner',
    isBusinessStaff: role === 'business_staff',
    businessId: businessId
  };
}
