
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function syncDemo() {
    console.log('Starting sync process...');

    // 1. Get all businesses
    const { data: businesses, error: bError } = await supabase
        .from('businesses')
        .select('id, name, slug, owner_id');

    if (bError) {
        console.error('Error fetching businesses:', bError);
        return;
    }

    console.log(`Found ${businesses.length} businesses.`);

    // 2. Get all profiles (to find potential owners)
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    // 3. Define mapping or create new demo users
    // For now, let's link all unowned businesses to 'tanloifmc@yahoo.com' or a new demo user
    const targetOwner = profiles.find(p => p.email === 'tanloifmc@yahoo.com') || profiles[0];

    if (!targetOwner) {
        console.error('No viable owner found in profiles. Please register at least one user first.');
        return;
    }

    console.log(`Target owner for orphans: ${targetOwner.email} (${targetOwner.id})`);

    for (const biz of businesses) {
        if (!biz.owner_id) {
            console.log(`Linking business "${biz.name}" (${biz.id}) to ${targetOwner.email}...`);
            const { error: uError } = await supabase
                .from('businesses')
                .update({ owner_id: targetOwner.id })
                .eq('id', biz.id);

            if (uError) {
                console.error(`Failed to link ${biz.name}:`, uError);
            } else {
                console.log(`Successfully linked ${biz.name}.`);
            }
        } else {
            // Check if owner_id exists in profiles
            const ownerExists = profiles.some(p => p.id === biz.owner_id);
            if (!ownerExists) {
                console.warn(`Business "${biz.name}" has invalid owner_id: ${biz.owner_id}. Re-linking to ${targetOwner.email}...`);
                await supabase.from('businesses').update({ owner_id: targetOwner.id }).eq('id', biz.id);
            }
        }
    }

    console.log('Sync complete!');
}

syncDemo().catch(console.error);
