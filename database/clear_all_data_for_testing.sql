-- ============================================
-- CLEAR ALL DATA FOR LOCAL TESTING
-- ============================================
-- ⚠️ WARNING: This script will DELETE ALL DATA from all tables
-- ✅ SAFE: It preserves database structure (tables, RLS, functions)
-- ✅ Use this to reset database for local testing
-- ============================================
-- 
-- What this script does:
-- - Deletes all user data (profiles, auth.users via service role)
-- - Deletes all business data (businesses, services, deals, etc.)
-- - Deletes all transactional data (orders, appointments, reviews)
-- - Deletes all admin data (admin_users, admin_activity_logs)
-- - Deletes all analytics data (page_views, conversions)
-- - Preserves: app_settings, page_content (homepage config)
--
-- What this script does NOT do:
-- - Does NOT drop tables
-- - Does NOT drop RLS policies
-- - Does NOT drop functions
-- - Does NOT drop indexes
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Show current data counts (before clear)
-- ============================================
DO $$
DECLARE
    v_counts TEXT;
BEGIN
    SELECT 
        'BEFORE CLEAR:' || E'\n' ||
        '  Profiles: ' || (SELECT COUNT(*)::TEXT FROM public.profiles) || E'\n' ||
        '  Businesses: ' || (SELECT COUNT(*)::TEXT FROM public.businesses) || E'\n' ||
        '  Orders: ' || (SELECT COUNT(*)::TEXT FROM public.orders) || E'\n' ||
        '  Appointments: ' || (SELECT COUNT(*)::TEXT FROM public.appointments) || E'\n' ||
        '  Reviews: ' || (SELECT COUNT(*)::TEXT FROM public.reviews) || E'\n' ||
        '  Admin Users: ' || (SELECT COUNT(*)::TEXT FROM public.admin_users) || E'\n' ||
        '  Auth Users: ' || (SELECT COUNT(*)::TEXT FROM auth.users) || E'\n'
    INTO v_counts;
    RAISE NOTICE '%', v_counts;
END $$;

-- ============================================
-- STEP 2: Delete child tables first (respecting FK constraints)
-- ============================================

-- Analytics & Tracking
DELETE FROM public.conversions;
DELETE FROM public.page_views;
DELETE FROM public.abuse_reports;

-- Business-related child tables
DELETE FROM public.business_staff;
DELETE FROM public.team_members;
DELETE FROM public.media_items;
DELETE FROM public.services;
DELETE FROM public.deals;
DELETE FROM public.business_blog_posts;

-- User-related child tables
DELETE FROM public.notifications;
DELETE FROM public.appointments;
DELETE FROM public.reviews;
DELETE FROM public.orders;
DELETE FROM public.support_tickets;
DELETE FROM public.registration_requests;

-- Blog
DELETE FROM public.blog_comments;
DELETE FROM public.business_blog_posts;
DELETE FROM public.blog_posts;
DELETE FROM public.blog_categories;

-- Admin
DELETE FROM public.admin_activity_logs;
DELETE FROM public.email_notifications_log;

-- ============================================
-- STEP 3: Delete parent tables
-- ============================================

-- Clear business_id references first
UPDATE public.profiles SET business_id = NULL WHERE business_id IS NOT NULL;

-- Delete businesses (cascade will handle related data if any remains)
DELETE FROM public.businesses;

-- Delete profiles
DELETE FROM public.profiles;

-- Delete admin users
DELETE FROM public.admin_users;

-- ============================================
-- STEP 4: Delete auth.users (requires service role)
-- ============================================
-- Note: This requires service role key
-- If running via MCP or Supabase Dashboard with service role, this will work
-- Otherwise, delete manually via Supabase Dashboard > Authentication > Users

-- Uncomment if you have service role access:
-- DELETE FROM auth.users;

-- ============================================
-- STEP 5: Reset sequences (for clean IDs)
-- ============================================

-- Reset businesses sequence
ALTER SEQUENCE IF EXISTS public.businesses_id_seq RESTART WITH 1;

-- Reset blog_posts sequence
ALTER SEQUENCE IF EXISTS public.blog_posts_id_seq RESTART WITH 1;

-- ============================================
-- STEP 6: Preserve essential config (optional)
-- ============================================
-- Uncomment to also clear app_settings and page_content:
-- DELETE FROM public.page_content;
-- DELETE FROM public.app_settings;
-- 
-- Then re-insert defaults:
-- INSERT INTO public.app_settings (id, settings_data)
-- VALUES (1, '{"siteName": "Beauty Directory", "supportEmail": "support@beautydir.com", "maintenanceMode": false}'::JSONB)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 7: Verify cleanup
-- ============================================
DO $$
DECLARE
    v_counts TEXT;
BEGIN
    SELECT 
        'AFTER CLEAR:' || E'\n' ||
        '  Profiles: ' || (SELECT COUNT(*)::TEXT FROM public.profiles) || E'\n' ||
        '  Businesses: ' || (SELECT COUNT(*)::TEXT FROM public.businesses) || E'\n' ||
        '  Orders: ' || (SELECT COUNT(*)::TEXT FROM public.orders) || E'\n' ||
        '  Appointments: ' || (SELECT COUNT(*)::TEXT FROM public.appointments) || E'\n' ||
        '  Reviews: ' || (SELECT COUNT(*)::TEXT FROM public.reviews) || E'\n' ||
        '  Admin Users: ' || (SELECT COUNT(*)::TEXT FROM public.admin_users) || E'\n' ||
        '  Auth Users: ' || (SELECT COUNT(*)::TEXT FROM auth.users) || E'\n' ||
        E'\n' ||
        '✅ Data cleared successfully!' || E'\n' ||
        '⚠️  Note: auth.users may still exist if service role not available' || E'\n' ||
        '   Delete manually via Supabase Dashboard if needed'
    INTO v_counts;
    RAISE NOTICE '%', v_counts;
END $$;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify all data is cleared:

SELECT 
    'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'businesses', COUNT(*) FROM public.businesses
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'admin_users', COUNT(*) FROM public.admin_users
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'deals', COUNT(*) FROM public.deals
UNION ALL
SELECT 'media_items', COUNT(*) FROM public.media_items
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM public.blog_posts
UNION ALL
SELECT 'business_blog_posts', COUNT(*) FROM public.business_blog_posts
UNION ALL
SELECT 'registration_requests', COUNT(*) FROM public.registration_requests
ORDER BY table_name;
