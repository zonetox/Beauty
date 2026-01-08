-- ============================================
-- Fix Missing RLS Policies
-- Created: 2025-01-08
-- Purpose: Add RLS policies for admin_activity_logs and email_notifications_log
-- ============================================

-- ============================================
-- ADMIN_ACTIVITY_LOGS POLICIES
-- ============================================

-- SELECT: Only admins can read activity logs
CREATE POLICY "admin_activity_logs_select_admin"
ON public.admin_activity_logs
FOR SELECT
USING (
  public.is_admin()
);

-- INSERT: Only admins can insert (via application, not directly)
-- Edge Functions can insert via service role
CREATE POLICY "admin_activity_logs_insert_admin"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (
  public.is_admin()
);

-- UPDATE: Only admins can update
CREATE POLICY "admin_activity_logs_update_admin"
ON public.admin_activity_logs
FOR UPDATE
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- DELETE: Only admins can delete
CREATE POLICY "admin_activity_logs_delete_admin"
ON public.admin_activity_logs
FOR DELETE
USING (
  public.is_admin()
);

-- ============================================
-- EMAIL_NOTIFICATIONS_LOG POLICIES
-- ============================================

-- SELECT: Only admins can read email logs
CREATE POLICY "email_notifications_log_select_admin"
ON public.email_notifications_log
FOR SELECT
USING (
  public.is_admin()
);

-- INSERT: Edge Functions insert via service role (no RLS check needed)
-- But we add policy for consistency
CREATE POLICY "email_notifications_log_insert_service"
ON public.email_notifications_log
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS anyway

-- UPDATE: Only admins can update
CREATE POLICY "email_notifications_log_update_admin"
ON public.email_notifications_log
FOR UPDATE
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- DELETE: Only admins can delete
CREATE POLICY "email_notifications_log_delete_admin"
ON public.email_notifications_log
FOR DELETE
USING (
  public.is_admin()
);
