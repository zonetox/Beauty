import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabaseClient';
import { Business } from '../../../../types';
import { DirectoryFilters } from '../types';

const PAGE_SIZE = 20;

export function useBusinesses(filters: DirectoryFilters) {
    return useQuery({
        queryKey: ['businesses', filters],
        queryFn: async () => {
            const from = (filters.page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            // Use RPC for advanced search if search text exists
            if (filters.search || filters.category || filters.location || filters.district) {
                const { data: searchData, error: searchError } = await supabase
                    .rpc('search_businesses_advanced', {
                        p_search_text: filters.search || null,
                        p_category: filters.category || null,
                        p_city: filters.location || null,
                        p_district: filters.district || null,
                        p_limit: PAGE_SIZE,
                        p_offset: from
                    });

                if (searchError) throw searchError;

                if (!searchData || searchData.length === 0) return { businesses: [], total: 0 };

                const business_ids = searchData.map((b: any) => b.id);
                const { data: fullData, error: fetchError, count } = await supabase
                    .from('businesses')
                    .select('*', { count: 'exact' })
                    .in('id', business_ids);

                if (fetchError) throw fetchError;

                // Preserve RPC order
                const orderedData = business_ids
                    .map((id: number) => fullData?.find(b => b.id === id))
                    .filter(Boolean) as Business[];

                return { businesses: orderedData, total: count || orderedData.length };
            }

            // Default fetch
            const { data, error, count } = await supabase
                .from('businesses')
                .select('*', { count: 'exact' })
                .eq('is_active', true)
                .order('is_featured', { ascending: false })
                .order('id', { ascending: true })
                .range(from, to);

            if (error) throw error;
            return { businesses: data as Business[], total: count || 0 };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
