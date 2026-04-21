import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabaseClient';
import { HomepageData } from '../../../../types';
import { DEFAULT_HOMEPAGE_DATA } from '../../../../constants';

const HOMEPAGE_QUERY_KEY = ['homepage-data'];

export function useHomepage() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: HOMEPAGE_QUERY_KEY,
        queryFn: async (): Promise<HomepageData> => {
            const { data, error } = await supabase
                .from('page_content')
                .select('content_data')
                .eq('page_name', 'homepage')
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return (data?.content_data as HomepageData) || DEFAULT_HOMEPAGE_DATA;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const updateMutation = useMutation({
        mutationFn: async (newData: HomepageData) => {
            const { error } = await supabase
                .from('page_content')
                .upsert({
                    page_name: 'homepage',
                    content_data: newData as any,
                }, {
                    onConflict: 'page_name',
                });

            if (error) throw error;
            return newData;
        },
        onSuccess: (newData) => {
            queryClient.setQueryData(HOMEPAGE_QUERY_KEY, newData);
        },
    });

    return {
        homepageData: data || DEFAULT_HOMEPAGE_DATA,
        isLoading,
        error,
        updateHomepageData: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending
    };
}
