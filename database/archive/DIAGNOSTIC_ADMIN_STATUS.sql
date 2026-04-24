-- ============================================
-- DIAGNOSTIC: WHY IS REGISTRATION FAILING?
-- ============================================
-- Chạy script này để xem chính xác chuyện gì đang xảy ra với user 'phucnguyen@gmail.com'
-- 1. Kiểm tra Metadata trong Auth.Users (Dữ liệu gốc từ Frontend)
SELECT id,
    email,
    raw_user_meta_data->>'user_type' as meta_user_type,
    raw_user_meta_data->>'business_name' as meta_business_name,
    raw_user_meta_data
FROM auth.users
WHERE email = 'phucnguyen@gmail.com';
-- 2. Kiểm tra Profile (Dữ liệu đã qua Trigger)
SELECT id,
    full_name,
    user_type,
    business_id
FROM public.profiles
WHERE email = 'phucnguyen@gmail.com'
    OR id IN (
        SELECT id
        FROM auth.users
        WHERE email = 'phucnguyen@gmail.com'
    );
-- 3. Kiểm tra Business (Dữ liệu đích)
SELECT id,
    name,
    slug,
    owner_id
FROM public.businesses
WHERE owner_id IN (
        SELECT id
        FROM auth.users
        WHERE email = 'phucnguyen@gmail.com'
    );
-- 4. Kiểm tra RPC Response (Dữ liệu App nhận được)
-- Thay thế UUID bên dưới bằng ID lấy được từ câu 1
-- SELECT public.get_user_context('DÁN_ID_VÀO_ĐÂY');
-- ============================================
-- KẾT QUẢ DỰ ĐOÁN: 
-- Nếu câu 1 có user_type = 'business' nhưng câu 3 rỗng 
-- -> Trigger bị lỗi khi Insert Business.
-- ============================================