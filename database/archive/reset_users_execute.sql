-- ============================================
-- EXECUTE: Reset All Users
-- ============================================
-- WARNING: This will DELETE ALL users
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Delete profiles (must be first due to FK)
DELETE FROM public.profiles;

-- Step 2: Delete admin users
DELETE FROM public.admin_users;

-- Step 3: Delete auth users (this will also clear sessions)
DELETE FROM auth.users;

-- Step 4: Verify (should return all zeros)
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;

-- Expected result:
-- auth_users_count: 0
-- profiles_count: 0
-- admin_users_count: 0
