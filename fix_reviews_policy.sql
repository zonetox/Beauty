-- Final Cleanup: Reviews Policy Optimization
-- This script fixes the last RLS performance issue
-- Run this in your Supabase SQL Editor
-- ============================================
-- Optimize reviews policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            select auth.uid()
        )
    );
-- Verify
SELECT tablename,
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY policyname;