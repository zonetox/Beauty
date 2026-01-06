-- ============================================
-- C3.11 - Membership & Billing Verification Script
-- ============================================
-- Purpose: Verify Membership packages, Orders CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.11 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if orders table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        RAISE EXCEPTION '❌ FAIL: orders table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: orders table exists';
    END IF;
END $$;

-- Check required columns in orders table
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('business_id'), ('package_id'), ('package_name'),
            ('amount'), ('status'), ('payment_method'), ('submitted_at'),
            ('confirmed_at'), ('notes')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing columns in orders table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in orders table';
    END IF;
END $$;

-- Check foreign key to businesses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'orders'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check order_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'order_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: order_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: order_status enum exists';
    END IF;
END $$;

-- Check membership_tier enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'membership_tier'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: membership_tier enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: membership_tier enum exists';
    END IF;
END $$;

-- Check businesses table has membership fields
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES ('membership_tier'), ('membership_expiry_date')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing membership columns in businesses table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All membership columns exist in businesses table';
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled on orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'orders'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on orders table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on orders table';
    END IF;
END $$;

-- Check required RLS policies for orders
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
                ('orders_select_owner_or_admin'),
                ('orders_insert_public_or_admin'),
                ('orders_update_owner_or_admin'),
                ('orders_delete_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'orders'
            AND policy_name = required.policy_name
        )
    LOOP
        missing_policies := array_append(missing_policies, policy_record.policy_name);
    END LOOP;

    IF array_length(missing_policies, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing RLS policies for orders: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required RLS policies exist for orders';
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for orders with invalid business_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM orders o
    LEFT JOIN businesses b ON o.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned orders (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned orders found';
    END IF;
END $$;

-- Check for orders with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM orders
    WHERE business_id IS NULL
       OR package_id IS NULL OR package_id = ''
       OR amount IS NULL
       OR status IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orders with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All orders have required fields';
    END IF;
END $$;

-- Check for orders with invalid status values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM orders
    WHERE status NOT IN ('Pending', 'Awaiting Confirmation', 'Completed', 'Rejected');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orders with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All orders have valid status values';
    END IF;
END $$;

-- Check for businesses with invalid membership_tier values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM businesses
    WHERE membership_tier NOT IN ('VIP', 'Premium', 'Free');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % businesses with invalid membership_tier values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All businesses have valid membership_tier values';
    END IF;
END $$;

-- Check for expired memberships
DO $$
DECLARE
    expired_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO expired_count
    FROM businesses
    WHERE membership_expiry_date IS NOT NULL
    AND membership_expiry_date < NOW()
    AND membership_tier != 'Free';

    IF expired_count > 0 THEN
        RAISE NOTICE 'ℹ️  INFO: Found % businesses with expired memberships', expired_count;
    ELSE
        RAISE NOTICE '✅ PASS: No expired memberships found (or all are Free tier)';
    END IF;
END $$;

-- ============================================
-- 4. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_orders INTEGER;
    pending_count INTEGER;
    awaiting_confirmation_count INTEGER;
    completed_count INTEGER;
    rejected_count INTEGER;
    total_revenue NUMERIC;
    businesses_by_tier RECORD;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO pending_count FROM orders WHERE status = 'Pending';
    SELECT COUNT(*) INTO awaiting_confirmation_count FROM orders WHERE status = 'Awaiting Confirmation';
    SELECT COUNT(*) INTO completed_count FROM orders WHERE status = 'Completed';
    SELECT COUNT(*) INTO rejected_count FROM orders WHERE status = 'Rejected';
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue FROM orders WHERE status = 'Completed';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORDER STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total orders: %', total_orders;
    RAISE NOTICE 'Pending: % (%.1f%%)', pending_count,
        CASE WHEN total_orders > 0 THEN (pending_count::NUMERIC / total_orders * 100) ELSE 0 END;
    RAISE NOTICE 'Awaiting Confirmation: % (%.1f%%)', awaiting_confirmation_count,
        CASE WHEN total_orders > 0 THEN (awaiting_confirmation_count::NUMERIC / total_orders * 100) ELSE 0 END;
    RAISE NOTICE 'Completed: % (%.1f%%)', completed_count,
        CASE WHEN total_orders > 0 THEN (completed_count::NUMERIC / total_orders * 100) ELSE 0 END;
    RAISE NOTICE 'Rejected: % (%.1f%%)', rejected_count,
        CASE WHEN total_orders > 0 THEN (rejected_count::NUMERIC / total_orders * 100) ELSE 0 END;
    RAISE NOTICE 'Total Revenue (Completed): % VND', total_revenue;
    RAISE NOTICE '========================================';
END $$;

-- Membership tier distribution
DO $$
DECLARE
    tier_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MEMBERSHIP TIER DISTRIBUTION';
    RAISE NOTICE '========================================';
    
    FOR tier_record IN
        SELECT membership_tier, COUNT(*) as count
        FROM businesses
        GROUP BY membership_tier
        ORDER BY 
            CASE membership_tier
                WHEN 'VIP' THEN 1
                WHEN 'Premium' THEN 2
                WHEN 'Free' THEN 3
            END
    LOOP
        RAISE NOTICE '%: % businesses', tier_record.membership_tier, tier_record.count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- Business distribution by orders
DO $$
DECLARE
    business_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ORDERS BY BUSINESS (Top 10)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT b.id, b.name, COUNT(o.id) as order_count,
               COUNT(CASE WHEN o.status = 'Completed' THEN 1 END) as completed_count,
               COALESCE(SUM(CASE WHEN o.status = 'Completed' THEN o.amount ELSE 0 END), 0) as total_revenue
        FROM businesses b
        LEFT JOIN orders o ON b.id = o.business_id
        GROUP BY b.id, b.name
        HAVING COUNT(o.id) > 0
        ORDER BY order_count DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '% (ID: %): % orders (% completed, Revenue: % VND)', 
            business_record.name, 
            business_record.id, 
            business_record.order_count,
            business_record.completed_count,
            business_record.total_revenue;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample orders (first 5)
DO $$
DECLARE
    order_record RECORD;
    order_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE ORDERS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR order_record IN
        SELECT o.id, o.package_name, o.amount, o.status, o.submitted_at,
               b.name as business_name
        FROM orders o
        LEFT JOIN businesses b ON o.business_id = b.id
        ORDER BY o.submitted_at DESC
        LIMIT 5
    LOOP
        order_count := order_count + 1;
        RAISE NOTICE '%: % - % (Business: %, Amount: % VND, Status: %, Date: %)', 
            order_count,
            order_record.package_name,
            SUBSTRING(order_record.id::TEXT FROM 1 FOR 8),
            COALESCE(order_record.business_name, 'N/A'),
            order_record.amount,
            order_record.status,
            order_record.submitted_at;
    END LOOP;
    
    IF order_count = 0 THEN
        RAISE NOTICE 'No orders found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.11 Membership & Billing Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test membership package display in UI';
    RAISE NOTICE '2. Test order creation (upgrade/renewal request)';
    RAISE NOTICE '3. Test order history display';
    RAISE NOTICE '4. Test payment info display';
    RAISE NOTICE '5. Test RLS policies with different user roles';
    RAISE NOTICE '6. Verify membership expiry date handling';
END $$;




