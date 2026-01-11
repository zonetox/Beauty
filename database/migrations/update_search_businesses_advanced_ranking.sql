-- Migration: Update search_businesses_advanced with ranking logic
-- Purpose: Implement deterministic, explainable ranking based on relevance + business value
-- Date: 2025-01-11
-- Safety: Idempotent - can be run multiple times safely

-- Drop and recreate function with ranking
DROP FUNCTION IF EXISTS public.search_businesses_advanced(
    p_search_text TEXT,
    p_category business_category,
    p_city TEXT,
    p_district TEXT,
    p_tags TEXT[],
    p_limit INTEGER,
    p_offset INTEGER
);

-- Create advanced search function with ranking
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
    WITH ranked_businesses AS (
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
            b.is_active,
            -- Ranking Formula:
            -- final_score = text_relevance + membership_weight + rating_score + location_bonus
            (
                -- 1. Text Relevance (0-100 scale)
                -- Weight: business name (A) > description (B) > address/tags (C)
                -- Use ts_rank_cd for better ranking than ts_rank
                CASE 
                    WHEN p_search_text IS NULL OR p_search_text = '' THEN 50.0
                    ELSE (
                        COALESCE(
                            ts_rank_cd(
                                setweight(to_tsvector('english', COALESCE(b.name, '')), 'A') ||
                                setweight(to_tsvector('english', COALESCE(b.description, '')), 'B') ||
                                setweight(to_tsvector('english', 
                                    COALESCE(b.address, '') || ' ' || 
                                    COALESCE(array_to_string(b.tags, ' '), '')
                                ), 'C'),
                                plainto_tsquery('english', p_search_text)
                            ) * 100.0,
                            0.0
                        ) +
                        -- Boost for exact name match (ILIKE)
                        CASE WHEN b.name ILIKE '%' || p_search_text || '%' THEN 20.0 ELSE 0.0 END
                    )
                END
                +
                -- 2. Membership Weight
                CASE b.membership_tier
                    WHEN 'VIP' THEN 30.0
                    WHEN 'Premium' THEN 15.0
                    ELSE 0.0
                END
                +
                -- 3. Rating Score: rating * ln(review_count + 1) * 5
                -- ln(review_count + 1) ensures businesses with 0 reviews don't get negative score
                COALESCE(
                    b.rating * LN(GREATEST(b.review_count, 0) + 1) * 5.0,
                    0.0
                )
                +
                -- 4. Location Bonus
                CASE 
                    WHEN p_city IS NOT NULL AND b.city = p_city THEN 10.0
                    WHEN p_district IS NOT NULL AND b.district = p_district THEN 5.0
                    ELSE 0.0
                END
            ) AS final_score
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
    )
    SELECT 
        rb.id,
        rb.name,
        rb.slug,
        rb.description,
        rb.categories,
        rb.city,
        rb.district,
        rb.address,
        rb.rating,
        rb.review_count,
        rb.membership_tier,
        rb.is_active
    FROM ranked_businesses rb
    ORDER BY rb.final_score DESC, rb.id ASC
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

-- Update comment with ranking explanation
COMMENT ON FUNCTION public.search_businesses_advanced IS 
'Advanced search function with deterministic ranking. Ranking formula: final_score = (text_relevance * 100) + membership_weight (VIP=30, Premium=15) + (rating * ln(review_count + 1) * 5) + location_bonus (city=10, district=5). Results sorted by final_score DESC. Frontend MUST NOT sort results.';
