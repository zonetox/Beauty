import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: "postgres://postgres.fdklazlcbxaiapsnnbqq:0918731411*Loi@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
});

async function run() {
    await client.connect();

    // Replicate what happens inside Supabase insert
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
        hero_slides: JSON.stringify([
            {
                title: 'Tinh hoa trị liệu',
                subtitle: 'Cân bằng thân - tâm - trí trong không gian thuần khiết',
                image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070'
            }
        ]),
        working_hours: JSON.stringify({
            'Thứ 2 - Thứ 6': '09:00 - 21:00',
            'Thứ 7 - CN': '08:30 - 22:00'
        }),
        socials: JSON.stringify({
            facebook: 'https://facebook.com/lunaspa',
            instagram: 'https://instagram.com/lunaspa'
        }),
        slug: 'luna-spa---massage-abcde',
        owner_id: '00000000-0000-0000-0000-000000000000', // random uuid
        is_active: true,
        is_verified: false,
        membership_tier: 'Free',
        landing_page_config: JSON.stringify({
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
        }),
        template_id: 'luna-spa',
        joined_date: new Date().toISOString(),
        notification_settings: JSON.stringify({
            review_alerts: true,
            booking_requests: true,
            platform_news: true
        })
    };

    const keys = Object.keys(demoData);
    const values = Object.values(demoData);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
        INSERT INTO public.businesses (${keys.join(', ')})
        VALUES (${placeholders})
        RETURNING *
    `;

    try {
        const res = await client.query(query, values);
        console.log("Success:", res.rows[0].id);

        // Rollback technically not possible since we didn't begin transaction, 
        // but we can just delete it right away.
        await client.query('DELETE FROM public.businesses WHERE id = $1', [res.rows[0].id]);

    } catch (err) {
        console.error("Insert Error:", err);
    } finally {
        await client.end();
    }
}

run();
