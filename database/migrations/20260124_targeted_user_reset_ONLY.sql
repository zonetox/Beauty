-- ============================================
-- TARGETED USER RESET: tanloifmc@yahoo.com
-- ============================================
-- CHỈ XÓA duy nhất người dùng này để bạn có thể đăng ký lại.
-- KHÔNG ảnh hưởng đến các doanh nghiệp demo của người khác.
DO $$
DECLARE v_user_id UUID;
BEGIN -- 1. Tìm ID của user dựa trên email
SELECT id INTO v_user_id
FROM auth.users
WHERE email = 'tanloifmc@yahoo.com';
IF v_user_id IS NOT NULL THEN -- 2. Xóa các dữ liệu phụ thuộc của RIÊNG user này
DELETE FROM public.business_staff
WHERE user_id = v_user_id;
DELETE FROM public.reviews
WHERE user_id = v_user_id;
DELETE FROM public.appointments
WHERE customer_email = 'tanloifmc@yahoo.com';
-- 3. Xóa Doanh nghiệp của RIÊNG user này (nếu có)
-- Chú ý: Doanh nghiệp do bạn tạo ra sẽ bị xóa để sạch dữ liệu
DELETE FROM public.businesses
WHERE owner_id = v_user_id;
-- 4. Xóa Profile
DELETE FROM public.profiles
WHERE id = v_user_id;
DELETE FROM public.admin_users
WHERE email = 'tanloifmc@yahoo.com';
-- 5. XÓA KHỎI BẢNG NGẦM AUTH (Quan trọng nhất)
DELETE FROM auth.users
WHERE id = v_user_id;
RAISE NOTICE 'Đã xóa sạch dữ liệu liên quan đến tanloifmc@yahoo.com. Bạn có thể đăng ký lại ngay bây giờ.';
ELSE RAISE NOTICE 'Không tìm thấy user với email tanloifmc@yahoo.com trong hệ thống Auth.';
END IF;
END $$;