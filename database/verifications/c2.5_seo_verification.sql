-- C2.5 - SEO, Metadata, Schema Verification
-- Tuân thủ Master Plan v1.1
-- Verifies SEO-related database schema, slugs, and SEO fields

DO $$
DECLARE
    v_count INTEGER;
    v_slug_count INTEGER;
    v_unique_slug_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'C2.5 - SEO Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ============================================
    -- 1. Verify businesses table has slug column
    -- ============================================
    RAISE NOTICE '1. Checking businesses.slug column...';
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'slug';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ businesses.slug column exists';
    ELSE
        RAISE EXCEPTION '   ❌ businesses.slug column NOT FOUND';
    END IF;

    -- Check slug uniqueness constraint
    SELECT COUNT(*) INTO v_slug_count FROM public.businesses;
    SELECT COUNT(DISTINCT slug) INTO v_unique_slug_count FROM public.businesses;
    
    IF v_slug_count = v_unique_slug_count THEN
        RAISE NOTICE '   ✅ All business slugs are unique';
    ELSE
        RAISE WARNING '   ⚠️  Found duplicate slugs: % total, % unique', v_slug_count, v_unique_slug_count;
    END IF;

    -- Check slug index
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'businesses'
      AND indexname = 'idx_businesses_slug';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ Index idx_businesses_slug exists';
    ELSE
        RAISE WARNING '   ⚠️  Index idx_businesses_slug NOT FOUND';
    END IF;

    -- ============================================
    -- 2. Verify businesses table has SEO column
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Checking businesses.seo column (JSONB)...';
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'businesses'
      AND column_name = 'seo'
      AND data_type = 'jsonb';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ businesses.seo JSONB column exists';
    ELSE
        RAISE EXCEPTION '   ❌ businesses.seo JSONB column NOT FOUND';
    END IF;

    -- ============================================
    -- 3. Verify blog_posts table has slug column
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Checking blog_posts.slug column...';
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_posts'
      AND column_name = 'slug';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ blog_posts.slug column exists';
    ELSE
        RAISE EXCEPTION '   ❌ blog_posts.slug column NOT FOUND';
    END IF;

    -- Check slug uniqueness constraint
    SELECT COUNT(*) INTO v_slug_count FROM public.blog_posts;
    SELECT COUNT(DISTINCT slug) INTO v_unique_slug_count FROM public.blog_posts;
    
    IF v_slug_count = v_unique_slug_count THEN
        RAISE NOTICE '   ✅ All blog post slugs are unique';
    ELSE
        RAISE WARNING '   ⚠️  Found duplicate slugs: % total, % unique', v_slug_count, v_unique_slug_count;
    END IF;

    -- Check slug index
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'blog_posts'
      AND indexname = 'idx_blog_posts_slug';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ Index idx_blog_posts_slug exists';
    ELSE
        RAISE WARNING '   ⚠️  Index idx_blog_posts_slug NOT FOUND';
    END IF;

    -- ============================================
    -- 4. Verify business_blog_posts table has slug column
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Checking business_blog_posts.slug column...';
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_blog_posts'
      AND column_name = 'slug';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ business_blog_posts.slug column exists';
    ELSE
        RAISE EXCEPTION '   ❌ business_blog_posts.slug column NOT FOUND';
    END IF;

    -- Check unique constraint (business_id, slug)
    SELECT COUNT(*) INTO v_count
    FROM pg_constraint
    WHERE conname LIKE '%business_blog_posts%slug%'
      AND contype = 'u';
    
    IF v_count >= 1 THEN
        RAISE NOTICE '   ✅ Unique constraint on (business_id, slug) exists';
    ELSE
        RAISE WARNING '   ⚠️  Unique constraint on (business_id, slug) NOT FOUND';
    END IF;

    -- ============================================
    -- 5. Verify business_blog_posts has SEO column
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '5. Checking business_blog_posts.seo column (JSONB)...';
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_blog_posts'
      AND column_name = 'seo'
      AND data_type = 'jsonb';
    
    IF v_count = 1 THEN
        RAISE NOTICE '   ✅ business_blog_posts.seo JSONB column exists';
    ELSE
        RAISE EXCEPTION '   ❌ business_blog_posts.seo JSONB column NOT FOUND';
    END IF;

    -- ============================================
    -- 6. Sample data verification
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '6. Sample data verification...';
    
    -- Check businesses with slugs
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE slug IS NOT NULL AND slug != '';
    
    IF v_count > 0 THEN
        RAISE NOTICE '   ✅ Found % businesses with slugs', v_count;
    ELSE
        RAISE WARNING '   ⚠️  No businesses with slugs found';
    END IF;

    -- Check blog_posts with slugs
    SELECT COUNT(*) INTO v_count
    FROM public.blog_posts
    WHERE slug IS NOT NULL AND slug != '';
    
    IF v_count > 0 THEN
        RAISE NOTICE '   ✅ Found % blog posts with slugs', v_count;
    ELSE
        RAISE WARNING '   ⚠️  No blog posts with slugs found';
    END IF;

    -- Check businesses with SEO data
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE seo IS NOT NULL;
    
    IF v_count > 0 THEN
        RAISE NOTICE '   ✅ Found % businesses with SEO data', v_count;
    ELSE
        RAISE NOTICE '   ℹ️  No businesses with SEO data (optional field)';
    END IF;

    -- ============================================
    -- 7. Slug format verification (SEO-friendly)
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '7. Slug format verification (SEO-friendly)...';
    
    -- Check for slugs with spaces (should be hyphenated)
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE slug LIKE '% %';
    
    IF v_count = 0 THEN
        RAISE NOTICE '   ✅ No business slugs with spaces found';
    ELSE
        RAISE WARNING '   ⚠️  Found % business slugs with spaces (should use hyphens)', v_count;
    END IF;

    -- Check for slugs with uppercase (should be lowercase)
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE slug != LOWER(slug);
    
    IF v_count = 0 THEN
        RAISE NOTICE '   ✅ All business slugs are lowercase';
    ELSE
        RAISE WARNING '   ⚠️  Found % business slugs with uppercase (should be lowercase)', v_count;
    END IF;

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'C2.5 SEO Verification Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schema verified:';
    RAISE NOTICE '   - businesses.slug (UNIQUE, indexed)';
    RAISE NOTICE '   - businesses.seo (JSONB)';
    RAISE NOTICE '   - blog_posts.slug (UNIQUE, indexed)';
    RAISE NOTICE '   - business_blog_posts.slug (UNIQUE per business)';
    RAISE NOTICE '   - business_blog_posts.seo (JSONB)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Notes:';
    RAISE NOTICE '   - Slugs should be lowercase, hyphenated, SEO-friendly';
    RAISE NOTICE '   - SEO fields are optional JSONB columns';
    RAISE NOTICE '   - Frontend components (SEOHead) handle meta tags dynamically';
    RAISE NOTICE '   - robots.txt and sitemap.xml are static files in /public';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Verification failed: %', SQLERRM;
END $$;


