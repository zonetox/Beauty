-- Database Cleanup Script
-- Purpose: Remove legacy/duplicate tables to ensure system uses the standard 'businesses' table.

-- 1. Drop the legacy 'gallery' table first (it depends on 'business')
DROP TABLE IF EXISTS public.gallery CASCADE;

-- 2. Drop the duplicate 'business' table
-- The application now fully uses 'businesses' (plural).
DROP TABLE IF EXISTS public.business CASCADE;

-- 3. Confirmation
-- This query confirms the correct table 'businesses' still exists and is accessible.
SELECT count(*) as business_count FROM public.businesses;
