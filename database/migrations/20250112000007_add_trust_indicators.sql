-- Migration: Add trust_indicators to businesses table
-- Date: 2025-01-12
-- Purpose: Store trust indicators (badges, certifications, awards)

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS trust_indicators jsonb DEFAULT '[]';

COMMENT ON COLUMN businesses.trust_indicators IS 'Array of trust indicators: [{"type": "badge", "title": "Verified", "icon": "..."}, ...]';
