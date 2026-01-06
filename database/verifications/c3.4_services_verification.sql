-- ============================================
-- C3.4 - Services Management Verification Script
-- ============================================
-- Purpose: Verify Services CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.4 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if services table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        RAISE EXCEPTION '❌ FAIL: services table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: services table exists';
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
            ('id'), ('business_id'), ('name'), ('price'), 
            ('description'), ('image_url'), ('duration_minutes'), ('position')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'services'
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
        AND table_name = 'services'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
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
        WHERE schemaname = 'public' AND tablename = 'services'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on services table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on services table';
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
                ('services_select_public_or_owner_or_admin'),
                ('services_insert_owner_or_admin'),
                ('services_update_owner_or_admin'),
                ('services_delete_owner_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'services'
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

-- Check for services with invalid business_id (orphaned services)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM services s
    LEFT JOIN businesses b ON s.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned services (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned services found';
    END IF;
END $$;

-- Check for services with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM services
    WHERE name IS NULL OR name = ''
       OR price IS NULL OR price = ''
       OR business_id IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % services with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All services have required fields';
    END IF;
END $$;

-- Check for services with invalid position values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM services
    WHERE position IS NULL OR position < 0;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % services with invalid position values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All services have valid position values';
    END IF;
END $$;

-- ============================================
-- 4. STORAGE VERIFICATION
-- ============================================

-- Check if business-gallery bucket exists (manual check required)
-- Note: This requires Supabase Dashboard or API access
DO $$
BEGIN
    RAISE NOTICE 'ℹ️  INFO: Please verify business-gallery bucket exists in Supabase Storage';
    RAISE NOTICE 'ℹ️  INFO: Storage policies should allow business owners to upload to business/{business_id}/services/';
END $$;

-- ============================================
-- 5. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_services INTEGER;
    services_with_images INTEGER;
    services_with_duration INTEGER;
    avg_position NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_services FROM services;
    SELECT COUNT(*) INTO services_with_images FROM services WHERE image_url IS NOT NULL AND image_url != '';
    SELECT COUNT(*) INTO services_with_duration FROM services WHERE duration_minutes IS NOT NULL;
    SELECT AVG(position) INTO avg_position FROM services;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SERVICES STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total services: %', total_services;
    RAISE NOTICE 'Services with images: % (%.1f%%)', services_with_images, 
        CASE WHEN total_services > 0 THEN (services_with_images::NUMERIC / total_services * 100) ELSE 0 END;
    RAISE NOTICE 'Services with duration: % (%.1f%%)', services_with_duration,
        CASE WHEN total_services > 0 THEN (services_with_duration::NUMERIC / total_services * 100) ELSE 0 END;
    RAISE NOTICE 'Average position: %', COALESCE(avg_position, 0);
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample services (first 5)
DO $$
DECLARE
    service_record RECORD;
    service_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE SERVICES (First 5)';
    RAISE NOTICE '========================================';
    
    FOR service_record IN
        SELECT s.id, s.name, s.price, s.business_id, b.name as business_name, s.position
        FROM services s
        LEFT JOIN businesses b ON s.business_id = b.id
        ORDER BY s.business_id, s.position
        LIMIT 5
    LOOP
        service_count := service_count + 1;
        RAISE NOTICE '%: % - % (Business: %, Position: %)', 
            service_count, 
            service_record.name, 
            service_record.price,
            COALESCE(service_record.business_name, 'N/A'),
            service_record.position;
    END LOOP;
    
    IF service_count = 0 THEN
        RAISE NOTICE 'No services found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.4 Services Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test CRUD operations in UI';
    RAISE NOTICE '2. Test image upload to Supabase Storage';
    RAISE NOTICE '3. Test RLS policies with different user roles';
    RAISE NOTICE '4. Verify drag-and-drop reordering works';
END $$;

