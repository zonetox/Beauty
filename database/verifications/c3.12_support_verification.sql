-- ============================================
-- C3.12 - Support Verification Script
-- ============================================
-- Purpose: Verify Support tickets CRUD operations, RLS policies, and data integrity
-- Usage: Run this script after implementing C3.12 to verify everything works
-- Date: 2025-01-06
-- ============================================

-- ============================================
-- 1. SCHEMA VERIFICATION
-- ============================================

-- Check if support_tickets table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        RAISE EXCEPTION '❌ FAIL: support_tickets table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: support_tickets table exists';
    END IF;
END $$;

-- Check required columns in support_tickets table
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    SELECT ARRAY_AGG(required.column_name)
    INTO missing_columns
    FROM (
        VALUES 
            ('id'), ('business_id'), ('business_name'), ('subject'),
            ('message'), ('status'), ('created_at'), ('last_reply_at'), ('replies')
    ) required(column_name)
    LEFT JOIN (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets'
    ) existing ON existing.column_name = required.column_name
    WHERE existing.column_name IS NULL;

    IF missing_columns IS NOT NULL AND array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing columns in support_tickets table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required columns exist in support_tickets table';
    END IF;
END $$;

-- Check foreign key to businesses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND table_name = 'support_tickets'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%business_id%'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: Foreign key to businesses table does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: Foreign key to businesses exists';
    END IF;
END $$;

-- Check ticket_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ticket_status'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: ticket_status enum does not exist';
    ELSE
        RAISE NOTICE '✅ PASS: ticket_status enum exists';
    END IF;
END $$;

-- Check replies column is JSONB
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'support_tickets'
        AND column_name = 'replies'
        AND data_type = 'jsonb'
    ) THEN
        RAISE EXCEPTION '❌ FAIL: replies column is not JSONB type';
    ELSE
        RAISE NOTICE '✅ PASS: replies column is JSONB type';
    END IF;
END $$;

-- ============================================
-- 2. RLS POLICIES VERIFICATION
-- ============================================

-- Check if RLS is enabled on support_tickets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'support_tickets'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ FAIL: RLS is not enabled on support_tickets table';
    ELSE
        RAISE NOTICE '✅ PASS: RLS is enabled on support_tickets table';
    END IF;
END $$;

-- Check required RLS policies for support_tickets
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
                ('support_tickets_select_owner_or_admin'),
                ('support_tickets_insert_owner_or_admin'),
                ('support_tickets_update_owner_or_admin'),
                ('support_tickets_delete_admin')
        ) AS required(policy_name)
        WHERE NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' 
            AND tablename = 'support_tickets'
            AND policy_name = required.policy_name
        )
    LOOP
        missing_policies := array_append(missing_policies, policy_record.policy_name);
    END LOOP;

    IF array_length(missing_policies, 1) > 0 THEN
        RAISE EXCEPTION '❌ FAIL: Missing RLS policies for support_tickets: %', array_to_string(missing_policies, ', ');
    ELSE
        RAISE NOTICE '✅ PASS: All required RLS policies exist for support_tickets';
    END IF;
END $$;

-- ============================================
-- 3. DATA INTEGRITY VERIFICATION
-- ============================================

-- Check for tickets with invalid business_id
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO orphaned_count
    FROM support_tickets st
    LEFT JOIN businesses b ON st.business_id = b.id
    WHERE b.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % orphaned tickets (business_id does not exist)', orphaned_count;
    ELSE
        RAISE NOTICE '✅ PASS: No orphaned tickets found';
    END IF;
END $$;

-- Check for tickets with missing required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM support_tickets
    WHERE business_id IS NULL
       OR subject IS NULL OR subject = ''
       OR message IS NULL OR message = ''
       OR status IS NULL;

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % tickets with missing required fields', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All tickets have required fields';
    END IF;
END $$;

-- Check for tickets with invalid status values
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM support_tickets
    WHERE status NOT IN ('Open', 'In Progress', 'Closed');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % tickets with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All tickets have valid status values';
    END IF;
END $$;

-- Check for tickets with invalid replies JSONB structure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM support_tickets
    WHERE replies IS NOT NULL
    AND NOT (jsonb_typeof(replies) = 'array');

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % tickets with invalid replies structure (should be array)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All tickets have valid replies structure';
    END IF;
END $$;

-- Check for replies with required fields
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO invalid_count
    FROM support_tickets
    WHERE replies IS NOT NULL
    AND jsonb_typeof(replies) = 'array'
    AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(replies) AS reply
        WHERE NOT (reply ? 'author' AND reply ? 'content' AND reply ? 'createdAt')
    );

    IF invalid_count > 0 THEN
        RAISE WARNING '⚠️  WARNING: Found % tickets with replies missing required fields (author, content, createdAt)', invalid_count;
    ELSE
        RAISE NOTICE '✅ PASS: All replies have required fields';
    END IF;
END $$;

-- ============================================
-- 4. STATISTICS
-- ============================================

