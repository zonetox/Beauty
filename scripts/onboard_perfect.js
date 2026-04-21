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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function onboardPerfect() {
    const csvPath = path.join(rootDir, 'data', 'ngocdung_perfect.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ ngocdung_perfect.csv not found!');
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',');
    const records = lines.slice(1);

    console.log(`🚀 Starting Perfect Onboarding for ${records.length} records...`);

    for (let i = 0; i < records.length; i++) {
        const row = records[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const data = {};
        headers.forEach((header, index) => {
            let val = row[index] || '';
            data[header.trim()] = val.replace(/^"|"$/g, '').trim();
        });

        console.log(`\n📦 [${i + 1}/${records.length}] Processing: ${data.business_name}`);

        try {
            // Check for existing business and delete to ensure clean import
            const { data: existingBiz } = await supabase.from('businesses').select('id, owner_id').eq('slug', data.slug).single();
            if (existingBiz) {
                console.log(`  ℹ️ Found existing business (ID: ${existingBiz.id}), cleaning up...`);

                // 1. Unlink profiles first to avoid FKEY violation
                await supabase.from('profiles').update({ business_id: null }).eq('business_id', existingBiz.id);

                // 2. Delete related data
                await supabase.from('services').delete().eq('business_id', existingBiz.id);
                await supabase.from('deals').delete().eq('business_id', existingBiz.id);
                await supabase.from('media_items').delete().eq('business_id', existingBiz.id);

                // 3. Delete business
                const { error: delErr } = await supabase.from('businesses').delete().eq('id', existingBiz.id);
                if (delErr) {
                    console.warn(`  ⚠️ Could not delete existing business: ${delErr.message}`);
                    // If delete fails, maybe try to update instead, but for "Perfect Import" we want a clean ID
                } else {
                    console.log(`  ✅ Existing business deleted.`);
                }
            }

            // 1. Resolve Auth User
            let userId;
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) throw listError;

            const existingUser = usersData.users.find(u => u.email === data.account_email);
            if (existingUser) {
                console.log(`  ℹ️ User already exists (ID: ${existingUser.id})`);
                userId = existingUser.id;
                // Update password and metadata
                await supabase.auth.admin.updateUserById(userId, {
                    password: data.account_password,
                    user_metadata: {
                        full_name: data.business_name,
                        user_type: 'business'
                    }
                });
            } else {
                const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
                    email: data.account_email,
                    password: data.account_password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: data.business_name,
                        user_type: 'business'
                    }
                });

                if (authError) throw authError;
                userId = createdAuth.user.id;
                console.log(`  ✅ Auth User created (ID: ${userId})`);
            }

            // 2. Create Business (100% Fields)
            const heroImages = data.hero_image_urls.split('|');
            const heroSlides = heroImages.map((url, idx) => ({
                title: idx === 0 ? data.business_name : `Dịch vụ đẳng cấp ${idx + 1}`,
                subtitle: idx === 0 ? data.slogan : "Công nghệ tiên tiến từ Hàn Quốc",
                image_url: url.trim()
            }));

            const { data: business, error: bizError } = await supabase.from('businesses').insert({
                name: data.business_name,
                slug: data.slug,
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
                hero_image_url: heroImages[0],
                hero_slides: heroSlides,
                owner_id: userId,
                onboarding_token: null,
                is_active: true,
                is_verified: true,
                is_featured: data.is_featured === 'TRUE',
                membership_tier: data.membership_tier || 'VIP',
                membership_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                latitude: parseFloat(data.latitude) || null,
                longitude: parseFloat(data.longitude) || null,
                seo: {
                    title: data.seo_title,
                    description: data.seo_description,
                    keywords: data.seo_keywords
                },
                socials: {
                    facebook: data.social_facebook,
                    instagram: data.social_instagram,
                    tiktok: data.social_tiktok,
                    zalo: data.social_zalo
                },
                working_hours: {
                    "monday": { "open": "08:00", "close": "20:00" },
                    "tuesday": { "open": "08:00", "close": "20:00" },
                    "wednesday": { "open": "08:00", "close": "20:00" },
                    "thursday": { "open": "08:00", "close": "20:00" },
                    "friday": { "open": "08:00", "close": "20:00" },
                    "saturday": { "open": "08:00", "close": "20:00" },
                    "sunday": { "open": "08:00", "close": "20:00" }
                },
                landing_page_config: {
                    sections: {
                        hero: { enabled: true, order: 0 },
                        trust: { enabled: true, order: 1 },
                        services: { enabled: true, order: 2 },
                        gallery: { enabled: true, order: 3 },
                        team: { enabled: true, order: 4 },
                        reviews: { enabled: true, order: 5 },
                        cta: { enabled: true, order: 6 },
                        contact: { enabled: true, order: 7 }
                    }
                },
                joined_date: new Date().toISOString()
            }).select().single();

            if (bizError) {
                console.error(`  ❌ Business Creation Error:`, bizError);
                throw bizError;
            }
            console.log(`  ✅ Business created (ID: ${business.id})`);

            // 3. Update Profile
            await supabase.from('profiles').update({
                business_id: business.id,
                user_type: 'business'
            }).eq('id', userId);
            console.log(`  ✅ Profile linked.`);

            // 4. Create Services
            const defaultServices = [
                {
                    business_id: business.id,
                    name: "Phun thêu lông mày chân thực",
                    description: "Công nghệ phun xăm thẩm mỹ tiên tiến nhất, mang lại vẻ đẹp tự nhiên.",
                    price: "2.000.000đ",
                    duration_minutes: 60,
                    image_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069"
                },
                {
                    business_id: business.id,
                    name: "Điều trị nám công nghệ cao",
                    description: "Sạch nám, sáng da, không xâm lấn.",
                    price: "5.000.000đ",
                    duration_minutes: 90,
                    image_url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273"
                }
            ];

            await supabase.from('services').insert(defaultServices);
            console.log(`  ✅ Default services created.`);

            // 5. Create Gallery Items
            const galleryItems = [
                {
                    business_id: business.id,
                    url: "https://images.unsplash.com/photo-1540555708036-39c5bedc0a4d",
                    title: "Không gian sang trọng",
                    type: "IMAGE"
                },
                {
                    business_id: business.id,
                    url: "https://images.unsplash.com/photo-1544161515-4ae6ce6ea858",
                    title: "Dịch vụ tận tâm",
                    type: "IMAGE"
                }
            ];
            await supabase.from('media_items').insert(galleryItems);
            console.log(`  ✅ Gallery items created.`);

        } catch (err) {
            console.error(`  ❌ Error processing ${data.business_name}: ${err.message}`);
        }
    }

    console.log('\n✨ PERFECT ONBOARDING COMPLETED.');
}

onboardPerfect()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ FATAL:', err);
        process.exit(1);
    });
