
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

let connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    process.exit(1);
}

const sqlPath = path.resolve(__dirname, '../database/rls_policies_v1.sql');
if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    process.exit(1);
}
const sql = fs.readFileSync(sqlPath, 'utf8');

connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('❌ POSTGRES_URL missing in .env.local');
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    console.log('🚀 Connecting to Supabase database for RLS Sync...');
    try {
        await client.connect();
        console.log('✅ Connected!');

        console.log('🔍 Testing connection...');
        const testRes = await client.query('SELECT 1');
        console.log('✅ Connection test successful!', testRes.rows);

        console.log('📝 Executing RLS Policies script...');
        // Split by semi-colon to handle potential individual command failures or wrap in transaction
        await client.query('BEGIN;');
        await client.query(sql);
        await client.query('COMMIT;');
        console.log('✅ RLS Policies synchronized successfully!');

    } catch (err) {
        await client.query('ROLLBACK;');
        console.error('❌ Error synchronizing RLS:', err.message);
        if (err.detail) console.error('Details:', err.detail);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
