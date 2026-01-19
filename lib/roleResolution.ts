/**
 * Role Resolution Service
 * 
 * Determines user type based on ACTUAL database schema.
 * NO hardcoded logic. NO assumptions.
 * 
 * Schema-based role resolution:
 * - profiles.business_id IS NOT NULL → Business Owner
 * - admin_users.email = user.email AND is_locked = FALSE → Admin
 * - profiles.id EXISTS → Regular User
 * - auth.uid() IS NULL → Anonymous
 */

import { supabase } from './supabaseClient.ts';
import { User } from '@supabase/supabase-js';

export type UserRole = 'anonymous' | 'user' | 'business_owner' | 'admin';

export interface RoleResolutionResult {
  role: UserRole;
  profileId: string | null;
  businessId: number | null;
  isAdmin: boolean;
  error?: string;
}

/**
 * Resolve user role from actual database
 * 
 * Logic (in order):
 * 1. If no user → anonymous
 * 2. Check admin_users table → admin
 * 3. Check profiles.business_id → business_owner
 * 4. Check profiles.id exists → user
 * 5. If profile doesn't exist → ERROR (should not happen after signup)
 */
export async function resolveUserRole(user: User | null): Promise<RoleResolutionResult> {
  // 1. Anonymous
  if (!user || !user.email) {
    return {
      role: 'anonymous',
      profileId: null,
      businessId: null,
      isAdmin: false
    };
  }

  try {
    // 2. Check admin status (from admin_users table)
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_locked')
      .eq('email', user.email)
      .eq('is_locked', false)
      .single();

    if (!adminError && adminUser) {
      // User is admin
      // Still need to fetch profile for business_id (admin can also own business)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, business_id')
        .eq('id', user.id)
        .single();

      return {
        role: 'admin',
        profileId: profile?.id || user.id,
        businessId: profile?.business_id || null,
        isAdmin: true
      };
    }

    // 3. Check profile and business ownership
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, business_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Profile doesn't exist - CRITICAL ERROR
      return {
        role: 'anonymous',
        profileId: null,
        businessId: null,
        isAdmin: false,
        error: `Profile not found for user ${user.id}. User account is incomplete.`
      };
    }

    if (!profile) {
      return {
        role: 'anonymous',
        profileId: null,
        businessId: null,
        isAdmin: false,
        error: `Profile record missing for user ${user.id}.`
      };
    }

    // 4. Check business ownership
    if (profile.business_id) {
      // Verify business exists and user is owner
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
          isAdmin: false
        };
      }
    }

    // 5. Regular user
    return {
      role: 'user',
      profileId: profile.id,
      businessId: null,
      isAdmin: false
    };

  } catch (error: any) {
    return {
      role: 'anonymous',
      profileId: null,
      businessId: null,
      isAdmin: false,
      error: `Role resolution failed: ${error.message}`
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
        error: 'Profile not found'
      };
    }

    if (!profile.business_id) {
      return {
        exists: false,
        businessId: null,
        error: 'Business not linked to profile'
      };
    }

    // Verify business exists and user is owner
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
        error: 'Business record not found or user is not owner'
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
