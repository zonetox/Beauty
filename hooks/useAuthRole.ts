
import { useQuery } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { keys } from '../lib/queryKeys';
import { resolveUserRole } from '../lib/roleResolution';

/**
 * Hook to resolve User Role based on User and Profile data.
 * Dependencies: User
 */
export function useAuthRole(user: User | null) {
    return useQuery({
        queryKey: keys.auth.role(user?.id || null),
        queryFn: async () => {
            // If no user, anonymous
            if (!user) {
                return {
                    role: 'anonymous' as const,
                    business_id: null,
                    error: null
                };
            }

            // We pass the user object to the resolution service
            // Note: resolveUserRole internally fetches profile again to be Safe/Strict,
            // but we can optimize future versions to accept profile if trusted.
            // For now, let's stick to the robust implementation in resolveUserRole 
            // which does parallel checks.
            const result = await resolveUserRole(user);

            return {
                role: result.role,
                business_id: result.business_id,
                profile: result.profile || null,
                error: result.error || null
            };
        },
        enabled: !!user, // Only run if we have a user
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
