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

async function check() {
    try {
        await client.connect();
        const res = await client.query('SELECT name, onboarding_token FROM public.businesses');
        console.log('--- TOKENS IN DB ---');
        console.table(res.rows);
        console.log('--------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
