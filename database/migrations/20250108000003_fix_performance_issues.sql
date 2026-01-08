-- ============================================
-- Fix Performance Issues
-- Created: 2025-01-08
-- Purpose: Fix Auth RLS InitPlan, add missing index, remove duplicate index
-- ============================================

-- ============================================
-- ADD MISSING INDEX
-- ============================================

-- Add index for notifications.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

-- ============================================
-- REMOVE DUPLICATE INDEX
-- ============================================

-- Remove duplicate index (keep idx_business_blog_posts_business_status)
DROP INDEX IF EXISTS public.idx_business_blog_posts_status_business;

-- ============================================
-- FIX AUTH RLS INITPLAN ISSUES
-- ============================================

-- Fix notifications Update policy
DROP POLICY IF EXISTS "Update notifications" ON public.notifications;
CREATE POLICY "Update notifications"
ON public.notifications
FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- Fix businesses Insert policy
DROP POLICY IF EXISTS "businesses_insert_owner" ON public.businesses;
CREATE POLICY "businesses_insert_owner"
ON public.businesses
FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND owner_id = (select auth.uid())
);

-- Fix profiles Insert policy
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = (select auth.uid()));

-- Fix blog_comments Insert policy
DROP POLICY IF EXISTS "blog_comments_insert_authenticated" ON public.blog_comments;
CREATE POLICY "blog_comments_insert_authenticated"
ON public.blog_comments
FOR INSERT
WITH CHECK ((select auth.uid()) IS NOT NULL);
