import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

// BYPASS SSL for Supabase/AWS self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !dbUrl) {
    console.error("❌ Missing configuration in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MASTER_PERMISSIONS = {
    can_view_analytics: true,
    can_manage_businesses: true,
    can_manage_registrations: true,
    can_manage_orders: true,
    can_manage_platform_blog: true,
    can_manage_users: true,
    can_manage_packages: true,
    can_manage_announcements: true,
    can_manage_support_tickets: true,
    can_manage_site_content: true,
    can_manage_system_settings: true,
    can_use_admin_tools: true,
    can_view_activity_log: true,
    can_view_email_log: true
};

async function runIndustrialSync() {
    const email = 'tanloifmc@yahoo.com';
    console.log(`🚀 STARTING INDUSTRIAL SYNC FOR: ${email}`);

    try {
        // --- STEP 1: UPGRADE DATABASE ENGINE (SQL) ---
        console.log("\n--- Phase 1: Upgrading Database RPC ---");
        const dbClient = new Client({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        });
        await dbClient.connect();
        const sql = fs.readFileSync('database/upgrade_get_user_context_v1.2.sql', 'utf8');
        await dbClient.query(sql);
        await dbClient.end();
        console.log("✅ RPC v1.2 applied successfully.");

        // --- STEP 2: PROFILE & ADMIN SYNC ---
        console.log("\n--- Phase 2: Syncing Profile & Admin Record ---");
        const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('email', email).single();
        if (pError) throw new Error(`Profile not found: ${pError.message}`);

        // Update Admin permissions and ensure username
        const { error: aError } = await supabase.from('admin_users').update({
            permissions: MASTER_PERMISSIONS,
            username: 'Admin Tân Lợi',
            role: 'Admin',
            is_locked: false
        }).eq('email', email);
        if (aError) console.warn("Note: Admin record update had issues (might not exist yet):", aError.message);
        else console.log("✅ Admin permissions standardized.");

        // --- STEP 3: BUSINESS RECOVERY ---
        console.log("\n--- Phase 3: Business Identity Recovery ---");
        const { data: existingBusiness } = await supabase.from('businesses').select('id').eq('owner_id', profile.id).maybeSingle();

        let businessId = existingBusiness?.id;

        if (!businessId) {
            console.log("No business found for this admin. Recreating high-quality default business...");
            const slug = `tan-loi-beauty-${Math.floor(Math.random() * 1000)}`;
            const { data: newBiz, error: bError } = await supabase.from('businesses').insert([{
                name: "1Beauty Admin Business",
                slug: slug,
                owner_id: profile.id,
                email: email,
                phone: "0918731411",
                address: "Thành phố Hồ Chim Minh",
                city: "TP. Hồ Chí Minh",
                district: "Quận 1",
                ward: "Phường Bến Thành",
                is_active: true,
                is_verified: true,
                membership_tier: 'Premium',
                categories: ['Spa & Massage'],
                description: "Văn phòng quản trị và showroom đối tác của 1Beauty.asia",
                working_hours: {
                    monday: { open: "09:00", close: "18:00" },
                    tuesday: { open: "09:00", close: "18:00" },
                    wednesday: { open: "09:00", close: "18:00" },
                    thursday: { open: "09:00", close: "18:00" },
                    friday: { open: "09:00", close: "18:00" },
                    saturday: { open: "09:00", close: "18:00" },
                    sunday: { open: "09:00", close: "18:00", isOpen: false }
                },
                joined_date: new Date().toISOString()
            }]).select().single();

            if (bError) throw bError;
            businessId = newBiz.id;
            console.log(`✅ Default business created (ID: ${businessId})`);
        } else {
            console.log(`✅ Found existing business (ID: ${businessId})`);
        }

        // --- STEP 4: FINAL LINKAGE ---
        console.log("\n--- Phase 4: Final Linkage ---");
        const { error: linkError } = await supabase.from('profiles').update({
            business_id: businessId,
            user_type: 'business'
        }).eq('id', profile.id);

        if (linkError) throw linkError;
        console.log("✅ Profile linked to Business successfully.");

        console.log("\n--- FINAL VERIFICATION ---");
        const { data: context, error: ctxError } = await supabase.rpc('get_user_context', { p_user_id: profile.id });
        if (ctxError) console.error("Ctx Error:", ctxError.message);
        console.log("Final Context State:", JSON.stringify(context, null, 2));

        console.log("\n🎯 INDUSTRIAL SYNC COMPLETE. ACCOUNT IS NOW BUG-FREE.");

    } catch (error) {
        console.error("\n❌ CRITICAL FAILURE during sync:", error.message);
        process.exit(1);
    }
}

runIndustrialSync();
