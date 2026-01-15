-- ============================================
-- CREATE DEMO BUSINESSES FOR EACH LOCATION
-- ============================================
-- Purpose: Create demo businesses for each city to showcase the platform
-- Created: 2025-01-13
-- 
-- Each demo business includes:
-- - Complete business information
-- - Services, deals, reviews
-- - Images and media
-- - Working hours
-- ============================================

-- Helper function to generate slug from name
DO $$
DECLARE
    business_id_1 BIGINT;
    business_id_2 BIGINT;
    business_id_3 BIGINT;
    business_id_4 BIGINT;
    business_id_5 BIGINT;
BEGIN

-- ============================================
-- 1. TP. HỒ CHÍ MINH - Spa & Massage
-- ============================================
INSERT INTO public.businesses (
    slug, name, logo_url, image_url, slogan,
    categories, address, city, district, ward,
    latitude, longitude, tags, phone, email, website,
    description, working_hours, socials, membership_tier,
    is_verified, is_active, is_featured, rating, review_count, view_count
) VALUES (
    'spa-saigon-premium',
    'Spa Sài Gòn Premium',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=800&fit=crop',
    'Nơi chăm sóc sắc đẹp và thư giãn hàng đầu Sài Gòn',
    ARRAY['Spa & Massage']::public.business_category[],
    '123 Nguyễn Huệ, Phường Bến Nghé',
    'TP. Hồ Chí Minh',
    'Quận 1',
    'Phường Bến Nghé',
    10.7769, 106.7009,
    ARRAY['spa', 'massage', 'thư giãn', 'chăm sóc da', 'premium'],
    '028 3829 1234',
    'info@spasaigonpremium.vn',
    'https://spasaigonpremium.vn',
    'Spa Sài Gòn Premium là địa điểm spa và massage hàng đầu tại Quận 1, TP. Hồ Chí Minh. Với không gian sang trọng, đội ngũ chuyên gia giàu kinh nghiệm và các liệu pháp chăm sóc da hiện đại, chúng tôi cam kết mang đến cho khách hàng trải nghiệm thư giãn và làm đẹp tuyệt vời nhất. Dịch vụ của chúng tôi bao gồm: massage thư giãn, chăm sóc da mặt, tắm hơi, xông hơi, và nhiều liệu pháp spa cao cấp khác.',
    '{"monday": {"open": "09:00", "close": "21:00", "isOpen": true}, "tuesday": {"open": "09:00", "close": "21:00", "isOpen": true}, "wednesday": {"open": "09:00", "close": "21:00", "isOpen": true}, "thursday": {"open": "09:00", "close": "21:00", "isOpen": true}, "friday": {"open": "09:00", "close": "21:00", "isOpen": true}, "saturday": {"open": "09:00", "close": "21:00", "isOpen": true}, "sunday": {"open": "10:00", "close": "20:00", "isOpen": true}}'::jsonb,
    '{"facebook": "https://facebook.com/spasaigonpremium", "instagram": "https://instagram.com/spasaigonpremium", "zalo": "02838291234"}'::jsonb,
    'Premium',
    true, true, true,
    4.8, 127, 2450
) RETURNING id INTO business_id_1;

