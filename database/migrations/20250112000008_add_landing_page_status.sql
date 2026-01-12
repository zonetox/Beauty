-- Migration: Add landing_page_status to businesses table
-- Date: 2025-01-12
-- Purpose: Track landing page moderation status

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS landing_page_status text DEFAULT 'Approved' 
CHECK (landing_page_status IN ('Pending', 'Approved', 'Rejected', 'Needs Review'));

COMMENT ON COLUMN businesses.landing_page_status IS 'Landing page moderation status: Pending, Approved, Rejected, Needs Review';
