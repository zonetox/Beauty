import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Profile } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

import { snakeToCamel } from '../lib/utils.ts';

interface UserSessionContextType {
  session: Session | null;
  currentUser: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPass: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isFavorite: (businessId: number) => boolean;
  toggleFavorite: (businessId: number) => Promise<void>;
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let hasAttemptedAuth = false;

    // Safety timeout: logic must resolve within 15 seconds or we force loading=false
    // Only log warning if we've attempted auth check but it's taking too long
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading && hasAttemptedAuth) {
        // Only warn if Supabase is configured AND we've attempted auth check
        // Only show warning in development mode to avoid Error Logger noise
        if (isSupabaseConfigured && (typeof import.meta !== 'undefined' ? import.meta.env?.MODE === 'development' : process.env.NODE_ENV !== 'production')) {
          console.warn('UserSessionContext: Auth check timed out after 15s. This may indicate a connection issue.');
        }
        setLoading(false);
      } else if (mounted && loading && !hasAttemptedAuth) {
        // If we haven't even attempted auth check yet, just set loading to false silently
        setLoading(false);
      }
    }, 15000);

    const fetchProfile = async (user: User) => {
      try {
        // PHASE 3: Optimize query - select only needed columns
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, business_id')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') { // Profile doesn't exist, create it
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, full_name: user.user_metadata.full_name, email: user.email })
            .select().single();
          if (insertError) {
            console.error('Error creating profile:', insertError.message);
          } else if (newProfile && mounted) {
            setProfile(snakeToCamel(newProfile) as Profile);
          }
        } else if (error) {
          console.error('Error fetching profile:', error.message);
        } else if (data && mounted) {
          setProfile(snakeToCamel(data) as Profile);
        }
      } catch (err) {
        console.error('Unexpected error in fetchProfile:', err);
      }
    };

    const handleAuthChange = async (_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;
      setLoading(true);
      try {
        setSession(session);
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          await fetchProfile(user);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth change error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Get initial session
    if (isSupabaseConfigured) {
      hasAttemptedAuth = true;
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        // Handle invalid refresh token errors
        if (error && (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))) {
          // Clear invalid session
          if (mounted) {
            setSession(null);
            setCurrentUser(null);
            setProfile(null);
            setLoading(false);
          }
          // Clear Supabase session storage
          supabase.auth.signOut().catch(() => {
            // Ignore signOut errors
          });
          return;
        }
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) setLoading(false);
          return;
        }
        handleAuthChange('INITIAL_SESSION', session);
      }).catch(err => {
        // Handle network or other errors
        if (err.message && (err.message.includes('Invalid Refresh Token') || err.message.includes('Refresh Token Not Found'))) {
          // Clear invalid session
          if (mounted) {
            setSession(null);
            setCurrentUser(null);
            setProfile(null);
            setLoading(false);
          }
          supabase.auth.signOut().catch(() => {
            // Ignore signOut errors
          });
        } else {
          console.error('Error getting initial session:', err);
          if (mounted) setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Handle refresh token errors gracefully
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, clear session
          if (mounted) {
            setSession(null);
            setCurrentUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }
        handleAuthChange(event, session);
      });

      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        subscription?.unsubscribe();
      };
    } else {
      if (mounted) setLoading(false);
      return () => { mounted = false; clearTimeout(safetyTimeout); };
    }
  }, []);

  const login = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) { throw new Error("Preview Mode: Real login is disabled."); }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      // Clear local state immediately
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Exception during logout:', error);
      // Still clear local state even if signOut fails
      setCurrentUser(null);
      setProfile(null);
      setSession(null);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.success("(Preview) A password reset link would be sent in a real environment.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) console.error("Supabase password reset request error:", error.message);
  };

  const resetPassword = async (newPass: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      toast.error("Preview Mode: Cannot reset password.");
      throw new Error("Preview Mode");
    }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update profile."); return; }
    if (!profile) return;
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', profile.id).select().single();
    if (error) console.error("Error updating profile:", error.message);
    else setProfile(data as Profile);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      // Explicitly select business_id to ensure it's included
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, business_id, favorites')
        .eq('id', currentUser.id)
        .single();
      if (!error && data) {
        setProfile(snakeToCamel(data) as Profile);
      } else if (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  const isFavorite = (businessId: number): boolean => profile?.favorites?.includes(businessId) ?? false;

  const toggleFavorite = async (businessId: number) => {
    if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot change favorites."); return; }
    if (!profile) return;
    const currentFavorites = profile.favorites || [];
    const newFavorites = currentFavorites.includes(businessId)
      ? currentFavorites.filter(id => id !== businessId)
      : [...currentFavorites, businessId];
    await updateProfile({ favorites: newFavorites });
  };

  const value = {
    session, currentUser, profile, loading,
    login, logout, requestPasswordReset, resetPassword,
    updateProfile, isFavorite, toggleFavorite, refreshProfile
  };

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextType => {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    // Return a safe default instead of throwing to prevent app crash
    // Only log in development mode to avoid Error Logger noise
    if (typeof import.meta !== 'undefined' ? import.meta.env?.MODE === 'development' : process.env.NODE_ENV !== 'production') {
      console.warn('useUserSession must be used within a UserSessionProvider. Using safe defaults.');
    }
    return {
      session: null,
      currentUser: null,
      profile: null,
      loading: false,
      login: async () => { throw new Error('UserSessionProvider not available'); },
      logout: async () => {},
      requestPasswordReset: async () => {},
      resetPassword: async () => {},
      updateProfile: async () => {},
      refreshProfile: async () => {},
      isFavorite: () => false,
      toggleFavorite: async () => {},
    };
  }
  return context;
};
