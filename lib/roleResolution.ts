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

export type UserRole = 'anonymous' | 'user' | 'business_owner' | 'business_staff' | 'admin';

export interface RoleResolutionResult {
  role: UserRole;
  profileId: string | null;
  businessId: number | null;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  isBusinessStaff: boolean;
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
    // MANDATORY: Verify profile exists first (required for all authenticated users)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, business_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist - CRITICAL ERROR - BLOCK ACCESS
      return {
        role: 'anonymous',
        profileId: null,
        businessId: null,
        isAdmin: false,
        isBusinessOwner: false,
        isBusinessStaff: false,
        error: `Profile not found for user ${user.id}. User account is incomplete. Profile record is required for all authenticated users.`
      };
    }

    if (profileError || !profile) {
      return {
        role: 'anonymous',
        profileId: null,
        businessId: null,
        isAdmin: false,
        isBusinessOwner: false,
        isBusinessStaff: false,
        error: `Profile record missing for user ${user.id}. Account initialization failed.`
      };
    }

    // 2. Check admin status (from admin_users table) - MANDATORY: is_locked = FALSE
    // Use maybeSingle() instead of single() to avoid 406 errors when user is not an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_locked')
      .eq('email', user.email)
      .eq('is_locked', false)
      .maybeSingle();

    // Handle 406 errors gracefully (Not Acceptable - usually means no rows match)
    if (adminError && adminError.code === '406') {
      // 406 is expected when user is not an admin - continue to next role check
      // Do nothing, fall through to business owner check
    } else if (adminError && adminError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected when user is not admin)
      // Other errors are unexpected - log but don't block
      console.debug('Admin check error (non-critical):', adminError.message);
    }

    if (!adminError && adminUser) {
      // User is admin - can also own business
      return {
        role: 'admin',
        profileId: profile.id,
        businessId: profile.business_id || null,
        isAdmin: true,
        isBusinessOwner: profile.business_id ? await checkBusinessOwnership(user.id, profile.business_id) : false,
        isBusinessStaff: false
      };
    }

    // 3. Check business ownership (businesses.owner_id = auth.uid())
    if (profile.business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('id, owner_id')
        .eq('id', profile.business_id)
        .eq('owner_id', user.id)
        .single();

      if (business) {
        return {
          role: 'business_owner',
          profileId: profile.id,
          businessId: profile.business_id,
          isAdmin: false,
          isBusinessOwner: true,
          isBusinessStaff: false
        };
      }
    }

    // 4. Check business staff relationship (business_staff.user_id = auth.uid())
    const { data: staffRecord } = await supabase
      .from('business_staff')
      .select('business_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (staffRecord) {
      return {
        role: 'business_staff',
        profileId: profile.id,
        businessId: staffRecord.business_id,
        isAdmin: false,
        isBusinessOwner: false,
        isBusinessStaff: true
      };
    }

    // 5. Regular user
    return {
      role: 'user',
      profileId: profile.id,
      businessId: null,
      isAdmin: false,
      isBusinessOwner: false,
      isBusinessStaff: false
    };

  } catch (error: any) {
    return {
      role: 'anonymous',
      profileId: null,
      businessId: null,
      isAdmin: false,
      isBusinessOwner: false,
      isBusinessStaff: false,
      error: `Role resolution failed: ${error.message}`
    };
  }
}

/**
 * Helper: Check if user owns a business
 */
async function checkBusinessOwnership(userId: string, businessId: number): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_id', userId)
      .single();
    
    return !!data;
  } catch {
    return false;
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
  } catch (error: any) {
    return {
      exists: false,
      error: `Profile verification failed: ${error.message}`
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
    // Check profile has business_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', userId)
      .single();

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

    // Verify business exists and user is owner (MANDATORY: businesses.owner_id = auth.uid())
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', profile.business_id)
      .eq('owner_id', userId)
      .single();

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
  } catch (error: any) {
    return {
      exists: false,
      businessId: null,
      error: `Business verification failed: ${error.message}`
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
  } catch (error: any) {
    return {
      hasAccess: false,
      isOwner: false,
      isStaff: false,
      error: `Business access verification failed: ${error.message}`
    };
  }
}
