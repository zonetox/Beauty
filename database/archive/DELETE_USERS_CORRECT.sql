-- XÓA USERS ĐÚNG CÁCH - XỬ LÝ FOREIGN KEY CONSTRAINTS
-- Chạy trong SQL Editor

-- Bước 1: Xóa tất cả records trong các bảng có foreign key đến auth.users
DELETE FROM public.business_staff WHERE user_id IS NOT NULL;
DELETE FROM public.businesses WHERE owner_id IS NOT NULL;
DELETE FROM public.conversions WHERE user_id IS NOT NULL;
DELETE FROM public.notifications WHERE user_id IS NOT NULL;
DELETE FROM public.page_views WHERE user_id IS NOT NULL;
DELETE FROM public.reviews WHERE user_id IS NOT NULL;

-- Bước 2: Xóa profiles và admin_users
DELETE FROM public.profiles;
DELETE FROM public.admin_users;

-- Bước 3: Sau khi xóa tất cả references, mới xóa auth.users
DELETE FROM auth.users;

-- Verify
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count,
    (SELECT COUNT(*) FROM public.businesses) as businesses_count;
