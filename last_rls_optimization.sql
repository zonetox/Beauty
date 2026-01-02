-- Last Batch of RLS Performance Optimization
-- This script fixes the final remaining RLS performance issues
-- Run this in your Supabase SQL Editor
-- ============================================
-- 1. Optimize registration_requests policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Admins can update registration requests" ON public.registration_requests;
CREATE POLICY "Admins can view registration requests" ON public.registration_requests FOR
SELECT USING (
        (
            select auth.email()
        ) IN (
            SELECT email
            FROM public.admin_users
            WHERE is_locked = false
        )
    );
CREATE POLICY "Admins can update registration requests" ON public.registration_requests FOR
UPDATE USING (
        (
            select auth.email()
        ) IN (
            SELECT email
            FROM public.admin_users
            WHERE is_locked = false
        )
    );
-- ============================================
-- 2. Optimize profiles policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (
        id = (
            select auth.uid()
        )
    );
-- ============================================
-- 3. Optimize services policies
-- ============================================
DROP POLICY IF EXISTS "Owners can insert services" ON public.services;
DROP POLICY IF EXISTS "Owners can update services" ON public.services;
DROP POLICY IF EXISTS "Owners can delete services" ON public.services;
CREATE POLICY "Owners can insert services" ON public.services FOR
INSERT WITH CHECK (
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "Owners can update services" ON public.services FOR
UPDATE USING (
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
CREATE POLICY "Owners can delete services" ON public.services FOR DELETE USING (
    business_id IN (
        SELECT business_id
        FROM public.profiles
        WHERE id = (
                select auth.uid()
            )
    )
);
-- ============================================
-- 4. Optimize orders policies
-- ============================================
DROP POLICY IF EXISTS "Business owners view orders" ON public.orders;
CREATE POLICY "Business owners view orders" ON public.orders FOR
SELECT USING (
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
-- ============================================
-- Verification Query
-- ============================================
SELECT tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename IN (
        'registration_requests',
        'profiles',
        'services',
        'orders'
    )
ORDER BY tablename,
    policyname;