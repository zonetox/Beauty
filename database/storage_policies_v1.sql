-- ============================================
-- 1BEAUTY.ASIA - STORAGE POLICIES v1.0
-- ============================================
-- Supabase Storage Bucket Policies
-- Created: 2025-01-05
-- Version: 1.0
--
-- This file contains all storage bucket definitions and policies.
-- Policies enforce security at storage level per ARCHITECTURE.md principles.
-- ============================================

-- ============================================
-- BUCKET DEFINITIONS
-- ============================================

-- Note: Buckets are created via Supabase Dashboard or API.
-- This SQL script defines the policies only.
-- Bucket creation SQL is provided for reference but may need to be run via Dashboard.

-- Bucket: avatars
-- Purpose: User profile avatars
-- Path structure: /user/{user_id}/{filename}
-- Public: TRUE (public read, authenticated write)

-- Bucket: business-logos
-- Purpose: Business logos
-- Path structure: /business/{business_id}/{filename}
-- Public: TRUE (public read, owner/admin write)

-- Bucket: business-gallery
-- Purpose: Business gallery images and media
-- Path structure: /business/{business_id}/{filename}
-- Public: TRUE (public read, owner/admin write)

-- Bucket: blog-images
-- Purpose: Blog post images (platform and business blogs)
-- Path structure: /blog/{blog_post_id}/{filename}
-- Public: TRUE (public read, admin/business owner write)

-- ============================================
-- HELPER FUNCTIONS (reuse from RLS policies)
-- ============================================

-- Note: These functions are defined in rls_policies_v1.sql
-- They are referenced here but should already exist.
-- If running this script standalone, ensure these functions exist first.

-- Function: Check if user is an admin
-- CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)...
-- (Defined in rls_policies_v1.sql)

-- Function: Check if user is a business owner
-- CREATE OR REPLACE FUNCTION public.is_business_owner(user_id UUID, business_id_param BIGINT)...
-- (Defined in rls_policies_v1.sql)

-- Function: Get user email from auth.uid()
-- CREATE OR REPLACE FUNCTION public.get_user_email()...
-- (Defined in rls_policies_v1.sql)

-- Function: Extract business_id from storage path
-- Path format: /business/{business_id}/{filename}
CREATE OR REPLACE FUNCTION public.extract_business_id_from_path(path TEXT)
RETURNS BIGINT AS $$
BEGIN
  -- Extract business_id from path like '/business/123/filename.jpg'
  -- Returns NULL if path doesn't match pattern
  RETURN (
    SELECT (regexp_match(path, '^/business/(\d+)/'))[1]::BIGINT
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Extract user_id from storage path
-- Path format: /user/{user_id}/{filename}
CREATE OR REPLACE FUNCTION public.extract_user_id_from_path(path TEXT)
RETURNS UUID AS $$
BEGIN
  -- Extract user_id from path like '/user/550e8400-e29b-41d4-a716-446655440000/filename.jpg'
  -- Returns NULL if path doesn't match pattern
  RETURN (
    SELECT (regexp_match(path, '^/user/([a-f0-9-]{36})/'))[1]::UUID
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================

-- Drop all existing storage policies for our buckets
DO $$ 
DECLARE
    bucket_id TEXT;
    policy_name TEXT;
BEGIN
    FOR bucket_id IN SELECT id FROM storage.buckets WHERE id IN ('avatars', 'business-logos', 'business-gallery', 'blog-images')
    LOOP
        FOR policy_name IN (
            SELECT policyname FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND policyname LIKE '%' || bucket_id || '%'
        )
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================
-- Bucket: avatars
-- Path: /user/{user_id}/{filename}

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own_or_admin" ON storage.objects;

-- SELECT: Public can read all avatars (public assets)
CREATE POLICY "avatars_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT: Users can upload to their own folder only
CREATE POLICY "avatars_insert_own"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '/', 1) = 'user'
  AND split_part(name, '/', 2) = auth.uid()::TEXT
);

-- UPDATE: Users can update their own files, admins can update any
CREATE POLICY "avatars_update_own_or_admin"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    (split_part(name, '/', 1) = 'user'
    AND split_part(name, '/', 2) = auth.uid()::TEXT)
  )
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    (split_part(name, '/', 1) = 'user'
    AND split_part(name, '/', 2) = auth.uid()::TEXT)
  )
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Users can delete their own files, admins can delete any
CREATE POLICY "avatars_delete_own_or_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  )
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- BUSINESS-LOGOS BUCKET POLICIES
-- ============================================
-- Bucket: business-logos
-- Path: /business/{business_id}/{filename}

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "business_logos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "business_logos_insert_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "business_logos_update_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "business_logos_delete_owner_or_admin" ON storage.objects;

