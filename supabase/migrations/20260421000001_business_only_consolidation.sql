-- ============================================
-- 1BEAUTY.ASIA - BUSINESS-ONLY CONSOLIDATION
-- ============================================
-- This migration removes the 'user' account type default
-- and forces all new signups to be handled as Businesses.
-- ============================================
-- 1. Update profiles table default to 'business'
ALTER TABLE public.profiles
ALTER COLUMN user_type
SET DEFAULT 'business';
-- 2. Migrate any existing regular users to business type (if any)
UPDATE public.profiles
SET user_type = 'business'
WHERE user_type = 'user';
-- 3. Hardened Trigger Function for Automatic Business Creation
-- This ensures that EVERY signup creates a business record.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_user_type TEXT;
v_business_id BIGINT;
v_slug TEXT;
v_business_name TEXT;
BEGIN -- FORCE all new signups to business type
v_user_type := 'business';
v_business_name := COALESCE(
    new.raw_user_meta_data->>'business_name',
    'Cửa hàng của ' || COALESCE(new.raw_user_meta_data->>'full_name', 'đối tác')
);
-- Create or Update Profile
INSERT INTO public.profiles (id, full_name, avatar_url, email, user_type)
VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'business_name',
            'Chủ doanh nghiệp'
        ),
        new.raw_user_meta_data->>'avatar_url',
        new.email,
        v_user_type
    ) ON CONFLICT (id) DO
UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type;
-- ALWAYS attempt to create a business record for new owners
SELECT id INTO v_business_id
FROM public.businesses
WHERE owner_id = new.id
LIMIT 1;
IF v_business_id IS NULL THEN -- Generate simple slug
v_slug := lower(
    regexp_replace(
        v_business_name,
        '[^a-zA-Z0-9]+',
        '-',
        'g'
    )
) || '-' || floor(random() * 1000)::text;
INSERT INTO public.businesses (
        name,
        slug,
        owner_id,
        is_active,
        is_verified,
        address,
        city,
        district,
        ward,
        phone,
        description,
        working_hours,
        image_url,
        categories
    )
VALUES (
        v_business_name,
        v_slug,
        new.id,
        true,
        false,
        COALESCE(
            new.raw_user_meta_data->>'address',
            'Chưa cập nhật'
        ),
        'TP. Hồ Chí Minh',
        'Quận 1',
        'Phường Bến Thành',
        COALESCE(new.raw_user_meta_data->>'phone', 'N/A'),
        COALESCE(
            new.raw_user_meta_data->>'description',
            'Doanh nghiệp mới đăng ký trên 1Beauty.asia'
        ),
        '{"monday": {"open": "09:00", "close": "18:00"}}'::jsonb,
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
        ARRAY ['Spa & Massage'::public.business_category]
    )
RETURNING id INTO v_business_id;
END IF;
-- Link profile to the new business
UPDATE public.profiles
SET business_id = v_business_id
WHERE id = new.id;
RETURN new;
END;
$$ LANGUAGE plpgsql;
-- 4. Re-apply trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();