-- ============================================
-- QUICK RESET USERS SCRIPT
-- ============================================
-- Chạy script này để reset users và đăng ký mới
-- ============================================

-- Step 1: Clear business_id references
UPDATE public.profiles SET business_id = NULL WHERE business_id IS NOT NULL;

-- Step 2: Delete all profiles
DELETE FROM public.profiles;

-- Step 3: Delete all businesses (will cascade to related data)
DELETE FROM public.businesses;

-- Step 4: Delete all orders
DELETE FROM public.orders;

-- Step 5: Delete all appointments
DELETE FROM public.appointments;

-- Step 6: Delete all reviews
DELETE FROM public.reviews;

-- Step 7: Delete all registration requests
DELETE FROM public.registration_requests;

-- Step 8: Delete all admin users
DELETE FROM public.admin_users;

-- Step 9: Verify cleanup
SELECT 
    'auth.users' as table_name, 
    (SELECT COUNT(*) FROM auth.users) as count
UNION ALL
SELECT 
    'public.profiles', 
    (SELECT COUNT(*) FROM public.profiles)
UNION ALL
SELECT 
    'public.businesses', 
    (SELECT COUNT(*) FROM public.businesses)
UNION ALL
SELECT 
    'public.admin_users', 
    (SELECT COUNT(*) FROM public.admin_users);

-- ⚠️ IMPORTANT: auth.users cannot be deleted via SQL
-- You MUST delete manually via Supabase Dashboard:
-- 1. Go to: Authentication > Users
-- 2. Select all users
-- 3. Click "Delete"

-- After running this script and deleting auth.users manually,
-- you can register new users via the app!
