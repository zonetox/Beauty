const pg = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('❌ POSTGRES_URL not found in .env.local');
    process.exit(1);
}

const client = new pg.Client({
    connectionString: process.env.POSTGRES_URL + (process.env.POSTGRES_URL.includes('?') ? '&' : '?') + 'sslmode=no-verify',
});

async function verify() {
    console.log('🔍 Verifying database trigger...');
    try {
        await client.connect();

        // Check for handle_new_user function
        const funcRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
    `);

        if (funcRes.rows.length > 0) {
            console.log('✅ Function public.handle_new_user() exists.');
        } else {
            console.log('❌ Function public.handle_new_user() NOT found.');
        }

        // Check for on_auth_user_created trigger
        const triggerRes = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' AND event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
    `);

        if (triggerRes.rows.length > 0) {
            console.log('✅ Trigger on_auth_user_created exists on auth.users.');
        } else {
            console.log('❌ Trigger on_auth_user_created NOT found on auth.users.');
        }

        // Check profiles table
        const profileRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name';
    `);

        if (profileRes.rows.length > 0) {
            console.log('✅ Table public.profiles exists and has full_name column.');
        } else {
            console.log('❌ Table public.profiles or full_name column NOT found.');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
    } finally {
        await client.end();
    }
}

verify();
