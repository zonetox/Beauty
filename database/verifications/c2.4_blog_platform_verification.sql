-- ============================================
-- C2.4 - Blog Platform Verification Script
-- ============================================
-- Purpose: Verify Blog platform functionality and database connectivity
-- Usage: Run this script after implementing C2.4 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if blog_posts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts') THEN
        RAISE EXCEPTION '❌ FAIL: blog_posts table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: blog_posts table exists';
    END IF;
END $$;

-- Check if business_blog_posts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_blog_posts') THEN
        RAISE WARNING '⚠️  WARNING: business_blog_posts table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: business_blog_posts table exists';
    END IF;
END $$;

-- Check if blog_comments table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
        RAISE WARNING '⚠️  WARNING: blog_comments table does not exist (comments may use localStorage fallback)';
    ELSE
        RAISE NOTICE '✅ PASS: blog_comments table exists';
    END IF;
END $$;

-- Check required columns for blog_posts
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('slug'), ('title'), ('excerpt'), ('content'), ('image_url'),
            ('author'), ('date'), ('category'), ('view_count')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'blog_posts'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '⚠️  WARNING: Missing columns in blog_posts table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in blog_posts table';
    END IF;
END $$;

-- Check required columns for business_blog_posts
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_blog_posts') THEN
        SELECT ARRAY_AGG(required.column_name)
        INTO missing_columns
        FROM (
            VALUES 
                ('id'), ('business_id'), ('slug'), ('title'), ('excerpt'), ('content'),
                ('image_url'), ('author'), ('published_date'), ('status'), ('is_featured'), ('view_count')
        ) required(column_name)
        LEFT JOIN (
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'business_blog_posts'
        ) existing ON existing.column_name = required.column_name
        WHERE existing.column_name IS NULL;

        IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
            RAISE WARNING '⚠️  WARNING: Missing columns in business_blog_posts table: %', array_to_string(missing_columns, ', ');
        ELSE
            RAISE NOTICE '✅ PASS: All required columns exist in business_blog_posts table';
        END IF;
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled on blog_posts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'blog_posts'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on blog_posts table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on blog_posts table';
    END IF;
END $$;

-- Check required RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
        (tablename = 'blog_posts' AND policyname LIKE '%select%public%')
        OR (tablename = 'business_blog_posts' AND policyname LIKE '%select%public%')
        OR (tablename = 'blog_comments' AND policyname LIKE '%select%public%')
    );

    IF policy_count = 0 THEN
        RAISE WARNING '⚠️  WARNING: No public SELECT policies found (check manually)';
    ELSE
        RAISE NOTICE '✅ PASS: Found % public SELECT policies', policy_count;
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for published blog posts
DO $$
DECLARE
    total_posts INTEGER;
    published_posts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_posts FROM blog_posts;
    SELECT COUNT(*) INTO published_posts FROM blog_posts WHERE date IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG POSTS STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total blog posts: %', total_posts;
    RAISE NOTICE 'Published blog posts: % (%.1f%%)', published_posts,
        CASE WHEN total_posts > 0 THEN (published_posts::NUMERIC / total_posts * 100) ELSE 0 END;
    RAISE NOTICE '========================================';

    IF published_posts = 0 THEN
        RAISE WARNING '⚠️  WARNING: No published blog posts found (blog list will be empty)';
    END IF;
END $$;

-- Check for published business blog posts
DO $$
DECLARE
    total_business_posts INTEGER;
    published_business_posts INTEGER;
    featured_business_posts INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_blog_posts') THEN
        SELECT COUNT(*) INTO total_business_posts FROM business_blog_posts;
        SELECT COUNT(*) INTO published_business_posts 
        FROM business_blog_posts 
        WHERE status = 'Published' AND published_date IS NOT NULL;
        SELECT COUNT(*) INTO featured_business_posts 
        FROM business_blog_posts 
        WHERE status = 'Published' AND published_date IS NOT NULL AND is_featured = true;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'BUSINESS BLOG POSTS STATISTICS';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total business blog posts: %', total_business_posts;
        RAISE NOTICE 'Published business blog posts: %', published_business_posts;
        RAISE NOTICE 'Featured business blog posts: %', featured_business_posts;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- Check blog posts with valid slugs
DO $$
DECLARE
    posts_with_slug INTEGER;
    posts_with_content INTEGER;
BEGIN
    SELECT COUNT(*) INTO posts_with_slug
    FROM blog_posts
    WHERE slug IS NOT NULL AND slug != '';

    SELECT COUNT(*) INTO posts_with_content
    FROM blog_posts
    WHERE content IS NOT NULL AND content != '';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG POSTS DATA QUALITY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Posts with slug: %', posts_with_slug;
    RAISE NOTICE 'Posts with content: %', posts_with_content;
    RAISE NOTICE '========================================';

    IF posts_with_slug = 0 THEN
        RAISE WARNING '⚠️  WARNING: No blog posts with slugs (detail pages cannot be accessed)';
    END IF;
