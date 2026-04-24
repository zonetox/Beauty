-- Fix Infinite Recursion in RLS for admin_users
DROP POLICY IF EXISTS "admin_users_select_admin_or_own" ON public.admin_users;
-- Admin users should not trigger is_admin on themselves for simple SELECT
CREATE POLICY "admin_users_select_admin_or_own" ON public.admin_users FOR
SELECT USING (
        email = (
            SELECT email
            FROM auth.users
            WHERE id = auth.uid()
        )
    );
-- Redefine with LANGUAGE sql to ensure efficient execution with DEFINER privileges
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT) RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE email = user_email
            AND is_locked = FALSE
    );
$$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public,
    pg_temp AS $$
SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE email = (
                SELECT email
                FROM auth.users
                WHERE id = auth.uid()
            )
            AND is_locked = FALSE
    );
$$;