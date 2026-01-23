-- ============================================
-- FINAL INDUSTRIAL AUTH SETUP
-- ============================================
-- 1. UNIFIED USER CONTEXT FUNCTION
-- This is the "Industry Standard" way to get all user data in ONE request.
-- Replaces multiple fragmented queries in frontend.
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
IF NOT FOUND THEN RETURN NULL;
-- Mandatory Profile missing
END IF;
-- B. Check Admin (Highest Priority)
SELECT role INTO v_admin
FROM public.admin_users
WHERE id = p_user_id;
IF FOUND THEN v_role := 'admin';
v_permissions := '["all"]'::jsonb;
-- Simple admin permission
ELSE -- C. Check Business Owner
-- Use the business_id stored in profile as primary link, but verify ownership
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
-- Update profile user_type if it doesn't match resolved role for consistency
IF v_role = 'business_owner'
AND v_profile.user_type != 'business' THEN
UPDATE public.profiles
SET user_type = 'business'
WHERE id = p_user_id;
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
-- 2. ROBUST ATOMIC TRIGGER (Standard Transactional Integrity)
-- Ensures that when an Auth user is created, Profile and Business (if applicable) exist instantly.
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
        working_hours
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
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb
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