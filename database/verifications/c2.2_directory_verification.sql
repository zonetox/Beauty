-- ============================================
-- C2.2 - Directory Search & Filter Verification Script
-- ============================================
-- Purpose: Verify Directory search, filter, pagination functionality and database connectivity
-- Usage: Run this script after implementing C2.2 to verify everything works
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

-- Check required columns for search & filter
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('name'), ('slug'), ('categories'), ('city'), ('district'),
            ('latitude'), ('longitude'), ('is_active'), ('is_featured'), ('is_verified'),
            ('joined_date'), ('description')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing columns in businesses table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in businesses table';
    END IF;
END $$;

-- Check categories column is array type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'categories'
        AND data_type = 'ARRAY'
    ) THEN
        RAISE WARNING '⚠️  WARNING: categories column is not ARRAY type (may be JSONB)';
    ELSE
        RAISE NOTICE '✅ PASS: categories column is ARRAY type';
    END IF;
END $$;

-- Check indexes for search performance
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'businesses'
    AND (
        indexname LIKE '%name%' OR
        indexname LIKE '%city%' OR
        indexname LIKE '%district%' OR
        indexname LIKE '%is_active%' OR
        indexname LIKE '%is_featured%'
    );

    IF index_count = 0 THEN
        RAISE WARNING '⚠️  WARNING: No search-related indexes found on businesses table (performance may be slow)';
    ELSE
        RAISE NOTICE '✅ PASS: Found % search-related indexes', index_count;
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

-- Check required RLS policy for public read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'businesses'
        AND policy_name LIKE '%select%public%'
    ) THEN
        RAISE WARNING '⚠️  WARNING: No public SELECT policy found for businesses table';
    ELSE
        RAISE NOTICE '✅ PASS: Public SELECT policy exists for businesses table';
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for active businesses
DO $$
DECLARE
    active_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM businesses;
    SELECT COUNT(*) INTO active_count FROM businesses WHERE is_active = true;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BUSINESSES STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total businesses: %', total_count;
    RAISE NOTICE 'Active businesses: % (%.1f%%)', active_count,
        CASE WHEN total_count > 0 THEN (active_count::NUMERIC / total_count * 100) ELSE 0 END;
    RAISE NOTICE '========================================';

    IF active_count = 0 THEN
        RAISE WARNING '⚠️  WARNING: No active businesses found (directory will be empty)';
    END IF;
END $$;

-- Check businesses with valid location data
DO $$
DECLARE
    with_location INTEGER;
    with_coordinates INTEGER;
BEGIN
    SELECT COUNT(*) INTO with_location
    FROM businesses
    WHERE city IS NOT NULL AND city != '';

    SELECT COUNT(*) INTO with_coordinates
    FROM businesses
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LOCATION DATA STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with city: %', with_location;
    RAISE NOTICE 'Businesses with coordinates: %', with_coordinates;
    RAISE NOTICE '========================================';

    IF with_coordinates = 0 THEN
        RAISE WARNING '⚠️  WARNING: No businesses with coordinates (map view will be empty)';
    END IF;
END $$;

-- Check businesses with categories
DO $$
DECLARE
    with_categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO with_categories
    FROM businesses
    WHERE categories IS NOT NULL
    AND (
        (jsonb_typeof(categories) = 'array' AND jsonb_array_length(categories) > 0)
        OR (categories::text != '[]' AND categories::text != 'null')
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORIES STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with categories: %', with_categories;
    RAISE NOTICE '========================================';
END $$;

-- Check for businesses with deals
DO $$
DECLARE
    businesses_with_deals INTEGER;
BEGIN
    SELECT COUNT(DISTINCT business_id)
    INTO businesses_with_deals
    FROM deals
    WHERE status = 'Active';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEALS STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with active deals: %', businesses_with_deals;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 4. SEARCH FUNCTIONALITY VERIFICATION
-- ============================================

-- Test search by name (case-insensitive)
DO $$
DECLARE
    search_result_count INTEGER;
    test_keyword TEXT := 'spa';
BEGIN
    SELECT COUNT(*)
    INTO search_result_count
    FROM businesses
    WHERE is_active = true
    AND name ILIKE '%' || test_keyword || '%';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEARCH FUNCTIONALITY TEST';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Search keyword: "%"', test_keyword;
    RAISE NOTICE 'Results found: %', search_result_count;
    RAISE NOTICE '========================================';
END $$;

-- Test filter by category
DO $$
DECLARE
    category_result_count INTEGER;
    test_category TEXT := 'Spa & Massage';
BEGIN
    SELECT COUNT(*)
    INTO category_result_count
    FROM businesses
    WHERE is_active = true
    AND (
        categories @> ARRAY[test_category]::text[]
        OR categories::text LIKE '%' || test_category || '%'
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORY FILTER TEST';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Category: %', test_category;
    RAISE NOTICE 'Results found: %', category_result_count;
    RAISE NOTICE '========================================';
END $$;

-- Test filter by location
DO $$
DECLARE
    location_result_count INTEGER;
    test_city TEXT;
BEGIN
    -- Get first city from businesses
    SELECT city INTO test_city
    FROM businesses
    WHERE city IS NOT NULL AND city != ''
    LIMIT 1;

    IF test_city IS NULL THEN
        RAISE NOTICE '⚠️  WARNING: No businesses with city data to test location filter';
    ELSE
        SELECT COUNT(*)
        INTO location_result_count
        FROM businesses
        WHERE is_active = true
        AND city = test_city;

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'LOCATION FILTER TEST';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'City: %', test_city;
        RAISE NOTICE 'Results found: %', location_result_count;
        RAISE NOTICE '========================================';
    END IF;
END $$;

-- ============================================
-- 5. PAGINATION VERIFICATION
-- ============================================

-- Test pagination calculation
DO $$
DECLARE
    total_active INTEGER;
    page_size INTEGER := 20;
    total_pages INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_active
    FROM businesses
    WHERE is_active = true;

    total_pages := CEIL(total_active::NUMERIC / page_size);

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PAGINATION CALCULATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total active businesses: %', total_active;
    RAISE NOTICE 'Page size: %', page_size;
    RAISE NOTICE 'Total pages: %', total_pages;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample businesses (first 5 active)
DO $$
DECLARE
    business_record RECORD;
    business_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE BUSINESSES (First 5 Active)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT id, name, city, district, categories, is_featured, is_verified, is_active
        FROM businesses
        WHERE is_active = true
        ORDER BY is_featured DESC, id ASC
        LIMIT 5
    LOOP
        business_count := business_count + 1;
        RAISE NOTICE '%: % (City: %, Categories: %, Featured: %, Verified: %)', 
            business_count,
            business_record.name,
            COALESCE(business_record.city, 'N/A'),
            COALESCE(business_record.categories::text, 'N/A'),
            business_record.is_featured,
            business_record.is_verified;
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
    RAISE NOTICE '✅ C2.2 Directory Search & Filter Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test search functionality in UI';
    RAISE NOTICE '2. Test filter by category, location, district';
    RAISE NOTICE '3. Test sort options (rating, newest, name)';
    RAISE NOTICE '4. Test pagination';
    RAISE NOTICE '5. Test map view / list view toggle';
    RAISE NOTICE '6. Test filter by deals, verified, open now';
    RAISE NOTICE '7. Verify SEO metadata updates with filters';
    RAISE NOTICE '8. Test RLS policies (public can only see active businesses)';
END $$;




