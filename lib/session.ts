/**
 * Session Management Utilities
 * 
 * Centralized session checking and management
 */

import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient.ts';

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * Check session once (used on app initialization)
 */
export async function checkSessionOnce(): Promise<SessionState> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      // Handle invalid refresh token
      if (error.message.includes('Invalid Refresh Token') ||
        error.message.includes('Refresh Token Not Found')) {
        // Clear invalid session
        await supabase.auth.signOut().catch(() => {
          // Ignore signOut errors
        });
        return { session: null, user: null, loading: false };
      }

      // Other errors
      return { session: null, user: null, loading: false };
    }

    return {
      session: data.session,
      user: data.session?.user ?? null,
      loading: false
    };
  } catch {
    // Network or other errors
    return { session: null, user: null, loading: false };
  }
}

/**
 * Get user profile (if authenticated)
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, business_id')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist - CRITICAL
      // Attempt to create (trigger may have failed)
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: null, // Will be updated from auth.users
          full_name: null
        })
        .select()
        .single();

      if (insertError) {
        // Creation failed - return error (caller must handle)
        return { data: null, error: insertError };
      }

      return { data: newProfile, error: null };
    }

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
