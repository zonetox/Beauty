-- ============================================
-- C3.13 - Settings Verification Script
-- ============================================
-- Purpose: Verify Settings CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.13 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if app_settings table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_settings') THEN
        RAISE EXCEPTION '❌ FAIL: app_settings table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: app_settings table exists';
    END IF;
END $$;

-- Check required columns in app_settings table
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES ('id'), ('settings_data')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_settings'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing columns in app_settings table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in app_settings table';
    END IF;
END $$;

-- Check settings_data column is JSONB
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'app_settings'
        AND column_name = 'settings_data'
        AND data_type = 'jsonb'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: settings_data column is not JSONB type';
    ELSE
        RAISE NOTICE '✅ PASS: settings_data column is JSONB type';
    END IF;
END $$;

-- Check businesses table has notification_settings JSONB field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'notification_settings'
        AND data_type = 'jsonb'
    ) THEN
        RAISE WARNING '⚠️  WARNING: notification_settings column does not exist in businesses table (may be stored differently)';
    ELSE
        RAISE NOTICE '✅ PASS: notification_settings column exists in businesses table';
    END IF;
END $$;

-- Check businesses table has staff JSONB field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'staff'
        AND data_type = 'jsonb'
    ) THEN
        RAISE WARNING '⚠️  WARNING: staff column does not exist in businesses table (may be stored differently)';
    ELSE
        RAISE NOTICE '✅ PASS: staff column exists in businesses table';
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled on app_settings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'app_settings'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on app_settings table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on app_settings table';
    END IF;
END $$;

