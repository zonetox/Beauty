/**
 * Post-Signup Initialization
 * 
 * MANDATORY: Ensures user has complete profile after signup.
 * BLOCKS access if initialization fails.
 * 
 * NO fallbacks. NO silent failures.
 */

import { supabase } from './supabaseClient.ts';
import { User } from '@supabase/supabase-js';
import { verifyProfileExists } from './roleResolution.ts';

export interface PostSignupResult {
  success: boolean;
  profileId: string | null;
  error?: string;
}

/**
 * Initialize user profile after signup
 * 
 * Steps:
 * 1. Wait for trigger to create profile (max 3 seconds)
 * 2. Verify profile exists
 * 3. If missing, attempt to create (one time only)
 * 4. If still missing → BLOCK and return error
 */
export async function initializeUserProfile(
  user: User,
  maxWaitMs: number = 3000
): Promise<PostSignupResult> {
  if (!user || !user.id) {
    return {
      success: false,
      profileId: null,
      error: 'Invalid user object'
    };
  }

  // Step 1: Wait for trigger to create profile
  const startTime = Date.now();
  let profileExists = false;
  let attempts = 0;
  const maxAttempts = 10;
  const intervalMs = 300;

  while (!profileExists && attempts < maxAttempts && (Date.now() - startTime) < maxWaitMs) {
    const verification = await verifyProfileExists(user.id);
    
    if (verification.exists) {
      profileExists = true;
      break;
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  // Step 2: If profile exists, return success
  if (profileExists) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    return {
      success: true,
      profileId: profile?.id || user.id
    };
  }

  // Step 3: Profile doesn't exist - attempt to create (schema allows this)
  // MANDATORY: Profile creation is required for all authenticated users
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || null,
      full_name: user.user_metadata?.full_name || user.email || null,
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (insertError || !newProfile) {
    // Step 4: Creation failed - BLOCK access
    // This is a CRITICAL failure - user cannot proceed without profile
    return {
      success: false,
      profileId: null,
      error: `Failed to initialize user profile: ${insertError?.message || 'Unknown error'}. Account is incomplete and cannot be used. Please contact support.`
    };
  }

  return {
    success: true,
    profileId: newProfile.id
  };
}

/**
 * Initialize business record for business signup
 * 
 * Verifies:
 * 1. Profile exists
 * 2. Business record exists
 * 3. Business is linked to user (owner_id matches)
 * 4. Profile.business_id is set
 */
export async function initializeBusinessProfile(
  user: User,
  business_id: number
): Promise<PostSignupResult> {
  if (!user || !user.id) {
    return {
      success: false,
      profileId: null,
      error: 'Invalid user object'
    };
  }

  // Verify business exists and user is owner
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, owner_id')
    .eq('id', business_id)
    .eq('owner_id', user.id)
    .single();

  if (businessError || !business) {
    return {
      success: false,
      profileId: null,
      error: `Business record not found or user is not owner: ${businessError?.message || 'Business not found'}`
    };
  }

  // Verify profile exists
  const profileResult = await initializeUserProfile(user);
  if (!profileResult.success) {
    return profileResult;
  }

  // Verify profile.business_id is set
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, business_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      profileId: null,
      error: 'Profile verification failed after business creation'
    };
  }

  if (profile.business_id !== business_id) {
    // Attempt to link
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ business_id: business_id })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        profileId: profile.id,
        error: `Failed to link business to profile: ${updateError.message}`
      };
    }
  }

  return {
    success: true,
    profileId: profile.id
  };
}
