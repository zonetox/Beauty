-- Migration: Create conversions table for conversion tracking
-- Date: 2025-01-12
-- Purpose: Track conversion events (clicks, bookings, contact forms)

CREATE TABLE IF NOT EXISTS conversions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id bigint REFERENCES businesses(id) ON DELETE CASCADE,
    conversion_type text NOT NULL, -- 'click', 'booking', 'contact', 'call'
    source text, -- 'landing_page', 'directory', 'search'
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    metadata jsonb,
    converted_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- SELECT: Business owners và admins
CREATE POLICY conversions_select_owner_or_admin ON conversions
    FOR SELECT
    USING (
        business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
        OR auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)
    );

-- INSERT: Public có thể insert (tracking)
CREATE POLICY conversions_insert_public ON conversions
    FOR INSERT
    WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversions_business_id ON conversions(business_id);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_at ON conversions(converted_at);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);

-- Comments
COMMENT ON TABLE conversions IS 'Conversion event tracking';
COMMENT ON COLUMN conversions.conversion_type IS 'Type: click, booking, contact, call';
COMMENT ON COLUMN conversions.source IS 'Source: landing_page, directory, search';