-- Services for Spa Sài Gòn Premium
INSERT INTO public.services (business_id, name, price, description, image_url, duration_minutes, position) VALUES
(business_id_1, 'Massage Thư Giãn Toàn Thân', '500,000 VNĐ', 'Massage thư giãn với tinh dầu tự nhiên, giúp giảm căng thẳng và mệt mỏi', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', 90, 1),
(business_id_1, 'Chăm Sóc Da Mặt Premium', '800,000 VNĐ', 'Liệu trình chăm sóc da mặt cao cấp với sản phẩm organic, phù hợp mọi loại da', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', 120, 2),
(business_id_1, 'Tắm Hơi & Xông Hơi', '300,000 VNĐ', 'Trải nghiệm tắm hơi và xông hơi truyền thống, giúp thải độc và thư giãn', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop', 60, 3),
(business_id_1, 'Massage Chân & Body Scrub', '600,000 VNĐ', 'Massage chân kết hợp body scrub với muối biển, làm mềm và mịn da', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop', 90, 4);

-- Deals for Spa Sài Gòn Premium
INSERT INTO public.deals (business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status) VALUES
(business_id_1, 'Combo Thư Giãn Cuối Tuần', 'Massage + Chăm sóc da mặt với giá ưu đãi đặc biệt', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '30 days', 20, 1300000, 1040000, 'Active'),
(business_id_1, 'Ưu Đãi Sinh Nhật', 'Giảm 30% cho khách hàng có sinh nhật trong tháng', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '60 days', 30, 500000, 350000, 'Active');

-- Reviews for Spa Sài Gòn Premium
INSERT INTO public.reviews (business_id, user_name, user_avatar_url, rating, comment, submitted_date, status) VALUES
(business_id_1, 'Nguyễn Thị Lan', 'https://i.pravatar.cc/150?img=1', 5, 'Dịch vụ tuyệt vời! Nhân viên chuyên nghiệp, không gian sang trọng. Mình sẽ quay lại!', NOW() - INTERVAL '5 days', 'Visible'),
(business_id_1, 'Trần Văn Minh', 'https://i.pravatar.cc/150?img=12', 5, 'Massage rất thư giãn, giá cả hợp lý. Đáng để thử!', NOW() - INTERVAL '10 days', 'Visible'),
(business_id_1, 'Lê Thị Hoa', 'https://i.pravatar.cc/150?img=5', 4, 'Tốt nhưng hơi đông, nên đặt lịch trước. Dịch vụ chất lượng!', NOW() - INTERVAL '15 days', 'Visible');

-- Media for Spa Sài Gòn Premium
INSERT INTO public.media_items (business_id, url, type, category, title, description, position) VALUES
(business_id_1, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Không gian spa sang trọng', 'Không gian thư giãn với ánh sáng tự nhiên', 1),
(business_id_1, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Phòng massage riêng', 'Phòng massage riêng tư, yên tĩnh', 2),
(business_id_1, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&h=800&fit=crop', 'IMAGE', 'Products', 'Sản phẩm chăm sóc da', 'Sản phẩm organic cao cấp', 3);

-- ============================================
-- 2. HÀ NỘI - Hair Salon
-- ============================================
INSERT INTO public.businesses (
    slug, name, logo_url, image_url, slogan,
    categories, address, city, district, ward,
    latitude, longitude, tags, phone, email, website,
    description, working_hours, socials, membership_tier,
    is_verified, is_active, is_featured, rating, review_count, view_count
) VALUES (
    'salon-hanoi-trendy',
    'Salon Hà Nội Trendy',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=800&fit=crop',
    'Nơi tạo nên phong cách thời trang cho bạn',
    ARRAY['Hair Salon']::public.business_category[],
    '456 Trần Hưng Đạo, Phường Cửa Nam',
    'Hà Nội',
    'Hoàn Kiếm',
    'Phường Cửa Nam',
    21.0285, 105.8542,
    ARRAY['salon', 'cắt tóc', 'nhuộm tóc', 'tạo kiểu', 'trendy'],
    '024 3825 5678',
    'info@salonhanoitrendy.vn',
    'https://salonhanoitrendy.vn',
    'Salon Hà Nội Trendy là salon tóc hàng đầu tại Hoàn Kiếm, Hà Nội. Với đội ngũ stylist chuyên nghiệp, giàu kinh nghiệm và luôn cập nhật xu hướng mới nhất, chúng tôi cam kết mang đến cho khách hàng những kiểu tóc đẹp, phù hợp với từng cá nhân. Dịch vụ của chúng tôi bao gồm: cắt tóc nam/nữ, nhuộm tóc, uốn tóc, duỗi tóc, tạo kiểu, và chăm sóc tóc chuyên sâu.',
    '{"monday": {"open": "08:00", "close": "20:00", "isOpen": true}, "tuesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "wednesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "thursday": {"open": "08:00", "close": "20:00", "isOpen": true}, "friday": {"open": "08:00", "close": "20:00", "isOpen": true}, "saturday": {"open": "08:00", "close": "20:00", "isOpen": true}, "sunday": {"open": "09:00", "close": "19:00", "isOpen": true}}'::jsonb,
    '{"facebook": "https://facebook.com/salonhanoitrendy", "instagram": "https://instagram.com/salonhanoitrendy", "zalo": "02438255678"}'::jsonb,
    'Premium',
    true, true, true,
    4.7, 98, 1890
) RETURNING id INTO business_id_2;

-- Services for Salon Hà Nội Trendy
INSERT INTO public.services (business_id, name, price, description, image_url, duration_minutes, position) VALUES
(business_id_2, 'Cắt Tóc Nam/Nữ', '150,000 VNĐ', 'Cắt tóc theo yêu cầu, tư vấn kiểu tóc phù hợp', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop', 45, 1),
(business_id_2, 'Nhuộm Tóc Balayage', '1,200,000 VNĐ', 'Kỹ thuật nhuộm balayage hiện đại, tạo độ sáng tự nhiên', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop', 180, 2),
(business_id_2, 'Uốn Tóc & Duỗi Tóc', '800,000 VNĐ', 'Uốn hoặc duỗi tóc với sản phẩm cao cấp, bảo vệ tóc', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop', 150, 3),
(business_id_2, 'Chăm Sóc Tóc Chuyên Sâu', '400,000 VNĐ', 'Ủ tóc, dưỡng tóc với sản phẩm chuyên nghiệp', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop', 90, 4);

-- Deals for Salon Hà Nội Trendy
INSERT INTO public.deals (business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status) VALUES
(business_id_2, 'Combo Cắt + Nhuộm', 'Cắt tóc + Nhuộm tóc với giá ưu đãi', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '30 days', 15, 1350000, 1147500, 'Active'),
(business_id_2, 'Ưu Đãi Sinh Viên', 'Giảm 20% cho sinh viên (có thẻ sinh viên)', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '90 days', 20, 150000, 120000, 'Active');

-- Reviews for Salon Hà Nội Trendy
INSERT INTO public.reviews (business_id, user_name, user_avatar_url, rating, comment, submitted_date, status) VALUES
(business_id_2, 'Phạm Thị Mai', 'https://i.pravatar.cc/150?img=9', 5, 'Stylist rất chuyên nghiệp, tư vấn nhiệt tình. Kiểu tóc đẹp như mong đợi!', NOW() - INTERVAL '3 days', 'Visible'),
(business_id_2, 'Hoàng Văn Đức', 'https://i.pravatar.cc/150?img=15', 4, 'Cắt tóc đẹp, giá cả hợp lý. Sẽ quay lại!', NOW() - INTERVAL '8 days', 'Visible'),
(business_id_2, 'Vũ Thị Linh', 'https://i.pravatar.cc/150?img=20', 5, 'Nhuộm balayage đẹp lắm! Màu tóc tự nhiên, không hư tóc. Rất hài lòng!', NOW() - INTERVAL '12 days', 'Visible');

-- Media for Salon Hà Nội Trendy
INSERT INTO public.media_items (business_id, url, type, category, title, description, position) VALUES
(business_id_2, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Không gian salon hiện đại', 'Không gian rộng rãi, thoáng mát', 1),
(business_id_2, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=800&fit=crop', 'IMAGE', 'Staff', 'Đội ngũ stylist chuyên nghiệp', 'Stylist giàu kinh nghiệm', 2),
(business_id_2, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=800&fit=crop', 'IMAGE', 'Products', 'Sản phẩm chăm sóc tóc', 'Sản phẩm cao cấp từ các thương hiệu nổi tiếng', 3);

-- ============================================
-- 3. ĐÀ NẴNG - Nail Salon
-- ============================================
INSERT INTO public.businesses (
    slug, name, logo_url, image_url, slogan,
    categories, address, city, district, ward,
    latitude, longitude, tags, phone, email, website,
    description, working_hours, socials, membership_tier,
    is_verified, is_active, is_featured, rating, review_count, view_count
) VALUES (
    'nail-danang-elegant',
    'Nail Đà Nẵng Elegant',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&h=800&fit=crop',
    'Nghệ thuật làm đẹp móng tay chuyên nghiệp',
    ARRAY['Nail Salon']::public.business_category[],
    '789 Lê Duẩn, Phường Hải Châu 1',
    'Đà Nẵng',
    'Hải Châu',
    'Phường Hải Châu 1',
    16.0544, 108.2022,
    ARRAY['nail', 'sơn móng', 'gel', 'nail art', 'chăm sóc móng'],
    '0236 3821 9012',
    'info@naildanangelegant.vn',
    'https://naildanangelegant.vn',
    'Nail Đà Nẵng Elegant là salon làm móng chuyên nghiệp tại Hải Châu, Đà Nẵng. Với đội ngũ thợ nail giàu kinh nghiệm, sáng tạo và luôn cập nhật xu hướng mới nhất, chúng tôi cam kết mang đến cho khách hàng những bộ móng đẹp, độc đáo và bền màu. Dịch vụ của chúng tôi bao gồm: sơn gel, nail art, chăm sóc móng, đắp móng, và nhiều dịch vụ làm đẹp móng khác.',
    '{"monday": {"open": "09:00", "close": "21:00", "isOpen": true}, "tuesday": {"open": "09:00", "close": "21:00", "isOpen": true}, "wednesday": {"open": "09:00", "close": "21:00", "isOpen": true}, "thursday": {"open": "09:00", "close": "21:00", "isOpen": true}, "friday": {"open": "09:00", "close": "21:00", "isOpen": true}, "saturday": {"open": "09:00", "close": "21:00", "isOpen": true}, "sunday": {"open": "10:00", "close": "20:00", "isOpen": true}}'::jsonb,
    '{"facebook": "https://facebook.com/naildanangelegant", "instagram": "https://instagram.com/naildanangelegant", "zalo": "023638219012"}'::jsonb,
    'Premium',
    true, true, true,
    4.9, 156, 2100
) RETURNING id INTO business_id_3;

-- Services for Nail Đà Nẵng Elegant
INSERT INTO public.services (business_id, name, price, description, image_url, duration_minutes, position) VALUES
(business_id_3, 'Sơn Gel Hàn Quốc', '200,000 VNĐ', 'Sơn gel cao cấp Hàn Quốc, bền màu 2-3 tuần', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop', 60, 1),
(business_id_3, 'Nail Art Cao Cấp', '350,000 VNĐ', 'Vẽ nail art theo yêu cầu, nhiều mẫu đẹp', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&h=400&fit=crop', 90, 2),
(business_id_3, 'Chăm Sóc Móng Chuyên Sâu', '250,000 VNĐ', 'Cắt da, dưỡng móng, massage tay', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop', 75, 3),
(business_id_3, 'Đắp Móng Gel/Acrylic', '500,000 VNĐ', 'Đắp móng gel hoặc acrylic, tạo form đẹp', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop', 120, 4);

-- Deals for Nail Đà Nẵng Elegant
INSERT INTO public.deals (business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status) VALUES
(business_id_3, 'Combo Sơn Gel + Nail Art', 'Sơn gel + Nail art với giá ưu đãi', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '30 days', 20, 550000, 440000, 'Active'),
(business_id_3, 'Ưu Đãi Thứ 2', 'Giảm 15% cho tất cả dịch vụ vào thứ 2 hàng tuần', 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '90 days', 15, 200000, 170000, 'Active');

-- Reviews for Nail Đà Nẵng Elegant
INSERT INTO public.reviews (business_id, user_name, user_avatar_url, rating, comment, submitted_date, status) VALUES
(business_id_3, 'Nguyễn Thị Hương', 'https://i.pravatar.cc/150?img=3', 5, 'Nail art đẹp lắm! Thợ nail rất tỉ mỉ và sáng tạo. Mình rất hài lòng!', NOW() - INTERVAL '2 days', 'Visible'),
(business_id_3, 'Trần Thị Nga', 'https://i.pravatar.cc/150?img=7', 5, 'Sơn gel bền màu, không bong tróc. Dịch vụ chuyên nghiệp!', NOW() - INTERVAL '7 days', 'Visible'),
(business_id_3, 'Lê Văn Tuấn', 'https://i.pravatar.cc/150?img=18', 4, 'Giá cả hợp lý, chất lượng tốt. Sẽ quay lại!', NOW() - INTERVAL '14 days', 'Visible');

-- Media for Nail Đà Nẵng Elegant
INSERT INTO public.media_items (business_id, url, type, category, title, description, position) VALUES
(business_id_3, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Không gian salon làm móng', 'Không gian sạch sẽ, hiện đại', 1),
(business_id_3, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=800&fit=crop', 'IMAGE', 'Products', 'Sản phẩm sơn gel cao cấp', 'Sơn gel từ các thương hiệu nổi tiếng', 2),
(business_id_3, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=800&fit=crop', 'IMAGE', 'Products', 'Mẫu nail art đẹp', 'Nhiều mẫu nail art độc đáo', 3);

-- ============================================
-- 4. HẢI PHÒNG - Beauty Clinic
-- ============================================
INSERT INTO public.businesses (
    slug, name, logo_url, image_url, slogan,
    categories, address, city, district, ward,
    latitude, longitude, tags, phone, email, website,
    description, working_hours, socials, membership_tier,
    is_verified, is_active, is_featured, rating, review_count, view_count
) VALUES (
    'clinic-haiphong-beauty',
    'Clinic Hải Phòng Beauty',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=800&fit=crop',
    'Chăm sóc da chuyên nghiệp với công nghệ hiện đại',
    ARRAY['Beauty Clinic']::public.business_category[],
    '321 Lạch Tray, Phường Máy Chai',
    'Hải Phòng',
    'Ngô Quyền',
    'Phường Máy Chai',
    20.8449, 106.6881,
    ARRAY['clinic', 'chăm sóc da', 'trị mụn', 'laser', 'thẩm mỹ'],
    '0225 3827 3456',
    'info@clinichaiphongbeauty.vn',
    'https://clinichaiphongbeauty.vn',
    'Clinic Hải Phòng Beauty là phòng khám thẩm mỹ và chăm sóc da chuyên nghiệp tại Ngô Quyền, Hải Phòng. Với đội ngũ bác sĩ và chuyên viên giàu kinh nghiệm, cùng hệ thống máy móc hiện đại, chúng tôi cam kết mang đến cho khách hàng các dịch vụ chăm sóc da an toàn, hiệu quả. Dịch vụ của chúng tôi bao gồm: trị mụn, chăm sóc da, laser, peel da, và nhiều liệu pháp làm đẹp khác.',
    '{"monday": {"open": "08:00", "close": "20:00", "isOpen": true}, "tuesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "wednesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "thursday": {"open": "08:00", "close": "20:00", "isOpen": true}, "friday": {"open": "08:00", "close": "20:00", "isOpen": true}, "saturday": {"open": "08:00", "close": "20:00", "isOpen": true}, "sunday": {"open": "09:00", "close": "18:00", "isOpen": true}}'::jsonb,
    '{"facebook": "https://facebook.com/clinichaiphongbeauty", "instagram": "https://instagram.com/clinichaiphongbeauty", "zalo": "022538273456"}'::jsonb,
    'VIP',
    true, true, true,
    4.8, 134, 1980
) RETURNING id INTO business_id_4;

-- Services for Clinic Hải Phòng Beauty
INSERT INTO public.services (business_id, name, price, description, image_url, duration_minutes, position) VALUES
(business_id_4, 'Trị Mụn Chuyên Sâu', '1,500,000 VNĐ', 'Liệu trình trị mụn với công nghệ hiện đại, an toàn', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop', 90, 1),
(business_id_4, 'Laser Trị Thâm & Nám', '2,500,000 VNĐ', 'Công nghệ laser hiện đại, trị thâm nám hiệu quả', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', 60, 2),
(business_id_4, 'Peel Da Hóa Học', '1,200,000 VNĐ', 'Peel da với acid tự nhiên, làm sáng và mịn da', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', 75, 3),
(business_id_4, 'Chăm Sóc Da Premium', '800,000 VNĐ', 'Liệu trình chăm sóc da cao cấp với sản phẩm organic', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop', 120, 4);

-- Deals for Clinic Hải Phòng Beauty
INSERT INTO public.deals (business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status) VALUES
(business_id_4, 'Combo Trị Mụn + Chăm Sóc Da', 'Trị mụn + Chăm sóc da với giá ưu đãi', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '30 days', 25, 2300000, 1725000, 'Active'),
(business_id_4, 'Ưu Đãi Lần Đầu', 'Giảm 30% cho khách hàng lần đầu đến', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '60 days', 30, 1500000, 1050000, 'Active');

-- Reviews for Clinic Hải Phòng Beauty
INSERT INTO public.reviews (business_id, user_name, user_avatar_url, rating, comment, submitted_date, status) VALUES
(business_id_4, 'Đỗ Thị Hạnh', 'https://i.pravatar.cc/150?img=11', 5, 'Trị mụn rất hiệu quả! Da mình đã cải thiện rất nhiều sau 3 lần điều trị.', NOW() - INTERVAL '4 days', 'Visible'),
(business_id_4, 'Bùi Văn Hùng', 'https://i.pravatar.cc/150?img=16', 4, 'Bác sĩ tư vấn nhiệt tình, dịch vụ chuyên nghiệp. Rất hài lòng!', NOW() - INTERVAL '9 days', 'Visible'),
(business_id_4, 'Phạm Thị Thu', 'https://i.pravatar.cc/150?img=6', 5, 'Laser trị thâm rất hiệu quả. Da mình sáng và mịn hơn nhiều!', NOW() - INTERVAL '16 days', 'Visible');

-- Media for Clinic Hải Phòng Beauty
INSERT INTO public.media_items (business_id, url, type, category, title, description, position) VALUES
(business_id_4, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Phòng khám hiện đại', 'Không gian sạch sẽ, chuyên nghiệp', 1),
(business_id_4, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Máy móc hiện đại', 'Hệ thống máy móc công nghệ cao', 2),
(business_id_4, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=800&fit=crop', 'IMAGE', 'Staff', 'Đội ngũ bác sĩ chuyên nghiệp', 'Bác sĩ giàu kinh nghiệm', 3);

-- ============================================
-- 5. CẦN THƠ - Dental Clinic
-- ============================================
INSERT INTO public.businesses (
    slug, name, logo_url, image_url, slogan,
    categories, address, city, district, ward,
    latitude, longitude, tags, phone, email, website,
    description, working_hours, socials, membership_tier,
    is_verified, is_active, is_featured, rating, review_count, view_count
) VALUES (
    'clinic-cantho-dental',
    'Clinic Cần Thơ Dental',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&h=800&fit=crop',
    'Nụ cười đẹp, sức khỏe răng miệng tốt',
    ARRAY['Dental Clinic']::public.business_category[],
    '654 Nguyễn Văn Cừ, Phường An Khánh',
    'Cần Thơ',
    'Ninh Kiều',
    'Phường An Khánh',
    10.0452, 105.7469,
    ARRAY['nha khoa', 'răng', 'niềng răng', 'tẩy trắng', 'implant'],
    '0292 3823 7890',
    'info@cliniccanthodental.vn',
    'https://cliniccanthodental.vn',
    'Clinic Cần Thơ Dental là phòng khám nha khoa chuyên nghiệp tại Ninh Kiều, Cần Thơ. Với đội ngũ bác sĩ nha khoa giàu kinh nghiệm, trang thiết bị hiện đại và quy trình vô trùng nghiêm ngặt, chúng tôi cam kết mang đến cho khách hàng dịch vụ nha khoa chất lượng cao, an toàn và hiệu quả. Dịch vụ của chúng tôi bao gồm: khám và điều trị răng, niềng răng, tẩy trắng răng, implant, và nhiều dịch vụ nha khoa khác.',
    '{"monday": {"open": "08:00", "close": "20:00", "isOpen": true}, "tuesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "wednesday": {"open": "08:00", "close": "20:00", "isOpen": true}, "thursday": {"open": "08:00", "close": "20:00", "isOpen": true}, "friday": {"open": "08:00", "close": "20:00", "isOpen": true}, "saturday": {"open": "08:00", "close": "20:00", "isOpen": true}, "sunday": {"open": "09:00", "close": "18:00", "isOpen": true}}'::jsonb,
    '{"facebook": "https://facebook.com/cliniccanthodental", "instagram": "https://instagram.com/cliniccanthodental", "zalo": "029238237890"}'::jsonb,
    'VIP',
    true, true, true,
    4.9, 142, 1750
) RETURNING id INTO business_id_5;

-- Services for Clinic Cần Thơ Dental
INSERT INTO public.services (business_id, name, price, description, image_url, duration_minutes, position) VALUES
(business_id_5, 'Khám & Tư Vấn Răng Miệng', '200,000 VNĐ', 'Khám tổng quát và tư vấn sức khỏe răng miệng', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=400&fit=crop', 30, 1),
(business_id_5, 'Niềng Răng Trong Suốt', '25,000,000 VNĐ', 'Niềng răng với khay trong suốt, thẩm mỹ cao', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=400&fit=crop', 60, 2),
(business_id_5, 'Tẩy Trắng Răng', '2,500,000 VNĐ', 'Tẩy trắng răng với công nghệ hiện đại, an toàn', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', 90, 3),
(business_id_5, 'Cấy Ghép Implant', '15,000,000 VNĐ', 'Cấy ghép implant chất lượng cao, bền vững', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', 120, 4);

-- Deals for Clinic Cần Thơ Dental
INSERT INTO public.deals (business_id, title, description, image_url, start_date, end_date, discount_percentage, original_price, deal_price, status) VALUES
(business_id_5, 'Combo Khám + Tẩy Trắng', 'Khám răng + Tẩy trắng với giá ưu đãi', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '30 days', 20, 2700000, 2160000, 'Active'),
(business_id_5, 'Ưu Đãi Gia Đình', 'Giảm 15% cho khách hàng đặt lịch cho 2 người trở lên', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=500&fit=crop', NOW(), NOW() + INTERVAL '60 days', 15, 200000, 170000, 'Active');

-- Reviews for Clinic Cần Thơ Dental
INSERT INTO public.reviews (business_id, user_name, user_avatar_url, rating, comment, submitted_date, status) VALUES
(business_id_5, 'Lý Thị Hoa', 'https://i.pravatar.cc/150?img=4', 5, 'Bác sĩ rất chuyên nghiệp, tư vấn nhiệt tình. Dịch vụ tốt!', NOW() - INTERVAL '6 days', 'Visible'),
(business_id_5, 'Võ Văn Nam', 'https://i.pravatar.cc/150?img=13', 5, 'Niềng răng đẹp lắm! Không đau, quá trình nhanh chóng. Rất hài lòng!', NOW() - INTERVAL '11 days', 'Visible'),
(business_id_5, 'Trần Thị Loan', 'https://i.pravatar.cc/150?img=8', 4, 'Tẩy trắng răng hiệu quả, giá cả hợp lý. Sẽ quay lại!', NOW() - INTERVAL '18 days', 'Visible');

-- Media for Clinic Cần Thơ Dental
INSERT INTO public.media_items (business_id, url, type, category, title, description, position) VALUES
(business_id_5, 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Phòng khám nha khoa hiện đại', 'Không gian sạch sẽ, chuyên nghiệp', 1),
(business_id_5, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&h=800&fit=crop', 'IMAGE', 'Interior', 'Trang thiết bị hiện đại', 'Máy móc công nghệ cao', 2),
(business_id_5, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=800&fit=crop', 'IMAGE', 'Staff', 'Đội ngũ bác sĩ nha khoa', 'Bác sĩ giàu kinh nghiệm', 3);

END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that all demo businesses were created
DO $$
DECLARE
    business_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO business_count
    FROM public.businesses
    WHERE slug IN (
        'spa-saigon-premium',
        'salon-hanoi-trendy',
        'nail-danang-elegant',
        'clinic-haiphong-beauty',
        'clinic-cantho-dental'
    );
    
    IF business_count = 5 THEN
        RAISE NOTICE '✅ Successfully created 5 demo businesses for all locations!';
    ELSE
        RAISE WARNING '⚠️ Expected 5 businesses, but found %', business_count;
    END IF;
END $$;
