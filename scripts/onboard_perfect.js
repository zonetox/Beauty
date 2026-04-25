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
                        trust: {
                            enabled: true,
                            order: 1,
                            content: {
                                title: "Chứng Nhận & Giải Thưởng",
                                subtitle: "Hơn 25 năm khẳng định vị thế dẫn đầu trong ngành thẩm mỹ",
                                items: [
                                    { title: "Top 10 Asian Beauty Awards", type: "award", description: "Giải thưởng danh giá dành cho hệ thống thẩm mỹ uy tín nhất Đông Nam Á." },
                                    { title: "Chứng nhận ISO 9001:2015", type: "certification", description: "Hệ thống quản lý chất lượng đạt tiêu chuẩn quốc tế." },
                                    { title: "25+ Năm Kinh Nghiệm", type: "badge", description: "Đội ngũ chuyên gia giàu kinh nghiệm, tận tâm với khách hàng." }
                                ]
                            }
                        },
                        about: { enabled: true, order: 2 },
                        services: {
                            enabled: true,
                            order: 3,
                            content: {
                                title: "Dịch Vụ Đẳng Cấp 5 Sao",
                                subtitle: "Công nghệ tiên tiến - Kết quả hoàn mỹ"
                            }
                        },
                        video: {
                            enabled: true,
                            order: 4,
                            content: {
                                title: "Cận Cảnh Công Nghệ Làm Đẹp",
                                subtitle: "Đội ngũ bác sĩ thực hiện các liệu trình hiện đại"
                            }
                        },
                        gallery: {
                            enabled: true,
                            order: 5,
                            content: {
                                title: "Không Gian & Kết Quả",
                                subtitle: "Sự hài lòng của khách hàng là động lực của chúng tôi"
                            }
                        },
                        deals: {
                            enabled: true,
                            order: 6,
                            content: {
                                title: "Ưu Đãi Đặc Biệt Tháng Này",
                                subtitle: "Đừng bỏ lỡ cơ hội nâng tầm nhan sắc với chi phí tối ưu"
                            }
                        },
                        reviews: {
                            enabled: true,
                            order: 7,
                            content: {
                                title: "Khách Hàng Nói Gì Về Ngọc Dung",
                                subtitle: "Hàng ngàn phụ nữ đã thay đổi diện mạo thành công"
                            }
                        },
                        blog: {
                            enabled: true,
                            order: 8,
                            content: {
                                title: "Kiến Thức Làm Đẹp Chuyên Sâu",
                                subtitle: "Cập nhật những xu hướng và bí quyết làm đẹp mới nhất"
                            }
                        },
                        team: {
                            enabled: true,
                            order: 9,
                            content: {
                                title: "Hội Đồng Chuyên Gia Đầu Ngành",
                                subtitle: "Đội ngũ bác sĩ được đào tạo bài bản tại Hàn Quốc và Hoa Kỳ"
                            }
                        },
                        cta: {
                            enabled: true,
                            order: 10,
                            content: {
                                title: "Sẵn Sàng Trải Nghiệm Dịch Vụ Đẳng Cấp?",
                                subtitle: "Đặt lịch ngay hôm nay để nhận voucher giảm giá 50% cho lần đầu trải nghiệm.",
                                cta_text: "Đăng ký tư vấn miễn phí"
                            }
                        },
                        contact: {
                            enabled: true,
                            order: 11,
                            content: {
                                title: "Kết Nối Với Chúng Tôi",
                                subtitle: "Hệ thống 18 chi nhánh trải dài khắp cả nước"
                            }
                        }
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

            // 4. Create Services (8 Services)
            const defaultServices = [
                {
                    business_id: business.id,
                    name: "Trị nám công nghệ cao Multi Light",
                    description: "Xóa sạch nám, tàn nhang, đốm nâu chỉ sau một liệu trình.",
                    price: "2.000.000đ",
                    duration_minutes: 60,
                    image_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069"
                },
                {
                    business_id: business.id,
                    name: "Giảm mỡ Ultra Slim",
                    description: "Hóa lỏng mỡ thừa, tạo form dáng S-line không xâm lấn.",
                    price: "5.000.000đ",
                    duration_minutes: 90,
                    image_url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273"
                },
                {
                    business_id: business.id,
                    name: "Phun xăm chân mày Charm",
                    description: "Dáng mày thanh tú, màu sắc tự nhiên, bền màu 3-5 năm.",
                    price: "3.500.000đ",
                    duration_minutes: 75,
                    image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e"
                },
                {
                    business_id: business.id,
                    name: "Trẻ hóa da Bio Young",
                    description: "Xóa nhăn, nâng cơ, phục hồi da lão hóa toàn diện.",
                    price: "8.000.000đ",
                    duration_minutes: 120,
                    image_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881"
                },
                {
                    business_id: business.id,
                    name: "Tắm trắng Diamond White",
                    description: "Bật tông trắng sáng, mịn màng ngay từ lần đầu tiên.",
                    price: "1.500.000đ",
                    duration_minutes: 90,
                    image_url: "https://images.unsplash.com/photo-1591343395582-99bf4de99bad"
                },
                {
                    business_id: business.id,
                    name: "Triệt lông Laser New Elight",
                    description: "Triệt lông vĩnh viễn, không đau rát, se khít lỗ chân lông.",
                    price: "1.200.000đ",
                    duration_minutes: 45,
                    image_url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8"
                },
                {
                    business_id: business.id,
                    name: "Chăm sóc da mặt chuyên sâu",
                    description: "Thanh lọc da, cung cấp độ ẩm và dưỡng chất tức thì.",
                    price: "800.000đ",
                    duration_minutes: 60,
                    image_url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15"
                },
                {
                    business_id: business.id,
                    name: "Gội đầu dưỡng sinh thảo dược",
                    description: "Thư giãn hoàn toàn, giảm căng thẳng và nuôi dưỡng tóc.",
                    price: "350.000đ",
                    duration_minutes: 60,
                    image_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df"
                }
            ];

            await supabase.from('services').insert(defaultServices);
            console.log(`  ✅ 8 Default services created.`);

            // 5. Create Gallery Items (8 Items)
            const galleryItems = [
                { business_id: business.id, url: "https://images.unsplash.com/photo-1540555708036-39c5bedc0a4d", title: "Không gian sảnh đón sang trọng", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1544161515-4ae6ce6ea858", title: "Phòng liệu trình tiêu chuẩn 5 sao", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069", title: "Thiết bị thẩm mỹ hiện đại", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8", title: "Công nghệ Laser mới nhất", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273", title: "Khu vực thư giãn của khách hàng", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881", title: "Chuyên gia đang thực hiện liệu trình", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15", title: "Kết quả sau liệu trình trẻ hóa", type: "IMAGE" },
                { business_id: business.id, url: "https://images.unsplash.com/photo-1562322140-8baeececf3df", title: "Sản phẩm dược mỹ phẩm cao cấp", type: "IMAGE" }
            ];
            await supabase.from('media_items').insert(galleryItems);
            console.log(`  ✅ 8 Gallery items created.`);

            // 6. Create Deals (3 Deals)
            const deals = [
                {
                    business_id: business.id,
                    title: "SUMMER SALE - GIẢM 50%",
                    description: "Ưu đãi lớn nhất năm cho tất cả dịch vụ trị nám và trẻ hóa da.",
                    discount_percentage: 50,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'ACTIVE'
                },
                {
                    business_id: business.id,
                    title: "TẶNG LIỆU TRÌNH CHĂM SÓC DA",
                    description: "Mua combo 5 buổi tặng ngay 1 buổi chăm sóc da mặt chuyên sâu.",
                    discount_percentage: 0,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'ACTIVE'
                },
                {
                    business_id: business.id,
                    title: "VOUCHER 500K CHO THÀNH VIÊN MỚI",
                    description: "Áp dụng cho hóa đơn từ 2.000.000đ.",
                    discount_percentage: 0,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'ACTIVE'
                }
            ];
            await supabase.from('deals').insert(deals);
            console.log(`  ✅ 3 Deals created.`);

            // 7. Create Blog Posts (3 Posts)
            const posts = [
                {
                    business_id: business.id,
                    title: "Bí quyết trị nám tận gốc không tái phát",
                    content: "Nám da luôn là nỗi lo của phụ nữ. Với công nghệ Multi Light tại Ngọc Dung, chúng tôi cam kết...",
                    status: 'PUBLISHED',
                    slug: 'bi-quyet-tri-nam-tan-goc',
                    author_name: "Chuyên gia Ngọc Dung",
                    image_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069"
                },
                {
                    business_id: business.id,
                    title: "Chăm sóc da đúng cách sau khi phun xăm",
                    content: "Để có màu môi và dáng mày đẹp nhất, việc chăm sóc sau hậu phẫu cực kỳ quan trọng...",
                    status: 'PUBLISHED',
                    slug: 'cham-soc-da-sau-phun-xam',
                    author_name: "Chuyên gia Ngọc Dung",
                    image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e"
                },
                {
                    business_id: business.id,
                    title: "Top 5 công nghệ giảm mỡ an toàn nhất 2026",
                    content: "Giảm mỡ không cần phẫu thuật đang là xu hướng được nhiều người lựa chọn...",
                    status: 'PUBLISHED',
                    slug: 'top-5-cong-nghe-giam-mo',
                    author_name: "Chuyên gia Ngọc Dung",
                    image_url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273"
                }
            ];
            await supabase.from('business_blog_posts').insert(posts);
            console.log(`  ✅ 3 Blog posts created.`);

            // 8. Create Team (4 Members)
            const team = [
                { business_id: business.id, name: "Bác sĩ Nguyễn Văn A", role: "Chuyên gia Da liễu", image_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d" },
                { business_id: business.id, name: "Bác sĩ Trần Thị B", role: "Chuyên gia Phẫu thuật Thẩm mỹ", image_url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f" },
                { business_id: business.id, name: "Chuyên gia Lê Văn C", role: "Kỹ thuật viên cao cấp", image_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7" },
                { business_id: business.id, name: "Bác sĩ Phạm Thị D", role: "Chuyên gia Laser & Công nghệ cao", image_url: "https://images.unsplash.com/photo-1559839734-2b71f1536750" }
            ];
            await supabase.from('team_members').insert(team);
            console.log(`  ✅ 4 Team members created.`);

            // 9. Create Reviews (5 Reviews)
            const reviews = [
                { business_id: business.id, user_name: "Nguyễn Thu Thủy", rating: 5, comment: "Dịch vụ trị nám ở đây thực sự hiệu quả, da mình đã sáng hơn rất nhiều.", status: 'VISIBLE', submitted_date: new Date().toISOString(), user_avatar_url: "https://i.pravatar.cc/150?u=thuy" },
                { business_id: business.id, user_name: "Trần Minh Anh", rating: 5, comment: "Nhân viên nhiệt tình, không gian sang trọng và rất thoải mái.", status: 'VISIBLE', submitted_date: new Date().toISOString(), user_avatar_url: "https://i.pravatar.cc/150?u=anh" },
                { business_id: business.id, user_name: "Lê Thị Hồng", rating: 4, comment: "Phun chân mày rất đẹp và tự nhiên, mình rất ưng ý.", status: 'VISIBLE', submitted_date: new Date().toISOString(), user_avatar_url: "https://i.pravatar.cc/150?u=hong" },
                { business_id: business.id, user_name: "Phạm Gia Bảo", rating: 5, comment: "Công nghệ giảm mỡ Ultra Slim rất hiệu quả, mình đã giảm được 5cm vòng eo.", status: 'VISIBLE', submitted_date: new Date().toISOString(), user_avatar_url: "https://i.pravatar.cc/150?u=bao" },
                { business_id: business.id, user_name: "Hoàng Mỹ Linh", rating: 5, comment: "Đội ngũ bác sĩ chuyên nghiệp, tư vấn rất kỹ lưỡng.", status: 'VISIBLE', submitted_date: new Date().toISOString(), user_avatar_url: "https://i.pravatar.cc/150?u=linh" }
            ];
            await supabase.from('reviews').insert(reviews);
            console.log(`  ✅ 5 Reviews created.`);

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
