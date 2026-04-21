-- Migration: Add scaling and onboarding fields
-- 20260421_scaling_and_onboarding.sql
-- 1. Add parent_id for multi-location (branch) support
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES businesses(id) ON DELETE
SET NULL;
-- 2. Add onboarding_token for secure first-time access
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS onboarding_token TEXT UNIQUE;
-- 3. Add verification_status for better moderation
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending' CHECK (
        verification_status IN ('Pending', 'Verified', 'Rejected')
    );
-- 4. Create index for fast parent/branch lookups
CREATE INDEX IF NOT EXISTS idx_businesses_parent_id ON businesses(parent_id);
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_token ON businesses(onboarding_token);
-- 5. Update RLS for parent_id: Business owners can manage their branches
-- Assuming owner_id is the link to auth.users
CREATE POLICY "Owners can manage their branches" ON businesses FOR ALL USING (
    auth.uid() = owner_id
    OR parent_id IN (
        SELECT id
        FROM businesses
        WHERE owner_id = auth.uid()
    )
);
COMMENT ON COLUMN businesses.parent_id IS 'ID của doanh nghiệp mẹ (nếu đây là chi nhánh)';
COMMENT ON COLUMN businesses.onboarding_token IS 'Token duy nhất dùng để bàn giao trang cho chủ sở hữu';