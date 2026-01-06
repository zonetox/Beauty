-- ============================================
-- C3.7 - Blog Management Verification Script
-- ============================================
-- Purpose: Verify Business Blog CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.7 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if business_blog_posts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_blog_posts') THEN
        RAISE EXCEPTION '❌ FAIL: business_blog_posts table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: business_blog_posts table exists';
    END IF;
END $$;

-- Check required columns
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('business_id'), ('slug'), ('title'), ('excerpt'), 
            ('image_url'), ('content'), ('author'), ('created_date'), 
            ('published_date'), ('status'), ('view_count'), ('is_featured'), ('seo')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'business_blog_posts'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist';
    END IF;
END $$;

-- Check foreign key to businesses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'business_blog_posts'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check unique constraint (business_id, slug)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'business_blog_posts'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%slug%'
    ) THEN
        RAISE WARNING '⚠️  WARNING: Unique constraint on (business_id, slug) may not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Unique constraint on (business_id, slug) exists';
    END IF;
END $$;

-- Check business_blog_post_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'business_blog_post_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: business_blog_post_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: business_blog_post_status enum exists';
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'business_blog_posts'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on business_blog_posts table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on business_blog_posts table';
    END IF;
END $$;

-- Check required RLS policies
DO $$
DECLARE
    missing_policies TEXT[];
    policy_record RECORD;
BEGIN
    missing_policies := ARRAY[]::TEXT[];
    
    FOR policy_record IN
        SELECT policy_name::TEXT
        FROM (
            VALUES 
                ('business_blog_posts_select_public_published_or_owner_or_admin'),
                ('business_blog_posts_insert_owner_or_admin'),
                ('business_blog_posts_update_owner_or_admin'),
                ('business_blog_posts_delete_owner_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'business_blog_posts'
            AND policy_name = required.policy_name
        )
    LOOP
        missing_policies := array_append(missing_policies, policy_record.policy_name);
    END LOOP;

    IF array_length(missing_policies, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing RLS policies: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required RLS policies exist';
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for blog posts with invalid business_id (orphaned posts)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM business_blog_posts bbp
    LEFT JOIN businesses b ON bbp.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned blog posts (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned blog posts found';
    END IF;
END $$;

-- Check for blog posts with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM business_blog_posts
    WHERE title IS NULL OR title = ''
       OR slug IS NULL OR slug = ''
       OR business_id IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % blog posts with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All blog posts have required fields';
    END IF;
END $$;

-- Check for blog posts with invalid status values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM business_blog_posts
    WHERE status NOT IN ('Draft', 'Published');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % blog posts with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All blog posts have valid status values';
    END IF;
END $$;

-- Check for duplicate slugs within same business
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT business_id, slug, COUNT(*) as cnt
        FROM business_blog_posts
        GROUP BY business_id, slug
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % duplicate slugs within same business (should be unique)', duplicate_count;
    ELSE
        RAISE NOTICE '✅ PASS: No duplicate slugs found (unique constraint working)';
    END IF;
END $$;

-- Check for published posts without published_date
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM business_blog_posts
    WHERE status = 'Published' AND published_date IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % published posts without published_date', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All published posts have published_date';
    END IF;
END $$;

-- ============================================
-- 4. STORAGE VERIFICATION
-- ============================================

-- Check if blog-images bucket exists (manual check required)
DO $$
BEGIN
    RAISE NOTICE 'ℹ️  INFO: Please verify blog-images bucket exists in Supabase Storage';
    RAISE NOTICE 'ℹ️  INFO: Storage policies should allow business owners to upload to blog/{post_id}/';
    RAISE NOTICE 'ℹ️  INFO: Image uploads should use blog-images bucket';
END $$;

-- ============================================
-- 5. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_posts INTEGER;
    draft_count INTEGER;
    published_count INTEGER;
    featured_count INTEGER;
    posts_with_images INTEGER;
    posts_with_seo INTEGER;
    avg_view_count NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_posts FROM business_blog_posts;
    SELECT COUNT(*) INTO draft_count FROM business_blog_posts WHERE status = 'Draft';
    SELECT COUNT(*) INTO published_count FROM business_blog_posts WHERE status = 'Published';
    SELECT COUNT(*) INTO featured_count FROM business_blog_posts WHERE is_featured = TRUE;
    SELECT COUNT(*) INTO posts_with_images FROM business_blog_posts WHERE image_url IS NOT NULL AND image_url != '';
    SELECT COUNT(*) INTO posts_with_seo FROM business_blog_posts WHERE seo IS NOT NULL AND seo != 'null'::jsonb;
    SELECT AVG(view_count) INTO avg_view_count FROM business_blog_posts;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG POST STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total posts: %', total_posts;
    RAISE NOTICE 'Draft posts: % (%.1f%%)', draft_count,
        CASE WHEN total_posts > 0 THEN (draft_count::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE 'Published posts: % (%.1f%%)', published_count,
        CASE WHEN total_posts > 0 THEN (published_count::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE 'Featured posts: % (%.1f%%)', featured_count,
        CASE WHEN total_posts > 0 THEN (featured_count::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE 'Posts with images: % (%.1f%%)', posts_with_images,
        CASE WHEN total_posts > 0 THEN (posts_with_images::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE 'Posts with SEO: % (%.1f%%)', posts_with_seo,
        CASE WHEN total_posts > 0 THEN (posts_with_seo::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE 'Average view count: %', COALESCE(avg_view_count, 0);
    RAISE NOTICE '========================================';
END $$;

-- Business distribution
DO $$
DECLARE
    business_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG POSTS BY BUSINESS';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT b.id, b.name, COUNT(bbp.id) as post_count,
               COUNT(CASE WHEN bbp.status = 'Published' THEN 1 END) as published_count
        FROM businesses b
        LEFT JOIN business_blog_posts bbp ON b.id = bbp.business_id
        GROUP BY b.id, b.name
        ORDER BY post_count DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '% (ID: %): % posts (% published)', 
            business_record.name, 
            business_record.id, 
            business_record.post_count,
            business_record.published_count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample blog posts (first 5)
DO $$
DECLARE
    post_record RECORD;
    post_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE BLOG POSTS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR post_record IN
        SELECT bbp.id, bbp.title, bbp.status, bbp.is_featured, bbp.view_count,
               b.name as business_name, bbp.published_date, bbp.created_date
        FROM business_blog_posts bbp
        LEFT JOIN businesses b ON bbp.business_id = b.id
        ORDER BY bbp.created_date DESC
        LIMIT 5
    LOOP
        post_count := post_count + 1;
        RAISE NOTICE '%: "%" - % (Business: %, Status: %, Featured: %, Views: %)', 
            post_count,
            post_record.title,
            COALESCE(post_record.published_date::text, post_record.created_date::text),
            COALESCE(post_record.business_name, 'N/A'),
            post_record.status,
            CASE WHEN post_record.is_featured THEN 'Yes' ELSE 'No' END,
            post_record.view_count;
    END LOOP;
    
    IF post_count = 0 THEN
        RAISE NOTICE 'No blog posts found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.7 Blog Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test CRUD operations in UI';
    RAISE NOTICE '2. Test image upload to Supabase Storage (blog-images bucket)';
    RAISE NOTICE '3. Test RLS policies with different user roles';
    RAISE NOTICE '4. Verify publish/unpublish works correctly';
    RAISE NOTICE '5. Verify featured toggle works correctly';
    RAISE NOTICE '6. Verify SEO settings are saved correctly';
    RAISE NOTICE '7. Verify image deletion from Storage works';
END $$;



