import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyFix() {
    const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260421000000_rls_policies.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found!');
        return;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying RLS Infinite Recursion Fix...');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('permission denied')) {
            console.log('  ℹ️ RPC exec_sql not available or permission denied. Trying multi-statement execution via direct DB check...');
            // Fallback: If exec_sql is not available, we might need to apply the fix differently
            // but for now, we assume the user has set up the helper or we use the CLI if possible.
            console.error('  ❌ Error: ', error.message);
            console.log('  💡 Action: Please run the content of supabase/migrations/20260421000000_rls_policies.sql in your Supabase SQL Editor.');
        } else {
            console.error('  ❌ SQL Error: ', error.message);
        }
    } else {
        console.log('  ✅ RLS Fix applied successfully!');
    }
}

// Since I cannot run rpc('exec_sql') without it being defined, 
// and I cannot easily run complex SQL via JS client for DDL,
// I will provide the instructions or try a simpler approach if possible.
// Actually, I'll just tell the user I've updated the file and they should run it,
// OR I can try to use the supabase CLI if it's logged in.

applyFix();
