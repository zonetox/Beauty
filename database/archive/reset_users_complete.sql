-- ============================================
-- COMPLETE USER RESET SCRIPT
-- ============================================
-- This script completely resets all users and related data
-- Run this to clean the database for fresh testing
-- ============================================

-- Step 1: Update profiles to remove business_id references (if any remain)
UPDATE profiles SET business_id = NULL WHERE business_id IS NOT NULL;

-- Step 2: Delete all profiles
DELETE FROM profiles;

-- Step 3: Delete all businesses (cascade will handle related data)
DELETE FROM businesses;

-- Step 4: Delete all orders
DELETE FROM orders;

-- Step 5: Delete all appointments
DELETE FROM appointments;

-- Step 6: Delete all reviews
DELETE FROM reviews;

-- Step 7: Delete all registration requests
DELETE FROM registration_requests;

-- Step 8: Verify cleanup
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM businesses) as businesses_count,
    (SELECT COUNT(*) FROM orders) as orders_count;

-- Note: auth.users cannot be deleted via SQL directly
-- You need to delete them via Supabase Dashboard or use service role
-- For now, profiles and businesses are cleaned