-- Check required RLS policies for app_settings
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
                ('app_settings_select_public'),
                ('app_settings_insert_admin'),
                ('app_settings_update_admin'),
                ('app_settings_delete_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'app_settings'
            AND policy_name = required.policy_name
        )
    LOOP
        missing_policies := array_append(missing_policies, policy_record.policy_name);
    END LOOP;

    IF array_length(missing_policies, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing RLS policies for app_settings: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required RLS policies exist for app_settings';
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for app_settings with invalid JSONB structure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM app_settings
    WHERE settings_data IS NULL
       OR NOT (jsonb_typeof(settings_data) = 'object');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % app_settings records with invalid JSONB structure', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All app_settings have valid JSONB structure';
    END IF;
END $$;

-- Check for app_settings with required bankDetails structure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM app_settings
    WHERE settings_data IS NOT NULL
    AND jsonb_typeof(settings_data) = 'object'
    AND NOT (
        settings_data ? 'bankDetails'
        AND jsonb_typeof(settings_data->'bankDetails') = 'object'
        AND settings_data->'bankDetails' ? 'bankName'
        AND settings_data->'bankDetails' ? 'accountName'
        AND settings_data->'bankDetails' ? 'accountNumber'
        AND settings_data->'bankDetails' ? 'transferNote'
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % app_settings records with missing bankDetails structure', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All app_settings have valid bankDetails structure';
    END IF;
END $$;

-- Check businesses with notification_settings structure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM businesses
    WHERE notification_settings IS NOT NULL
    AND jsonb_typeof(notification_settings) = 'object'
    AND NOT (
        notification_settings ? 'reviewAlerts'
        AND notification_settings ? 'bookingRequests'
        AND notification_settings ? 'platformNews'
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % businesses with invalid notification_settings structure', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All businesses have valid notification_settings structure (or NULL)';
    END IF;
END $$;

-- Check businesses with staff array structure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM businesses
    WHERE staff IS NOT NULL
    AND NOT (jsonb_typeof(staff) = 'array');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % businesses with invalid staff structure (should be array)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All businesses have valid staff structure (or NULL)';
    END IF;
END $$;

-- Check staff members with required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM businesses
    WHERE staff IS NOT NULL
    AND jsonb_typeof(staff) = 'array'
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(staff) AS member
        WHERE NOT (member ? 'id' AND member ? 'name' AND member ? 'email' AND member ? 'role')
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % businesses with staff members missing required fields (id, name, email, role)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All staff members have required fields';
    END IF;
END $$;

-- ============================================
-- 4. STATISTICS
-- ============================================

-- Display app_settings statistics
DO $$
DECLARE
    settings_count INTEGER;
    has_bank_details BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM app_settings;
    
    SELECT EXISTS (
        SELECT 1 FROM app_settings
        WHERE settings_data IS NOT NULL
        AND settings_data ? 'bankDetails'
    ) INTO has_bank_details;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APP SETTINGS STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total settings records: %', settings_count;
    RAISE NOTICE 'Has bank details: %', CASE WHEN has_bank_details THEN 'Yes' ELSE 'No' END;
    RAISE NOTICE '========================================';
END $$;

-- Business notification settings distribution
DO $$
DECLARE
    review_alerts_count INTEGER;
    booking_requests_count INTEGER;
    platform_news_count INTEGER;
    total_businesses INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_businesses FROM businesses;
    
    SELECT COUNT(*) INTO review_alerts_count
    FROM businesses
    WHERE notification_settings IS NOT NULL
    AND notification_settings->>'reviewAlerts' = 'true';
    
    SELECT COUNT(*) INTO booking_requests_count
    FROM businesses
    WHERE notification_settings IS NOT NULL
    AND notification_settings->>'bookingRequests' = 'true';
    
    SELECT COUNT(*) INTO platform_news_count
    FROM businesses
    WHERE notification_settings IS NOT NULL
    AND notification_settings->>'platformNews' = 'true';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NOTIFICATION SETTINGS DISTRIBUTION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total businesses: %', total_businesses;
    RAISE NOTICE 'Review alerts enabled: % (%.1f%%)', review_alerts_count,
        CASE WHEN total_businesses > 0 THEN (review_alerts_count::NUMERIC / total_businesses * 100) ELSE 0 END;
    RAISE NOTICE 'Booking requests enabled: % (%.1f%%)', booking_requests_count,
        CASE WHEN total_businesses > 0 THEN (booking_requests_count::NUMERIC / total_businesses * 100) ELSE 0 END;
    RAISE NOTICE 'Platform news enabled: % (%.1f%%)', platform_news_count,
        CASE WHEN total_businesses > 0 THEN (platform_news_count::NUMERIC / total_businesses * 100) ELSE 0 END;
    RAISE NOTICE '========================================';
END $$;

-- Staff management statistics
DO $$
DECLARE
    businesses_with_staff INTEGER;
    total_staff_members INTEGER;
    avg_staff_per_business NUMERIC;
BEGIN
    SELECT COUNT(*) INTO businesses_with_staff
    FROM businesses
    WHERE staff IS NOT NULL
    AND jsonb_typeof(staff) = 'array'
    AND jsonb_array_length(staff) > 0;
    
    SELECT COALESCE(SUM(jsonb_array_length(staff)), 0) INTO total_staff_members
    FROM businesses
    WHERE staff IS NOT NULL
    AND jsonb_typeof(staff) = 'array';
    
    SELECT COUNT(*) INTO avg_staff_per_business FROM businesses;
    avg_staff_per_business := CASE 
        WHEN avg_staff_per_business > 0 THEN total_staff_members::NUMERIC / avg_staff_per_business 
        ELSE 0 
    END;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STAFF MANAGEMENT STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses with staff: %', businesses_with_staff;
    RAISE NOTICE 'Total staff members: %', total_staff_members;
    RAISE NOTICE 'Average staff per business: %.2f', avg_staff_per_business;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample app_settings
DO $$
DECLARE
    settings_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE APP SETTINGS';
    RAISE NOTICE '========================================';
    
    FOR settings_record IN
        SELECT id, settings_data
        FROM app_settings
        ORDER BY id
        LIMIT 5
    LOOP
        RAISE NOTICE 'ID: %', settings_record.id;
        IF settings_record.settings_data ? 'bankDetails' THEN
            RAISE NOTICE '  Bank: %', settings_record.settings_data->'bankDetails'->>'bankName';
            RAISE NOTICE '  Account: %', settings_record.settings_data->'bankDetails'->>'accountName';
            RAISE NOTICE '  Account Number: %', settings_record.settings_data->'bankDetails'->>'accountNumber';
        ELSE
            RAISE NOTICE '  No bank details configured';
        END IF;
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'No app_settings found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- FUTURE ENHANCEMENTS (Phase D+)
-- ============================================
-- 
-- 🔧 1. Uniqueness Logic Check (Optional - Phase D+)
-- If each business should have only 1 app_settings record:
-- 
-- DO $$
-- DECLARE
--     duplicate_count INTEGER;
-- BEGIN
--     SELECT COUNT(*)
--     INTO duplicate_count
--     FROM app_settings
--     GROUP BY business_id  -- If business_id is added later
--     HAVING COUNT(*) > 1;
--     
--     IF duplicate_count > 0 THEN
--         RAISE WARNING '⚠️  WARNING: Found businesses with duplicate app_settings records';
--     END IF;
-- END $$;
-- 
-- 🔧 2. JSON Schema Version Check (Optional - Phase D+)
-- If settings schema is versioned in the future:
-- 
-- DO $$
-- DECLARE
--     missing_version_count INTEGER;
-- BEGIN
--     SELECT COUNT(*)
--     INTO missing_version_count
--     FROM app_settings
--     WHERE settings_data IS NOT NULL
--     AND NOT (settings_data ? 'version');
--     
--     IF missing_version_count > 0 THEN
--         RAISE WARNING '⚠️  WARNING: Found % app_settings without version field', missing_version_count;
--     END IF;
-- END $$;
-- 
-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.13 Settings Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test account settings update in UI';
    RAISE NOTICE '2. Test notification settings toggle';
    RAISE NOTICE '3. Test staff management (add/edit/remove)';
    RAISE NOTICE '4. Test form validation';
    RAISE NOTICE '5. Test RLS policies with different user roles';
    RAISE NOTICE '6. Verify settings persistence in database';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: Future enhancements (uniqueness check, schema versioning)';
    RAISE NOTICE '   are documented in comments above for Phase D+ implementation.';
END $$;

