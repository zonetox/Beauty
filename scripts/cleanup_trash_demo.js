import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('❌ Missing DATABASE_URL/SUPABASE_DB_URL');
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function cleanup() {
    console.log('🧹 Starting Database Cleanup (Wiping old demo data)...');

    try {
        await client.connect();

        console.log('🗑️ Deleting child records (Level 2)...');
        await client.query('DELETE FROM public.appointments;');
        await client.query('DELETE FROM public.blog_comments;');

        console.log('🗑️ Deleting child records (Level 1)...');
        await client.query('DELETE FROM public.business_blog_posts;');
        await client.query('DELETE FROM public.reviews;');
        await client.query('DELETE FROM public.media_items;');
        await client.query('DELETE FROM public.business_staff;');
        await client.query('DELETE FROM public.services;');
        await client.query('DELETE FROM public.deals;');
        await client.query('DELETE FROM public.team_members;');

        console.log('🔄 Unlinking businesses from profiles...');
        await client.query('UPDATE public.profiles SET business_id = NULL;');

        console.log('🗑️ Deleting businesses...');
        await client.query('DELETE FROM public.businesses;');

        // Reset identities
        console.log('🔄 Resetting businesses identity...');
        await client.query('ALTER SEQUENCE public.businesses_id_seq RESTART WITH 1;');

        console.log('✅ DATABASE CLEANED. System is ready for Stage 4 import.');

    } catch (error) {
        console.error('❌ Cleanup failed:');
        console.error(error.message);
    } finally {
        await client.end();
    }
}

cleanup();
