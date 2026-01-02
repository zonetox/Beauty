-- Fix RLS Security Issues
-- This script enables RLS on all public tables and fixes function search_path issues
-- Run this in your Supabase SQL Editor
-- ============================================
-- PART 1: Enable RLS on Public Tables
-- ============================================
-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
-- Enable RLS on business_blog_posts
ALTER TABLE public.business_blog_posts ENABLE ROW LEVEL SECURITY;
-- Enable RLS on blog_posts
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- Enable RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
-- ============================================
-- PART 2: Create RLS Policies for Public Read Access
-- ============================================
-- Policy for support_tickets (only business owners can read their own tickets, admins can read all)
DROP POLICY IF EXISTS "Public can read support tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can read own tickets" ON public.support_tickets FOR
SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = auth.uid()
        )
    );
-- Policy for business_blog_posts (public can read published posts)
DROP POLICY IF EXISTS "Public can read published business blog posts" ON public.business_blog_posts;
CREATE POLICY "Public can read published business blog posts" ON public.business_blog_posts FOR
SELECT USING (status = 'Published');
-- Policy for blog_posts (public can read all platform blog posts)
DROP POLICY IF EXISTS "Public can read blog posts" ON public.blog_posts;
CREATE POLICY "Public can read blog posts" ON public.blog_posts FOR
SELECT USING (true);
-- Policy for team_members (public can read all team members)
DROP POLICY IF EXISTS "Public can read team members" ON public.team_members;
CREATE POLICY "Public can read team members" ON public.team_members FOR
SELECT USING (true);
-- Policy for deals (public can read active deals)
DROP POLICY IF EXISTS "Public can read active deals" ON public.deals;
CREATE POLICY "Public can read active deals" ON public.deals FOR
SELECT USING (status = 'Active');
-- ============================================
-- PART 3: Fix Function Search Path Issues
-- ============================================
-- Fix increment_view_count function
CREATE OR REPLACE FUNCTION public.increment_view_count(p_business_id integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.businesses
SET view_count = COALESCE(view_count, 0) + 1
WHERE id = p_business_id;
END;
$$;
-- Fix update_business_ratings function
CREATE OR REPLACE FUNCTION public.update_business_ratings() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.businesses
SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE business_id = NEW.business_id
            AND status = 'Visible'
    ),
    review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE business_id = NEW.business_id
            AND status = 'Visible'
    )
WHERE id = NEW.business_id;
RETURN NEW;
END;
$$;
-- ============================================
-- PART 4: Verification Query
-- ============================================
-- Check RLS status for all tables
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'support_tickets',
        'business_blog_posts',
        'blog_posts',
        'team_members',
        'deals'
    )
ORDER BY tablename;
-- Check function search_path settings
SELECT proname as function_name,
    prosecdef as security_definer,
    proconfig as config_settings
FROM pg_proc
WHERE proname IN (
        'increment_view_count',
        'update_business_ratings'
    )
    AND pronamespace = 'public'::regnamespace;