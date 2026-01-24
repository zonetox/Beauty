-- ============================================
-- GROUND TRUTH SCHEMA v2.0 (Simplified Registration)
-- ============================================
-- Cập nhật trigger để hỗ trợ 2-step registration flow
-- STRICT NEW USER TRIGGER (với giá trị mặc định an toàn)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_business_name TEXT;
BEGIN v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- TẠO PROFILE (Luôn luôn)
INSERT INTO public.profiles (id, full_name, avatar_url, email, user_type)
VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new.raw_user_meta_data->>'avatar_url',
        new.email,
        v_user_type
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
-- TẠO BUSINESS (Chỉ khi user_type = 'business')
IF v_user_type = 'business' THEN -- Kiểm tra đã có business chưa
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = new.id
LIMIT 1;
IF v_business_id IS NULL THEN -- Lấy tên business từ metadata hoặc dùng email
v_business_name := COALESCE(
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
);
-- Tạo slug an toàn
v_slug := lower(
    regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g')
) || '-' || floor(random() * 10000)::text;
-- INSERT với GIÁ TRỊ MẶC ĐỊNH cho tất cả trường bắt buộc
INSERT INTO public.businesses (
        name,
        slug,
        owner_id,
        is_active,
        is_verified,
        -- Các trường bắt buộc với giá trị mặc định
        address,
        city,
        district,
        ward,
        phone,
        description,
        working_hours,
        image_url,
        categories
    )
VALUES (
        v_business_name,
        v_slug,
        new.id,
        true,
        false,
        -- Giá trị mặc định - user sẽ cập nhật sau
        'Chưa cập nhật',
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        'Chưa cập nhật',
        'Vui lòng cập nhật thông tin doanh nghiệp trong Dashboard',
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb,
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
        ARRAY ['Spa & Massage'::public.business_category]
    )
RETURNING id INTO v_business_id;
END IF;
-- Cập nhật business_id vào profile
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
RETURN new;
EXCEPTION
WHEN OTHERS THEN -- Log lỗi nhưng không làm fail quá trình đăng ký
RAISE LOG 'Error in handle_new_user: %',
SQLERRM;
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- Đảm bảo trigger được gắn đúng
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();