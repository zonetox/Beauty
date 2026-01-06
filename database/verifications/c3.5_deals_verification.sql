-- ============================================
-- C3.5 - Deals Management Verification Script
-- ============================================
-- Purpose: Verify Deals CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.5 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if deals table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
        RAISE EXCEPTION '❌ FAIL: deals table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: deals table exists';
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
            ('id'), ('business_id'), ('title'), ('description'), 
            ('image_url'), ('start_date'), ('end_date'), 
            ('discount_percentage'), ('original_price'), ('deal_price'), ('status')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'deals'
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
        AND table_name = 'deals'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check deal_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'deal_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: deal_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: deal_status enum exists';
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
        WHERE schemaname = 'public' AND tablename = 'deals'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on deals table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on deals table';
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
                ('deals_select_public_or_owner_or_admin'),
                ('deals_insert_owner_or_admin'),
                ('deals_update_owner_or_admin'),
                ('deals_delete_owner_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'deals'
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

-- Check for deals with invalid business_id (orphaned deals)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM deals d
    LEFT JOIN businesses b ON d.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned deals (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned deals found';
    END IF;
END $$;

-- Check for deals with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM deals
    WHERE title IS NULL OR title = ''
       OR description IS NULL OR description = ''
       OR business_id IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % deals with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All deals have required fields';
    END IF;
END $$;

-- Check for deals with invalid date ranges (start_date >= end_date)
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM deals
    WHERE start_date IS NOT NULL 
       AND end_date IS NOT NULL
       AND start_date >= end_date;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % deals with invalid date ranges (start_date >= end_date)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All deals have valid date ranges';
    END IF;
END $$;

-- Check for deals with invalid prices (deal_price > original_price)
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM deals
    WHERE original_price IS NOT NULL
       AND deal_price IS NOT NULL
       AND deal_price > original_price;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % deals with invalid prices (deal_price > original_price)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All deals have valid prices';
    END IF;
END $$;

-- Check for deals with invalid discount percentages
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM deals
    WHERE discount_percentage IS NOT NULL
       AND (discount_percentage < 0 OR discount_percentage > 100);

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % deals with invalid discount percentages (not 0-100)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All deals have valid discount percentages';
    END IF;
END $$;

-- ============================================
-- 4. STATUS VERIFICATION
-- ============================================

-- Check deal status distribution
DO $$
DECLARE
    active_count INTEGER;
    expired_count INTEGER;
    scheduled_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM deals;
    SELECT COUNT(*) INTO active_count FROM deals WHERE status = 'Active';
    SELECT COUNT(*) INTO expired_count FROM deals WHERE status = 'Expired';
    SELECT COUNT(*) INTO scheduled_count FROM deals WHERE status = 'Scheduled';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEAL STATUS DISTRIBUTION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total deals: %', total_count;
    RAISE NOTICE 'Active: % (%.1f%%)', active_count, 
        CASE WHEN total_count > 0 THEN (active_count::NUMERIC / total_count * 100) ELSE 0 END;
    RAISE NOTICE 'Expired: % (%.1f%%)', expired_count,
        CASE WHEN total_count > 0 THEN (expired_count::NUMERIC / total_count * 100) ELSE 0 END;
    RAISE NOTICE 'Scheduled: % (%.1f%%)', scheduled_count,
        CASE WHEN total_count > 0 THEN (scheduled_count::NUMERIC / total_count * 100) ELSE 0 END;
    RAISE NOTICE '========================================';
END $$;

-- Check deals that should have status updated based on dates
DO $$
DECLARE
    needs_update_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO needs_update_count
    FROM deals
    WHERE (
        -- Should be Scheduled but is not
        (start_date IS NOT NULL AND start_date > NOW() AND status != 'Scheduled')
        OR
        -- Should be Expired but is not
        (end_date IS NOT NULL AND end_date < NOW() AND status != 'Expired')
        OR
        -- Should be Active but is not
        (start_date IS NOT NULL AND end_date IS NOT NULL 
         AND start_date <= NOW() AND end_date >= NOW() AND status != 'Active')
    );

    IF needs_update_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % deals that may need status update based on dates', needs_update_count;
    ELSE
        RAISE NOTICE '✅ PASS: All deals have correct status based on dates';
    END IF;
END $$;

-- ============================================
-- 5. STORAGE VERIFICATION
-- ============================================

-- Check if business-gallery bucket exists (manual check required)
DO $$
BEGIN
    RAISE NOTICE 'ℹ️  INFO: Please verify business-gallery bucket exists in Supabase Storage';
    RAISE NOTICE 'ℹ️  INFO: Storage policies should allow business owners to upload to business/{business_id}/deals/';
END $$;

-- ============================================
-- 6. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_deals INTEGER;
    deals_with_images INTEGER;
    deals_with_dates INTEGER;
    deals_with_prices INTEGER;
    avg_discount NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_deals FROM deals;
    SELECT COUNT(*) INTO deals_with_images FROM deals WHERE image_url IS NOT NULL AND image_url != '';
    SELECT COUNT(*) INTO deals_with_dates FROM deals WHERE start_date IS NOT NULL AND end_date IS NOT NULL;
    SELECT COUNT(*) INTO deals_with_prices FROM deals WHERE original_price IS NOT NULL AND deal_price IS NOT NULL;
    SELECT AVG(discount_percentage) INTO avg_discount FROM deals WHERE discount_percentage IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEALS STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total deals: %', total_deals;
    RAISE NOTICE 'Deals with images: % (%.1f%%)', deals_with_images, 
        CASE WHEN total_deals > 0 THEN (deals_with_images::NUMERIC / total_deals * 100) ELSE 0 END;
    RAISE NOTICE 'Deals with dates: % (%.1f%%)', deals_with_dates,
        CASE WHEN total_deals > 0 THEN (deals_with_dates::NUMERIC / total_deals * 100) ELSE 0 END;
    RAISE NOTICE 'Deals with prices: % (%.1f%%)', deals_with_prices,
        CASE WHEN total_deals > 0 THEN (deals_with_prices::NUMERIC / total_deals * 100) ELSE 0 END;
    RAISE NOTICE 'Average discount: %.1f%%', COALESCE(avg_discount, 0);
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 7. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample deals (first 5)
DO $$
DECLARE
    deal_record RECORD;
    deal_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE DEALS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR deal_record IN
        SELECT d.id, d.title, d.status, d.business_id, b.name as business_name, 
               d.start_date, d.end_date, d.deal_price, d.original_price
        FROM deals d
        LEFT JOIN businesses b ON d.business_id = b.id
        ORDER BY d.business_id, d.start_date DESC NULLS LAST
        LIMIT 5
    LOOP
        deal_count := deal_count + 1;
        RAISE NOTICE '%: % - Status: % (Business: %)', 
            deal_count, 
            deal_record.title, 
            deal_record.status,
            COALESCE(deal_record.business_name, 'N/A');
        IF deal_record.start_date IS NOT NULL OR deal_record.end_date IS NOT NULL THEN
            RAISE NOTICE '   Dates: % to %', 
                COALESCE(deal_record.start_date::TEXT, 'N/A'),
                COALESCE(deal_record.end_date::TEXT, 'N/A');
        END IF;
        IF deal_record.deal_price IS NOT NULL AND deal_record.original_price IS NOT NULL THEN
            RAISE NOTICE '   Price: %đ (was %đ)', 
                deal_record.deal_price,
                deal_record.original_price;
        END IF;
    END LOOP;
    
    IF deal_count = 0 THEN
        RAISE NOTICE 'No deals found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.5 Deals Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test CRUD operations in UI';
    RAISE NOTICE '2. Test image upload to Supabase Storage';
    RAISE NOTICE '3. Test RLS policies with different user roles';
    RAISE NOTICE '4. Verify status auto-update based on dates';
    RAISE NOTICE '5. Verify discount auto-calculation from prices';
END $$;

