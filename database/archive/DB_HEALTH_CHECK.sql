-- ============================================
-- 1BEAUTY.ASIA - DB HEALTH CHECK TOOL
-- ============================================
-- Chạy script này để kiểm tra "sức khỏe" và tính đồng bộ của Database.
-- 1. KIỂM TRA CẤU TRÚC BẢNG (Schema Integrity)
SELECT table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('businesses', 'profiles', 'admin_users')
ORDER BY table_name,
    column_name;
-- 2. KIỂM TRA ĐỒNG BỘ ROLE (Business vs Profile)
SELECT p.email,
    p.user_type as profile_type,
    (
        SELECT COUNT(*)
        FROM public.businesses b
        WHERE b.owner_id = p.id
    ) as business_count,
    CASE
        WHEN p.user_type = 'business'
        AND NOT EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.owner_id = p.id
        ) THEN '⚠️ THIẾU BUSINESS'
        WHEN p.user_type = 'user'
        AND EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.owner_id = p.id
        ) THEN '⚠️ SAI USER_TYPE'
        ELSE '✅ CHUẨN'
    END as status
FROM public.profiles p;
-- 3. KIỂM TRA TÀI KHOẢN ADMIN
SELECT email,
    role,
    is_locked,
    CASE
        WHEN is_locked THEN '⚠️ LOCKED'
        ELSE '✅ ACTIVE'
    END as admin_status
FROM public.admin_users;
-- 4. KIỂM TRA RPC INTEGRITY
SELECT routine_name,
    specific_schema
FROM information_schema.routines
WHERE routine_name = 'get_user_context';