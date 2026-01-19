-- ============================================
-- Set tanloifmc@yahoo.com as Super Admin
-- ============================================
-- This script will insert or update the user to be a super admin
-- with full permissions and unlocked status
-- ============================================

-- Insert or Update Super Admin
INSERT INTO public.admin_users (
    username,
    email,
    role,
    permissions,
    is_locked
) VALUES (
    'SuperAdmin',
    'tanloifmc@yahoo.com',
    'Admin',
    '{
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
) ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    role = 'Admin',
    permissions = EXCLUDED.permissions,
    is_locked = false;

-- Verify the admin was created/updated
SELECT 
    id, 
    username, 
    email, 
    role, 
    is_locked,
    permissions,
    CASE 
        WHEN is_locked THEN '⚠️ LOCKED'
        ELSE '✅ ACTIVE'
    END as status
FROM public.admin_users 
WHERE email = 'tanloifmc@yahoo.com';

-- Show all admins
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
ORDER BY id;
