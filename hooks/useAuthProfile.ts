
import { useQuery } from '@tanstack/react-query';
import { keys } from '../lib/queryKeys';
import { Profile } from '../types';
import { snakeToCamel } from '../lib/utils';
import { getUserProfile } from '../lib/session';

/**
 * Hook to fetch User Profile based on Auth ID.
 * Uses 'session' as the source of truth for userId.
 */
export function useAuthProfile(userId: string | undefined | null) {
    return useQuery({
        queryKey: keys.auth.profile(userId || null),
        queryFn: async (): Promise<Profile | null> => {
            if (!userId) return null;

            // 1. Fetch raw data using existing secure utility
            // This utility handles checking if profile exists and even creating it if missing (recovery)
            const { data, error } = await getUserProfile(userId);

            if (error) {
                console.error('[useAuthProfile] Error fetching profile:', error);
                throw error;
            }

            if (!data) return null;

            // 2. Transform to camelCase for app usage
            return snakeToCamel(data) as Profile;
        },
        enabled: !!userId, // Only run if we have a userId
        staleTime: 1000 * 60 * 15, // 15 minutes (Profiles don't change often)
        retry: 2,
    });
}
