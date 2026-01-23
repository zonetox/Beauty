-- ============================================
-- MASTER AUTH OVERHAUL & DATA HEALING (v1.1 - Fix column status)
-- ============================================
-- Giải quyết triệt để lỗi phân quyền và kiểu dữ liệu.
-- Bản cập nhật: Sử dụng is_active thay cho status để khớp với Schema v1.0.
-- 1. SỬA LỖI KIỂU DỮ LIỆU TRONG RPC
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID) RETURNS JSONB SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_profile RECORD;
v_business_id BIGINT;
v_role TEXT := 'user';
v_permissions JSONB := '[]'::jsonb;
BEGIN -- A. Lấy Profile cơ bản
SELECT * INTO v_profile
FROM public.profiles
WHERE id = p_user_id;
-- Nếu không có Profile, trả về lỗi nhẹ để UI xử lý
IF NOT FOUND THEN RETURN jsonb_build_object(
    'role',
    'user',
    'isDataLoaded',
    false,
    'error',
    'Profile not found'
);
END IF;
-- B. Kiểm tra Admin (Sử dụng EMAIL)
IF EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = v_profile.email
        AND is_locked = FALSE
) THEN v_role := 'admin';
v_permissions := '["all"]'::jsonb;
-- C. Kiểm tra Business Owner
ELSE
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = p_user_id
LIMIT 1;
IF v_business_id IS NOT NULL THEN v_role := 'business_owner';
-- D. Kiểm tra Business Staff
ELSE
SELECT business_id INTO v_business_id
FROM public.business_staff
WHERE user_id = p_user_id
LIMIT 1;
IF v_business_id IS NOT NULL THEN v_role := 'business_staff';
END IF;
END IF;
END IF;
-- E. Đồng bộ ngược lại bảng Profiles
IF v_role = 'business_owner'
AND (
    v_profile.user_type != 'business'
    OR v_profile.business_id IS NULL
) THEN
UPDATE public.profiles
SET user_type = 'business',
    business_id = v_business_id
WHERE id = p_user_id;
END IF;
RETURN jsonb_build_object(
    'profile',
    to_jsonb(v_profile),
    'role',
    v_role,
    'businessId',
    v_business_id,
    'permissions',
    v_permissions,
    'isDataLoaded',
    TRUE
);
END;
$$ LANGUAGE plpgsql;
-- 2. TỐI ƯU TRIGGER ĐĂNG KÝ (SỬ DỤNG IS_ACTIVE)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_id BIGINT;
v_slug TEXT;
BEGIN v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- TẠO PROFILE
INSERT INTO public.profiles (id, full_name, avatar_url, email, user_type)
VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'business_name',
            'User'
        ),
        new.raw_user_meta_data->>'avatar_url',
        new.email,
        v_user_type
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
-- TẠO BUSINESS (Sử dụng is_active=true)
IF v_user_type = 'business'
AND new.raw_user_meta_data->>'business_name' IS NOT NULL THEN
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = new.id
LIMIT 1;
IF v_business_id IS NULL THEN v_slug := lower(
    regexp_replace(
        new.raw_user_meta_data->>'business_name',
        '[^a-zA-Z0-9]+',
        '-',
        'g'
    )
) || '-' || floor(random() * 1000)::text;
INSERT INTO public.businesses (
        name,
        slug,
        owner_id,
        is_active,
        is_verified,
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
        new.raw_user_meta_data->>'business_name',
        v_slug,
        new.id,
        true,
        false,
        COALESCE(new.raw_user_meta_data->>'address', 'N/A'),
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        COALESCE(new.raw_user_meta_data->>'phone', 'N/A'),
        COALESCE(new.raw_user_meta_data->>'description', ''),
        '{"monday": {"open": "09:00", "close": "18:00"}}'::jsonb,
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
        ARRAY ['Spa & Massage'::public.business_category]
    )
RETURNING id INTO v_business_id;
END IF;
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
RETURN new;
EXCEPTION
WHEN OTHERS THEN RAISE LOG 'Error in handle_new_user: %',
SQLERRM;
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- 3. CƠ CHẾ TỰ SỬA CHỮA (DATA HEALING - Fix column errors)
DO $$
DECLARE r RECORD;
v_bid BIGINT;
BEGIN FOR r IN
SELECT id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE (raw_user_meta_data->>'user_type') = 'business' LOOP
SELECT id INTO v_bid
FROM public.businesses
WHERE owner_id = r.id;
IF v_bid IS NULL THEN
INSERT INTO public.businesses (
        name,
        slug,
        owner_id,
        is_active,
        is_verified,
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
        COALESCE(
            r.raw_user_meta_data->>'business_name',
            'Business Draft'
        ),
        'resync-' || floor(random() * 1000000)::text,
        r.id,
        true,
        false,
        'N/A',
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        'N/A',
        '',
        '{"monday": {"open": "09:00", "close": "18:00"}}'::jsonb,
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
        ARRAY ['Spa & Massage'::public.business_category]
    )
RETURNING id INTO v_bid;
END IF;
UPDATE public.profiles
SET user_type = 'business',
    business_id = v_bid
WHERE id = r.id;
END LOOP;
END $$;
-- Cấp quyền
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO anon;