-- Display statistics
DO $$
DECLARE
    total_tickets INTEGER;
    open_count INTEGER;
    in_progress_count INTEGER;
    closed_count INTEGER;
    tickets_with_replies INTEGER;
    total_replies INTEGER;
    avg_replies_per_ticket NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_tickets FROM support_tickets;
    SELECT COUNT(*) INTO open_count FROM support_tickets WHERE status = 'Open';
    SELECT COUNT(*) INTO in_progress_count FROM support_tickets WHERE status = 'In Progress';
    SELECT COUNT(*) INTO closed_count FROM support_tickets WHERE status = 'Closed';
    
    SELECT COUNT(*) INTO tickets_with_replies
    FROM support_tickets
    WHERE replies IS NOT NULL
    AND jsonb_typeof(replies) = 'array'
    AND jsonb_array_length(replies) > 0;
    
    SELECT COALESCE(SUM(jsonb_array_length(replies)), 0) INTO total_replies
    FROM support_tickets
    WHERE replies IS NOT NULL
    AND jsonb_typeof(replies) = 'array';
    
    avg_replies_per_ticket := CASE 
        WHEN total_tickets > 0 THEN total_replies::NUMERIC / total_tickets 
        ELSE 0 
    END;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUPPORT TICKET STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total tickets: %', total_tickets;
    RAISE NOTICE 'Open: % (%.1f%%)', open_count,
        CASE WHEN total_tickets > 0 THEN (open_count::NUMERIC / total_tickets * 100) ELSE 0 END;
    RAISE NOTICE 'In Progress: % (%.1f%%)', in_progress_count,
        CASE WHEN total_tickets > 0 THEN (in_progress_count::NUMERIC / total_tickets * 100) ELSE 0 END;
    RAISE NOTICE 'Closed: % (%.1f%%)', closed_count,
        CASE WHEN total_tickets > 0 THEN (closed_count::NUMERIC / total_tickets * 100) ELSE 0 END;
    RAISE NOTICE 'Tickets with replies: %', tickets_with_replies;
    RAISE NOTICE 'Total replies: %', total_replies;
    RAISE NOTICE 'Average replies per ticket: %.2f', avg_replies_per_ticket;
    RAISE NOTICE '========================================';
END $$;

-- Business distribution by tickets
DO $$
DECLARE
    business_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TICKETS BY BUSINESS (Top 10)';
    RAISE NOTICE '========================================';
    
    FOR business_record IN
        SELECT b.id, b.name, COUNT(st.id) as ticket_count,
               COUNT(CASE WHEN st.status = 'Open' THEN 1 END) as open_count,
               COUNT(CASE WHEN st.status = 'In Progress' THEN 1 END) as in_progress_count,
               COUNT(CASE WHEN st.status = 'Closed' THEN 1 END) as closed_count
        FROM businesses b
        LEFT JOIN support_tickets st ON b.id = st.business_id
        GROUP BY b.id, b.name
        HAVING COUNT(st.id) > 0
        ORDER BY ticket_count DESC
        LIMIT 10
    LOOP
        RAISE NOTICE '% (ID: %): % tickets (% open, % in progress, % closed)', 
            business_record.name, 
            business_record.id, 
            business_record.ticket_count,
            business_record.open_count,
            business_record.in_progress_count,
            business_record.closed_count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 5. SAMPLE DATA VERIFICATION
-- ============================================

-- Display sample tickets (first 5)
DO $$
DECLARE
    ticket_record RECORD;
    ticket_count INTEGER := 0;
    reply_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE TICKETS (First 5)';
    RAISE NOTICE '========================================';
    
    FOR ticket_record IN
        SELECT st.id, st.subject, st.status, st.created_at, st.last_reply_at,
               b.name as business_name,
               CASE 
                   WHEN st.replies IS NULL OR jsonb_typeof(st.replies) != 'array' THEN 0
                   ELSE jsonb_array_length(st.replies)
               END as reply_count
        FROM support_tickets st
        LEFT JOIN businesses b ON st.business_id = b.id
        ORDER BY st.created_at DESC
        LIMIT 5
    LOOP
        ticket_count := ticket_count + 1;
        RAISE NOTICE '%: % (Business: %, Status: %, Replies: %, Created: %, Last Reply: %)', 
            ticket_count,
            ticket_record.subject,
            COALESCE(ticket_record.business_name, 'N/A'),
            ticket_record.status,
            ticket_record.reply_count,
            ticket_record.created_at,
            COALESCE(ticket_record.last_reply_at::TEXT, 'Never');
    END LOOP;
    
    IF ticket_count = 0 THEN
        RAISE NOTICE 'No tickets found in database';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ C3.12 Support Verification Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test ticket creation in UI';
    RAISE NOTICE '2. Test reply functionality';
    RAISE NOTICE '3. Test status updates';
    RAISE NOTICE '4. Test filtering by status';
    RAISE NOTICE '5. Test RLS policies with different user roles';
    RAISE NOTICE '6. Verify replies JSONB structure';
END $$;




