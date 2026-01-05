-- Comprehensive RLS Performance Optimization
-- This script optimizes all remaining RLS policies for better performance
-- Run this in your Supabase SQL Editor
-- ============================================
-- 1. Optimize support_tickets policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read own tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can read own tickets" ON public.support_tickets FOR
SELECT TO authenticated USING (
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
-- ============================================
-- 2. Optimize media_items policies (combine multiple SELECT policies)
-- ============================================
DROP POLICY IF EXISTS "Media items are viewable by everyone" ON public.media_items;
DROP POLICY IF EXISTS "Owners can manage media" ON public.media_items;
-- Combined SELECT policy for all roles
CREATE POLICY "View media items" ON public.media_items FOR
SELECT USING (true);
-- Public can view all media
-- Separate policy for INSERT/UPDATE/DELETE (owners only)
CREATE POLICY "Manage media items" ON public.media_items FOR ALL USING (
    business_id IN (
        SELECT business_id
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
    )
);
-- ============================================
-- 3. Optimize businesses policies
-- ============================================
DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
CREATE POLICY "Users can update own business" ON public.businesses FOR
UPDATE USING (
        id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
-- ============================================
-- 4. Optimize notifications policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (
        recipient_email = (
            select auth.email()
        )
    );
-- ============================================
-- 5. Optimize profiles policies
-- ============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (
        id = (
            select auth.uid()
        )
    );
-- ============================================
-- Verification Query
-- ============================================
-- Check all optimized policies
SELECT tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename IN (
        'support_tickets',
        'media_items',
        'businesses',
        'notifications',
        'profiles'
    )
ORDER BY tablename,
    policyname;