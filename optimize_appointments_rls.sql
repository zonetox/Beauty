-- Optimize RLS Policies for Appointments Table
-- This script fixes performance issues with RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================
-- Drop existing policies to recreate them optimized
-- ============================================
DROP POLICY IF EXISTS "Owners view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public view appointments for slots" ON public.appointments;
-- ============================================
-- Create optimized combined policies
-- ============================================
-- Combined SELECT policy (replaces multiple permissive policies)
-- Uses (select auth.uid()) to avoid re-evaluation per row
CREATE POLICY "View appointments" ON public.appointments FOR
SELECT USING (
        -- Public can view for booking slots (no auth required)
        true
        OR -- Owners can view their business appointments
        business_id IN (
            SELECT business_id
            FROM public.profiles
            WHERE id = (
                    select auth.uid()
                )
        )
    );
-- Optimized UPDATE policy
-- Uses (select auth.uid()) to avoid re-evaluation per row
CREATE POLICY "Update appointments" ON public.appointments FOR
UPDATE USING (
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
-- Check policies on appointments table
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;