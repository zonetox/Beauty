-- ============================================
-- MASTER FIX & DIAGNOSTICS: Registration Error
-- ============================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- 1. FIX SCHEMA DISCREPANCIES (PROFILES)
DO $$ BEGIN -- Add user_type to profiles if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_type'
) THEN
ALTER TABLE public.profiles
ADD COLUMN user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'business'));
END IF;
-- Add business_id to profiles if missing (should exist, but let's be safe)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'business_id'
) THEN
ALTER TABLE public.profiles
ADD COLUMN business_id BIGINT REFERENCES public.businesses(id);
END IF;
END $$;
-- 2. FIX SCHEMA DISCREPANCIES (BUSINESSES)
DO $$ BEGIN -- image_url: Drop NOT NULL and set a default
ALTER TABLE public.businesses
ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE public.businesses
ALTER COLUMN image_url
SET DEFAULT 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60';
-- Ensure other mandatory fields have defaults if possible
ALTER TABLE public.businesses
ALTER COLUMN city
SET DEFAULT 'TP. Hồ Chí Minh';
ALTER TABLE public.businesses
ALTER COLUMN district
SET DEFAULT 'Quận 1';
ALTER TABLE public.businesses
ALTER COLUMN ward
SET DEFAULT 'Phường Bến Thành';
ALTER TABLE public.businesses
ALTER COLUMN description
SET DEFAULT '';
ALTER TABLE public.businesses
ALTER COLUMN working_hours
SET DEFAULT '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "18:00"}, "sunday": {"open": "Closed", "close": "Closed"}}'::jsonb;
END $$;
-- 3. REINSTALL INDUSTRIAL TRIGGER (WITH DEBUG LOGGING)
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
-- Safe Category Cast
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
        image_url
    )
VALUES (
        new.raw_user_meta_data->>'business_name',
        v_slug,
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'address',
        ARRAY [v_category_enum],
        COALESCE(new.raw_user_meta_data->>'description', ''),
        'Active',
        FALSE,
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'image_url',
            'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60'
        )
    )
RETURNING id INTO v_business_id;
-- Link back to profile
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
END IF;
RETURN new;
EXCEPTION
WHEN OTHERS THEN -- Capture error details in Postgres logs
RAISE LOG 'Error in handle_new_user trigger: % (%)',
SQLERRM,
SQLSTATE;
-- Re-throw the error so Supabase Auth stops the transaction
RAISE EXCEPTION 'DATABASE_TRIGGER_ERROR: %',
SQLERRM;
END;
$$ LANGUAGE plpgsql;
-- 4. RE-ENFORCE TRIGGER ATTACHMENT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 5. FINAL HEALTH CHECK (Results visible in Supabase)
SELECT (
        SELECT count(*)
        FROM information_schema.columns
        WHERE table_name = 'profiles'
            AND column_name = 'user_type'
    ) as has_user_type_column,
    (
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'businesses'
            AND column_name = 'image_url'
    ) as image_url_is_nullable,
    (
        SELECT count(*)
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) as trigger_exists;