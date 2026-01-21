
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = (match[2] || '').trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            env[match[1]] = value;
        }
    }
    return env;
}

async function main() {
    console.log('--- 1BEAUTY.ASIA DETAILED AUDIT ---');

    const env = parseEnv('.env.local');
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Profiles
    const { data: profiles, count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    // 2. Admin Users
    const { data: admins } = await supabase
        .from('admin_users')
        .select('*');

    // 3. Businesses
    const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name, owner_id, slug');

    console.log(`\n[PROFILES] Count: ${profileCount ?? 0}`);
    profiles?.forEach(p => console.log(` - ${p.email} (ID: ${p.id})`));

    console.log(`\n[ADMINS] Count: ${admins?.length ?? 0}`);
    admins?.forEach(a => console.log(` - ${a.username} (${a.email})`));

    console.log(`\n[BUSINESSES] Count: ${businesses?.length ?? 0}`);
    businesses?.forEach(b => console.log(` - ${b.name} (Slug: ${b.slug}, OwnerID: ${b.owner_id})`));
}

main().catch(console.error);
