-- ============================================
-- C2.3 - Business Landing Page Verification Script
-- ============================================
-- Purpose: Verify Business landing page data, RLS, and related tables
-- Usage: Run this script after implementing C2.3 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if businesses table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
        RAISE EXCEPTION '❌ FAIL: businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: businesses table exists';
    END IF;
END $$;

-- Check required columns for business landing page
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('name'), ('slug'), ('description'), ('categories'), ('city'), ('district'),
            ('address'), ('phone'), ('email'), ('website'), ('latitude'), ('longitude'),
            ('image_url'), ('hero_image_url'), ('hero_slides'), ('youtube_url'),
            ('is_active'), ('is_featured'), ('is_verified'), ('view_count'),
            ('joined_date'), ('socials'), ('seo'), ('working_hours')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '⚠️  WARNING: Missing columns in businesses table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in businesses table';
    END IF;
END $$;

-- Check related tables exist
DO $$
DECLARE
    missing_tables TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.table_name)
    INTO missing_tables
    FROM (
        VALUES 
            ('services'), ('deals'), ('media_items'), ('team_members'), 
            ('reviews'), ('business_blog_posts'), ('appointments')
    ) required(table_name)
    LEFT JOIN (
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
    ) existing ON existing.table_name = required.table_name
    WHERE existing.table_name IS NULL;

    IF missing_tables IS NOT NULL AND array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING '⚠️  WARNING: Missing related tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All related tables exist';
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled on businesses table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'businesses'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on businesses table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on businesses table';
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
        (tablename = 'businesses' AND policyname LIKE '%select%public%')
        OR (tablename = 'services' AND policyname LIKE '%select%public%')
        OR (tablename = 'deals' AND policyname LIKE '%select%public%')
        OR (tablename = 'media_items' AND policyname LIKE '%select%public%')
        OR (tablename = 'team_members' AND policyname LIKE '%select%public%')
        OR (tablename = 'reviews' AND policyname LIKE '%select%public%')
        OR (tablename = 'business_blog_posts' AND policyname LIKE '%select%public%')
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

-- Check for businesses with valid slugs
DO $$
DECLARE
    total_businesses INTEGER;
    businesses_with_slug INTEGER;
    businesses_with_description INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_businesses FROM businesses;
    SELECT COUNT(*) INTO businesses_with_slug FROM businesses WHERE slug IS NOT NULL AND slug != '';
    SELECT COUNT(*) INTO businesses_with_description FROM businesses WHERE description IS NOT NULL AND description != '';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BUSINESSES DATA STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total businesses: %', total_businesses;
    RAISE NOTICE 'Businesses with slug: % (%.1f%%)', businesses_with_slug,
        CASE WHEN total_businesses > 0 THEN (businesses_with_slug::NUMERIC / total_businesses * 100) ELSE 0 END;
    RAISE NOTICE 'Businesses with description: % (%.1f%%)', businesses_with_description,
        CASE WHEN total_businesses > 0 THEN (businesses_with_description::NUMERIC / total_businesses * 100) ELSE 0 END;
    RAISE NOTICE '========================================';

    IF businesses_with_slug = 0 THEN
        RAISE WARNING '⚠️  WARNING: No businesses with slugs (landing pages cannot be accessed)';
    END IF;
END $$;

