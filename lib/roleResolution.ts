/**
 * Role Resolution Service
 * 
 * Determines user type based on ACTUAL database schema.
 * NO hardcoded logic. NO assumptions.
 * 
 * Schema-based role resolution (in order):
 * 1. auth.uid() IS NULL → Anonymous
 * 2. admin_users.email = user.email AND is_locked = FALSE → Admin
 * 3. businesses.owner_id = auth.uid() → Business Owner
 * 4. business_staff.user_id = auth.uid() → Business Staff (can access business dashboard)
 * 5. profiles.id EXISTS → Regular User
 * 
 * OPERATIONAL STATES (based on schema):
 * - Regular User: profiles.id exists, NOT business owner, NOT admin
 * - Business Owner: businesses.owner_id = auth.uid()
 * - Business Staff: business_staff.user_id = auth.uid() (can access business dashboard)
 * - Admin: admin_users.email = auth.users.email AND is_locked = FALSE
 */

import { supabase } from './supabaseClient.ts';
import { User } from '@supabase/supabase-js';
import { Profile } from '../types.ts';

export type UserRole = 'anonymous' | 'user' | 'business_owner' | 'business_staff' | 'admin';

export interface RoleResolutionResult {
  role: UserRole;
  profileId: string | null;
  businessId: number | null;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  isBusinessStaff: boolean;
  profile?: Profile | null; // Add dynamic profile data
  error?: string;
}

/**
 * Resolve user role from actual database
 * 
 * Logic (in order - STRICT):
 * 1. If no user → anonymous
 * 2. Check admin_users table → admin (MANDATORY: is_locked = FALSE)
 * 3. Check businesses.owner_id = auth.uid() → business_owner
 * 4. Check business_staff.user_id = auth.uid() → business_staff
 * 5. Check profiles.id exists → user
 * 6. If profile doesn't exist → ERROR (BLOCK ACCESS)
 */
export async function resolveUserRole(user: User | null): Promise<RoleResolutionResult> {
  // 1. Anonymous
  if (!user || !user.email) {
    return {
      role: 'anonymous',
      profileId: null,
      businessId: null,
      isAdmin: false,
      isBusinessOwner: false,
      isBusinessStaff: false
    };
  }

  try {
    // INDUSTRIAL STANDARD: Use the unified context RPC
    // This single call replaces all fragmented table checks (profiles, admin, business, staff)
    const { data, error } = await (supabase.rpc as any)('get_user_context', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Unified Context Error:', error);
      throw error;
    }

    const context = data as any;

    if (!context) {
      return {
        role: 'anonymous',
        profileId: null,
        businessId: null,
        isAdmin: false,
        isBusinessOwner: false,
        isBusinessStaff: false,
        error: `Context not found for user ${user.id}`
      };
    }

    // Map RPC response to RoleResolutionResult
    return {
      role: context.role as any,
      profileId: context.profile.id,
      businessId: context.businessId,
      isAdmin: context.role === 'admin',
      isBusinessOwner: context.role === 'business_owner',
      isBusinessStaff: context.role === 'business_staff',
      profile: context.profile
    };

  } catch (error: unknown) {
    console.error('Role Resolution Failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      role: 'anonymous',
      profileId: null,
      businessId: null,
      isAdmin: false,
      isBusinessOwner: false,
      isBusinessStaff: false,
      error: `Role resolution failed: ${errorMessage}`
    };
  }
}

/**
 * Verify profile exists after signup
 * Blocks access if profile is missing
 */
export async function verifyProfileExists(userId: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist - CRITICAL
      return {
        exists: false,
        error: 'Profile record not found. Account initialization failed.'
      };
    }

    if (error) {
      return {
        exists: false,
        error: `Failed to verify profile: ${error.message}`
      };
    }

    if (!data) {
      return {
        exists: false,
        error: 'Profile record is missing.'
      };
    }

    return { exists: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      exists: false,
      error: `Profile verification failed: ${errorMessage}`
    };
  }
}

/**
 * Verify business record exists and is linked to user
 * Used for business signup flow
 * 
 * Checks:
 * 1. Profile exists
 * 2. Business exists
 * 3. User is owner (businesses.owner_id = auth.uid())
 */
export async function verifyBusinessLinked(userId: string): Promise<{ exists: boolean; businessId: number | null; error?: string }> {
  try {
    // Add timeout for verification (15 seconds)
    const verificationTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Business verification timeout')), 15000);
    });

    // Check profile has business_id with timeout
    const profileQuery = supabase
      .from('profiles')
      .select('business_id')
      .eq('id', userId)
      .single();

    const { data: profile, error: profileError } = await Promise.race([
      profileQuery,
      verificationTimeout
    ]) as { data: { business_id: number | null } | null; error: any };

    if (profileError || !profile) {
      return {
        exists: false,
        businessId: null,
        error: 'Profile not found. Account is incomplete.'
      };
    }

    if (!profile.business_id) {
      return {
        exists: false,
        businessId: null,
        error: 'Business not linked to profile. Business registration incomplete.'
      };
    }

    // Verify business exists and user is owner with timeout
    const businessQuery = supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', profile.business_id)
      .eq('owner_id', userId)
      .single();

    const { data: business, error: businessError } = await Promise.race([
      businessQuery,
      verificationTimeout
    ]) as { data: { id: number; owner_id: string } | null; error: any };

    if (businessError || !business) {
      return {
        exists: false,
        businessId: profile.business_id,
        error: 'Business record not found or user is not owner. Business ownership verification failed.'
      };
    }

    return {
      exists: true,
      businessId: business.id
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      exists: false,
      businessId: null,
      error: `Business verification failed: ${errorMessage}`
    };
  }
}

/**
 * Verify business access (owner OR staff)
 * Used for business dashboard access
 * 
 * Checks:
 * 1. User is owner (businesses.owner_id = auth.uid())
 * 2. OR user is staff (business_staff.user_id = auth.uid() AND business_staff.business_id = businessId)
 */
export async function verifyBusinessAccess(userId: string, businessId: number): Promise<{ hasAccess: boolean; isOwner: boolean; isStaff: boolean; error?: string }> {
  try {
    // Check ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .eq('owner_id', userId)
      .single();

    if (business) {
      return {
        hasAccess: true,
        isOwner: true,
        isStaff: false
      };
    }

    // Check staff relationship
    const { data: staffRecord } = await supabase
      .from('business_staff')
      .select('id')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();

    if (staffRecord) {
      return {
        hasAccess: true,
        isOwner: false,
        isStaff: true
      };
    }

    return {
      hasAccess: false,
      isOwner: false,
      isStaff: false,
      error: 'User does not have access to this business. User must be owner or staff member.'
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      hasAccess: false,
      isOwner: false,
      isStaff: false,
      error: `Business access verification failed: ${errorMessage}`
    };
  }
}