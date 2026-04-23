import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Check Error:", error.message);
    } else {
        console.log("Admin User Keys:", Object.keys(data[0]));
    }
}

checkColumns();
