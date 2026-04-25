-- UPGRADE: get_user_context v1.2 (Concurrent Roles Support)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID) RETURNS JSONB SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_profile RECORD;
v_business_id BIGINT;
v_role TEXT := 'user';
v_permissions JSONB := '[]'::jsonb;
v_is_admin BOOLEAN := FALSE;
BEGIN -- 1. Lấy Profile (Nguồn định danh cơ bản)
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
-- 2. Kiểm tra quyền Admin (Sử dụng Email)
IF EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE email = v_profile.email
        AND is_locked = FALSE
) THEN v_role := 'admin';
v_is_admin := TRUE;
v_permissions := '["all"]'::jsonb;
END IF;
-- 3. KIỂM TRA DOANH NGHIỆP (KHÔNG DÙNG ELSE - KIỂM TRA ĐỘC LẬP)
-- Check Owner
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = p_user_id
LIMIT 1;
-- Check Staff (nếu không phải Owner)
IF v_business_id IS NULL THEN
SELECT business_id INTO v_business_id
FROM public.business_staff
WHERE user_id = p_user_id
LIMIT 1;
-- Nếu là Staff và không phải Admin, set role thành staff
IF v_business_id IS NOT NULL
AND NOT v_is_admin THEN v_role := 'business_staff';
END IF;
ELSE -- Nếu là Owner và không phải Admin, set role thành owner
IF NOT v_is_admin THEN v_role := 'business_owner';
END IF;
END IF;
-- 4. Đồng bộ ngược lại bảng Profiles nếu cần
IF v_business_id IS NOT NULL
AND (
    v_profile.user_type != 'business'
    OR v_profile.business_id IS NULL
) THEN
UPDATE public.profiles
SET user_type = 'business',
    business_id = v_business_id
WHERE id = p_user_id;
END IF;
-- 5. TRẢ VỀ CONTEXT ĐẦY ĐỦ
RETURN jsonb_build_object(
    'profile',
    to_jsonb(v_profile),
    'role',
    v_role,
    'businessId',
    v_business_id,
    'permissions',
    v_permissions,
    'is_admin',
    v_is_admin,
    'isDataLoaded',
    TRUE
);
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO anon;