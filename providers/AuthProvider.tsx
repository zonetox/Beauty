/**
 * CLEAN Auth Provider (Layer 1: Identity)
 * 
 * Duty: ONLY manages the Supabase Session/User.
 * NO database queries. NO retry loops. NO profile fetching.
 * Pure Identity Provider.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.ts';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  state: AuthState;
  session: Session | null;
  user: User | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
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

  /**
   * Handle Auth Changes (State Machine)
   */
  const handleAuthChange = useCallback((_event: AuthChangeEvent, newSession: Session | null) => {
    console.log(`[Auth] Layer 1 - Identity Event: ${_event}`);

    setSession(newSession);
    const newUser = newSession?.user ?? null;
    setUser(newUser);

    if (newUser) {
      setState('authenticated');
    } else {
      setState('unauthenticated');
    }
  }, []);

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
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
