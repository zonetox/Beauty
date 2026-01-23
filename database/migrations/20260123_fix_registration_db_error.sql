-- ============================================
-- FIX: Registration Database Error
-- ============================================
-- Root Cause: image_url is NOT NULL in public.businesses but was missing from triggers.
-- 1. Make image_url nullable or set a default
ALTER TABLE public.businesses
ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.businesses
ALTER COLUMN image_url
SET DEFAULT 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60';
-- 2. Update the INDUSTRIAL trigger to be safer
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_name TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_base_slug TEXT;
v_count INT;
v_category_enum public.business_category;
BEGIN v_user_type := COALESCE(new.raw_user_meta_data->>'user_type', 'user');
-- A. Insert Profile
INSERT INTO public.profiles (id, full_name, avatar_url, email, user_type)
VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url',
        new.email,
        v_user_type
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
-- B. Handle Business Creation
IF v_user_type = 'business'
AND new.raw_user_meta_data->>'business_name' IS NOT NULL THEN -- Generate Slug
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
-- Category
BEGIN v_category_enum := (new.raw_user_meta_data->>'category')::public.business_category;
EXCEPTION
WHEN OTHERS THEN v_category_enum := 'Spa & Massage'::public.business_category;
END;
-- Create Business
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
        working_hours,
        image_url -- ADDED FIX
    )
VALUES (
        new.raw_user_meta_data->>'business_name',
        v_slug,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'address',
        ARRAY [v_category_enum],
        new.raw_user_meta_data->>'description',
        'Active',
        FALSE,
        new.id,
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb,
        COALESCE(
            new.raw_user_meta_data->>'image_url',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60'
        ) -- ADDED FIX
    )
RETURNING id INTO v_business_id;
-- Link back to profile
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
RETURN new;
END;
$$ LANGUAGE plpgsql;