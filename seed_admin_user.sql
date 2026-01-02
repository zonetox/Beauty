-- Insert Super Admin User (Run this to fix "Auth check timed out" / Login loop)
-- Replace 'tanloifmc@yahoo.com' with your actual admin email if different.
INSERT INTO public.admin_users (username, email, role, permissions, is_locked)
VALUES (
        'SuperAdmin',
        'tanloifmc@yahoo.com',
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
    ) ON CONFLICT (email) DO NOTHING;
-- Also ensure app_settings exist (just in case)
INSERT INTO public.app_settings (id, settings_data)
VALUES (
        1,
        '{
        "siteName": "Beauty Directory",
        "supportEmail": "support@beautydir.com",
        "maintenanceMode": false,
        "bankDetails": {
            "bankName": "MB Bank",
            "accountName": "BEAUTY DIR CO",
            "accountNumber": "0000000000",
            "transferNote": "Payment for order [code]"
        }
    }'::JSONB
    ) ON CONFLICT (id) DO NOTHING;