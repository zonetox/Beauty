-- Migration: Create business_staff table for Staff/Sub-user System
-- Date: 2025-01-12
-- Purpose: Support staff members who can edit landing page and blog without billing access

CREATE TABLE IF NOT EXISTS business_staff (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id bigint NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role staff_member_role NOT NULL DEFAULT 'Editor',
    permissions jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(business_id, user_id)
);

-- RLS Policies
ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;

-- SELECT: Business owners và staff members có thể xem
CREATE POLICY business_staff_select_owner_or_staff ON business_staff
    FOR SELECT
    USING (
        business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
        OR user_id = auth.uid()
    );

-- INSERT: Business owners có thể thêm staff
CREATE POLICY business_staff_insert_owner ON business_staff
    FOR INSERT
    WITH CHECK (
        business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- UPDATE: Business owners có thể update staff
CREATE POLICY business_staff_update_owner ON business_staff
    FOR UPDATE
    USING (
        business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- DELETE: Business owners có thể xóa staff
CREATE POLICY business_staff_delete_owner ON business_staff
    FOR DELETE
    USING (
        business_id IN (SELECT profiles.business_id FROM profiles WHERE profiles.id = auth.uid())
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_staff_business_id ON business_staff(business_id);
CREATE INDEX IF NOT EXISTS idx_business_staff_user_id ON business_staff(user_id);

-- Comments
COMMENT ON TABLE business_staff IS 'Staff members assigned to businesses with limited permissions';
COMMENT ON COLUMN business_staff.role IS 'Staff role: Editor or Admin';
COMMENT ON COLUMN business_staff.permissions IS 'JSONB permissions: canEditLandingPage, canEditBlog, canManageMedia, canManageServices';
