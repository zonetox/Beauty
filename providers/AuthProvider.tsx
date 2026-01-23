/**
 * ROBUST Auth Provider (Unified Layer) - React Query Hardened
 * 
 * Duty: Manages BOTH Supabase Identity AND User Profile/Role.
 * Uses React Query for state management to prevent race conditions and ensure consistency.
 */

import React, { createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient.ts';
import { Profile } from '../types.ts';
import toast from 'react-hot-toast';
import { UserRole } from '../lib/roleResolution.ts';
import { useAuthSession } from '../hooks/useAuthSession.ts';
import { useAuthProfile } from '../hooks/useAuthProfile.ts';
import { useAuthRole } from '../hooks/useAuthRole.ts';
import { useQueryClient } from '@tanstack/react-query';
import { keys } from '../lib/queryKeys.ts';

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
  isFavorite: (businessId: number) => boolean;
  toggleFavorite: (businessId: number) => Promise<void>;
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
  const queryClient = useQueryClient();

  // 1. Session Management (Source of Truth)
  const {
    session,
    user,
    isLoading: isSessionLoading
  } = useAuthSession();

  // 2. Profile Management
  const {
    data: profile,
    isLoading: isProfileLoading
  } = useAuthProfile(user?.id);

  // 3. Role Management
  const {
    data: roleData,
    isLoading: isRoleLoading
  } = useAuthRole(user || null);

  // Computed State
  const role = roleData?.role || 'anonymous';
  const businessId = roleData?.businessId || null;
  const authError = roleData?.error || null;

  // Overall Loading State
  // We are loading if session is loading, OR if we have a user but profile/role are still loading
  const isLoading = isSessionLoading || (!!user && (isProfileLoading || isRoleLoading));

  const state: AuthState = useMemo(() => {
    if (isLoading) return 'loading';
    if (user) return 'authenticated';
    return 'unauthenticated';
  }, [isLoading, user]);

  // Actions
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // React Query subscription in useAuthSession will handle the state update automatically
    // But we can manually clear to he immediate
    queryClient.setQueryData(keys.auth.session, null);
    queryClient.removeQueries({ queryKey: keys.auth.profile(user?.id || null) });
    queryClient.removeQueries({ queryKey: keys.auth.role(user?.id || null) });
  }, [queryClient, user?.id]);

  const register = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata || {} }
    });
    if (error) throw error;
    if (!data.user) throw new Error('Registration failed');
  }, []);

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

  // Favorites
  const isFavorite = useCallback((businessId: number) => {
    return profile?.favorites?.includes(businessId) || false;
  }, [profile]);

  const toggleFavorite = useCallback(async (toToggleBusinessId: number) => {
    if (!profile || !user) {
      toast.error('Vui lòng đăng nhập để lưu vào danh sách yêu thích');
      return;
    }

    const currentFavorites = profile.favorites || [];
    const isCurrentlyFavorite = currentFavorites.includes(toToggleBusinessId);

    let newFavorites;
    if (isCurrentlyFavorite) {
      newFavorites = currentFavorites.filter(id => id !== toToggleBusinessId);
    } else {
      newFavorites = [...currentFavorites, toToggleBusinessId];
    }

    // Optimistic update via React Query
    queryClient.setQueryData(keys.auth.profile(user.id), (old: Profile | null) => {
      if (!old) return null;
      return { ...old, favorites: newFavorites };
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ favorites: newFavorites })
      .eq('id', user.id);

    if (updateError) {
      // Revert on error
      queryClient.setQueryData(keys.auth.profile(user.id), (old: Profile | null) => {
        if (!old) return null;
        return { ...old, favorites: currentFavorites };
      });
      toast.error('Không thể cập nhật danh sách yêu thích');
      console.error('Error toggling favorite:', updateError);
    } else {
      toast.success(isCurrentlyFavorite ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích');
    }
  }, [profile, user, queryClient]);

  const value: AuthContextType = {
    state,
    session: session || null,
    user,
    profile: profile || null,
    role,
    businessId,
    isDataLoaded: !isLoading,
    error: authError,
    login,
    logout,
    register,
    refreshAuth: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.auth.session });
      await queryClient.invalidateQueries({ queryKey: keys.auth.profile(user?.id || null) });
      await queryClient.invalidateQueries({ queryKey: keys.auth.role(user?.id || null) });
    },
    requestPasswordReset,
    resetPassword,
    isFavorite,
    toggleFavorite
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
