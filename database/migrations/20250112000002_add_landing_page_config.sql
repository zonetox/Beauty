-- Migration: Add landing_page_config to businesses table
-- Date: 2025-01-12
-- Purpose: Store section visibility and order for landing page builder

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS landing_page_config jsonb DEFAULT '{
  "sections": {
    "hero": {"enabled": true, "order": 1},
    "trust": {"enabled": false, "order": 2},
    "services": {"enabled": true, "order": 3},
    "gallery": {"enabled": true, "order": 4},
    "team": {"enabled": false, "order": 5},
    "reviews": {"enabled": true, "order": 6},
    "cta": {"enabled": true, "order": 7},
    "contact": {"enabled": true, "order": 8}
  }
}';

COMMENT ON COLUMN businesses.landing_page_config IS 'Landing page section configuration: visibility and order';
