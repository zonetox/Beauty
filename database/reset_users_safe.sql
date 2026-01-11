-- ============================================
-- SAFE RESET USERS SCRIPT (Step by step)
-- ============================================
-- This script provides a safer, step-by-step approach
-- Run each section separately and verify results
-- ============================================

-- ============================================
-- STEP 1: View current users (for verification)
-- ============================================
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'public.profiles' as table_name,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'public.admin_users' as table_name,
    COUNT(*) as count
FROM public.admin_users;

-- View all auth users with details
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- View all admin users
SELECT 
    id,
    username,
    email,
    role,
    is_locked,
    last_login
FROM public.admin_users
ORDER BY id;

-- View all profiles
SELECT 
    id,
    email,
    full_name,
    business_id
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Delete profiles first (due to FK constraints)
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.profiles;

-- ============================================
-- STEP 3: Delete admin users
-- ============================================
-- Uncomment to execute:
-- DELETE FROM public.admin_users;

-- ============================================
-- STEP 4: Delete auth users (requires admin)
-- ============================================
-- Uncomment to execute:
-- DELETE FROM auth.users;

-- ============================================
-- STEP 5: Verify all users are deleted
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;

-- ============================================
-- STEP 6: Create new admin user (after reset)
-- ============================================
-- After resetting, you'll need to:
-- 1. Register a new user via Supabase Auth (sign up)
-- 2. Then add them to admin_users table:

-- Example (replace with actual user email):
-- INSERT INTO public.admin_users (username, email, role, permissions, is_locked)
-- VALUES (
--     'admin',
--     'admin@example.com',
--     'Admin',
--     '{
--         "canViewAnalytics": true,
--         "canManageBusinesses": true,
--         "canManageRegistrations": true,
--         "canManageOrders": true,
--         "canManagePlatformBlog": true,
--         "canManageUsers": true,
--         "canManagePackages": true,
--         "canManageAnnouncements": true,
--         "canManageSupportTickets": true,
--         "canManageSystemSettings": true,
--         "canViewActivityLog": true,
--         "canViewEmailLog": true,
--         "canUseAdminTools": true,
--         "canManageSiteContent": true
--     }'::jsonb,
--     false
-- );
