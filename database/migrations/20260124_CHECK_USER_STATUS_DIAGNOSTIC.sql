-- ============================================
-- DIAGNOSTIC SCRIPT: CHECK USER STATUS
-- ============================================
-- Chạy script này để biết TẠI SAO tài khoản của bạn bị nhận nhầm là User.
-- Thay đổi email bên dưới nếu cần.
DO $$
DECLARE v_email TEXT := 'lan1@gmail.com';
-- THAY EMAIL CẦN KIỂM TRA TẠI ĐÂY
v_user_id UUID;
v_profile_exists BOOLEAN;
v_business_exists BOOLEAN;
v_user_type TEXT;
v_business_id BIGINT;
v_error_log TEXT;
BEGIN -- 1. Check Auth.Users
SELECT id INTO v_user_id
FROM auth.users
WHERE email = v_email;
IF v_user_id IS NULL THEN RAISE NOTICE '❌ 1. Auth: Email % CHƯA tồn tại trong bảng ngầm auth.users.',
v_email;
ELSE RAISE NOTICE '✅ 1. Auth: User ID là %',
v_user_id;
-- 2. Check Profiles
SELECT EXISTS(
        SELECT 1
        FROM public.profiles
        WHERE id = v_user_id
    ) INTO v_profile_exists;
IF v_profile_exists THEN
SELECT user_type,
    business_id INTO v_user_type,
    v_business_id
FROM public.profiles
WHERE id = v_user_id;
RAISE NOTICE '✅ 2. Profile: Đã tồn tại. user_type = %, business_id = %',
v_user_type,
v_business_id;
ELSE RAISE NOTICE '❌ 2. Profile: CHƯA được tạo cho user này.';
END IF;
-- 3. Check Businesses
SELECT EXISTS(
        SELECT 1
        FROM public.businesses
        WHERE owner_id = v_user_id
    ) INTO v_business_exists;
IF v_business_exists THEN
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = v_user_id
LIMIT 1;
RAISE NOTICE '✅ 3. Business: Đã tồn tại. Business ID = %', v_business_id;
ELSE RAISE NOTICE '❌ 3. Business: CHƯA được tạo cho user này.';
END IF;
-- 4. Check Registration Errors
SELECT error_detail INTO v_error_log
FROM public.registration_errors
WHERE user_id = v_user_id
    OR email = v_email
ORDER BY created_at DESC
LIMIT 1;
IF v_error_log IS NOT NULL THEN RAISE NOTICE '❗ 4. Lỗi Trigger: Tìm thấy lỗi khi đăng ký: %',
v_error_log;
ELSE RAISE NOTICE '✅ 4. Trigger: Không tìm thấy lỗi ghi nhận trong bảng registration_errors.';
END IF;
-- 5. Test RPC Resolve
RAISE NOTICE '🔍 5. Kiểm tra RPC get_user_context: %',
(
    SELECT public.get_user_context(v_user_id)
);
END IF;
END $$;