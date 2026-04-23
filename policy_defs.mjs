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
        const policiesRes = await client.query(`
            SELECT policyname, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'businesses'
        `);
        console.log(JSON.stringify(policiesRes.rows, null, 2));
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
