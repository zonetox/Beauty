-- ============================================
-- C3.9 - Booking Management Verification Script
-- ============================================
-- Purpose: Verify Appointments CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.9 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if appointments table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
        RAISE EXCEPTION '❌ FAIL: appointments table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: appointments table exists';
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
            ('id'), ('business_id'), ('service_id'), ('service_name'),
            ('staff_member_id'), ('customer_name'), ('customer_email'),
            ('customer_phone'), ('date'), ('time_slot'), ('status'), ('notes'), ('created_at')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'appointments'
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
        AND table_name = 'appointments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check appointment_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'appointment_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: appointment_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: appointment_status enum exists';
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
        WHERE schemaname = 'public' AND tablename = 'appointments'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on appointments table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on appointments table';
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
                ('appointments_select_owner_or_admin'),
                ('appointments_insert_public_or_admin'),
                ('appointments_update_owner_or_admin'),
                ('appointments_delete_owner_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'appointments'
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

-- Check for appointments with invalid business_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM appointments a
    LEFT JOIN businesses b ON a.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned appointments (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned appointments found';
    END IF;
END $$;

-- Check for appointments with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM appointments
    WHERE customer_name IS NULL OR customer_name = ''
       OR customer_phone IS NULL OR customer_phone = ''
       OR business_id IS NULL
       OR date IS NULL
       OR time_slot IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % appointments with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All appointments have required fields';
    END IF;
END $$;

-- Check for appointments with invalid status values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM appointments
    WHERE status NOT IN ('Pending', 'Confirmed', 'Cancelled', 'Completed');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % appointments with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All appointments have valid status values';
    END IF;
END $$;

-- ============================================
-- 4. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_appointments INTEGER;
    pending_count INTEGER;
    confirmed_count INTEGER;
    completed_count INTEGER;
    cancelled_count INTEGER;
    upcoming_count INTEGER;
    past_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_appointments FROM appointments;
    SELECT COUNT(*) INTO pending_count FROM appointments WHERE status = 'Pending';
    SELECT COUNT(*) INTO confirmed_count FROM appointments WHERE status = 'Confirmed';
    SELECT COUNT(*) INTO completed_count FROM appointments WHERE status = 'Completed';
    SELECT COUNT(*) INTO cancelled_count FROM appointments WHERE status = 'Cancelled';
    SELECT COUNT(*) INTO upcoming_count FROM appointments WHERE status IN ('Pending', 'Confirmed') AND date >= CURRENT_DATE;
    SELECT COUNT(*) INTO past_count FROM appointments WHERE status IN ('Completed', 'Cancelled') OR date < CURRENT_DATE;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APPOINTMENT STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total appointments: %', total_appointments;
    RAISE NOTICE 'Pending: % (%.1f%%)', pending_count,
        CASE WHEN total_appointments > 0 THEN (pending_count::NUMERIC / total_appointments * 100) ELSE 0 END;
    RAISE NOTICE 'Confirmed: % (%.1f%%)', confirmed_count,
        CASE WHEN total_appointments > 0 THEN (confirmed_count::NUMERIC / total_appointments * 100) ELSE 0 END;
    RAISE NOTICE 'Completed: % (%.1f%%)', completed_count,
        CASE WHEN total_appointments > 0 THEN (completed_count::NUMERIC / total_appointments * 100) ELSE 0 END;
    RAISE NOTICE 'Cancelled: % (%.1f%%)', cancelled_count,
        CASE WHEN total_appointments > 0 THEN (cancelled_count::NUMERIC / total_appointments * 100) ELSE 0 END;
    RAISE NOTICE 'Upcoming: %', upcoming_count;
    RAISE NOTICE 'Past: %', past_count;
    RAISE NOTICE '========================================';
END $$;

-- Business distribution
DO $$
DECLARE
    business_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APPOINTMENTS BY BUSINESS (Top 10)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT b.id, b.name, COUNT(a.id) as appointment_count,
               COUNT(CASE WHEN a.status = 'Pending' THEN 1 END) as pending_count,
               COUNT(CASE WHEN a.status = 'Confirmed' THEN 1 END) as confirmed_count
        FROM businesses b
        LEFT JOIN appointments a ON b.id = a.business_id
        GROUP BY b.id, b.name
        HAVING COUNT(a.id) > 0
        ORDER BY appointment_count DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '% (ID: %): % appointments (% pending, % confirmed)', 
            business_record.name, 
            business_record.id, 
            business_record.appointment_count,
            business_record.pending_count,
            business_record.confirmed_count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample appointments (first 5)
DO $$
DECLARE
    appointment_record RECORD;
    appointment_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE APPOINTMENTS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR appointment_record IN
        SELECT a.id, a.customer_name, a.service_name, a.date, a.time_slot, a.status,
               b.name as business_name
        FROM appointments a
        LEFT JOIN businesses b ON a.business_id = b.id
        ORDER BY a.date DESC, a.time_slot DESC
        LIMIT 5
    LOOP
        appointment_count := appointment_count + 1;
        RAISE NOTICE '%: % - % (Business: %, Date: %, Time: %, Status: %)', 
            appointment_count,
            appointment_record.customer_name,
            appointment_record.service_name,
            COALESCE(appointment_record.business_name, 'N/A'),
            appointment_record.date,
            appointment_record.time_slot,
            appointment_record.status;
    END LOOP;
    
    IF appointment_count = 0 THEN
        RAISE NOTICE 'No appointments found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.9 Booking Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test list appointments in UI';
    RAISE NOTICE '2. Test update appointment status (Confirm/Cancel/Complete)';
    RAISE NOTICE '3. Test calendar view';
    RAISE NOTICE '4. Test filters (by status)';
    RAISE NOTICE '5. Test RLS policies with different user roles';
END $$;




