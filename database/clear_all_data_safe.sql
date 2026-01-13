-- ============================================
-- SAFE CLEAR ALL DATA (Step by step with verification)
-- ============================================
-- This script clears all data but allows you to verify each step
-- Run each section separately and check results
-- ============================================

-- ============================================
-- STEP 1: View current data (before clear)
-- ============================================
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
UNION ALL
SELECT 'page_views', COUNT(*) FROM public.page_views
UNION ALL
SELECT 'conversions', COUNT(*) FROM public.conversions
ORDER BY table_name;

-- ============================================
-- STEP 2: Clear analytics & tracking
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.conversions;
-- DELETE FROM public.page_views;
-- DELETE FROM public.abuse_reports;

-- ============================================
-- STEP 3: Clear business-related data
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.business_staff;
-- DELETE FROM public.team_members;
-- DELETE FROM public.media_items;
-- DELETE FROM public.services;
-- DELETE FROM public.deals;
-- DELETE FROM public.business_blog_posts;

-- ============================================
-- STEP 4: Clear user-related data
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.notifications;
-- DELETE FROM public.appointments;
-- DELETE FROM public.reviews;
-- DELETE FROM public.orders;
-- DELETE FROM public.support_tickets;
-- DELETE FROM public.registration_requests;

-- ============================================
-- STEP 5: Clear blog data
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.blog_comments;
-- DELETE FROM public.business_blog_posts;
-- DELETE FROM public.blog_posts;
-- DELETE FROM public.blog_categories;

-- ============================================
-- STEP 6: Clear admin data
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.admin_activity_logs;
-- DELETE FROM public.email_notifications_log;
-- DELETE FROM public.admin_users;

-- ============================================
-- STEP 7: Clear businesses and profiles
-- ============================================
-- Uncomment to execute:
-- UPDATE public.profiles SET business_id = NULL WHERE business_id IS NOT NULL;
-- DELETE FROM public.businesses;
-- DELETE FROM public.profiles;

-- ============================================
-- STEP 8: Reset sequences
-- ============================================
-- Uncomment to execute:
-- ALTER SEQUENCE IF EXISTS public.businesses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.blog_posts_id_seq RESTART WITH 1;

-- ============================================
-- STEP 9: Verify all data cleared
-- ============================================
-- Run the query from STEP 1 again to verify
