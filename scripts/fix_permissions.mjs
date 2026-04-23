import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const ALL_PERMISSIONS = {
    can_view_analytics: true,
    can_manage_businesses: true,
    can_manage_registrations: true,
    can_manage_orders: true,
    can_manage_platform_blog: true,
    can_manage_users: true,
    can_manage_packages: true,
    can_manage_announcements: true,
    can_manage_support_tickets: true,
    can_manage_site_content: true,
    can_manage_system_settings: true,
    can_use_admin_tools: true,
    can_view_activity_log: true,
    can_view_email_log: true
};

async function fixPermissions(email) {
    console.log(`Updating permissions for: ${email}`);

    const { data, error } = await supabase
        .from('admin_users')
        .update({ permissions: ALL_PERMISSIONS })
        .eq('email', email);

    if (error) {
        console.error("Update Error:", error.message);
    } else {
        console.log("Permissions updated successfully.");
    }
}

fixPermissions('tanloifmc@yahoo.com');
