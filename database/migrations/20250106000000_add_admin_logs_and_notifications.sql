-- C4.9 - Add Admin Logs and Notifications Tables
-- Tuân thủ Master Plan v1.1
-- Migration để chuyển từ localStorage sang database

-- ============================================
-- Table: admin_activity_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for admin_activity_logs
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_username ON public.admin_activity_logs(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_timestamp ON public.admin_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON public.admin_activity_logs(action);

-- Enable RLS on admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_activity_logs
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin_activity_logs_select_admin" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "admin_activity_logs_insert_admin" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "admin_activity_logs_delete_admin" ON public.admin_activity_logs;

-- Only admins can read logs
CREATE POLICY "admin_activity_logs_select_admin"
ON public.admin_activity_logs
FOR SELECT
USING (public.is_admin(public.get_user_email()));

-- Only admins can insert logs
CREATE POLICY "admin_activity_logs_insert_admin"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- Only admins can delete logs
CREATE POLICY "admin_activity_logs_delete_admin"
ON public.admin_activity_logs
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- Table: email_notifications_log
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_notifications_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email_notifications_log
CREATE INDEX IF NOT EXISTS idx_email_notifications_log_recipient ON public.email_notifications_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_log_sent_at ON public.email_notifications_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_log_read ON public.email_notifications_log(read);

-- Enable RLS on email_notifications_log
ALTER TABLE public.email_notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_notifications_log
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "email_notifications_log_select_admin" ON public.email_notifications_log;
DROP POLICY IF EXISTS "email_notifications_log_insert_admin" ON public.email_notifications_log;
DROP POLICY IF EXISTS "email_notifications_log_update_admin" ON public.email_notifications_log;
DROP POLICY IF EXISTS "email_notifications_log_delete_admin" ON public.email_notifications_log;

-- Only admins can read notifications log
CREATE POLICY "email_notifications_log_select_admin"
ON public.email_notifications_log
FOR SELECT
USING (public.is_admin(public.get_user_email()));

-- Only admins can insert notifications log
CREATE POLICY "email_notifications_log_insert_admin"
ON public.email_notifications_log
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- Only admins can update notifications log (mark as read)
CREATE POLICY "email_notifications_log_update_admin"
ON public.email_notifications_log
FOR UPDATE
USING (public.is_admin(public.get_user_email()));

-- Only admins can delete notifications log
CREATE POLICY "email_notifications_log_delete_admin"
ON public.email_notifications_log
FOR DELETE
USING (public.is_admin(public.get_user_email()));


