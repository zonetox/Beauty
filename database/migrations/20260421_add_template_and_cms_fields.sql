-- Migration: Add Template and CMS fields to businesses table
-- Date: 2026-04-21
-- 1. Add template_id and zalo_phone
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'luxury-minimal',
    ADD COLUMN IF NOT EXISTS zalo_phone TEXT,
    ADD COLUMN IF NOT EXISTS location_map_url TEXT,
    ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'slider',
    ADD COLUMN IF NOT EXISTS map_style JSONB DEFAULT '{"theme": "muted"}'::JSONB,
    ADD COLUMN IF NOT EXISTS products_packages JSONB DEFAULT '[]'::JSONB;
-- 2. Update LandingPageConfig in current records if needed
-- (Not strictly necessary if frontend handles defaults, but good for data integrity)
COMMENT ON COLUMN public.businesses.template_id IS 'Identifier for the luxury template (e.g., luxury-minimal, korean-clinic)';
COMMENT ON COLUMN public.businesses.zalo_phone IS 'Phone number for direct Zalo chat integration';
COMMENT ON COLUMN public.businesses.products_packages IS 'Store data for the Products and Packages section of the landing page';