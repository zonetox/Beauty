-- DATABASE OPTIMIZATION: INDUSTRIAL SCALE INDICES
-- Mục tiêu: Đảm bảo tốc độ truy vấn < 100ms cho hàng chục ngàn bản ghi.
-- 1. BẢNG BUSINESSES (Tìm kiếm và Lọc)
CREATE INDEX IF NOT EXISTS idx_businesses_active_verified ON public.businesses(is_active, is_verified)
WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(city, district, ward);
CREATE INDEX IF NOT EXISTS idx_businesses_categories ON public.businesses USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON public.businesses(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON public.businesses(is_featured)
WHERE is_featured = TRUE;
-- 2. BẢNG PROFILES (Phân quyền và Liên kết)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_business_link ON public.profiles(business_id);
-- 3. BẢNG ADMIN_USERS
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
-- 4. BẢNG BLOG POSTS (Nếu có lớn)
-- Lưu ý: Thực hiện tương tự cho bảng business_blog_posts nếu bảng đó tồn tại và quy mô lớn.
ANALYZE public.businesses;
ANALYZE public.profiles;