
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { keys } from '../lib/queryKeys';
import { useEffect } from 'react';

/**
 * Hook to manage Supabase Session state via React Query
 * 
 * Benefits:
 * - Automatic re-fetching on window focus
 * - centralized state
 * - Strict type safety
 */
export function useAuthSession() {
    const queryClient = useQueryClient();

    // 1. Initial Session Query
    const { data: session, isLoading, error } = useQuery({
        queryKey: keys.auth.session,
        queryFn: async (): Promise<Session | null> => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        },
        // Don't refetch too aggressively, Supabase SDK handles rotation
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
    });

    // 2. Realtime Subscription (Keeps RQ Logic in sync with SDK)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            // Update Query Cache immediately
            if (event === 'SIGNED_OUT') {
                queryClient.setQueryData(keys.auth.session, null);
                queryClient.setQueryData(keys.auth.profile(null), null); // Clear profile too
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                queryClient.setQueryData(keys.auth.session, newSession);
            } else if (event === 'USER_UPDATED') {
                queryClient.setQueryData(keys.auth.session, newSession);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [queryClient]);

    return {
        session,
        user: session?.user ?? null,
        isLoading,
        error
    };
}
