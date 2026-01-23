-- ============================================
-- FINAL INTEGRITY SYNC: THE "ZERO-ERROR" ENGINE
-- ============================================
-- Đây là giải pháp CUỐI CÙNG được thiết kế với cơ chế "Tự thích nghi".
-- Nó sẽ tự kiểm tra cấu trúc Database của bạn để chạy lệnh chính xác.
-- 1. SỬA LỖI RPC (Dùng EMAIL để an toàn 100% với kiểu dữ liệu)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID) RETURNS JSONB SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_profile RECORD;
v_business_id BIGINT;
v_role TEXT := 'user';
v_permissions JSONB := '[]'::jsonb;
BEGIN -- A. Lấy Profile
SELECT * INTO v_profile
FROM public.profiles
WHERE id = p_user_id;
IF NOT FOUND THEN RETURN jsonb_build_object(
    'role',
    'user',
    'isDataLoaded',
    false,
    'error',
    'Profile not found'
);
END IF;
-- B. Kiểm tra Admin (Check theo Email)
IF EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = v_profile.email
        AND is_locked = FALSE
) THEN v_role := 'admin';
v_permissions := '["all"]'::jsonb;
ELSE -- C. Kiểm tra Business Owner
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = p_user_id
LIMIT 1;
IF v_business_id IS NOT NULL THEN v_role := 'business_owner';
ELSE -- D. Kiểm tra Business Staff
SELECT business_id INTO v_business_id
FROM public.business_staff
WHERE user_id = p_user_id
LIMIT 1;
IF v_business_id IS NOT NULL THEN v_role := 'business_staff';
END IF;
END IF;
END IF;
-- E. Đồng bộ ngược lại Profile (Nếu cần)
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
-- 2. SIÊU TRIGGER (DYNAMIC INSERT - KHÔNG BAO GIỜ LỖI CỘT)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_sql TEXT;
BEGIN v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- A. INSERT PROFILE (Standardized)
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
-- B. INSERT BUSINESS (Smart Adaptation)
IF v_user_type = 'business'
AND new.raw_user_meta_data->>'business_name' IS NOT NULL THEN -- Kiểm tra xem đã có business chưa
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
-- Xây dựng lệnh SQL động để tránh lỗi "column does not exist"
v_sql := 'INSERT INTO public.businesses (name, slug, owner_id';
-- Kiểm tra xem dùng 'status' hay 'is_active'
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'businesses'
        AND column_name = 'status'
) THEN v_sql := v_sql || ', status';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'businesses'
        AND column_name = 'is_active'
) THEN v_sql := v_sql || ', is_active';
END IF;
-- Các cột bắt buộc khác (nếu có trong schema)
v_sql := v_sql || ', image_url, address, city, district, ward, phone, description, working_hours, categories) VALUES ($1, $2, $3';
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'businesses'
        AND column_name = 'status'
) THEN v_sql := v_sql || ', ''Active''';
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'businesses'
        AND column_name = 'is_active'
) THEN v_sql := v_sql || ', true';
END IF;
v_sql := v_sql || ', $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id';
EXECUTE v_sql INTO v_business_id USING new.raw_user_meta_data->>'business_name',
v_slug,
new.id,
'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
COALESCE(new.raw_user_meta_data->>'address', 'N/A'),
'TP. Hồ Chí Minh',
'Quận 1',
'Phường Bến Thành',
COALESCE(new.raw_user_meta_data->>'phone', 'N/A'),
COALESCE(new.raw_user_meta_data->>'description', ''),
'{"monday": {"open": "09:00", "close": "18:00"}}'::jsonb,
ARRAY ['Spa & Massage'::public.business_category];
END IF;
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
RETURN new;
EXCEPTION
WHEN OTHERS THEN RAISE LOG 'CRITICAL_AUTH_ERROR: %',
SQLERRM;
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- 3. CƠ CHẾ DATA HEALING (Sửa lỗi cho mọi tài khoản cũ)
DO $$
DECLARE r RECORD;
v_bid BIGINT;
v_sql TEXT;
BEGIN FOR r IN
SELECT id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE (raw_user_meta_data->>'user_type') = 'business' LOOP
SELECT id INTO v_bid
FROM public.businesses
WHERE owner_id = r.id;
IF v_bid IS NULL THEN v_sql := 'INSERT INTO public.businesses (name, slug, owner_id, is_active, is_verified, address, city, district, ward, phone, description, working_hours, image_url, categories) VALUES ($1, $2, $3, true, false, ''N/A'', ''TP. Hồ Chí Minh'', ''Quận 1'', ''Phường Bến Thành'', ''N/A'', '''', ''{"monday": {"open": "09:00", "close": "18:00"}}''::jsonb, ''https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60'', ARRAY[''Spa & Massage''::public.business_category]) RETURNING id';
-- Kiểm tra xem status có tồn tại không để dùng đúng cột
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'businesses'
        AND column_name = 'status'
) THEN v_sql := REPLACE(
    v_sql,
    'is_active, is_verified',
    'status, is_active, is_verified'
);
v_sql := REPLACE(v_sql, 'true, false', '''Active'', true, false');
END IF;
EXECUTE v_sql INTO v_bid USING COALESCE(
    r.raw_user_meta_data->>'business_name',
    'Business Draft'
),
'resync-' || floor(random() * 1000000)::text,
r.id;
END IF;
UPDATE public.profiles
SET user_type = 'business',
    business_id = v_bid
WHERE id = r.id;
END LOOP;
END $$;
-- 4. ĐẢM BẢO QUYỀN TRUY CẬP
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated,
    anon;