import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { keys } from '../../../../lib/queryKeys';
import { useEffect } from 'react';

/**
 * Hook to manage Supabase Session state via React Query
 */
export function useAuthSession() {
    const queryClient = useQueryClient();

    const { data: session, isLoading, error } = useQuery({
        queryKey: keys.auth.session,
        queryFn: async (): Promise<Session | null> => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    });

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (event === 'SIGNED_OUT') {
                queryClient.setQueryData(keys.auth.session, null);
                queryClient.setQueryData(keys.auth.profile(null), null);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
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
