-- ============================================
-- REDESIGN BUSINESS REGISTRATION (ATOMIC & TYPED)
-- ============================================
-- 1. ADD user_type TO PROFILES
-- ============================================
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_type'
) THEN
ALTER TABLE public.profiles
ADD COLUMN user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'business'));
END IF;
END $$;
-- Add index for performance on user_type
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
-- 2. UPDATE TRIGGER TO CAPTURE user_type
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public LANGUAGE plpgsql AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        email,
        user_type -- New field
    )
VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', NULL),
        COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
        COALESCE(new.email, NULL),
        COALESCE(new.raw_user_meta_data->>'user_type', 'user') -- Default to 'user' if missing
    ) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$;
-- 3. ATOMIC BUSINESS REGISTRATION FUNCTION
-- ============================================
DROP FUNCTION IF EXISTS public.register_business_atomic;
CREATE OR REPLACE FUNCTION public.register_business_atomic(
        p_email TEXT,
        p_password TEXT,
        p_full_name TEXT,
        p_business_name TEXT,
        p_phone TEXT,
        p_address TEXT,
        p_category TEXT,
        p_description TEXT DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_business_id BIGINT;
v_slug TEXT;
v_base_slug TEXT;
v_count INT;
v_category_enum public.business_category;
BEGIN -- 1. Generate Slug
v_base_slug := lower(
    regexp_replace(p_business_name, '[^a-zA-Z0-9]+', '-', 'g')
);
-- Remove leading/trailing dashes
v_base_slug := trim(
    both '-'
    from v_base_slug
);
-- Handle empty slug
IF length(v_base_slug) = 0 THEN v_base_slug := 'business';
END IF;
v_slug := v_base_slug;
v_count := 1;
-- Verify slug uniqueness
WHILE EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE slug = v_slug
) LOOP v_slug := v_base_slug || '-' || v_count;
v_count := v_count + 1;
END LOOP;
-- Cast category string to enum safely (fallback to Spa if invalid/mismatch)
BEGIN v_category_enum := p_category::public.business_category;
EXCEPTION
WHEN OTHERS THEN v_category_enum := 'Spa & Massage'::public.business_category;
END;
-- 2. Insert Business
INSERT INTO public.businesses (
        name,
        slug,
        phone,
        address,
        categories,
        -- array of enums
        description,
        status,
        is_verified,
        -- Required fields with defaults
        city,
        district,
        ward,
        working_hours
    )
VALUES (
        p_business_name,
        v_slug,
        p_phone,
        p_address,
        ARRAY [v_category_enum],
        -- Wrap in array
        p_description,
        'Active',
        FALSE,
        -- Defaults for now as form is simplified
        'Unknown',
        -- city
        'Unknown',
        -- district
        'Unknown',
        -- ward
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb
    )
RETURNING id INTO v_business_id;
-- 3. Return data
RETURN jsonb_build_object(
    'business_id',
    v_business_id,
    'slug',
    v_slug,
    'message',
    'Business created successfully'
);
END;
$$;