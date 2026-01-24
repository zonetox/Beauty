-- ============================================
-- DIAGNOSTIC: Check Admin Account Status
-- ============================================
-- Chạy các query này để kiểm tra tài khoản admin
-- 1. Kiểm tra user đã được tạo chưa
SELECT id,
    email,
    created_at
FROM auth.users
WHERE email = 'tanloifmc@yahoo.com';
-- 2. Kiểm tra profile
SELECT id,
    email,
    user_type,
    full_name
FROM public.profiles
WHERE email = 'tanloifmc@yahoo.com';
-- 3. Kiểm tra admin_users
SELECT id,
    username,
    email,
    role,
    is_locked
FROM public.admin_users
WHERE email = 'tanloifmc@yahoo.com';
-- 4. Test RPC get_user_context
SELECT public.get_user_context(
        (
            SELECT id
            FROM auth.users
            WHERE email = 'tanloifmc@yahoo.com'
        )
    );
-- ============================================
-- KẾT QUẢ MONG ĐỢI:
-- Query 1: Phải có 1 dòng với id (UUID)
-- Query 2: Phải có 1 dòng với user_type = 'user' (hoặc null)
-- Query 3: Phải có 1 dòng với role = 'Admin', is_locked = false
-- Query 4: Phải trả về JSON với role = 'admin'
-- ============================================