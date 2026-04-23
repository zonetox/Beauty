import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAdminUser(email) {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error("Check Error:", error.message);
    } else {
        console.log("Admin User Data:", JSON.stringify(data, null, 2));
    }
}

checkAdminUser('tanloifmc@yahoo.com');
