import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAdminUser(email) {
    console.log(`Checking admin_users table for: ${email}`);

    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error("Error fetching from admin_users:", error.message);
        return;
    }

    if (!data) {
        console.error(`User ${email} not found in admin_users table.`);
    } else {
        console.log("Admin User Data:", JSON.stringify(data, null, 2));
    }

    // Also check auth.users just in case
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === email);
    if (authUser) {
        console.log("Auth User metadata:", JSON.stringify(authUser.user_metadata, null, 2));
        console.log("Auth User email_confirmed_at:", authUser.email_confirmed_at);
    } else {
        console.log("Auth user not found.");
    }
}

checkAdminUser('tanloifmc@yahoo.com');
