-- ============================================
-- FUNDAMENTAL REGISTRATION FIX (Resilient & Atomic)
-- ============================================
-- Đây là giải pháp "Căn cơ" để đảm bảo Signup luôn thành công
-- và lỗi được ghi vết chi tiết (Deep Diagnostics).
-- 1. TẠO BẢNG GHI LỖI HỆ THỐNG (CENTRALIZED LOGGING)
CREATE TABLE IF NOT EXISTS public.registration_errors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    error_message TEXT,
    error_detail TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Index cho việc giám sát
CREATE INDEX IF NOT EXISTS idx_reg_errors_user_id ON public.registration_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_errors_created_at ON public.registration_errors(created_at DESC);
-- RLS: Chỉ Admin mới xem được lỗi hệ thống
ALTER TABLE public.registration_errors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "registration_errors_admin_select" ON public.registration_errors;
CREATE POLICY "registration_errors_admin_select" ON public.registration_errors FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.admin_users
            WHERE email = (
                    SELECT email
                    FROM auth.users
                    WHERE id = auth.uid()
                )
        )
    );
-- 2. ĐẢM BẢO SCHEMA PROFILES ĐỦ CỘT
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'user_type'
) THEN
ALTER TABLE public.profiles
ADD COLUMN user_type TEXT DEFAULT 'user';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'setup_incomplete'
) THEN
ALTER TABLE public.profiles
ADD COLUMN setup_incomplete BOOLEAN DEFAULT FALSE;
END IF;
END $$;
-- 3. CƠ CHẾ TRIGGER ĐA TẦNG (ATOMIC-RESILIENCE)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_base_slug TEXT;
v_count INT;
v_category_enum public.business_category;
BEGIN -- LẤY USER TYPE TỪ METADATA
v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- TẦNG 1: TẠO PROFILE (BẮT BUỘC & TIN CẬY)
-- Giai đoạn này phải thành công để user có danh tính trong app
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
-- TẦNG 2: TẠO DOANH NGHIỆP (BEST EFFORT & CÔ LẬP LỖI)
IF v_user_type = 'business'
AND new.raw_user_meta_data->>'business_name' IS NOT NULL THEN BEGIN -- 2a. Generate Slug an toàn (tự động tăng số nếu trùng)
v_base_slug := lower(
    regexp_replace(
        new.raw_user_meta_data->>'business_name',
        '[^a-zA-Z0-9]+',
        '-',
        'g'
    )
);
v_base_slug := trim(
    both '-'
    from v_base_slug
);
IF length(v_base_slug) = 0 THEN v_base_slug := 'business';
END IF;
v_slug := v_base_slug;
v_count := 1;
WHILE EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE slug = v_slug
) LOOP v_slug := v_base_slug || '-' || v_count;
v_count := v_count + 1;
END LOOP;
-- 2b. Cast Category an toàn
BEGIN v_category_enum := (new.raw_user_meta_data->>'category')::public.business_category;
EXCEPTION
WHEN OTHERS THEN v_category_enum := 'Spa & Massage'::public.business_category;
END;
-- 2c. INSERT BUSINESS VỚI SMART DEFAULTS
INSERT INTO public.businesses (
        name,
        slug,
        phone,
        address,
        categories,
        description,
        status,
        owner_id,
        city,
        district,
        ward,
        image_url,
        working_hours
    )
VALUES (
        new.raw_user_meta_data->>'business_name',
        v_slug,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'address',
        ARRAY [v_category_enum],
        COALESCE(new.raw_user_meta_data->>'description', ''),
        'Active',
        new.id,
        'TP. Hồ Chí Minh',
        -- Default City
        'Quận 1',
        -- Default District
        'Phường Bến Thành',
        -- Default Ward
        COALESCE(
            new.raw_user_meta_data->>'image_url',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60'
        ),
        '{"monday": {"open": "09:00", "close": "21:00"}, "tuesday": {"open": "09:00", "close": "21:00"}, "wednesday": {"open": "09:00", "close": "21:00"}, "thursday": {"open": "09:00", "close": "21:00"}, "friday": {"open": "09:00", "close": "21:00"}, "saturday": {"open": "09:00", "close": "21:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb
    )
RETURNING id INTO v_business_id;
-- LINK BACK TO PROFILE
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
EXCEPTION
WHEN OTHERS THEN -- GHI LỖI VÀO BẢNG DIAGNOSTICS THAY VÌ LÀM TREO ĐĂNG KÝ
INSERT INTO public.registration_errors (
        user_id,
        full_name,
        email,
        error_message,
        error_detail,
        metadata
    )
VALUES (
        new.id,
        new.raw_user_meta_data->>'business_name',
        new.email,
        'Business Creation Failed',
        SQLERRM,
        new.raw_user_meta_data
    );
-- Đánh dấu Profile là chưa hoàn tất để App hướng dẫn sau
UPDATE public.profiles
SET setup_incomplete = TRUE
WHERE id = new.id;
END;
END IF;
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- 4. CLEANUP OLD TRIGGERS & ATTACH NEW ONE
-- Đảm bảo chỉ có DUY NHẤT một trigger hoạt động
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 5. TRUY VẤN KIỂM TRA (Dành cho Dev)
-- SELECT * FROM public.registration_errors ORDER BY created_at DESC LIMIT 10;