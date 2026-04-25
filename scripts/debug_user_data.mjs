import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccountData() {
    const email = 'tanloifmc@yahoo.com';
    console.log(`Checking data for ${email}...`);

    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    const { data: adminUser } = await supabase.from('admin_users').select('*').eq('email', email).single();

    let business = null;
    if (profile) {
        const { data: b } = await supabase.from('businesses').select('*').eq('owner_id', profile.id).maybeSingle();
        business = b;
    }

    console.log('\n--- PROFILE ---');
    console.log(JSON.stringify(profile, null, 2));

    console.log('\n--- ADMIN USER ---');
    console.log(JSON.stringify(adminUser, null, 2));

    console.log('\n--- BUSINESS OWNED ---');
    console.log(JSON.stringify(business, null, 2));
}

checkAccountData();
