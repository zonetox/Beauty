-- ============================================
-- Fix Security Warnings
-- Tuân thủ Master Plan v1.1
-- Date: 2025-01-08
-- ============================================
-- Fixes:
-- 1. Remove SECURITY DEFINER from views
-- 2. Add search_path to functions
-- 3. Fix permissive RLS policies
-- ============================================

-- ============================================
-- 1. FIX VIEWS - Remove SECURITY DEFINER
-- ============================================

-- Recreate v_slow_queries without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_slow_queries CASCADE;
CREATE VIEW public.v_slow_queries
WITH (security_invoker=true)
AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Recreate v_index_usage without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_index_usage CASCADE;
CREATE VIEW public.v_index_usage
WITH (security_invoker=true)
AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Recreate v_unused_indexes without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_unused_indexes CASCADE;
CREATE VIEW public.v_unused_indexes
WITH (security_invoker=true)
AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- 2. FIX FUNCTIONS - Add search_path
-- ============================================

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

-- Fix extract_business_id_from_path
CREATE OR REPLACE FUNCTION public.extract_business_id_from_path(path TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Extract business_id from path like '/business/123/filename.jpg'
    -- Returns NULL if path doesn't match pattern
    RETURN (
        SELECT (regexp_match(path, '^/business/(\d+)/'))[1]::BIGINT
    );
END;
$$;

-- Fix extract_user_id_from_path
CREATE OR REPLACE FUNCTION public.extract_user_id_from_path(path TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Extract user_id from path like '/user/550e8400-e29b-41d4-a716-446655440000/filename.jpg'
    -- Returns NULL if path doesn't match pattern
    RETURN (
        SELECT (regexp_match(path, '^/user/([a-f0-9-]{36})/'))[1]::UUID
    );
END;
$$;

-- Fix search_businesses
CREATE OR REPLACE FUNCTION public.search_businesses(search_query TEXT)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    slug TEXT,
    rating DOUBLE PRECISION,
    review_count INTEGER,
    city TEXT,
    district TEXT,
    categories TEXT[],
    rank REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.slug,
        b.rating,
        b.review_count,
        b.city,
        b.district,
        b.categories,
        ts_rank(
            to_tsvector('english', 
                COALESCE(b.name, '') || ' ' || 
                COALESCE(b.description, '') || ' ' ||
                COALESCE(b.address, '') || ' ' ||
                COALESCE(array_to_string(b.tags, ' '), '')
            ),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM public.businesses b
    WHERE b.is_active = TRUE
    AND (
        to_tsvector('english', 
            COALESCE(b.name, '') || ' ' || 
            COALESCE(b.description, '') || ' ' ||
            COALESCE(b.address, '') || ' ' ||
            COALESCE(array_to_string(b.tags, ' '), '')
        ) @@ plainto_tsquery('english', search_query)
        OR b.name ILIKE '%' || search_query || '%'
        OR b.city ILIKE '%' || search_query || '%'
        OR b.district ILIKE '%' || search_query || '%'
    )
    ORDER BY rank DESC, b.rating DESC, b.review_count DESC
    LIMIT 50;
END;
$$;

-- Fix search_blog_posts
CREATE OR REPLACE FUNCTION public.search_blog_posts(search_query TEXT)
RETURNS TABLE (
    id BIGINT,
    slug TEXT,
    title TEXT,
    excerpt TEXT,
    category TEXT,
    date TIMESTAMPTZ,
    rank REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.slug,
        bp.title,
        bp.excerpt,
        bp.category,
        bp.date,
        ts_rank(
            to_tsvector('english', 
                COALESCE(bp.title, '') || ' ' || 
                COALESCE(bp.content, '') || ' ' ||
                COALESCE(bp.excerpt, '')
            ),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM public.blog_posts bp
    WHERE (
        to_tsvector('english', 
            COALESCE(bp.title, '') || ' ' || 
            COALESCE(bp.content, '') || ' ' ||
            COALESCE(bp.excerpt, '')
        ) @@ plainto_tsquery('english', search_query)
        OR bp.title ILIKE '%' || search_query || '%'
        OR bp.category ILIKE '%' || search_query || '%'
    )
    ORDER BY rank DESC, bp.date DESC
    LIMIT 50;
END;
$$;

-- Fix get_business_count
CREATE OR REPLACE FUNCTION public.get_business_count(
    p_category TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE is_active = TRUE
      AND (p_category IS NULL OR p_category = ANY(categories))
      AND (p_city IS NULL OR city = p_city)
      AND (p_district IS NULL OR district = p_district);
    
    RETURN v_count;
END;
$$;

-- Fix handle_new_user (trigger function)
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

-- ============================================
-- 3. FIX PERMISSIVE RLS POLICIES
-- ============================================

-- Fix appointments_insert_public_or_admin
DROP POLICY IF EXISTS appointments_insert_public_or_admin ON public.appointments;
CREATE POLICY appointments_insert_public_or_admin ON public.appointments
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow public to create appointments for active businesses only
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id
            AND is_active = TRUE
        )
        OR is_admin()
    );

-- Fix notifications Update policy
DROP POLICY IF EXISTS "Update notifications" ON public.notifications;
CREATE POLICY "Update notifications" ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can only update their own notifications
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Fix orders Public/Users create orders
DROP POLICY IF EXISTS "Public/Users create orders" ON public.orders;
CREATE POLICY "Public/Users create orders" ON public.orders
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow public to create orders for active businesses only
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id
            AND is_active = TRUE
        )
        OR is_admin()
    );

-- Fix orders_insert_public_or_admin
DROP POLICY IF EXISTS orders_insert_public_or_admin ON public.orders;
CREATE POLICY orders_insert_public_or_admin ON public.orders
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow public to create orders for active businesses only
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE id = business_id
            AND is_active = TRUE
        )
        OR is_admin()
    );

-- Fix registration_requests Public can create registration requests
DROP POLICY IF EXISTS "Public can create registration requests" ON public.registration_requests;
CREATE POLICY "Public can create registration requests" ON public.registration_requests
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow public to create registration requests
        -- But validate email format
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND business_name IS NOT NULL
        AND business_name != ''
        AND phone IS NOT NULL
        AND phone != ''
    );

-- Fix registration_requests_insert_public
DROP POLICY IF EXISTS registration_requests_insert_public ON public.registration_requests;
CREATE POLICY registration_requests_insert_public ON public.registration_requests
    FOR INSERT
    TO public
    WITH CHECK (
        -- Allow public to create registration requests
        -- But validate email format
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND business_name IS NOT NULL
        AND business_name != ''
        AND phone IS NOT NULL
        AND phone != ''
    );

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

-- Grant execute on updated functions
GRANT EXECUTE ON FUNCTION public.increment_business_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.increment_business_blog_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_blog_view_count TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_businesses TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_businesses TO anon;
GRANT EXECUTE ON FUNCTION public.search_blog_posts TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_blog_posts TO anon;
GRANT EXECUTE ON FUNCTION public.get_business_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_count TO anon;

-- Grant select on views
GRANT SELECT ON public.v_slow_queries TO authenticated;
GRANT SELECT ON public.v_index_usage TO authenticated;
GRANT SELECT ON public.v_unused_indexes TO authenticated;
