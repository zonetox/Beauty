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
        await client.query('DROP POLICY IF EXISTS "Owners can manage their branches" ON public.businesses;');
        await client.query('DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;');
        await client.query('DROP POLICY IF EXISTS "View businesses" ON public.businesses;');

        // Restore standard select/insert admin policies that we dropped in isolation earlier
        await client.query(`
            DROP POLICY IF EXISTS "businesses_select_public_active_or_owner_or_admin" ON public.businesses;
            CREATE POLICY "businesses_select_public_active_or_owner_or_admin"
            ON public.businesses
            FOR SELECT
            USING (
              is_active = TRUE
              OR owner_id = auth.uid()
              OR public.is_admin(public.get_user_email())
            );
            
            DROP POLICY IF EXISTS "businesses_insert_admin" ON public.businesses;
            CREATE POLICY "businesses_insert_admin"
            ON public.businesses
            FOR INSERT
            WITH CHECK (public.is_admin(public.get_user_email()));
        `);
        console.log('Successfully cleaned up rogue and recursive policies!');
    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