-- Check businesses with hero slides
DO $$
DECLARE
    businesses_with_hero_slides INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO businesses_with_hero_slides
    FROM businesses
    WHERE hero_slides IS NOT NULL
    AND (
        (jsonb_typeof(hero_slides) = 'array' AND jsonb_array_length(hero_slides) > 0)
        OR (hero_slides::text != '[]' AND hero_slides::text != 'null')
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'HERO SLIDES STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with hero slides: %', businesses_with_hero_slides;
    RAISE NOTICE '========================================';
END $$;

-- Check businesses with related data
DO $$
DECLARE
    businesses_with_services INTEGER;
    businesses_with_deals INTEGER;
    businesses_with_gallery INTEGER;
    businesses_with_team INTEGER;
    businesses_with_reviews INTEGER;
    businesses_with_blog INTEGER;
BEGIN
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_services FROM services WHERE business_id IS NOT NULL;
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_deals FROM deals WHERE business_id IS NOT NULL;
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_gallery FROM media_items WHERE business_id IS NOT NULL;
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_team FROM team_members WHERE business_id IS NOT NULL;
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_reviews FROM reviews WHERE business_id IS NOT NULL;
    SELECT COUNT(DISTINCT business_id) INTO businesses_with_blog FROM business_blog_posts WHERE business_id IS NOT NULL AND status = 'Published';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RELATED DATA STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with services: %', businesses_with_services;
    RAISE NOTICE 'Businesses with deals: %', businesses_with_deals;
    RAISE NOTICE 'Businesses with gallery: %', businesses_with_gallery;
    RAISE NOTICE 'Businesses with team: %', businesses_with_team;
    RAISE NOTICE 'Businesses with reviews: %', businesses_with_reviews;
    RAISE NOTICE 'Businesses with blog posts: %', businesses_with_blog;
    RAISE NOTICE '========================================';
END $$;

-- Check SEO data
DO $$
DECLARE
    businesses_with_seo INTEGER;
    businesses_with_seo_title INTEGER;
    businesses_with_seo_description INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO businesses_with_seo
    FROM businesses
    WHERE seo IS NOT NULL
    AND seo::text != '{}' AND seo::text != 'null';

    SELECT COUNT(*)
    INTO businesses_with_seo_title
    FROM businesses
    WHERE seo IS NOT NULL
    AND seo->>'title' IS NOT NULL
    AND seo->>'title' != '';

    SELECT COUNT(*)
    INTO businesses_with_seo_description
    FROM businesses
    WHERE seo IS NOT NULL
    AND seo->>'description' IS NOT NULL
    AND seo->>'description' != '';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEO DATA STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with SEO data: %', businesses_with_seo;
    RAISE NOTICE 'Businesses with SEO title: %', businesses_with_seo_title;
    RAISE NOTICE 'Businesses with SEO description: %', businesses_with_seo_description;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 4. BUSINESS LANDING PAGE FUNCTIONALITY VERIFICATION
-- ============================================

-- Test fetching business by slug
DO $$
DECLARE
    test_business RECORD;
    test_slug TEXT;
BEGIN
    -- Get first business with slug
    SELECT slug INTO test_slug
    FROM businesses
    WHERE slug IS NOT NULL AND slug != ''
    AND is_active = true
    LIMIT 1;

    IF test_slug IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: No active businesses with slugs found to test';
    ELSE
        SELECT * INTO test_business
        FROM businesses
        WHERE slug = test_slug
        LIMIT 1;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'BUSINESS BY SLUG TEST';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Test slug: %', test_slug;
        RAISE NOTICE 'Business found: %', test_business.name;
        RAISE NOTICE 'Has description: %', CASE WHEN test_business.description IS NOT NULL THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE 'Has hero slides: %', CASE WHEN test_business.hero_slides IS NOT NULL AND jsonb_array_length(test_business.hero_slides) > 0 THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE 'Has SEO: %', CASE WHEN test_business.seo IS NOT NULL THEN 'Yes' ELSE 'No' END;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- Test related data fetching
DO $$
DECLARE
    test_business_id INTEGER;
    services_count INTEGER;
    deals_count INTEGER;
    gallery_count INTEGER;
    team_count INTEGER;
    reviews_count INTEGER;
    blog_count INTEGER;
BEGIN
    -- Get first active business ID
    SELECT id INTO test_business_id
    FROM businesses
    WHERE is_active = true
    LIMIT 1;

    IF test_business_id IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: No active businesses found to test related data';
    ELSE
        SELECT COUNT(*) INTO services_count FROM services WHERE business_id = test_business_id;
        SELECT COUNT(*) INTO deals_count FROM deals WHERE business_id = test_business_id AND status = 'Active';
        SELECT COUNT(*) INTO gallery_count FROM media_items WHERE business_id = test_business_id;
        SELECT COUNT(*) INTO team_count FROM team_members WHERE business_id = test_business_id;
        SELECT COUNT(*) INTO reviews_count FROM reviews WHERE business_id = test_business_id AND status = 'Visible';
        SELECT COUNT(*) INTO blog_count FROM business_blog_posts WHERE business_id = test_business_id AND status = 'Published';

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'RELATED DATA FETCH TEST (Business ID: %)', test_business_id;
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Services: %', services_count;
        RAISE NOTICE 'Active deals: %', deals_count;
        RAISE NOTICE 'Gallery items: %', gallery_count;
        RAISE NOTICE 'Team members: %', team_count;
        RAISE NOTICE 'Visible reviews: %', reviews_count;
        RAISE NOTICE 'Published blog posts: %', blog_count;
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
    businesses_with_views INTEGER;
    avg_views NUMERIC;
BEGIN
    SELECT COALESCE(SUM(view_count), 0) INTO total_views FROM businesses;
    SELECT COUNT(*) INTO businesses_with_views FROM businesses WHERE view_count > 0;
    SELECT COALESCE(AVG(view_count), 0) INTO avg_views FROM businesses WHERE view_count > 0;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VIEW COUNT STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total views: %', total_views;
    RAISE NOTICE 'Businesses with views: %', businesses_with_views;
    RAISE NOTICE 'Average views per business: %.1f', avg_views;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE BUSINESS LANDING PAGE DATA
-- ============================================

-- Display sample business data
DO $$
DECLARE
    business_record RECORD;
    business_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE BUSINESSES (First 3 Active)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT 
            id, name, slug, city, categories, 
            is_featured, is_verified, is_active,
            view_count,
            CASE WHEN hero_slides IS NOT NULL AND jsonb_array_length(hero_slides) > 0 THEN 'Yes' ELSE 'No' END as has_hero_slides,
            CASE WHEN seo IS NOT NULL THEN 'Yes' ELSE 'No' END as has_seo
        FROM businesses
        WHERE is_active = true
        ORDER BY is_featured DESC, view_count DESC, id ASC
        LIMIT 3
    LOOP
        business_count := business_count + 1;
        RAISE NOTICE '%: % (Slug: %, City: %, Featured: %, Verified: %, Views: %, Hero: %, SEO: %)', 
            business_count,
            business_record.name,
            COALESCE(business_record.slug, 'N/A'),
            COALESCE(business_record.city, 'N/A'),
            business_record.is_featured,
            business_record.is_verified,
            business_record.view_count,
            business_record.has_hero_slides,
            business_record.has_seo;
    END LOOP;
    
    IF business_count = 0 THEN
        RAISE NOTICE 'No active businesses found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C2.3 Business Landing Page Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test business landing page: /business/{slug}';
    RAISE NOTICE '2. Verify all sections render correctly (Hero, About, Services, Gallery, Team, Video, Blog, Deals, Reviews, Location)';
    RAISE NOTICE '3. Test booking modal functionality';
    RAISE NOTICE '4. Verify SEO metadata (title, description, Open Graph, Schema.org)';
    RAISE NOTICE '5. Test view count increment (once per session)';
    RAISE NOTICE '6. Test recently viewed functionality';
    RAISE NOTICE '7. Verify RLS policies (public can only see active businesses)';
    RAISE NOTICE '8. Test responsive design on mobile/tablet/desktop';
END $$;

