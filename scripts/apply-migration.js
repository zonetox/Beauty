import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env.local
dotenv.config({ path: path.join(rootDir, '.env.local') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('❌ Mising DATABASE_URL or SUPABASE_DB_URL in .env.local');
    process.exit(1);
}

const migrationFileName = process.argv[2] || '20260421_add_template_and_cms_fields.sql';
const migrationFile = path.join(rootDir, 'database', 'migrations', migrationFileName);

async function runMigration() {
    console.log('🚀 Starting migration...');
    console.log(`📂 File: ${migrationFile}`);

    if (!fs.existsSync(migrationFile)) {
        console.error('❌ Migration file not found!');
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');
    const client = new pg.Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        await client.query(sql);
        console.log('✅ Migration applied successfully!');

    } catch (error) {
        console.error('❌ Migration failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
