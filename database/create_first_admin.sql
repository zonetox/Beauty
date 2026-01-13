-- ============================================
-- Create First Admin User
-- ============================================
-- Run this script to create the first admin user
-- Replace email and username as needed
-- ============================================

-- Create Super Admin
INSERT INTO public.admin_users (username, email, role, permissions, is_locked)
VALUES (
    'SuperAdmin',
    'admin@1beauty.asia',  -- ⚠️ CHANGE THIS EMAIL to your actual admin email
    'Admin',
    '{
        "canManageUsers": true,
        "canManageOrders": true,
        "canViewEmailLog": true,
        "canUseAdminTools": true,
        "canViewAnalytics": true,
        "canManagePackages": true,
        "canViewActivityLog": true,
        "canManageBusinesses": true,
        "canManageSiteContent": true,
        "canManagePlatformBlog": true,
        "canManageAnnouncements": true,
        "canManageRegistrations": true,
        "canManageSupportTickets": true,
        "canManageSystemSettings": true
    }'::JSONB,
    FALSE
) ON CONFLICT (email) DO UPDATE 
SET 
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_locked = EXCLUDED.is_locked;

-- Verify admin was created
SELECT 
    id, 
    username, 
    email, 
    role, 
    is_locked,
    CASE 
        WHEN is_locked THEN '⚠️ LOCKED'
        ELSE '✅ ACTIVE'
    END as status
FROM public.admin_users 
WHERE email = 'admin@1beauty.asia';

-- Show all admins
SELECT 
    id, 
    username, 
    email, 
    role, 
    is_locked
FROM public.admin_users
ORDER BY id;