END $$;

-- Check blog categories
DO $$
DECLARE
    unique_categories INTEGER;
BEGIN
    SELECT COUNT(DISTINCT category)
    INTO unique_categories
    FROM blog_posts
    WHERE category IS NOT NULL AND category != '';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BLOG CATEGORIES STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Unique categories: %', unique_categories;
    RAISE NOTICE '========================================';
END $$;

-- Check blog comments
DO $$
DECLARE
    total_comments INTEGER;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
        SELECT COUNT(*) INTO total_comments FROM blog_comments;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'BLOG COMMENTS STATISTICS';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Total comments: %', total_comments;
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'BLOG COMMENTS';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Comments table does not exist - using localStorage fallback';
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- ============================================
-- 4. BLOG FUNCTIONALITY VERIFICATION
-- ============================================

-- Test fetching blog post by slug
DO $$
DECLARE
    test_post RECORD;
    test_slug TEXT;
BEGIN
    SELECT slug INTO test_slug
    FROM blog_posts
    WHERE slug IS NOT NULL AND slug != ''
    LIMIT 1;

    IF test_slug IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: No blog posts with slugs found to test';
    ELSE
        SELECT * INTO test_post
        FROM blog_posts
        WHERE slug = test_slug
        LIMIT 1;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'BLOG POST BY SLUG TEST';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Test slug: %', test_slug;
        RAISE NOTICE 'Post found: %', test_post.title;
        RAISE NOTICE 'Has content: %', CASE WHEN test_post.content IS NOT NULL THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE 'Has image: %', CASE WHEN test_post.image_url IS NOT NULL THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE 'View count: %', test_post.view_count;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- Test related posts (by category)
DO $$
DECLARE
    test_category TEXT;
    related_count INTEGER;
BEGIN
    SELECT category INTO test_category
    FROM blog_posts
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    HAVING COUNT(*) > 1
    LIMIT 1;

    IF test_category IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: No categories with multiple posts found to test related posts';
    ELSE
        SELECT COUNT(*) - 1 INTO related_count
        FROM blog_posts
        WHERE category = test_category;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'RELATED POSTS TEST';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Test category: %', test_category;
        RAISE NOTICE 'Related posts count: %', related_count;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- ============================================
-- 5. VIEW COUNT VERIFICATION
-- ============================================

-- Check view count data
DO $$
DECLARE
    total_views BIGINT;
    posts_with_views INTEGER;
    avg_views NUMERIC;
BEGIN
    SELECT COALESCE(SUM(view_count), 0) INTO total_views FROM blog_posts;
    SELECT COUNT(*) INTO posts_with_views FROM blog_posts WHERE view_count > 0;
    SELECT COALESCE(AVG(view_count), 0) INTO avg_views FROM blog_posts WHERE view_count > 0;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VIEW COUNT STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total views: %', total_views;
    RAISE NOTICE 'Posts with views: %', posts_with_views;
    RAISE NOTICE 'Average views per post: %.1f', avg_views;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE BLOG DATA
-- ============================================

-- Display sample blog posts
DO $$
DECLARE
    post_record RECORD;
    post_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE BLOG POSTS (First 5 Published)';
    RAISE NOTICE '========================================';
    
    FOR post_record IN
        SELECT id, title, slug, category, author, date, view_count
        FROM blog_posts
        WHERE date IS NOT NULL
        ORDER BY date DESC, id ASC
        LIMIT 5
    LOOP
        post_count := post_count + 1;
        RAISE NOTICE '%: % (Slug: %, Category: %, Views: %)', 
            post_count,
            post_record.title,
            COALESCE(post_record.slug, 'N/A'),
            COALESCE(post_record.category, 'N/A'),
            post_record.view_count;
    END LOOP;
    
    IF post_count = 0 THEN
        RAISE NOTICE 'No published blog posts found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C2.4 Blog Platform Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test blog list page: /blog';
    RAISE NOTICE '2. Test blog post detail: /blog/{slug}';
    RAISE NOTICE '3. Test business blog post: /business/{businessSlug}/post/{postSlug}';
    RAISE NOTICE '4. Test search functionality';
    RAISE NOTICE '5. Test category filter';
    RAISE NOTICE '6. Test pagination';
    RAISE NOTICE '7. Test comments (if blog_comments table exists)';
    RAISE NOTICE '8. Test related posts';
    RAISE NOTICE '9. Verify SEO metadata (title, description, Open Graph, Schema.org)';
    RAISE NOTICE '10. Test view count increment (once per session)';
    RAISE NOTICE '11. Verify RLS policies (public can only see published posts)';
END $$;



