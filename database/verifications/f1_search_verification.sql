-- ============================================
-- F1 - Search System Verification Script
-- Tuân thủ Master Plan v1.1
-- Verify search indexes, functions, and performance
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
    v_index_exists BOOLEAN;
    v_function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'F1 - Search System Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ============================================
    -- 1. Verify Search Indexes
    -- ============================================
    RAISE NOTICE '1. Verifying search indexes...';
    
    -- Check businesses indexes
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'businesses'
      AND indexname LIKE '%search%';
    
    IF v_count >= 4 THEN
        RAISE NOTICE '   [OK] Found % search indexes on businesses table', v_count;
    ELSE
        RAISE WARNING '   [WARN] Expected at least 4 search indexes, found %', v_count;
    END IF;
    
    -- Check specific indexes
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND indexname = 'idx_businesses_name_search'
    ) INTO v_index_exists;
    
    IF v_index_exists THEN
        RAISE NOTICE '   [OK] idx_businesses_name_search exists';
    ELSE
        RAISE WARNING '   [WARN] idx_businesses_name_search NOT found';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND indexname = 'idx_businesses_tags_search'
    ) INTO v_index_exists;
    
    IF v_index_exists THEN
        RAISE NOTICE '   [OK] idx_businesses_tags_search exists';
    ELSE
        RAISE WARNING '   [WARN] idx_businesses_tags_search NOT found';
    END IF;
    
    -- Check blog_posts indexes
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'blog_posts'
      AND indexname LIKE '%search%';
    
    IF v_count >= 2 THEN
        RAISE NOTICE '   [OK] Found % search indexes on blog_posts table', v_count;
    ELSE
        RAISE WARNING '   [WARN] Expected at least 2 search indexes, found %', v_count;
    END IF;

    -- ============================================
    -- 2. Verify Search Functions
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Verifying search functions...';
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'search_businesses'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '   [OK] search_businesses() function exists';
    ELSE
        RAISE WARNING '   [WARN] search_businesses() function NOT found';
        RAISE NOTICE '   Action: Run migration 20250106000002_add_search_indexes.sql';
    END IF;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'search_blog_posts'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '   [OK] search_blog_posts() function exists';
    ELSE
        RAISE WARNING '   [WARN] search_blog_posts() function NOT found';
        RAISE NOTICE '   Action: Run migration 20250106000002_add_search_indexes.sql';
    END IF;

    -- ============================================
    -- 3. Test Search Functions (if they exist)
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Testing search functions...';
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'search_businesses'
    ) THEN
        BEGIN
            SELECT COUNT(*) INTO v_count
            FROM public.search_businesses(
                p_search_text => 'test',
                p_limit => 5,
                p_offset => 0
            );
            
            RAISE NOTICE '   [OK] search_businesses() function is callable';
            RAISE NOTICE '   [INFO] Test search returned % results', v_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '   [WARN] Error testing search_businesses(): %', SQLERRM;
        END;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'search_blog_posts'
    ) THEN
        BEGIN
            SELECT COUNT(*) INTO v_count
            FROM public.search_blog_posts(
                p_search_text => 'test',
                p_limit => 5,
                p_offset => 0
            );
            
            RAISE NOTICE '   [OK] search_blog_posts() function is callable';
            RAISE NOTICE '   [INFO] Test search returned % results', v_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '   [WARN] Error testing search_blog_posts(): %', SQLERRM;
        END;
    END IF;

    -- ============================================
    -- 4. Verify Index Usage
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Verifying index usage...';
    RAISE NOTICE '   Note: Index usage statistics require actual queries to be run.';
    RAISE NOTICE '   Check pg_stat_user_indexes after running search queries.';

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'F1 Search System Verification Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run migration 20250106000002_add_search_indexes.sql if indexes/functions missing';
    RAISE NOTICE '2. Test search functionality in DirectoryPage';
    RAISE NOTICE '3. Test blog search in BlogListPage';
    RAISE NOTICE '4. Monitor query performance with EXPLAIN ANALYZE';
    RAISE NOTICE '5. Verify search ranking works correctly';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Search system verification failed: %', SQLERRM;
END $$;


