-- ============================================
-- SETUP SOLE ADMIN: tanloifmc@yahoo.com
-- ============================================
-- 1. XÓA TẤT CẢ ADMIN CŨ (Đảm bảo tính duy nhất)
DELETE FROM public.admin_users
WHERE email != 'tanloifmc@yahoo.com';
-- 2. THIẾT LẬP TANLOIFMC LÀM SUPER ADMIN
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
        'Admin',
        '{
        "all": true,
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
SET username = 'SuperAdmin',
    role = 'Admin',
    permissions = EXCLUDED.permissions,
    is_locked = false;
-- 3. KIỂM TRA KẾT QUẢ
SELECT username,
    email,
    role,
    CASE
        WHEN is_locked THEN '⚠️ BỊ KHÓA'
        ELSE '✅ ĐANG HOẠT ĐỘNG'
    END as trang_thai
FROM public.admin_users;