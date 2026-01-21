/**
 * Single Global Auth Provider
 * 
 * Manages authentication state for the entire application.
 * Only 3 states: loading, authenticated, unauthenticated
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.ts';
import { checkSessionOnce, getUserProfile } from '../lib/session.ts';
import { Profile } from '../types.ts';
import { snakeToCamel } from '../lib/utils.ts';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  // State
  state: AuthState;
  session: Session | null;
  user: User | null;
  profile: Profile | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch profile for authenticated user
  // MANDATORY: Profile must exist for authenticated users
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await getUserProfile(userId);

      if (error && (error as any).code === 'PGRST116') {
        // Profile doesn't exist - CRITICAL ERROR
        // Attempt to create (trigger may have failed)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: null, // Will be set by trigger or updated later
            full_name: null
          })
          .select()
          .single();

        if (insertError || !newProfile) {
          // Creation failed - profile is required
          console.error('CRITICAL: Profile creation failed:', insertError);
          setProfile(null);
          return;
        }

        setProfile(snakeToCamel(newProfile) as Profile);
        return;
      }

      if (error) {
        // Other error - log but don't block (may be transient)
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (data) {
        setProfile(snakeToCamel(data) as Profile);
      } else {
        // No data returned - profile missing
        setProfile(null);
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
      setProfile(null);
    }
  }, []);

  // Handle auth state change
  const handleAuthChange = useCallback(async (_event: AuthChangeEvent, newSession: Session | null) => {
    setSession(newSession);
    const newUser = newSession?.user ?? null;
    setUser(newUser);

    if (newUser) {
      // User is authenticated - fetch profile
      await fetchProfile(newUser.id);
      setState('authenticated');
    } else {
      // User is not authenticated
      setProfile(null);
      setState('unauthenticated');
    }
  }, [fetchProfile]);

  // Initialize: Check session ONCE on app load
  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initialize = async () => {
      // Check session once
      const sessionState = await checkSessionOnce();

      if (!mounted) return;

      setSession(sessionState.session);
      setUser(sessionState.user);

      if (sessionState.user) {
        // Fetch profile
        await fetchProfile(sessionState.user.id);
        setState('authenticated');
      } else {
        setState('unauthenticated');
      }

      // Safety Timeout: Force initialization to complete after 10 seconds
      // to prevent permanent hangs on "Initializing..." screen
      const safetyTimeoutId = setTimeout(() => {
        if (mounted && state === 'loading') {
          console.warn('Auth initialization timed out after 10s - forcing unauthenticated state');
          setState('unauthenticated');
        }
      }, 10000);

      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (mounted) {
            await handleAuthChange(event, newSession);
          }
        }
      );

      authSubscription = subscription;

      // Clear safety timeout if initialized manually above (this won't reach here if blocked)
      // but the 10s timer ensures the app is usable anyway
      return () => {
        clearTimeout(safetyTimeoutId);
      };
    };

    initialize();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, [handleAuthChange, fetchProfile]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Auth state change will be handled by subscription
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      // Clear local state immediately for better UX
      setState('unauthenticated');
      setSession(null);
      setUser(null);
      setProfile(null);

      // Sign out from Supabase (don't throw on error)
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase signOut error (ignoring):', error);
    }
  }, []);

  // Register
  const register = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');

    // Auth state change will be handled by subscription
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }, []);

  // Reset password
  const resetPassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    state,
    session,
    user,
    profile,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
