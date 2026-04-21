import { useQuery } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { keys } from '../../../../lib/queryKeys';
import { resolveUserRole } from '../../../../lib/roleResolution';

/**
 * Hook to resolve User Role based on User and Profile data.
 */
export function useAuthRole(user: User | null) {
    return useQuery({
        queryKey: keys.auth.role(user?.id || null),
        queryFn: async () => {
            if (!user) {
                return {
                    role: 'anonymous' as const,
                    business_id: null,
                    error: null
                };
            }

            const result = await resolveUserRole(user);

            return {
                role: result.role,
                business_id: result.business_id,
                profile: result.profile || null,
                error: result.error || null
            };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });
}
