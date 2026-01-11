-- Migration: Add search_businesses_advanced function
-- Purpose: Support advanced search with filters (category, city, district, tags) and pagination
-- Date: 2025-01-11
-- Safety: Idempotent - can be run multiple times safely

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.search_businesses_advanced(
    p_search_text TEXT,
    p_category business_category,
    p_city TEXT,
    p_district TEXT,
    p_tags TEXT[],
    p_limit INTEGER,
    p_offset INTEGER
);

-- Create advanced search function
CREATE OR REPLACE FUNCTION public.search_businesses_advanced(
    p_search_text TEXT DEFAULT NULL,
    p_category business_category DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    slug TEXT,
    description TEXT,
    categories business_category[],
    city TEXT,
    district TEXT,
    address TEXT,
    rating DOUBLE PRECISION,
    review_count INTEGER,
    membership_tier membership_tier,
    is_active BOOLEAN
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.slug,
        b.description,
        b.categories,
        b.city,
        b.district,
        b.address,
        b.rating,
        b.review_count,
        b.membership_tier,
        b.is_active
    FROM public.businesses b
    WHERE b.is_active = TRUE
        -- Full-text search (if search text provided)
        AND (
            p_search_text IS NULL 
            OR p_search_text = ''
            OR (
                to_tsvector('english', 
                    COALESCE(b.name, '') || ' ' || 
                    COALESCE(b.description, '') || ' ' ||
                    COALESCE(b.address, '') || ' ' ||
                    COALESCE(array_to_string(b.tags, ' '), '')
                ) @@ plainto_tsquery('english', p_search_text)
                OR b.name ILIKE '%' || p_search_text || '%'
                OR b.city ILIKE '%' || p_search_text || '%'
                OR b.district ILIKE '%' || p_search_text || '%'
            )
        )
        -- Category filter (array contains)
        AND (p_category IS NULL OR p_category = ANY(b.categories))
        -- City filter
        AND (p_city IS NULL OR b.city = p_city)
        -- District filter
        AND (p_district IS NULL OR b.district = p_district)
        -- Tags filter (array overlap)
        AND (p_tags IS NULL OR b.tags && p_tags)
    ORDER BY 
        -- Priority: VIP > Premium > Free
        CASE b.membership_tier
            WHEN 'VIP' THEN 1
            WHEN 'Premium' THEN 2
            WHEN 'Free' THEN 3
            ELSE 4
        END ASC,
        b.rating DESC NULLS LAST,
        b.review_count DESC NULLS LAST,
        b.id ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.search_businesses_advanced(
    p_search_text TEXT,
    p_category business_category,
    p_city TEXT,
    p_district TEXT,
    p_tags TEXT[],
    p_limit INTEGER,
    p_offset INTEGER
) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.search_businesses_advanced IS 
'Advanced search function for businesses with full-text search, category/city/district/tags filters, and pagination. Returns active businesses only.';
