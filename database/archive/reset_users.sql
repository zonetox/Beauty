-- ============================================
-- RESET USERS SCRIPT
-- ============================================
-- WARNING: This script will DELETE ALL users from the database
-- Use with caution! This is irreversible.
-- ============================================

-- Step 1: Delete all profiles (public.profiles)
-- This must be done first due to foreign key constraints
DELETE FROM public.profiles;

-- Step 2: Delete all admin users (public.admin_users)
DELETE FROM public.admin_users;

-- Step 3: Delete all auth users (auth.users)
-- This will also delete associated sessions
-- Note: This requires admin privileges
DELETE FROM auth.users;

-- Step 4: Verify deletion
-- Check if all users are deleted
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;

-- ============================================
-- ALTERNATIVE: Soft delete (if you want to keep data)
-- ============================================
-- Instead of deleting, you can mark users as inactive:

-- UPDATE public.profiles SET updated_at = NOW();
-- UPDATE public.admin_users SET is_locked = true;
-- -- Note: auth.users cannot be soft-deleted easily

-- ============================================
-- RECOMMENDED: Reset specific users only
-- ============================================
-- If you want to keep some users, use these queries instead:

-- Delete specific user by email:
-- DELETE FROM public.profiles WHERE email = 'user@example.com';
-- DELETE FROM public.admin_users WHERE email = 'user@example.com';
-- DELETE FROM auth.users WHERE email = 'user@example.com';

-- Delete users created before a specific date:
-- DELETE FROM public.profiles WHERE id IN (
--     SELECT id FROM auth.users WHERE created_at < '2025-01-01'
-- );
-- DELETE FROM public.admin_users WHERE email IN (
--     SELECT email FROM auth.users WHERE created_at < '2025-01-01'
-- );
-- DELETE FROM auth.users WHERE created_at < '2025-01-01';
