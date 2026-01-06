-- ============================================
-- F3 - SEO & Discoverability Verification Script
-- Tuân thủ Master Plan v1.1
-- Verify SEO implementation: meta tags, Schema.org, OpenGraph, sitemap, robots.txt, canonical URLs, slugs
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
    v_exists BOOLEAN;
    v_business_count INTEGER;
    v_blog_count INTEGER;
    v_business_blog_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'F3 - SEO & Discoverability Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ============================================
    -- 1. Verify Slugs (F3.7)
    -- ============================================
    RAISE NOTICE '1. Verifying SEO-friendly slugs...';
    
    -- Check businesses have slugs
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE is_active = TRUE
      AND (slug IS NULL OR slug = '');
    
    IF v_count = 0 THEN
        RAISE NOTICE '   [OK] All active businesses have slugs';
    ELSE
        RAISE WARNING '   [WARN] Found % active businesses without slugs', v_count;
    END IF;
    
    -- Check blog posts have slugs (blog_posts doesn't have status column)
    SELECT COUNT(*) INTO v_count
    FROM public.blog_posts
    WHERE (slug IS NULL OR slug = '');
    
    IF v_count = 0 THEN
        RAISE NOTICE '   [OK] All blog posts have slugs';
    ELSE
        RAISE WARNING '   [WARN] Found % blog posts without slugs', v_count;
    END IF;
    
    -- Check business blog posts have slugs
    SELECT COUNT(*) INTO v_count
    FROM public.business_blog_posts
    WHERE status = 'Published'
      AND (slug IS NULL OR slug = '');
    
    IF v_count = 0 THEN
        RAISE NOTICE '   [OK] All published business blog posts have slugs';
    ELSE
        RAISE WARNING '   [WARN] Found % published business blog posts without slugs', v_count;
    END IF;
    
    -- Check slug uniqueness for businesses
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT slug, COUNT(*) as cnt
        FROM public.businesses
        WHERE slug IS NOT NULL AND slug != ''
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_count = 0 THEN
        RAISE NOTICE '   [OK] All business slugs are unique';
    ELSE
        RAISE WARNING '   [WARN] Found % duplicate business slugs', v_count;
    END IF;
    
    -- Check slug uniqueness for blog posts
    SELECT COUNT(*) INTO v_count
    FROM (
        SELECT slug, COUNT(*) as cnt
        FROM public.blog_posts
        WHERE slug IS NOT NULL AND slug != ''
        GROUP BY slug
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF v_count = 0 THEN
        RAISE NOTICE '   [OK] All blog post slugs are unique';
    ELSE
        RAISE WARNING '   [WARN] Found % duplicate blog post slugs', v_count;
    END IF;

    -- ============================================
    -- 2. Verify Database Schema for SEO Fields
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Verifying database schema for SEO fields...';
    
    -- Check businesses table has SEO fields
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'businesses'
          AND column_name = 'slug'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '   [OK] businesses.slug column exists';
    ELSE
        RAISE WARNING '   [WARN] businesses.slug column NOT found';
    END IF;
    
    -- Check blog_posts table has SEO fields
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'blog_posts'
          AND column_name = 'slug'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '   [OK] blog_posts.slug column exists';
    ELSE
        RAISE WARNING '   [WARN] blog_posts.slug column NOT found';
    END IF;
    
    -- Check business_blog_posts table has SEO fields
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'business_blog_posts'
          AND column_name = 'slug'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '   [OK] business_blog_posts.slug column exists';
    ELSE
        RAISE WARNING '   [WARN] business_blog_posts.slug column NOT found';
    END IF;

    -- ============================================
    -- 3. Verify Sitemap Data Availability
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Verifying sitemap data availability...';
    
    -- Count active businesses for sitemap
    SELECT COUNT(*) INTO v_business_count
    FROM public.businesses
    WHERE is_active = TRUE
      AND slug IS NOT NULL
      AND slug != '';
    
    RAISE NOTICE '   [INFO] % active businesses available for sitemap', v_business_count;
    
    -- Count blog posts for sitemap (blog_posts doesn't have status column)
    SELECT COUNT(*) INTO v_blog_count
    FROM public.blog_posts
    WHERE slug IS NOT NULL
      AND slug != '';
    
    RAISE NOTICE '   [INFO] % blog posts available for sitemap', v_blog_count;
    
    -- Count published business blog posts for sitemap
    SELECT COUNT(*) INTO v_business_blog_count
    FROM public.business_blog_posts
    WHERE status = 'Published'
      AND slug IS NOT NULL
      AND slug != '';
    
    RAISE NOTICE '   [INFO] % published business blog posts available for sitemap', v_business_blog_count;

    -- ============================================
    -- 4. Verify Indexes for SEO Queries
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Verifying indexes for SEO queries...';
    
    -- Check index on businesses.slug
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND indexname LIKE '%slug%'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '   [OK] Index exists on businesses.slug';
    ELSE
        RAISE WARNING '   [WARN] Index on businesses.slug NOT found';
        RAISE NOTICE '   Action: Run migration 20250106000002_add_search_indexes.sql';
    END IF;
    
    -- Check index on blog_posts.slug
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'blog_posts'
          AND indexname LIKE '%slug%'
    ) INTO v_exists;
    
    IF v_exists THEN
        RAISE NOTICE '   [OK] Index exists on blog_posts.slug';
    ELSE
        RAISE WARNING '   [WARN] Index on blog_posts.slug NOT found';
        RAISE NOTICE '   Action: Run migration 20250106000002_add_search_indexes.sql';
    END IF;

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'F3 SEO Verification Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Frontend Implementation Checklist:';
    RAISE NOTICE '  [ ] F3.1 Meta tags - Verify all pages use SEOHead component';
    RAISE NOTICE '  [ ] F3.2 Schema.org - Verify WebSite, Article, LocalBusiness schemas';
    RAISE NOTICE '  [ ] F3.3 OpenGraph - Verify OG tags on all pages';
    RAISE NOTICE '  [ ] F3.4 Sitemap - Verify Edge Function generate-sitemap exists';
    RAISE NOTICE '  [ ] F3.5 Robots.txt - Verify robots.txt file exists in public/';
    RAISE NOTICE '  [ ] F3.6 Canonical URLs - Verify canonical tags in SEOHead';
    RAISE NOTICE '  [ ] F3.7 Slugs - Verify all pages use SEO-friendly slugs';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Deploy Edge Function: supabase functions deploy generate-sitemap';
    RAISE NOTICE '2. Test sitemap generation: curl https://[project].supabase.co/functions/v1/generate-sitemap';
    RAISE NOTICE '3. Verify robots.txt points to sitemap URL';
    RAISE NOTICE '4. Test SEO metadata on all pages using browser dev tools';
    RAISE NOTICE '5. Validate Schema.org markup using Google Rich Results Test';
    RAISE NOTICE '6. Test OpenGraph tags using Facebook Sharing Debugger';
    RAISE NOTICE '7. Submit sitemap to Google Search Console';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'SEO verification failed: %', SQLERRM;
END $$;


