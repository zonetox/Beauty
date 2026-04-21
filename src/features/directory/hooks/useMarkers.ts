import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabaseClient';
import { BusinessMarker } from '../types';

export function useMarkers() {
    return useQuery({
        queryKey: ['business-markers'],
        queryFn: async (): Promise<BusinessMarker[]> => {
            const { data, error } = await supabase
                .from('businesses')
                .select('id, name, slug, logo_url, image_url, address, rating, review_count, latitude, longitude, categories, is_active')
                .eq('is_active', true)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .limit(2000);

            if (error) throw error;
            return data as BusinessMarker[];
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