-- SELECT: Public can read all logos (public assets)
CREATE POLICY "business_logos_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-logos');

-- INSERT: Business owners can upload to their own business folder, admins can upload to any
CREATE POLICY "business_logos_insert_owner_or_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- UPDATE: Business owners can update their own files, admins can update any
CREATE POLICY "business_logos_update_owner_or_admin"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-logos'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
)
WITH CHECK (
  bucket_id = 'business-logos'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- DELETE: Business owners can delete their own files, admins can delete any
CREATE POLICY "business_logos_delete_owner_or_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-logos'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- ============================================
-- BUSINESS-GALLERY BUCKET POLICIES
-- ============================================
-- Bucket: business-gallery
-- Path: /business/{business_id}/{filename}

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "business_gallery_select_public" ON storage.objects;
DROP POLICY IF EXISTS "business_gallery_insert_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "business_gallery_update_owner_or_admin" ON storage.objects;
DROP POLICY IF EXISTS "business_gallery_delete_owner_or_admin" ON storage.objects;

-- SELECT: Public can read all gallery images (public assets)
CREATE POLICY "business_gallery_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-gallery');

-- INSERT: Business owners can upload to their own business folder, admins can upload to any
CREATE POLICY "business_gallery_insert_owner_or_admin"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-gallery'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- UPDATE: Business owners can update their own files, admins can update any
CREATE POLICY "business_gallery_update_owner_or_admin"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-gallery'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
)
WITH CHECK (
  bucket_id = 'business-gallery'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- DELETE: Business owners can delete their own files, admins can delete any
CREATE POLICY "business_gallery_delete_owner_or_admin"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-gallery'
  AND split_part(name, '/', 1) = 'business'
  AND (
    public.is_business_owner(auth.uid(), split_part(name, '/', 2)::BIGINT)
    OR public.is_admin(public.get_user_email())
  )
);

-- ============================================
-- BLOG-IMAGES BUCKET POLICIES
-- ============================================
-- Bucket: blog-images
-- Path: /blog/{blog_post_id}/{filename}
-- Note: blog_post_id can be platform blog (BIGINT) or business blog (UUID)

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "blog_images_select_public" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_insert_admin_or_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_update_admin_or_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "blog_images_delete_admin_or_authenticated" ON storage.objects;

-- SELECT: Public can read all blog images (public assets)
CREATE POLICY "blog_images_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'blog-images');

-- INSERT: Admins can upload to any folder, business owners can upload (for business blogs)
-- Note: Business owners can upload but path validation is handled at application level
-- RLS policies on business_blog_posts table enforce ownership
CREATE POLICY "blog_images_insert_admin_or_authenticated"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '/', 1) = 'blog'
  AND (
    public.is_admin(public.get_user_email())
    -- Business owners can upload (ownership verified at application level via business_blog_posts RLS)
    OR auth.uid() IS NOT NULL
  )
);

-- UPDATE: Admins can update any, business owners can update (ownership verified at app level)
CREATE POLICY "blog_images_update_admin_or_authenticated"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'blog-images'
  AND split_part(name, '/', 1) = 'blog'
  AND (
    public.is_admin(public.get_user_email())
    OR auth.uid() IS NOT NULL
  )
)
WITH CHECK (
  bucket_id = 'blog-images'
  AND split_part(name, '/', 1) = 'blog'
  AND (
    public.is_admin(public.get_user_email())
    OR auth.uid() IS NOT NULL
  )
);

-- DELETE: Admins can delete any, business owners can delete (ownership verified at app level)
CREATE POLICY "blog_images_delete_admin_or_authenticated"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'blog-images'
  AND split_part(name, '/', 1) = 'blog'
  AND (
    public.is_admin(public.get_user_email())
    OR auth.uid() IS NOT NULL
  )
);

-- ============================================
-- END OF STORAGE POLICIES v1.0
-- ============================================

-- ============================================
-- NOTES
-- ============================================
-- 1. Buckets must be created via Supabase Dashboard or API before policies can be applied
-- 2. All buckets are PUBLIC (public read access)
-- 3. Write access is restricted by policies (no public write)
-- 4. Path structure enforces organization: /business/{id}/, /user/{id}/, /blog/{id}/
-- 5. Helper functions from rls_policies_v1.sql must exist before running this script
-- 6. storage.foldername(name) returns array of folder names from path
-- 7. Policies use database-based role checking (no hardcode) per ARCHITECTURE.md

