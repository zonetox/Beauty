-- FIX LOGIN AND ADMIN PERMISSIONS
-- This script fixes the RLS policies preventing login and admin recognition.
-- 1. FIX PROFILES RLS
-- The error "new row violates row-level security policy for table profiles" happens
-- because there was no policy allowing INSERTs.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Ensure update/select policies exist (from previous scripts, but good to ensure)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
-- 2. FIX ADMIN USERS RLS
-- The error "Could not fetch admin users" happens because the app tries to fetch the list 
-- before the user is fully authenticated. We must allow public read access to this list 
-- so the app knows who is an admin during the loading phase.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Public can read admin list" ON public.admin_users;
CREATE POLICY "Public can read admin list" ON public.admin_users FOR
SELECT USING (true);
-- 3. ENSURE SUPER ADMIN EXISTS
-- Re-run the setup for your specific email to ensure it's in the database.
INSERT INTO public.admin_users (
        username,
        email,
        role,
        permissions,
        is_locked
    )
VALUES (
        'SuperAdmin',
        'tanloifmc@yahoo.com',
        -- The email you are logging in with
        'Admin',
        '{
        "canViewAnalytics": true,
        "canManageBusinesses": true,
        "canManageRegistrations": true,
        "canManageOrders": true,
        "canManagePlatformBlog": true,
        "canManageUsers": true,
        "canManagePackages": true,
        "canManageAnnouncements": true,
        "canManageSupportTickets": true,
        "canManageSiteContent": true,
        "canManageSystemSettings": true,
        "canUseAdminTools": true,
        "canViewActivityLog": true,
        "canViewEmailLog": true
    }'::jsonb,
        false
    ) ON CONFLICT (email) DO
UPDATE
SET role = 'Admin',
    is_locked = false;