-- ============================================
-- COPY TOÀN BỘ FILE NÀY VÀO SUPABASE SQL EDITOR
-- ============================================
-- File: 20250118000002_add_performance_indexes.sql
-- Date: 2025-01-18
-- Purpose: Add performance indexes to reduce query time from 1-1.4s to <500ms
-- ============================================

-- ============================================
-- 1. blog_posts table - date index (NOTE: blog_posts does NOT have status column)
-- ============================================
-- Query pattern: SELECT * FROM blog_posts ORDER BY date DESC
CREATE INDEX IF NOT EXISTS idx_blog_posts_date 
ON public.blog_posts(date DESC NULLS LAST);

-- ============================================
-- 2. businesses table - additional filter indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_is_active 
ON public.businesses(is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_businesses_is_featured 
ON public.businesses(is_featured)
WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_businesses_city_district 
ON public.businesses(city, district)
WHERE city IS NOT NULL AND district IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_city 
ON public.businesses(city)
WHERE city IS NOT NULL;

-- ============================================
-- 3. reviews table - business_id, status, created_at indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_reviews_business_status_date 
ON public.reviews(business_id, status, submitted_date DESC)
WHERE status = 'Visible';

CREATE INDEX IF NOT EXISTS idx_reviews_business_id 
ON public.reviews(business_id);

CREATE INDEX IF NOT EXISTS idx_reviews_status 
ON public.reviews(status)
WHERE status = 'Visible';

CREATE INDEX IF NOT EXISTS idx_reviews_submitted_date 
ON public.reviews(submitted_date DESC);

-- ============================================
-- 4. services table - business_id and position indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_services_business_position 
ON public.services(business_id, position);

CREATE INDEX IF NOT EXISTS idx_services_business_id 
ON public.services(business_id);

-- ============================================
-- 5. deals table - business_id, status, date indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deals_business_status_dates 
ON public.deals(business_id, status, start_date, end_date)
WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_deals_business_id 
ON public.deals(business_id);

CREATE INDEX IF NOT EXISTS idx_deals_status 
ON public.deals(status)
WHERE status = 'Active';

CREATE INDEX IF NOT EXISTS idx_deals_dates 
ON public.deals(start_date, end_date);

-- ============================================
-- 6. media_items table - business_id and position indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_media_items_business_position 
ON public.media_items(business_id, position);

CREATE INDEX IF NOT EXISTS idx_media_items_business_id 
ON public.media_items(business_id);

-- ============================================
-- 7. team_members table - business_id index
-- ============================================
CREATE INDEX IF NOT EXISTS idx_team_members_business_id 
ON public.team_members(business_id);

-- ============================================
-- 8. appointments table - business_id and status indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_business_status 
ON public.appointments(business_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_business_id 
ON public.appointments(business_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date_status 
ON public.appointments(date, status);

-- ============================================
-- 9. business_blog_posts table - business_id and status indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_business_blog_posts_business_status_date 
ON public.business_blog_posts(business_id, status, published_date DESC NULLS LAST)
WHERE status = 'Published';

CREATE INDEX IF NOT EXISTS idx_business_blog_posts_business_id 
ON public.business_blog_posts(business_id);

CREATE INDEX IF NOT EXISTS idx_business_blog_posts_status 
ON public.business_blog_posts(status)
WHERE status = 'Published';

-- ============================================
-- 10. Update table statistics for query planner
-- ============================================
ANALYZE public.blog_posts;
ANALYZE public.businesses;
ANALYZE public.reviews;
ANALYZE public.services;
ANALYZE public.deals;
ANALYZE public.media_items;
ANALYZE public.team_members;
ANALYZE public.appointments;
ANALYZE public.business_blog_posts;
