import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    process.exit(1);
}

// Admin client to bypass RLS and create users
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function onboard() {
    const csvPath = path.join(rootDir, 'data', 'master_import_template.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ master_import_template.csv not found!');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    const records = lines.slice(1);

    console.log(`🚀 Starting Onboarding for ${records.length} records...`);

    for (let i = 0; i < records.length; i++) {
        // Simple CSV parser (handling quoted fields)
        const row = records[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const data = {};
        headers.forEach((header, index) => {
            let val = row[index] || '';
            data[header.trim()] = val.replace(/^"|"$/g, '').trim();
        });

        console.log(`\n📦 [${i + 1}/${records.length}] Processing: ${data.business_name}`);

        try {
            // 1. Create Auth User
            let authUser;
            let userId;

            const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
                email: data.account_email,
                password: data.account_password,
                email_confirm: true,
                user_metadata: {
                    full_name: data.business_name,
                    user_type: 'business'
                }
            });

            if (authError) {
                if (authError.message.includes('already been registered')) {
                    console.log(`  ℹ️ User already exists, fetching existing ID...`);
                    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
                    if (listError) throw listError;

                    const existingUser = users.users.find(u => u.email === data.account_email);
                    if (!existingUser) throw new Error(`Could not find existing user for ${data.account_email}`);
                    userId = existingUser.id;
                } else {
                    console.error(`  ❌ Auth Error: ${authError.message}`);
                    continue;
                }
            } else {
                authUser = createdAuth;
                userId = authUser.user.id;
            }

            console.log(`  ✅ Using User ID: ${userId}`);

            // 2. Create Onboarding Token
            const onboardingToken = data.slug || Buffer.from(`${userId}-${Date.now()}`).toString('base64').substring(0, 32);

            // 3. Create Business
            const { data: business, error: bizError } = await supabase.from('businesses').insert({
                name: data.business_name,
                slug: data.slug || `${data.business_name.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(Math.random() * 1000)}`,
                slogan: data.slogan,
                description: data.description,
                categories: data.categories.split(',').map(c => c.trim()),
                address: data.address,
                ward: data.ward,
                district: data.district,
                city: data.city,
                phone: data.phone,
                email: data.email,
                website: data.website,
                zalo_phone: data.zalo_phone || data.phone,
                template_id: data.template_id || 'luxury-minimal',
                hero_type: data.hero_type || 'slider',
                youtube_url: data.youtube_url,
                hero_image_url: data.hero_image_urls.split('|')[0],
                owner_id: userId,
                onboarding_token: onboardingToken,
                is_active: true,
                is_verified: false,
                membership_tier: data.membership_tier || 'Free',
                working_hours: { "monday": { "open": "09:00", "close": "18:00" } }
            }).select().single();

            if (bizError) {
                console.error(`  ❌ Business Creation Error: ${bizError.message}`);
                // Cleanup partial Auth? No, better keep for manual fix if needed
                continue;
            }

            console.log(`  ✅ Business created: ID ${business.id}`);

            // 4. Update Profile with Business ID
            const { error: profileError } = await supabase.from('profiles').update({
                business_id: business.id
            }).eq('id', userId);

            if (profileError) {
                console.error(`  ❌ Profile Link Error: ${profileError.message}`);
            } else {
                console.log(`  ✅ Profile linked to Business.`);
            }

            console.log(`  🔗 Onboarding Link: http://localhost:5173/onboarding/${onboardingToken}`);

        } catch (err) {
            console.error(`  ❌ Unexpected Error: ${err.message}`);
        }
    }

    console.log('\n✨ ONBOARDING PROCESS COMPLETED.');
}

onboard();
