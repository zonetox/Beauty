
 
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    process.exit(1);
}

const sqlPath = path.resolve(__dirname, '../database/FIX_AUTH_TRIGGER.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new pg.Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    console.log('🚀 Connecting to Supabase database...');
    try {
        await client.connect();
        console.log('✅ Connected!');

        console.log('📝 Executing SQL script...');
        await client.query(sql);
        console.log('✅ SQL execution successful! Database is now synchronized.');

    } catch (err) {
        console.error('❌ Error synchronizing database:', err.message);
        if (err.detail) console.error('Details:', err.detail);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
