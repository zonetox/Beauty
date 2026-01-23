-- ============================================
-- FIX: get_user_context TYPE MISMATCH
-- ============================================
-- Sửa lỗi "operator does not exist: bigint = uuid"
-- Do so sánh admin_users.id (BIGINT) với p_user_id (UUID)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID) RETURNS JSONB SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_profile RECORD;
v_business_owner RECORD;
v_business_staff RECORD;
v_admin RECORD;
v_role TEXT := 'user';
v_business_id BIGINT := NULL;
v_permissions JSONB := '[]'::jsonb;
BEGIN -- A. Get Base Profile
SELECT * INTO v_profile
FROM public.profiles
WHERE id = p_user_id;
-- Nếu profile chưa tồn tại (vừa đăng ký xong, trigger đang chạy hoặc bị delay)
-- Chúng ta vẫn nên trả về context cơ bản thay vì NULL để tránh làm treo App
IF NOT FOUND THEN RETURN jsonb_build_object(
    'profile',
    null,
    'role',
    'anonymous',
    'businessId',
    null,
    'permissions',
    '[]'::jsonb,
    'isDataLoaded',
    FALSE,
    'error',
    'Profile not found yet'
);
END IF;
-- B. Check Admin (Sử dụng EMAIL thay vì ID vì admin_users.id là BIGINT)
-- Đây là nơi xảy ra lỗi type mismatch
SELECT role INTO v_admin
FROM public.admin_users
WHERE email = v_profile.email
    AND is_locked = FALSE;
IF FOUND THEN v_role := 'admin';
v_permissions := '["all"]'::jsonb;
ELSE -- C. Check Business Owner
-- Verify ownership
SELECT id INTO v_business_owner
FROM public.businesses
WHERE owner_id = p_user_id
LIMIT 1;
IF FOUND THEN v_role := 'business_owner';
v_business_id := v_business_owner.id;
ELSE -- D. Check Business Staff
SELECT business_id,
    role INTO v_business_staff
FROM public.business_staff
WHERE user_id = p_user_id
LIMIT 1;
IF FOUND THEN v_role := 'business_staff';
v_business_id := v_business_staff.business_id;
END IF;
END IF;
END IF;
-- E. Compile Final Context
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
-- RE-GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO anon;