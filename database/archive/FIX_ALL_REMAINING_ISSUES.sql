-- ============================================
-- FIX ALL REMAINING SECURITY & PERFORMANCE ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX MISSING FUNCTIONS - Add search_path
-- ============================================

-- Fix get_my_business_id
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id BIGINT;
BEGIN
    SELECT business_id INTO v_business_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_business_id;
END;
$$;

-- Fix increment_view_count
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name TEXT, p_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_table_name = 'businesses' THEN
        UPDATE public.businesses
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    ELSIF p_table_name = 'blog_posts' THEN
        UPDATE public.blog_posts
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    END IF;
END;
$$;

-- Fix update_business_ratings
CREATE OR REPLACE FUNCTION public.update_business_ratings(p_business_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_avg_rating DOUBLE PRECISION;
    v_review_count INTEGER;
BEGIN
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM public.reviews
    WHERE business_id = p_business_id
    AND status = 'approved';
    
    UPDATE public.businesses
    SET 
        rating = v_avg_rating,
        review_count = v_review_count
    WHERE id = p_business_id;
END;
$$;

-- ============================================
-- 2. DELETE ALL USERS (Run in SQL Editor)
-- ============================================

-- Delete from public tables first
DELETE FROM public.profiles;
DELETE FROM public.admin_users;

-- Delete from auth.users (requires SQL Editor, not Management API)
DELETE FROM auth.users;

-- Verify
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_my_business_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.update_business_ratings TO authenticated;
