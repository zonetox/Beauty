-- A3.4 - Security Audit
-- Tuân thủ Master Plan v1.1
-- Comprehensive security audit: RLS policies, missing tables, security holes

DO $$
DECLARE
    v_count INTEGER;
    v_table_count INTEGER;
    v_policy_count INTEGER;
    v_missing_policies TEXT[] := ARRAY[]::TEXT[];
    v_table_name TEXT;
    v_has_rls BOOLEAN;
    v_has_policies BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'A3.4 - Security Audit';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ============================================
    -- 1. Verify all tables have RLS enabled
    -- ============================================
    RAISE NOTICE '1. Checking RLS enabled on all tables...';
    
    FOR v_table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename
    LOOP
        SELECT relrowsecurity INTO v_has_rls
        FROM pg_class 
        WHERE relname = v_table_name 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF v_has_rls THEN
            RAISE NOTICE '   [OK] % has RLS enabled', v_table_name;
        ELSE
            RAISE WARNING '   [WARN] % does NOT have RLS enabled', v_table_name;
            v_missing_policies := array_append(v_missing_policies, v_table_name || ' (RLS not enabled)');
        END IF;
    END LOOP;

    -- ============================================
    -- 2. Verify RLS policies exist for critical tables
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Checking RLS policies for critical tables...';
    
    FOR v_table_name IN 
        SELECT unnest(ARRAY[
            'profiles', 'businesses', 'services', 'deals', 'team_members', 
            'media_items', 'reviews', 'blog_posts', 'business_blog_posts',
            'admin_users', 'registration_requests', 'orders', 'appointments',
            'support_tickets', 'announcements', 'app_settings', 'page_content',
            'blog_comments', 'admin_activity_logs', 'email_notifications_log',
            'membership_packages'
        ])
    LOOP
        -- Check if table exists
        SELECT COUNT(*) INTO v_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = v_table_name;
        
        IF v_count = 0 THEN
            RAISE NOTICE '   [SKIP] % table does not exist', v_table_name;
            CONTINUE;
        END IF;
        
        -- Check if RLS is enabled
        SELECT relrowsecurity INTO v_has_rls
        FROM pg_class 
        WHERE relname = v_table_name 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF NOT v_has_rls THEN
            RAISE WARNING '   [WARN] % exists but RLS is not enabled', v_table_name;
            v_missing_policies := array_append(v_missing_policies, v_table_name || ' (RLS not enabled)');
            CONTINUE;
        END IF;
        
        -- Check if policies exist
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = v_table_name;
        
        IF v_policy_count = 0 THEN
            RAISE WARNING '   [WARN] % has RLS enabled but NO policies defined', v_table_name;
            v_missing_policies := array_append(v_missing_policies, v_table_name || ' (no policies)');
        ELSE
            RAISE NOTICE '   [OK] % has % policy/policies', v_table_name, v_policy_count;
        END IF;
    END LOOP;

    -- ============================================
    -- 3. Verify helper functions exist
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Checking helper functions...';
    
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin';
    
    IF v_count > 0 THEN
        RAISE NOTICE '   [OK] is_admin() function exists';
    ELSE
        RAISE WARNING '   [WARN] is_admin() function NOT FOUND';
        v_missing_policies := array_append(v_missing_policies, 'is_admin() function');
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'is_business_owner';
    
    IF v_count > 0 THEN
        RAISE NOTICE '   [OK] is_business_owner() function exists';
    ELSE
        RAISE WARNING '   [WARN] is_business_owner() function NOT FOUND';
        v_missing_policies := array_append(v_missing_policies, 'is_business_owner() function');
    END IF;
    
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_user_email';
    
    IF v_count > 0 THEN
        RAISE NOTICE '   [OK] get_user_email() function exists';
    ELSE
        RAISE WARNING '   [WARN] get_user_email() function NOT FOUND';
        v_missing_policies := array_append(v_missing_policies, 'get_user_email() function');
    END IF;

    -- ============================================
    -- 4. Check for security vulnerabilities
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Checking for security vulnerabilities...';
    
    -- Check if any policies allow public write access to sensitive tables
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('admin_users', 'app_settings', 'page_content')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
      AND (qual LIKE '%true%' OR with_check LIKE '%true%');
    
    IF v_count > 0 THEN
        RAISE WARNING '   [WARN] Found % policies allowing public write to sensitive tables', v_count;
        v_missing_policies := array_append(v_missing_policies, 'Public write access to sensitive tables');
    ELSE
        RAISE NOTICE '   [OK] No public write access to sensitive tables';
    END IF;
    
    -- Check if admin_users table has proper protection
    SELECT COUNT(*) INTO v_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_users'
      AND cmd = 'SELECT'
      AND (qual LIKE '%true%' OR roles = ARRAY['public']::name[]);
    
    IF v_count > 0 THEN
        RAISE WARNING '   [WARN] admin_users table may be publicly readable';
        v_missing_policies := array_append(v_missing_policies, 'admin_users public read access');
    ELSE
        RAISE NOTICE '   [OK] admin_users table is protected';
    END IF;

    -- ============================================
    -- 5. Verify new tables have RLS policies
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '5. Checking new tables (C4.9, C2.4)...';
    
    -- Check blog_comments
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'blog_comments';
    
    IF v_count = 1 THEN
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'blog_comments';
        
        IF v_policy_count > 0 THEN
            RAISE NOTICE '   [OK] blog_comments has % policy/policies', v_policy_count;
        ELSE
            RAISE WARNING '   [WARN] blog_comments table has NO policies';
            v_missing_policies := array_append(v_missing_policies, 'blog_comments (no policies)');
        END IF;
    ELSE
        RAISE NOTICE '   [SKIP] blog_comments table does not exist';
    END IF;
    
    -- Check admin_activity_logs
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'admin_activity_logs';
    
    IF v_count = 1 THEN
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_activity_logs';
        
        IF v_policy_count > 0 THEN
            RAISE NOTICE '   [OK] admin_activity_logs has % policy/policies', v_policy_count;
        ELSE
            RAISE WARNING '   [WARN] admin_activity_logs table has NO policies';
            v_missing_policies := array_append(v_missing_policies, 'admin_activity_logs (no policies)');
        END IF;
    ELSE
        RAISE NOTICE '   [SKIP] admin_activity_logs table does not exist (run migration 20250106000000_add_admin_logs_and_notifications.sql)';
    END IF;
    
    -- Check email_notifications_log
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'email_notifications_log';
    
    IF v_count = 1 THEN
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'email_notifications_log';
        
        IF v_policy_count > 0 THEN
            RAISE NOTICE '   [OK] email_notifications_log has % policy/policies', v_policy_count;
        ELSE
            RAISE WARNING '   [WARN] email_notifications_log table has NO policies';
            v_missing_policies := array_append(v_missing_policies, 'email_notifications_log (no policies)');
        END IF;
    ELSE
        RAISE NOTICE '   [SKIP] email_notifications_log table does not exist (run migration 20250106000000_add_admin_logs_and_notifications.sql)';
    END IF;
    
    -- Check membership_packages
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'membership_packages';
    
    IF v_count = 1 THEN
        SELECT COUNT(*) INTO v_policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'membership_packages';
        
        IF v_policy_count > 0 THEN
            RAISE NOTICE '   [OK] membership_packages has % policy/policies', v_policy_count;
        ELSE
            RAISE WARNING '   [WARN] membership_packages table has NO policies';
            v_missing_policies := array_append(v_missing_policies, 'membership_packages (no policies)');
        END IF;
    ELSE
        RAISE NOTICE '   [SKIP] membership_packages table does not exist';
    END IF;

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'A3.4 Security Audit Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF array_length(v_missing_policies, 1) > 0 THEN
        RAISE WARNING 'Security Issues Found:';
        FOR i IN 1..array_length(v_missing_policies, 1) LOOP
            RAISE WARNING '   - %', v_missing_policies[i];
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE 'Action Required: Fix the issues above before proceeding.';
    ELSE
        RAISE NOTICE '[OK] No security issues found. All tables have RLS enabled and policies defined.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Review RLS_MATRIX.md for policy requirements';
    RAISE NOTICE '2. Run rls_policies_v1.sql to ensure all policies are applied';
    RAISE NOTICE '3. Test policies with different user roles';
    RAISE NOTICE '4. Proceed to A3.5 - Test Matrix';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Security audit failed: %', SQLERRM;
END $$;

