import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRLS() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT * FROM pg_policies WHERE tablename = 'businesses';
        `);
        console.log('--- RLS POLICIES FOR BUSINESSES ---');
        console.table(res.rows.map(r => ({
            name: r.policyname,
            action: r.cmd,
            roles: r.roles,
            using: r.qual
        })));
        console.log('-----------------------------------');

        const rlsStatus = await client.query(`
            SELECT relrowsecurity FROM pg_class WHERE relname = 'businesses';
        `);
        console.log('RLS Enabled:', rlsStatus.rows[0].relrowsecurity);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkRLS();
