
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
    console.log('--- SUPABASE AUTH USERS AUDIT ---');

    const env = parseEnv('.env.local');
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
        return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // List users from Auth (requires service role / admin privileges)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing Auth users:', error.message);
        if (error.message.includes('JWT')) {
            console.log('The key might not have admin permissions or is invalid.');
        }
        return;
    }

    console.log(`\nTotal Users in Auth: ${users?.length ?? 0}`);
    users?.slice(0, 10).forEach(u => {
        console.log(` - ${u.email} (ID: ${u.id}, Created: ${u.created_at})`);
    });
}

main().catch(console.error);
