-- ============================================
-- C3.10 - Analytics Dashboard Verification Script
-- ============================================
-- Purpose: Verify Analytics dashboard data sources and related tables
-- Usage: Run this script after implementing C3.10 to verify everything works
-- Date: 2025-01-06
-- Note: Analytics currently uses mock data. Real analytics tracking will be implemented in Phase D.
-- ============================================

-- ============================================
-- 1. VERIFY ANALYTICS DATA SOURCES
-- ============================================

-- Check if analytics table exists (should NOT exist - using mock data for now)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics' OR table_name = 'business_analytics') THEN
        RAISE WARNING '⚠️  WARNING: Analytics table exists. Current implementation uses mock data.';
    ELSE
        RAISE NOTICE '✅ PASS: No analytics table (using mock data - expected for Phase C)';
    END IF;
END $$;

-- ============================================
-- 2. VERIFY RELATED TABLES (for future analytics calculation)
-- ============================================

-- Check businesses table (for business analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
        RAISE EXCEPTION '❌ FAIL: businesses table does not exist (required for analytics)';
    ELSE
        RAISE NOTICE '✅ PASS: businesses table exists';
    END IF;
END $$;

-- Check reviews table (for rating analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        RAISE WARNING '⚠️  WARNING: reviews table does not exist (may be needed for analytics)';
    ELSE
        RAISE NOTICE '✅ PASS: reviews table exists (can be used for rating analytics)';
    END IF;
END $$;

-- Check appointments table (for booking analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
        RAISE WARNING '⚠️  WARNING: appointments table does not exist (may be needed for analytics)';
    ELSE
        RAISE NOTICE '✅ PASS: appointments table exists (can be used for booking analytics)';
    END IF;
END $$;

-- Check orders table (for revenue analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        RAISE WARNING '⚠️  WARNING: orders table does not exist (may be needed for analytics)';
    ELSE
        RAISE NOTICE '✅ PASS: orders table exists (can be used for revenue analytics)';
    END IF;
END $$;

-- ============================================
-- 3. ANALYTICS DATA STRUCTURE VERIFICATION
-- ============================================

-- Verify BusinessAnalytics interface can be populated from existing tables
DO $$
DECLARE
    business_count INTEGER;
    review_count INTEGER;
    appointment_count INTEGER;
    order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO business_count FROM businesses;
    SELECT COUNT(*) INTO review_count FROM reviews;
    SELECT COUNT(*) INTO appointment_count FROM appointments;
    SELECT COUNT(*) INTO order_count FROM orders;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ANALYTICS DATA SOURCES AVAILABILITY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Businesses: % (for business analytics)', business_count;
    RAISE NOTICE 'Reviews: % (for rating analytics)', review_count;
    RAISE NOTICE 'Appointments: % (for booking analytics)', appointment_count;
    RAISE NOTICE 'Orders: % (for revenue analytics)', order_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'ℹ️  INFO: Analytics dashboard currently uses mock data.';
    RAISE NOTICE 'ℹ️  INFO: Real analytics tracking will be implemented in Phase D.';
    RAISE NOTICE 'ℹ️  INFO: Data sources above can be used to calculate real analytics.';
END $$;

-- ============================================
-- 4. SAMPLE ANALYTICS CALCULATION (for reference)
-- ============================================

-- Example: Calculate average rating per business (for analytics)
DO $$
DECLARE
    business_record RECORD;
    sample_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE ANALYTICS CALCULATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Average Rating by Business (Top 5):';
    
    FOR business_record IN
        SELECT b.id, b.name, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
        FROM businesses b
        LEFT JOIN reviews r ON b.id = r.business_id
        WHERE r.status = 'Visible' OR r.status IS NULL
        GROUP BY b.id, b.name
        HAVING COUNT(r.id) > 0
        ORDER BY avg_rating DESC
        LIMIT 5
    LOOP
        sample_count := sample_count + 1;
        RAISE NOTICE '%: % (ID: %) - Avg Rating: %.2f (% reviews)', 
            sample_count,
            business_record.name,
            business_record.id,
            business_record.avg_rating,
            business_record.review_count;
    END LOOP;
    
    IF sample_count = 0 THEN
        RAISE NOTICE 'No businesses with reviews found';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Example: Calculate appointment statistics (for analytics)
DO $$
DECLARE
    total_appointments INTEGER;
    pending_count INTEGER;
    confirmed_count INTEGER;
    completed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_appointments FROM appointments;
    SELECT COUNT(*) INTO pending_count FROM appointments WHERE status = 'Pending';
    SELECT COUNT(*) INTO confirmed_count FROM appointments WHERE status = 'Confirmed';
    SELECT COUNT(*) INTO completed_count FROM appointments WHERE status = 'Completed';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'APPOINTMENT STATISTICS (for analytics)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total appointments: %', total_appointments;
    RAISE NOTICE 'Pending: %', pending_count;
    RAISE NOTICE 'Confirmed: %', confirmed_count;
    RAISE NOTICE 'Completed: %', completed_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.10 Analytics Dashboard Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Current Status:';
    RAISE NOTICE '- Analytics dashboard uses mock data (expected for Phase C)';
    RAISE NOTICE '- Related tables exist and can be used for real analytics';
    RAISE NOTICE '- Real analytics tracking will be implemented in Phase D';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps (Phase D):';
    RAISE NOTICE '1. Implement analytics tracking (page views, clicks)';
    RAISE NOTICE '2. Create analytics table or use existing tables';
    RAISE NOTICE '3. Calculate real-time analytics from data sources';
    RAISE NOTICE '4. Update AnalyticsDashboard to use real data';
END $$;



