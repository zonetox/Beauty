-- ============================================
-- F1.1 - Add Search Indexes for Full-Text Search
-- Tuân thủ Master Plan v1.1
-- Optimize search performance with proper indexes
-- ============================================

-- ============================================
-- 1. Text Search Indexes for businesses table
-- ============================================

-- Index for name search (most common)
CREATE INDEX IF NOT EXISTS idx_businesses_name_search 
ON public.businesses USING gin(to_tsvector('english', name));

-- Index for description search
CREATE INDEX IF NOT EXISTS idx_businesses_description_search 
ON public.businesses USING gin(to_tsvector('english', COALESCE(description, '')));

-- Index for tags search (array)
CREATE INDEX IF NOT EXISTS idx_businesses_tags_search 
ON public.businesses USING gin(tags);

-- Index for categories search (array)
CREATE INDEX IF NOT EXISTS idx_businesses_categories_search 
ON public.businesses USING gin(categories);

-- Composite index for location-based search
CREATE INDEX IF NOT EXISTS idx_businesses_location 
ON public.businesses(city, district, ward) 
WHERE is_active = TRUE;

-- Index for active businesses (most common filter)
CREATE INDEX IF NOT EXISTS idx_businesses_is_active 
ON public.businesses(is_active) 
WHERE is_active = TRUE;

-- Index for featured businesses
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured 
ON public.businesses(is_featured) 
WHERE is_featured = TRUE AND is_active = TRUE;

-- Index for membership expiry (for filtering)
CREATE INDEX IF NOT EXISTS idx_businesses_membership_expiry 
ON public.businesses(membership_expiry_date) 
WHERE membership_expiry_date IS NOT NULL;

-- ============================================
-- 2. Text Search Indexes for blog_posts table
-- ============================================

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search 
ON public.blog_posts USING gin(to_tsvector('english', title));

-- Index for content search
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_search 
ON public.blog_posts USING gin(to_tsvector('english', COALESCE(content, '')));

-- Index for category search
CREATE INDEX IF NOT EXISTS idx_blog_posts_category 
ON public.blog_posts(category) 
WHERE category IS NOT NULL;

-- Index for date sorting
CREATE INDEX IF NOT EXISTS idx_blog_posts_date 
ON public.blog_posts(date DESC);

-- ============================================
-- 3. Text Search Indexes for business_blog_posts table
-- ============================================

-- Index for title search
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_title_search 
ON public.business_blog_posts USING gin(to_tsvector('english', title));

-- Index for content search
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_content_search 
ON public.business_blog_posts USING gin(to_tsvector('english', COALESCE(content, '')));

-- Index for status and business_id (common filter)
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_status_business 
ON public.business_blog_posts(business_id, status) 
WHERE status = 'Published';

-- ============================================
-- 4. Helper Function: Business Search with Ranking
-- ============================================

CREATE OR REPLACE FUNCTION public.search_businesses(
    p_search_text TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
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
    rating DOUBLE PRECISION,
    review_count INTEGER,
    city TEXT,
    district TEXT,
    categories TEXT[],
    tags TEXT[],
    is_featured BOOLEAN,
    is_verified BOOLEAN,
    rank REAL
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.slug,
        b.rating,
        b.review_count,
        b.city,
        b.district,
        b.categories,
        b.tags,
        b.is_featured,
        b.is_verified,
        -- Ranking: featured (2.0) + verified (1.5) + rating (0.1 per star) + review_count (0.01 per review)
        (
            CASE WHEN b.is_featured THEN 2.0 ELSE 0.0 END +
            CASE WHEN b.is_verified THEN 1.5 ELSE 0.0 END +
            (COALESCE(b.rating, 0) * 0.1) +
            (COALESCE(b.review_count, 0) * 0.01)
        )::REAL AS rank
    FROM public.businesses b
    WHERE 
        b.is_active = TRUE
        AND (p_category IS NULL OR p_category = ANY(b.categories))
        AND (p_city IS NULL OR b.city = p_city)
        AND (p_district IS NULL OR b.district = p_district)
        AND (p_tags IS NULL OR p_tags && b.tags)
        AND (
            p_search_text IS NULL 
            OR p_search_text = ''
            OR to_tsvector('english', COALESCE(b.name, '') || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('english', p_search_text)
            OR b.name ILIKE '%' || p_search_text || '%'
            OR p_search_text = ANY(b.tags)
        )
    ORDER BY rank DESC, b.id ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================
-- 5. Helper Function: Blog Search
-- ============================================

CREATE OR REPLACE FUNCTION public.search_blog_posts(
    p_search_text TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id BIGINT,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    author TEXT,
    date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    rank REAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.author,
        bp.date,
        bp.category,
        -- Ranking: recency (newer = higher) + text match relevance
        (
            EXTRACT(EPOCH FROM (NOW() - bp.date)) / 86400.0 * -0.01 +
            CASE 
                WHEN p_search_text IS NOT NULL AND p_search_text != '' THEN
                    ts_rank(
                        to_tsvector('english', COALESCE(bp.title, '') || ' ' || COALESCE(bp.content, '')),
                        plainto_tsquery('english', p_search_text)
                    )
                ELSE 0.0
            END
        )::REAL AS rank
    FROM public.blog_posts bp
    WHERE 
        (p_category IS NULL OR bp.category = p_category)
        AND (
            p_search_text IS NULL 
            OR p_search_text = ''
            OR to_tsvector('english', COALESCE(bp.title, '') || ' ' || COALESCE(bp.content, '')) @@ plainto_tsquery('english', p_search_text)
            OR bp.title ILIKE '%' || p_search_text || '%'
        )
    ORDER BY rank DESC, bp.date DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================
-- 6. Grant execute permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.search_businesses TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_businesses TO anon;
GRANT EXECUTE ON FUNCTION public.search_blog_posts TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_blog_posts TO anon;

