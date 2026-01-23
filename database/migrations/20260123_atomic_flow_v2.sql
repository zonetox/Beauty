-- ============================================
-- ATOMIC BUSINESS REGISTRATION TRIGGER (V2)
-- ============================================
-- 1. ENHANCED HANDLE NEW USER TRIGGER
-- This trigger handles BOTH regular users and business owners in ONE transaction.
-- It reads metadata passed during signup and creates all necessary records.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public LANGUAGE plpgsql AS $$
DECLARE v_user_type TEXT;
v_business_name TEXT;
v_business_phone TEXT;
v_business_address TEXT;
v_business_category TEXT;
v_description TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_base_slug TEXT;
v_count INT;
v_category_enum public.business_category;
BEGIN -- 1. Determine User Type
v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- 2. Insert Base Profile
INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        email,
        user_type
    )
VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', NULL),
        COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
        COALESCE(new.email, NULL),
        v_user_type
    ) ON CONFLICT (id) DO NOTHING;
-- 3. If Business Owner, Create Business Record Immediately
IF v_user_type = 'business' THEN v_business_name := new.raw_user_meta_data->>'business_name';
v_business_phone := new.raw_user_meta_data->>'phone';
v_business_address := new.raw_user_meta_data->>'address';
v_business_category := new.raw_user_meta_data->>'category';
v_description := new.raw_user_meta_data->>'description';
IF v_business_name IS NOT NULL THEN -- A. Generate Slug
v_base_slug := lower(
    regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g')
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
-- B. Safe Category Cast
BEGIN v_category_enum := v_business_category::public.business_category;
EXCEPTION
WHEN OTHERS THEN v_category_enum := 'Spa & Massage'::public.business_category;
END;
-- C. Create Business
INSERT INTO public.businesses (
        name,
        slug,
        phone,
        address,
        categories,
        description,
        status,
        is_verified,
        owner_id,
        city,
        district,
        ward,
        -- Defaults
        working_hours
    )
VALUES (
        v_business_name,
        v_slug,
        v_business_phone,
        v_business_address,
        ARRAY [v_category_enum],
        v_description,
        'Active',
        FALSE,
        new.id,
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        -- Default Vietnamese data
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb
    )
RETURNING id INTO v_business_id;
-- D. Update Profile with business_id
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
END IF;
RETURN new;
END;
$$;