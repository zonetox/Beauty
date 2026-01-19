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

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider.tsx';
import { resolveUserRole, UserRole } from '../lib/roleResolution.ts';

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
  const { user, state } = useAuth();
  const [roleResult, setRoleResult] = useState<{
    role: UserRole;
    error: string | null;
    isAdmin: boolean;
    isBusinessOwner: boolean;
    isBusinessStaff: boolean;
    businessId: number | null;
  }>({
    role: 'anonymous',
    error: null,
    isAdmin: false,
    isBusinessOwner: false,
    isBusinessStaff: false,
    businessId: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolveRole = async () => {
      if (state === 'loading') {
        setIsLoading(true);
        return;
      }

      if (!user) {
        setRoleResult({
          role: 'anonymous',
          error: null,
          isAdmin: false,
          isBusinessOwner: false,
          isBusinessStaff: false,
          businessId: null
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const result = await resolveUserRole(user);
      
      setRoleResult({
        role: result.role,
        error: result.error || null,
        isAdmin: result.isAdmin,
        isBusinessOwner: result.isBusinessOwner,
        isBusinessStaff: result.isBusinessStaff,
        businessId: result.businessId
      });
      setIsLoading(false);
    };

    resolveRole();
  }, [user, state]);

  return {
    role: roleResult.role,
    isLoading,
    error: roleResult.error,
    isAdmin: roleResult.isAdmin,
    isBusinessOwner: roleResult.isBusinessOwner,
    isBusinessStaff: roleResult.isBusinessStaff,
    businessId: roleResult.businessId
  };
}
