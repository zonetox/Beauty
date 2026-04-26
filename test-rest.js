const url = "https://fdklazlcbxaiapsnnbqq.supabase.co/rest/v1/businesses";
const apiKey = process.env.SUPABASE_ANON_KEY || ""; // READ FROM ENV

const demoData = {
    name: 'Luna Spa & Massage',
    slogan: 'Tinh hoa trị liệu - Cân bằng Thân - Tâm - Trí',
    description: 'Luna Spa mang đến những...',
    address: '123 Đường Hoa Hồng, P.2, Q.3, TP.HCM',
    city: 'Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 2',
    phone: '0123 456 789',
    email: 'lunaspa@gmail.com',
    website: 'https://lunaspa.vn',
    categories: ['Spa & Massage'],
    image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=2070',
    logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS&backgroundColor=6B8C6B',
    hero_slides: [
        {
            title: 'Tinh hoa trị liệu',
            subtitle: 'Cân bằng thân - tâm - trí trong không gian thuần khiết',
            image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070'
        }
    ],
    working_hours: {
        'Thứ 2 - Thứ 6': '09:00 - 21:00',
        'Thứ 7 - CN': '08:30 - 22:00'
    },
    socials: {
        facebook: 'https://facebook.com/lunaspa',
        instagram: 'https://instagram.com/lunaspa'
    },
    slug: 'luna-spa---massage-abcde',
    owner_id: '12345678-1234-1234-1234-123456789012',
    is_active: true,
    is_verified: false,
    membership_tier: 'Free',
    landing_page_config: {
        sections: {
            hero: { enabled: true, order: 1 },
            trust: { enabled: true, order: 2 },
            services: { enabled: true, order: 3 },
            gallery: { enabled: true, order: 4 },
            team: { enabled: true, order: 5 },
            reviews: { enabled: true, order: 6 },
            products: { enabled: true, order: 7 },
            cta: { enabled: true, order: 8 },
            contact: { enabled: true, order: 9 },
        }
    },
    template_id: 'luna-spa',
    joined_date: new Date().toISOString(),
    notification_settings: {
        review_alerts: true,
        booking_requests: true,
        platform_news: true
    }
};

async function test() {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "apikey": apiKey,
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify(demoData)
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
}
test();
