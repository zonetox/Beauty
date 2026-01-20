-- ============================================
-- Fix Timeout Queries - Add Missing Indexes
-- Date: 2025-01-18
-- Purpose: Fix timeout issues on homepage, blog, businesses, markers, and packages queries
-- ============================================

-- ============================================
-- 1. page_content table indexes
-- ============================================
-- Query pattern: SELECT * FROM page_content WHERE page_name = 'homepage'
-- This query is timing out because page_name is not indexed
CREATE INDEX IF NOT EXISTS idx_page_content_page_name 
ON public.page_content(page_name) 
WHERE page_name IS NOT NULL;

-- ============================================
-- 2. blog_categories table indexes
-- ============================================
-- Query pattern: SELECT * FROM blog_categories ORDER BY name
-- This query is timing out because name ordering is not optimized
CREATE INDEX IF NOT EXISTS idx_blog_categories_name 
ON public.blog_categories(name);

-- ============================================
-- 3. membership_packages table indexes
-- ============================================
-- Query pattern: SELECT * FROM membership_packages WHERE is_active = true ORDER BY price
-- This query is timing out because composite filter+order is not indexed
CREATE INDEX IF NOT EXISTS idx_membership_packages_active_price 
ON public.membership_packages(is_active, price) 
WHERE is_active = TRUE;

-- Index for is_active filter alone (if not already exists)
CREATE INDEX IF NOT EXISTS idx_membership_packages_is_active 
ON public.membership_packages(is_active) 
WHERE is_active = TRUE;

-- ============================================
-- 4. businesses table - markers query indexes
-- ============================================
-- Query pattern: SELECT id, name, latitude, longitude, categories, is_active 
-- FROM businesses 
-- WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
-- This query is timing out because latitude/longitude filters are not optimized
CREATE INDEX IF NOT EXISTS idx_businesses_location_coords 
ON public.businesses(is_active, latitude, longitude) 
WHERE is_active = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Composite index for featured active businesses (homepage critical query)
-- Query pattern: SELECT * FROM businesses WHERE is_active = true AND is_featured = true ORDER BY id
CREATE INDEX IF NOT EXISTS idx_businesses_active_featured_id 
ON public.businesses(is_active, is_featured, id) 
WHERE is_active = TRUE AND is_featured = TRUE;

-- ============================================
-- 5. blog_posts table - optimize date ordering
-- ============================================
-- Query pattern: SELECT * FROM blog_posts ORDER BY date DESC LIMIT 50
-- Ensure date index is optimized (may already exist but verify)
CREATE INDEX IF NOT EXISTS idx_blog_posts_date_desc 
ON public.blog_posts(date DESC NULLS LAST);

-- ============================================
-- 6. blog_comments table indexes
-- ============================================
-- Query pattern: SELECT * FROM blog_comments WHERE post_id = ? ORDER BY date
-- This query may be slow if post_id is not indexed
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id_date 
ON public.blog_comments(post_id, date);

-- Index for date ordering alone
CREATE INDEX IF NOT EXISTS idx_blog_comments_date 
ON public.blog_comments(date DESC);

-- ============================================
-- 7. businesses table - additional composite indexes for common filters
-- ============================================
-- Query pattern: SELECT * FROM businesses WHERE is_active = true AND city = ? AND district = ?
CREATE INDEX IF NOT EXISTS idx_businesses_active_city_district 
ON public.businesses(is_active, city, district) 
WHERE is_active = TRUE;

-- Query pattern: SELECT * FROM businesses WHERE is_active = true AND categories @> ARRAY[?]
-- Note: GIN index for categories already exists, but composite with is_active helps
CREATE INDEX IF NOT EXISTS idx_businesses_active_categories 
ON public.businesses(is_active) 
WHERE is_active = TRUE;
-- Note: The GIN index on categories (idx_businesses_categories_search) should handle array contains
-- This index helps with the is_active filter

-- ============================================
-- 8. Update table statistics for query planner
-- ============================================
-- Run ANALYZE on all tables to update statistics for better query planning
ANALYZE public.page_content;
ANALYZE public.blog_categories;
ANALYZE public.membership_packages;
ANALYZE public.businesses;
ANALYZE public.blog_posts;
ANALYZE public.blog_comments;

-- ============================================
-- 9. Verify indexes were created
-- ============================================
-- Run this query to verify all indexes exist:
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('page_content', 'blog_categories', 'membership_packages', 'businesses', 'blog_posts', 'blog_comments')
-- ORDER BY tablename, indexname;
