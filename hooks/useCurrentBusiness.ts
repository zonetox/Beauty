import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Business } from '../types';

/**
 * Hook to fetch current business by business_id
 * Uses React Query for caching and state management
 * 
 * @param business_id - The ID of the business to fetch
 * @returns React Query result with business data
 */
export function useCurrentBusiness(business_id: number | null) {
    return useQuery({
        queryKey: ['business', 'current', business_id],
        queryFn: async () => {
            if (!business_id) {
                return null;
            }

            console.log('[useCurrentBusiness] Fetching business:', business_id);

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', business_id)
                .single();

            if (error) {
                console.error('[useCurrentBusiness] Fetch failed:', error);
                throw error;
            }

            console.log('[useCurrentBusiness] ✅ Fetch successful:', data?.name);
            return data as Business;
        },
        enabled: !!business_id, // Only run if we have a business_id
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
        retry: 3, // Retry 3 times on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
}
