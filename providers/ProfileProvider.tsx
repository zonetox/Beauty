/**
 * Profile Provider (Layer 2: Data)
 * 
 * Duty: Fetches and manages User Profile and Role data.
 * Depends on: AuthProvider (Layer 1)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthProvider.tsx';
import { Profile } from '../types.ts';
import { snakeToCamel } from '../lib/utils.ts';
import { getUserProfile } from '../lib/session.ts';
import { resolveUserRole, UserRole } from '../lib/roleResolution.ts';

export interface ProfileContextType {
    profile: Profile | null;
    role: UserRole;
    businessId: number | null;
    isLoaded: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
};

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, state: authState } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [role, setRole] = useState<UserRole>('anonymous');
    const [businessId, setBusinessId] = useState<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfileData = useCallback(async (userId: string) => {
        try {
            setIsLoaded(false);
            setError(null);

            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await getUserProfile(userId);

            if (profileError) {
                if ((profileError as any).code === 'PGRST116') {
                    // Profile simply doesn't exist yet (Normal state after signup)
                    setProfile(null);
                    setRole('anonymous');
                    setIsLoaded(true);
                    return;
                }
                throw profileError;
            }

            if (profileData) {
                setProfile(snakeToCamel(profileData) as Profile);
            }

            // 2. Resolve Role
            const roleResult = await resolveUserRole(user);
            setRole(roleResult.role);
            setBusinessId(roleResult.businessId);

            if (roleResult.error) {
                setError(roleResult.error);
            }

            setIsLoaded(true);
        } catch (err: any) {
            console.error('[Profile] Error fetching data:', err);
            setError(err.message || 'Failed to load profile');
            setIsLoaded(true);
        }
    }, [user]);

    // Trigger fetch when auth state changes to authenticated
    useEffect(() => {
        if (authState === 'authenticated' && user) {
            fetchProfileData(user.id);
        } else if (authState === 'unauthenticated') {
            setProfile(null);
            setRole('anonymous');
            setBusinessId(null);
            setIsLoaded(true);
            setError(null);
        } else {
            setIsLoaded(false);
        }
    }, [authState, user, fetchProfileData]);

    const value = {
        profile,
        role,
        businessId,
        isLoaded,
        error,
        refreshProfile: async () => {
            if (user) await fetchProfileData(user.id);
        }
    };

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
