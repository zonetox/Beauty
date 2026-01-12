-- Migration: Create abuse_reports table
-- Date: 2025-01-12
-- Purpose: Track abuse reports for reviews

CREATE TABLE IF NOT EXISTS abuse_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Resolved', 'Dismissed')),
    admin_notes text,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;

-- SELECT: Reporters có thể xem own reports, admins có thể xem all
CREATE POLICY abuse_reports_select_own_or_admin ON abuse_reports
    FOR SELECT
    USING (
        reporter_id = auth.uid()
        OR auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)
    );

-- INSERT: Authenticated users có thể tạo reports
CREATE POLICY abuse_reports_insert_authenticated ON abuse_reports
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admins có thể update status
CREATE POLICY abuse_reports_update_admin ON abuse_reports
    FOR UPDATE
    USING (
        auth.email() IN (SELECT admin_users.email FROM admin_users WHERE admin_users.is_locked = false)
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_abuse_reports_review_id ON abuse_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_status ON abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reporter_id ON abuse_reports(reporter_id);

-- Comments
COMMENT ON TABLE abuse_reports IS 'Abuse reports for reviews';
COMMENT ON COLUMN abuse_reports.status IS 'Status: Pending, Reviewed, Resolved, Dismissed';
