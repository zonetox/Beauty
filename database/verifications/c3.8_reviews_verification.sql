-- ============================================
-- C3.8 - Reviews Management Verification Script
-- ============================================
-- Purpose: Verify Reviews CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.8 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if reviews table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        RAISE EXCEPTION '❌ FAIL: reviews table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: reviews table exists';
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
            ('id'), ('user_id'), ('business_id'), ('user_name'), 
            ('user_avatar_url'), ('rating'), ('comment'), ('submitted_date'), 
            ('status'), ('reply')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reviews'
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
        AND table_name = 'reviews'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check rating constraint (1-5)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'public'
        AND constraint_name LIKE '%rating%'
        AND constraint_name LIKE '%check%'
    ) THEN
        RAISE WARNING '⚠️  WARNING: Rating check constraint (1-5) may not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Rating check constraint exists';
    END IF;
END $$;

-- Check review_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'review_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: review_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: review_status enum exists';
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
        WHERE schemaname = 'public' AND tablename = 'reviews'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on reviews table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on reviews table';
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
                ('reviews_select_public_visible_or_own_or_owner_or_admin'),
                ('reviews_insert_authenticated_or_admin'),
                ('reviews_update_own_or_owner_or_admin'),
                ('reviews_delete_own_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'reviews'
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

-- Check for reviews with invalid business_id (orphaned reviews)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM reviews r
    LEFT JOIN businesses b ON r.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned reviews (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned reviews found';
    END IF;
END $$;

-- Check for reviews with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM reviews
    WHERE user_name IS NULL OR user_name = ''
       OR business_id IS NULL
       OR rating IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % reviews with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All reviews have required fields';
    END IF;
END $$;

-- Check for reviews with invalid rating values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM reviews
    WHERE rating < 1 OR rating > 5;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % reviews with invalid rating values (must be 1-5)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All reviews have valid rating values (1-5)';
    END IF;
END $$;

-- Check for reviews with invalid status values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM reviews
    WHERE status NOT IN ('Visible', 'Hidden');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % reviews with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All reviews have valid status values';
    END IF;
END $$;

-- Check for reviews with reply but missing replied_date
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM reviews
    WHERE reply IS NOT NULL
    AND (reply->>'replied_date' IS NULL OR reply->>'replied_date' = '');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % reviews with reply but missing replied_date', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All replies have replied_date';
    END IF;
END $$;

-- ============================================
-- 4. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_reviews INTEGER;
    visible_count INTEGER;
    hidden_count INTEGER;
    reviews_with_replies INTEGER;
    avg_rating NUMERIC;
    rating_distribution RECORD;
BEGIN
    SELECT COUNT(*) INTO total_reviews FROM reviews;
    SELECT COUNT(*) INTO visible_count FROM reviews WHERE status = 'Visible';
    SELECT COUNT(*) INTO hidden_count FROM reviews WHERE status = 'Hidden';
    SELECT COUNT(*) INTO reviews_with_replies FROM reviews WHERE reply IS NOT NULL;
    SELECT AVG(rating) INTO avg_rating FROM reviews;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REVIEW STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total reviews: %', total_reviews;
    RAISE NOTICE 'Visible reviews: % (%.1f%%)', visible_count,
        CASE WHEN total_reviews > 0 THEN (visible_count::NUMERIC / total_reviews * 100) ELSE 0 END;
    RAISE NOTICE 'Hidden reviews: % (%.1f%%)', hidden_count,
        CASE WHEN total_reviews > 0 THEN (hidden_count::NUMERIC / total_reviews * 100) ELSE 0 END;
    RAISE NOTICE 'Reviews with replies: % (%.1f%%)', reviews_with_replies,
        CASE WHEN total_reviews > 0 THEN (reviews_with_replies::NUMERIC / total_reviews * 100) ELSE 0 END;
    RAISE NOTICE 'Average rating: %.2f', COALESCE(avg_rating, 0);
    RAISE NOTICE '========================================';
END $$;

-- Rating distribution
DO $$
DECLARE
    rating_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RATING DISTRIBUTION';
    RAISE NOTICE '========================================';
    
    FOR rating_record IN
        SELECT rating, COUNT(*) as count
        FROM reviews
        GROUP BY rating
        ORDER BY rating DESC
    LOOP
        RAISE NOTICE '% stars: % reviews', rating_record.rating, rating_record.count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- Business distribution
DO $$
DECLARE
    business_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REVIEWS BY BUSINESS (Top 10)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT b.id, b.name, COUNT(r.id) as review_count,
               COUNT(CASE WHEN r.status = 'Visible' THEN 1 END) as visible_count,
               AVG(r.rating) as avg_rating
        FROM businesses b
        LEFT JOIN reviews r ON b.id = r.business_id
        GROUP BY b.id, b.name
        HAVING COUNT(r.id) > 0
        ORDER BY review_count DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '% (ID: %): % reviews (% visible, avg rating: %.2f)', 
            business_record.name, 
            business_record.id, 
            business_record.review_count,
            business_record.visible_count,
            business_record.avg_rating;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample reviews (first 5)
DO $$
DECLARE
    review_record RECORD;
    review_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE REVIEWS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR review_record IN
        SELECT r.id, r.rating, r.status, r.user_name, r.comment,
               b.name as business_name, r.submitted_date,
               CASE WHEN r.reply IS NOT NULL THEN 'Yes' ELSE 'No' END as has_reply
        FROM reviews r
        LEFT JOIN businesses b ON r.business_id = b.id
        ORDER BY r.submitted_date DESC
        LIMIT 5
    LOOP
        review_count := review_count + 1;
        RAISE NOTICE '%: % stars - "%" (Business: %, Status: %, Has Reply: %, Date: %)', 
            review_count,
            review_record.rating,
            SUBSTRING(review_record.comment FROM 1 FOR 50),
            COALESCE(review_record.business_name, 'N/A'),
            review_record.status,
            review_record.has_reply,
            review_record.submitted_date;
    END LOOP;
    
    IF review_count = 0 THEN
        RAISE NOTICE 'No reviews found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.8 Reviews Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test list reviews in UI';
    RAISE NOTICE '2. Test reply to reviews';
    RAISE NOTICE '3. Test hide/show reviews';
    RAISE NOTICE '4. Test rating distribution display';
    RAISE NOTICE '5. Test filters (by status, by rating)';
    RAISE NOTICE '6. Test RLS policies with different user roles';
END $$;




