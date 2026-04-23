import { DEMO_CONTENT } from './src/features/templates/presets.ts';
import { toSnakeCase } from './lib/utils.ts';

const demo = DEMO_CONTENT['luna-spa'];

const demoData = {
    ...demo,
    slug: 'luna-spa-12345',
    owner_id: '12345',
    is_active: true,
    is_verified: false,
    membership_tier: 'Free',
    landing_page_config: { sections: { hero: { enabled: true, order: 1 } } },
    template_id: 'luna-spa',
    joined_date: new Date().toISOString(),
    notification_settings: {
        review_alerts: true,
        booking_requests: true,
        platform_news: true
    }
};

const businessData = { ...demoData };
// pretend we delete the relational fields 
delete businessData.id;
delete businessData.business_blog_posts;

const snakeCased = toSnakeCase(businessData);
console.log(JSON.stringify(snakeCased, null, 2));
