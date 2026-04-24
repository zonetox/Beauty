// src/features/directory/types.ts

export interface DirectoryFilters {
    search?: string;
    location?: string;
    district?: string;
    category?: string;
    page: number;
}

export interface BusinessMarker {
    id: number;
    name: string;
    slug?: string;
    logo_url?: string;
    image_url?: string;
    address?: string;
    rating?: number;
    review_count?: number;
    latitude: number;
    longitude: number;
    categories: string[];
    is_active: boolean;
}
