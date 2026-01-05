-- Add Missing Indexes for Foreign Keys
-- This script creates indexes on foreign key columns to improve query performance
-- Run this in your Supabase SQL Editor
-- ============================================
-- Create indexes for foreign key columns
-- ============================================
-- Index for team_members.business_id
CREATE INDEX IF NOT EXISTS idx_team_members_business_id ON public.team_members(business_id);
-- Index for support_tickets.business_id
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_id ON public.support_tickets(business_id);
-- Index for services.business_id
CREATE INDEX IF NOT EXISTS idx_services_business_id ON public.services(business_id);
-- Index for reviews.user_id
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
-- Index for reviews.business_id (also useful for queries)
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
-- Index for profiles.business_id
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON public.profiles(business_id);
-- Index for media_items.business_id (if not already exists)
CREATE INDEX IF NOT EXISTS idx_media_items_business_id ON public.media_items(business_id);
-- Index for deals.business_id (if not already exists)
CREATE INDEX IF NOT EXISTS idx_deals_business_id ON public.deals(business_id);
-- Index for appointments.business_id (if not already exists)
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON public.appointments(business_id);
-- ============================================
-- Verification Query
-- ============================================
-- Check all indexes on foreign key columns
SELECT schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%_business_id'
    OR indexname LIKE 'idx_%_user_id'
ORDER BY tablename,
    indexname;