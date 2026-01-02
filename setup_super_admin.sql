-- 1. First, ensure the user account exists in Supabase Auth.
-- You should create the user 'tanloifmc@yahoo.com' in the Supabase Dashboard > Authentication tab manually if you haven't already.

-- 2. Run this script to grant Admin permissions to that email.

INSERT INTO public.admin_users (
    username,
    email,
    role,
    permissions,
    is_locked
) VALUES (
    'SuperAdmin', -- You can change the display name
    'tanloifmc@yahoo.com', -- MUST match the email in Authentication
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
    role = 'Admin',
    permissions = '{
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
    is_locked = false;

-- Verify the insertion
SELECT * FROM public.admin_users WHERE email = 'tanloifmc@yahoo.com';
