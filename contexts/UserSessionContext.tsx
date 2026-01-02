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
    const fetchProfile = async (user: User) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') { // Profile doesn't exist, create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, full_name: user.user_metadata.full_name, email: user.email })
          .select().single();
        if (insertError) console.error('Error creating profile:', insertError.message);
        else setProfile(snakeToCamel(newProfile) as Profile);
      } else if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(snakeToCamel(data) as Profile);
      }
    };

    const handleAuthChange = async (_event: AuthChangeEvent, session: Session | null) => {
      setLoading(true);
      setSession(session);
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        await fetchProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    // Get initial session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange('INITIAL_SESSION', session);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

      return () => {
        subscription?.unsubscribe();
      };
    } else {
      setLoading(false);
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
      // Manually trigger the fetch logic again
      const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (data) setProfile(data as Profile);
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

export const useUserSession = () => {
  const context = useContext(UserSessionContext);
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};
