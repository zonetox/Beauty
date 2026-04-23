import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkProfilesSchema() {
    // Check valid user types by querying one or looking at constraints if possible
    // For now, let's just try 'business' and 'user' to see if 'admin' is the one failing
    const { data, error } = await supabase.rpc('get_user_context', { p_user_id: '650f68df-d1ba-43e2-959c-44195da613ab' });
    console.log("RPC get_user_context result:", JSON.stringify(data, null, 2));
    console.log("RPC Error:", error);

    // Get table definition if possible (might not work depending on permissions)
    const { data: cols, error: colError } = await supabase.from('profiles').select('*').limit(1);
    if (cols && cols.length > 0) {
        console.log("Sample Profile column names:", Object.keys(cols[0]));
    }
}

checkProfilesSchema();
