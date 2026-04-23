// Bypass self-signed SSL errors for Supabase connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: 'postgres://postgres.fdklazlcbxaiapsnnbqq:0918731411*Loi@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        await client.query(`
            ALTER TABLE public.businesses 
            ADD COLUMN IF NOT EXISTS landing_page_drafts JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Successfully added landing_page_drafts column!');
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
