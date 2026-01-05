-- Fix Remaining Security Issues
-- This script fixes the last 2 function search_path issues
-- Run this in your Supabase SQL Editor
-- ============================================
-- Fix increment_blog_view_count function
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(p_post_id integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.blog_posts
SET view_count = COALESCE(view_count, 0) + 1
WHERE id = p_post_id;
END;
$$;
-- ============================================
-- Fix handle_new_user function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, email)
VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email
    );
RETURN NEW;
END;
$$;
-- ============================================
-- Verification Query
-- ============================================
SELECT p.proname as function_name,
    p.prosecdef as security_definer,
    p.proconfig as config_settings,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname IN ('increment_blog_view_count', 'handle_new_user')
    AND p.pronamespace = 'public'::regnamespace
ORDER BY p.proname;