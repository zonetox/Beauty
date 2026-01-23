/**
 * ROBUST Auth Provider (Unified Layer)
 * 
 * Duty: Manages BOTH Supabase Identity AND User Profile/Role.
 * Consolidates Layer 1 (Session) and Layer 2 (Data) to prevent race conditions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.ts';
import { Profile } from '../types.ts';
import { getUserProfile } from '../lib/session.ts';
import { resolveUserRole, UserRole } from '../lib/roleResolution.ts';
import { snakeToCamel } from '../lib/utils.ts';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  state: AuthState;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  businessId: number | null;
  isDataLoaded: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  refreshAuth: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
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
  const [role, setRole] = useState<UserRole>('anonymous');
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Internal logic to fetch profile and resolve role
   */
  const resolveUserData = useCallback(async (currentUser: User) => {
    try {
      setIsDataLoaded(false);
      setError(null);

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await getUserProfile(currentUser.id);

      if (profileData) {
        setProfile(snakeToCamel(profileData) as Profile);
      } else if (profileError) {
        console.warn('[Auth] Profile fetching issue:', profileError);
        // We don't throw here to allow the UI to handle missing profile gracefully via role
      }

      // 2. Resolve Role
      const roleResult = await resolveUserRole(currentUser);
      setRole(roleResult.role);
      setBusinessId(roleResult.businessId);

      if (roleResult.error) {
        setError(roleResult.error);
      }

      setIsDataLoaded(true);
    } catch (err: any) {
      console.error('[Auth] Critical error resolving user data:', err);
      setError(err.message || 'Failed to load user data');
      setIsDataLoaded(true);
    }
  }, []);

  /**
   * Handle Auth Changes (State Machine)
   */
  const handleAuthChange = useCallback(async (_event: AuthChangeEvent, newSession: Session | null) => {
    console.log(`[Auth] Unified Event: ${_event}`);

    setSession(newSession);
    const newUser = newSession?.user ?? null;
    setUser(newUser);

    if (newUser) {
      setState('authenticated');
      await resolveUserData(newUser);
    } else {
      setProfile(null);
      setRole('anonymous');
      setBusinessId(null);
      setIsDataLoaded(true);
      setState('unauthenticated');
    }
  }, [resolveUserData]);

  /**
   * Initialize Identity
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      // 1. Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        setState('authenticated');
      } else {
        setState('unauthenticated');
      }

      // 2. Subscribe to changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (mounted) handleAuthChange(event, session);
      });

      return subscription;
    };

    const subPromise = initialize();

    return () => {
      mounted = false;
      subPromise.then(sub => sub?.unsubscribe());
    };
  }, [handleAuthChange]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState('unauthenticated');
    setSession(null);
    setUser(null);
  }, []);

  // Register
  const register = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata || {} }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');
  }, []);

  // Password Management
  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

  const value: AuthContextType = {
    state,
    session,
    user,
    profile,
    role,
    businessId,
    isDataLoaded,
    error,
    login,
    logout,
    register,
    refreshAuth: async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        await resolveUserData(currentSession.user);
      }
    },
    requestPasswordReset,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
