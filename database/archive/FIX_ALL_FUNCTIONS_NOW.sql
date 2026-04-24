-- FIX TẤT CẢ FUNCTIONS THIẾU search_path
-- Chạy ngay trong SQL Editor

-- Fix get_my_business_id
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id BIGINT;
BEGIN
    SELECT business_id INTO v_business_id
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_business_id;
END;
$$;

-- Fix get_user_email
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = auth.uid();
    RETURN v_email;
END;
$$;

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Fix increment_blog_view_count
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(p_post_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
$$;

-- Fix increment_business_blog_view_count
CREATE OR REPLACE FUNCTION public.increment_business_blog_view_count(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.business_blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
$$;

-- Fix increment_business_view_count
CREATE OR REPLACE FUNCTION public.increment_business_view_count(p_business_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.businesses
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_business_id;
END;
$$;

-- Fix increment_view_count (nếu có 2 versions, fix cả 2)
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name TEXT, p_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_table_name = 'businesses' THEN
        UPDATE public.businesses
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    ELSIF p_table_name = 'blog_posts' THEN
        UPDATE public.blog_posts
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = p_id;
    END IF;
END;
$$;

-- Fix is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND is_locked = FALSE
    ) INTO v_is_admin;
    RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

-- Fix is_business_owner
CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_owner BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = p_business_id
        AND owner_id = auth.uid()
    ) INTO v_is_owner;
    RETURN COALESCE(v_is_owner, FALSE);
END;
$$;

-- Fix update_business_ratings
CREATE OR REPLACE FUNCTION public.update_business_ratings(p_business_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_avg_rating DOUBLE PRECISION;
    v_review_count INTEGER;
BEGIN
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM public.reviews
    WHERE business_id = p_business_id
    AND status = 'approved';
    
    UPDATE public.businesses
    SET 
        rating = v_avg_rating,
        review_count = v_review_count
    WHERE id = p_business_id;
END;
$$;

-- XÓA TẤT CẢ USERS
DELETE FROM public.profiles;
DELETE FROM public.admin_users;
DELETE FROM auth.users;

-- VERIFY
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count,
    (SELECT COUNT(*) FROM public.admin_users) as admin_users_count;
