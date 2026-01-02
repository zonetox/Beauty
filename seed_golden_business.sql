-- Seed Golden Sample Business
-- This business showcases 100% complete content structure.

INSERT INTO businesses (
    name, slug, description, categories, address, ward, district, city,
    phone, email, website, 
    latitude, longitude, 
    is_active, is_verified, is_featured, membership_tier, membership_expiry_date,
    joined_date, rating, review_count, view_count,
    image_url, logo_url,
    working_hours, 
    socials, seo,
    tags
) VALUES (
    'Elite Beauty Center & Spa', 
    'elite-beauty-center-spa', 
    'Trải nghiệm đẳng cấp thượng lưu tại Elite Beauty Center. Chúng tôi mang đến giải pháp làm đẹp toàn diện từ chăm sóc da chuyên sâu, thư giãn body đến các liệu trình thẩm mỹ công nghệ cao. \n\nVới đội ngũ chuyên gia hàng đầu và không gian sang trọng, Elite cam kết mang lại vẻ đẹp tỏa sáng và sự thư thái tuyệt đối cho quý khách.', 
    ARRAY['Spa & Massage']::public.business_category[], 
    '123 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
    '0909123456', 'contact@elitebeauty.vn', 'https://elitebeauty.vn',
    10.7760, 106.7009, -- Central HCMC Coordinates
    TRUE, TRUE, TRUE, 'VIP', NOW() + INTERVAL '1 year',
    NOW(), 4.9, 128, 5400,
    'https://images.unsplash.com/photo-1600334019640-eb827c16187a?q=80&w=1920&auto=format&fit=crop', -- Cover
    'https://images.unsplash.com/photo-1560066984-12186d30543d?q=80&w=200&auto=format&fit=crop', -- Logo
    '{"Thứ 2 - Thứ 6": "09:00 - 21:00", "Thứ 7": "08:00 - 22:00", "Chủ Nhật": "08:00 - 20:00"}',
    '{"facebook": "https://facebook.com/elitebeauty", "instagram": "https://instagram.com/elitebeauty", "tiktok": "https://tiktok.com/@elitebeauty", "zalo": "0909123456"}',
    '{"title": "Elite Beauty Center - Spa Đẳng Cấp Quận 1", "description": "Spa cao cấp tại Quận 1 TP.HCM. Chuyên chăm sóc da, massage thư giãn và trị liệu công nghệ cao.", "keywords": "spa quan 1, elite beauty, massage, cham soc da"}',
    ARRAY['luxury', 'spa', 'massage', 'skincare', 'premium']
);

-- Variable for the new business ID would ideally be captured here, 
-- but in pure SQL script we assume it's the latest or use a subquery.
-- For safety in this script, we'll select it based on the slug.

DO $$
DECLARE
    new_biz_id BIGINT;
BEGIN
    SELECT id INTO new_biz_id FROM businesses WHERE slug = 'elite-beauty-center-spa' LIMIT 1;

    -- 1. Services
    INSERT INTO services (business_id, name, description, duration_minutes, price, image_url, position) VALUES
    (new_biz_id, 'Liệu trình Cấy Tảo Xoắn', 'Cung cấp dưỡng chất, giúp da sáng mịn và căng bóng ngay sau lần đầu tiên.', 60, '1500000', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop', 1),
    (new_biz_id, 'Massage Body Đá Nóng', 'Thư giãn cơ bắp, lưu thông khí huyết với đá nóng Bazan tự nhiên.', 90, '800000', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop', 2),
    (new_biz_id, 'Triệt Lông Vĩnh Viễn (Full Body)', 'Công nghệ Laser Diode an toàn, hiệu quả, bảo hành trọn đời.', 45, '5000000', 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=600&auto=format&fit=crop', 3);

    -- 2. Team Members
    INSERT INTO team_members (business_id, name, role, image_url) VALUES
    (new_biz_id, 'Dr. Sarah Nguyễn', 'Chuyên gia Da liễu', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop'),
    (new_biz_id, 'Master Lily Trần', 'Kỹ thuật viên trưởng', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop');

    -- 3. Gallery (Images & Video references)
    INSERT INTO media_items (business_id, url, type, category, title, position) VALUES
    (new_biz_id, 'https://images.unsplash.com/photo-1600334019640-eb827c16187a?q=80&w=800&auto=format&fit=crop', 'IMAGE', 'Interior', 'Sảnh đón khách sang trọng', 1),
    (new_biz_id, 'https://images.unsplash.com/photo-1540555700478-4be88f075056?q=80&w=800&auto=format&fit=crop', 'IMAGE', 'Interior', 'Phòng trị liệu riêng tư', 2),
    (new_biz_id, 'https://www.w3schools.com/html/mov_bbb.mp4', 'VIDEO', 'Uncategorized', 'Giới thiệu Elite Beauty', 3);

    -- 4. Deals
    INSERT INTO deals (business_id, title, description, discount_percentage, original_price, deal_price, start_date, end_date, status, image_url) VALUES
    (new_biz_id, 'Grand Opening - Giảm 50%', 'Ưu đãi đặc biệt mừng khai trương chi nhánh mới. Áp dụng cho tất cả dịch vụ.', 50, NULL, NULL, NOW(), NOW() + INTERVAL '30 days', 'Active', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=600&auto=format&fit=crop');

    -- 5. Business Blog
    INSERT INTO business_blog_posts (business_id, title, slug, excerpt, content, image_url, created_date, view_count, status) VALUES
    (new_biz_id, '5 Bí quyết chăm sóc da mùa hè', '5-bi-quyet-cham-soc-da-mua-he-' || new_biz_id, 'Mùa hè nắng nóng khiến da dễ bị tổn thương...', '<p>Chi tiết bài viết về chăm sóc da mùa hè...</p>', 'https://images.unsplash.com/photo-1556228552-523cd13b2ce2?q=80&w=600&auto=format&fit=crop', NOW(), 150, 'Published');

END $$;
