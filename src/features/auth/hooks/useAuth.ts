import { useAuthSession } from './useAuthSession';
import { useAuthRole } from './useAuthRole';
import { AuthContextType, AuthState } from '../types';
import { supabase } from '../../../../lib/supabaseClient';

/**
 * Unified Auth Hook
 * 
 * Combines session management and role resolution into a single, high-performance interface.
 * Replaces fragmented contexts (AuthContext, AdminContext, BusinessContext).
 */
export function useAuth(): AuthContextType {
    const { session, user, isLoading: isSessionLoading } = useAuthSession();
    const { data: roleData, isLoading: isRoleLoading } = useAuthRole(user);

    const isDataLoaded = !isSessionLoading && !isRoleLoading;

    let state: AuthState = 'loading';
    if (isDataLoaded) {
        state = user ? 'authenticated' : 'unauthenticated';
    }

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const register = async (email: string, password: string, metadata?: Record<string, unknown>) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
        if (error) throw error;
    };

    const refreshAuth = async () => {
        await supabase.auth.refreshSession();
    };

    const requestPasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    };

    const resetPassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    // Favorites Logic (Legacy compatibility)
    const isFavorite = (business_id: number) => {
        return roleData?.profile?.favorites?.includes(business_id) ?? false;
    };

    const toggleFavorite = async (business_id: number) => {
        if (!user || !roleData?.profile) return;

        const currentFavorites = roleData.profile.favorites || [];
        const isFav = currentFavorites.includes(business_id);
        const nextFavorites = isFav
            ? currentFavorites.filter(id => id !== business_id)
            : [...currentFavorites, business_id];

        const { error } = await supabase
            .from('profiles')
            .update({ favorites: nextFavorites })
            .eq('id', user.id);

        if (error) throw error;
    };

    return {
        state,
        session: session ?? null,
        user: user ?? null,
        profile: roleData?.profile ?? null,
        role: roleData?.role ?? 'anonymous',
        business_id: roleData?.business_id ?? null,
        isDataLoaded,
        error: roleData?.error ?? null,
        login,
        logout,
        register,
        refreshAuth,
        requestPasswordReset,
        resetPassword,
        isFavorite,
        toggleFavorite
    };
}
