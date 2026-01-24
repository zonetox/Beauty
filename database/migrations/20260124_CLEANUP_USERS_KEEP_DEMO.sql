-- ============================================
-- COMPREHENSIVE USER CLEANUP (Preserve Demo Businesses)
-- ============================================
-- Xóa sạch tất cả user accounts nhưng GIỮ NGUYÊN demo businesses
-- BƯỚC 1: Xóa các bảng phụ thuộc user
DELETE FROM public.business_staff;
DELETE FROM public.reviews
WHERE user_id IS NOT NULL;
DELETE FROM public.appointments;
DELETE FROM public.notifications
WHERE user_id IS NOT NULL;
DELETE FROM public.page_views
WHERE user_id IS NOT NULL;
DELETE FROM public.conversions
WHERE user_id IS NOT NULL;
-- BƯỚC 2: Clear business_id references in profiles (FIX foreign key constraint)
UPDATE public.profiles
SET business_id = NULL
WHERE business_id IS NOT NULL;
-- BƯỚC 3: Xóa businesses của USER (giữ lại demo businesses không có owner)
DELETE FROM public.businesses
WHERE owner_id IS NOT NULL;
-- BƯỚC 4: Xóa Profiles và Admin
DELETE FROM public.profiles;
DELETE FROM public.admin_users;
-- BƯỚC 5: Xóa Auth Users (Bảng ngầm của Supabase)
DELETE FROM auth.users;
-- BƯỚC 6: Kiểm tra kết quả
SELECT 'auth.users' as table_name,
    COUNT(*) as remaining_count
FROM auth.users
UNION ALL
SELECT 'profiles',
    COUNT(*)
FROM public.profiles
UNION ALL
SELECT 'admin_users',
    COUNT(*)
FROM public.admin_users
UNION ALL
SELECT 'businesses (with owner)',
    COUNT(*)
FROM public.businesses
WHERE owner_id IS NOT NULL
UNION ALL
SELECT 'businesses (demo - no owner)',
    COUNT(*)
FROM public.businesses
WHERE owner_id IS NULL;
-- ============================================
-- KẾT QUẢ MONG ĐỢI:
-- - auth.users: 0
-- - profiles: 0
-- - admin_users: 0
-- - businesses (with owner): 0
-- - businesses (demo - no owner): > 0 (các demo vẫn còn)
-- ============================================