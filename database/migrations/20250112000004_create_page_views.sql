-- Migration: Create page_views table for traffic analytics
-- Date: 2025-01-12
-- Purpose: Track page views for analytics

CREATE TABLE IF NOT EXISTS page_views (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_type text NOT NULL, -- 'homepage', 'business', 'blog', 'directory'
    page_id text, -- business slug, blog slug, etc.
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    ip_address text,
    user_agent text,
    referrer text,
    viewed_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins có thể xem all, business owners có thể xem own business views
CREATE POLICY page_views_select_admin_or_owner ON page_views
    FOR SELECT
    USING (
        auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)
        OR (page_type = 'business' AND page_id IN (
            SELECT slug FROM businesses 
            WHERE id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
        ))
    );

-- INSERT: Public có thể insert (tracking)
CREATE POLICY page_views_insert_public ON page_views
    FOR INSERT
    WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_page_views_page_id ON page_views(page_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);

-- Comments
COMMENT ON TABLE page_views IS 'Page view tracking for analytics';
COMMENT ON COLUMN page_views.page_type IS 'Type: homepage, business, blog, directory';
COMMENT ON COLUMN page_views.page_id IS 'Identifier: business slug, blog slug, etc.';
