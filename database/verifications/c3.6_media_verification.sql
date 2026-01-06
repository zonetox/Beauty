-- ============================================
-- C3.6 - Media Management Verification Script
-- ============================================
-- Purpose: Verify Media CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.6 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if media_items table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_items') THEN
        RAISE EXCEPTION '❌ FAIL: media_items table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: media_items table exists';
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
            ('id'), ('business_id'), ('url'), ('type'), 
            ('category'), ('title'), ('description'), ('position')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'media_items'
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
        AND table_name = 'media_items'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check media_type enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'media_type'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: media_type enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: media_type enum exists';
    END IF;
END $$;

-- Check media_category enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'media_category'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: media_category enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: media_category enum exists';
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
        WHERE schemaname = 'public' AND tablename = 'media_items'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on media_items table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on media_items table';
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
                ('media_items_select_public_or_owner_or_admin'),
                ('media_items_insert_owner_or_admin'),
                ('media_items_update_owner_or_admin'),
                ('media_items_delete_owner_or_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'media_items'
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

-- Check for media_items with invalid business_id (orphaned media)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM media_items m
    LEFT JOIN businesses b ON m.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned media items (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned media items found';
    END IF;
END $$;

-- Check for media_items with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM media_items
    WHERE url IS NULL OR url = ''
       OR business_id IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % media items with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All media items have required fields';
    END IF;
END $$;

-- Check for media_items with invalid type values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM media_items
    WHERE type NOT IN ('IMAGE', 'VIDEO');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % media items with invalid type values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All media items have valid type values';
    END IF;
END $$;

-- Check for media_items with invalid category values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM media_items
    WHERE category NOT IN ('Uncategorized', 'Interior', 'Exterior', 'Staff', 'Products');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % media items with invalid category values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All media items have valid category values';
    END IF;
END $$;

-- Check for media_items with invalid position values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM media_items
    WHERE position IS NULL OR position < 0;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % media items with invalid position values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All media items have valid position values';
    END IF;
END $$;

-- ============================================
-- 4. STORAGE VERIFICATION
-- ============================================

-- Check if business-gallery bucket exists (manual check required)
DO $$
BEGIN
    RAISE NOTICE 'ℹ️  INFO: Please verify business-gallery bucket exists in Supabase Storage';
    RAISE NOTICE 'ℹ️  INFO: Storage policies should allow business owners to upload to business/{business_id}/gallery/';
    RAISE NOTICE 'ℹ️  INFO: Previous code used business-assets bucket - verify migration to business-gallery';
END $$;

-- ============================================
-- 5. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_media INTEGER;
    images_count INTEGER;
    videos_count INTEGER;
    media_with_titles INTEGER;
    media_with_descriptions INTEGER;
    avg_position NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_media FROM media_items;
    SELECT COUNT(*) INTO images_count FROM media_items WHERE type = 'IMAGE';
    SELECT COUNT(*) INTO videos_count FROM media_items WHERE type = 'VIDEO';
    SELECT COUNT(*) INTO media_with_titles FROM media_items WHERE title IS NOT NULL AND title != '';
    SELECT COUNT(*) INTO media_with_descriptions FROM media_items WHERE description IS NOT NULL AND description != '';
    SELECT AVG(position) INTO avg_position FROM media_items;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MEDIA STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total media items: %', total_media;
    RAISE NOTICE 'Images: % (%.1f%%)', images_count, 
        CASE WHEN total_media > 0 THEN (images_count::NUMERIC / total_media * 100) ELSE 0 END;
    RAISE NOTICE 'Videos: % (%.1f%%)', videos_count,
        CASE WHEN total_media > 0 THEN (videos_count::NUMERIC / total_media * 100) ELSE 0 END;
    RAISE NOTICE 'Media with titles: % (%.1f%%)', media_with_titles,
        CASE WHEN total_media > 0 THEN (media_with_titles::NUMERIC / total_media * 100) ELSE 0 END;
    RAISE NOTICE 'Media with descriptions: % (%.1f%%)', media_with_descriptions,
        CASE WHEN total_media > 0 THEN (media_with_descriptions::NUMERIC / total_media * 100) ELSE 0 END;
    RAISE NOTICE 'Average position: %', COALESCE(avg_position, 0);
    RAISE NOTICE '========================================';
END $$;

-- Category distribution
DO $$
DECLARE
    category_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CATEGORY DISTRIBUTION';
    RAISE NOTICE '========================================';
    
    FOR category_record IN
        SELECT category, COUNT(*) as count
        FROM media_items
        GROUP BY category
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '%: % items', category_record.category, category_record.count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample media items (first 5)
DO $$
DECLARE
    media_record RECORD;
    media_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE MEDIA ITEMS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR media_record IN
        SELECT m.id, m.type, m.category, m.title, m.business_id, b.name as business_name, m.position
        FROM media_items m
        LEFT JOIN businesses b ON m.business_id = b.id
        ORDER BY m.business_id, m.position
        LIMIT 5
    LOOP
        media_count := media_count + 1;
        RAISE NOTICE '%: % - % (Business: %, Category: %, Position: %)', 
            media_count, 
            media_record.type, 
            COALESCE(media_record.title, 'Untitled'),
            COALESCE(media_record.business_name, 'N/A'),
            media_record.category,
            media_record.position;
    END LOOP;
    
    IF media_count = 0 THEN
        RAISE NOTICE 'No media items found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.6 Media Management Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test CRUD operations in UI';
    RAISE NOTICE '2. Test file upload to Supabase Storage (business-gallery bucket)';
    RAISE NOTICE '3. Test RLS policies with different user roles';
    RAISE NOTICE '4. Verify drag-and-drop reordering works';
    RAISE NOTICE '5. Verify category filtering works';
    RAISE NOTICE '6. Verify file deletion from Storage works';
END $$;




