-- ============================================
-- F2 - Performance Optimization
-- Tuân thủ Master Plan v1.1
-- Add missing indexes, optimize queries
-- ============================================

-- ============================================
-- 1. Additional Performance Indexes
-- ============================================

-- Index for business slug (used in fetchBusinessBySlug)
CREATE INDEX IF NOT EXISTS idx_businesses_slug_unique 
ON public.businesses(slug) 
WHERE slug IS NOT NULL;

-- Index for business owner_id (used in business owner queries)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id 
ON public.businesses(owner_id) 
WHERE owner_id IS NOT NULL;

-- Index for reviews by business_id (common filter)
CREATE INDEX IF NOT EXISTS idx_reviews_business_id_status 
ON public.reviews(business_id, status) 
WHERE status = 'Visible';

-- Index for appointments by business_id and date
CREATE INDEX IF NOT EXISTS idx_appointments_business_date 
ON public.appointments(business_id, date) 
WHERE date IS NOT NULL;

-- Index for orders by business_id and status
CREATE INDEX IF NOT EXISTS idx_orders_business_status 
ON public.orders(business_id, status);

-- Index for support_tickets by business_id and status
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_status 
ON public.support_tickets(business_id, status);

-- Index for blog_posts by slug (used in getPostBySlug)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_unique 
ON public.blog_posts(slug) 
WHERE slug IS NOT NULL;

-- Index for business_blog_posts by business_id and status
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_business_status 
ON public.business_blog_posts(business_id, status) 
WHERE status = 'Published';

-- Index for services by business_id (common filter)
CREATE INDEX IF NOT EXISTS idx_services_business_id_position 
ON public.services(business_id, position);

-- Index for deals by business_id and status
CREATE INDEX IF NOT EXISTS idx_deals_business_status 
ON public.deals(business_id, status) 
WHERE status = 'Active';

-- Index for media_items by business_id and position
CREATE INDEX IF NOT EXISTS idx_media_items_business_position 
ON public.media_items(business_id, position);

-- ============================================
-- 2. Composite Indexes for Common Query Patterns
-- ============================================

-- Index for active businesses with membership
CREATE INDEX IF NOT EXISTS idx_businesses_active_membership 
ON public.businesses(is_active, membership_tier, membership_expiry_date) 
WHERE is_active = TRUE;

-- Index for featured active businesses
CREATE INDEX IF NOT EXISTS idx_businesses_featured_active 
ON public.businesses(is_featured, is_active, rating DESC) 
WHERE is_featured = TRUE AND is_active = TRUE;

-- ============================================
-- 3. Analyze Tables (Update Statistics)
-- ============================================

-- Update table statistics for query planner
ANALYZE public.businesses;
ANALYZE public.reviews;
ANALYZE public.appointments;
ANALYZE public.orders;
ANALYZE public.blog_posts;
ANALYZE public.business_blog_posts;
ANALYZE public.services;
ANALYZE public.deals;
ANALYZE public.media_items;

-- ============================================
-- 4. Performance Monitoring Views
-- ============================================

-- View for slow query monitoring (if pg_stat_statements is enabled)
-- Note: This requires pg_stat_statements extension
CREATE OR REPLACE VIEW public.v_slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- Queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 50;

-- View for index usage statistics
CREATE OR REPLACE VIEW public.v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- View for unused indexes (candidates for removal)
CREATE OR REPLACE VIEW public.v_unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- 5. Query Optimization Functions
-- ============================================

-- Function to get business count efficiently (for pagination)
CREATE OR REPLACE FUNCTION public.get_business_count(
    p_category TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE is_active = TRUE
      AND (p_category IS NULL OR p_category = ANY(categories))
      AND (p_city IS NULL OR city = p_city)
      AND (p_district IS NULL OR district = p_district);
    
    RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_business_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_count TO anon;

-- ============================================
-- 6. Vacuum and Analyze (Maintenance)
-- ============================================

-- Note: VACUUM ANALYZE should be run periodically (not in migration)
-- This is just a comment for reference
-- VACUUM ANALYZE public.businesses;
-- VACUUM ANALYZE public.reviews;
-- VACUUM ANALYZE public.appointments;

