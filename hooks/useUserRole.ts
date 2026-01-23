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

export function useUserRole(): UseUserRoleResult {
  const { role, state: authState, isDataLoaded, businessId, error } = useAuth();

  return {
    role,
    isLoading: authState === 'loading' || !isDataLoaded,
    error: error,
    isAdmin: role === 'admin',
    isBusinessOwner: role === 'business_owner',
    isBusinessStaff: role === 'business_staff',
    businessId: businessId
  };
}
