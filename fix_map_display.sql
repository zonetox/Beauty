-- Fix Map Display: Update businesses to be active
-- This script sets is_active = true for all businesses that are currently NULL or false
-- Run this in your Supabase SQL Editor
UPDATE public.businesses
SET is_active = true
WHERE is_active IS NULL
    OR is_active = false;
-- Verify the update
SELECT id,
    name,
    is_active,
    latitude,
    longitude
FROM public.businesses
ORDER BY id;