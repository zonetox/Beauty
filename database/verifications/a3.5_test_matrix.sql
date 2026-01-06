-- ============================================
-- A3.5 - Test Matrix for RLS Policies
-- Tuân thủ Master Plan v1.1
-- Comprehensive test cases for all roles and operations
-- ============================================

-- ============================================
-- TEST SETUP
-- ============================================
-- Note: This script tests RLS policies logic, not actual user authentication
-- For real testing, you need to create test users in Supabase Auth

DO $$
DECLARE
    v_test_count INTEGER := 0;
    v_pass_count INTEGER := 0;
    v_fail_count INTEGER := 0;
    v_test_name TEXT;
    v_result TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'A3.5 - RLS Test Matrix';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'This script verifies RLS policies structure and logic.';
    RAISE NOTICE 'For actual role-based testing, create test users in Supabase Auth.';
    RAISE NOTICE '';

    -- ============================================
    -- 1. VERIFY HELPER FUNCTIONS EXIST
    -- ============================================
    RAISE NOTICE '1. Verifying helper functions...';
    
    v_test_name := 'is_admin() function exists';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    v_test_name := 'is_business_owner() function exists';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_business_owner'
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    v_test_name := 'get_user_email() function exists';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_email'
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 2. VERIFY RLS POLICIES FOR ANONYMOUS USERS
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Testing Anonymous User Policies...';
    
    -- Anonymous should be able to SELECT active businesses
    v_test_name := 'Anonymous: SELECT active businesses allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'SELECT'
          AND (qual LIKE '%is_active%' OR qual LIKE '%TRUE%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Anonymous should NOT be able to INSERT businesses
    v_test_name := 'Anonymous: INSERT businesses blocked';
    v_test_count := v_test_count + 1;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'INSERT'
          AND (qual LIKE '%true%' OR with_check LIKE '%true%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Anonymous should be able to SELECT public blog posts
    v_test_name := 'Anonymous: SELECT blog_posts allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'blog_posts'
          AND cmd = 'SELECT'
          AND (qual LIKE '%true%' OR qual LIKE '%TRUE%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 3. VERIFY RLS POLICIES FOR BUSINESS OWNERS
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Testing Business Owner Policies...';
    
    -- Business owner should be able to UPDATE their own business
    v_test_name := 'Business Owner: UPDATE own business allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'UPDATE'
          AND (qual LIKE '%owner_id%' OR qual LIKE '%is_business_owner%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Business owner should be able to CRUD their services
    v_test_name := 'Business Owner: CRUD own services allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'services'
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_business_owner%' OR with_check LIKE '%is_business_owner%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Business owner should NOT be able to DELETE businesses
    v_test_name := 'Business Owner: DELETE businesses blocked';
    v_test_count := v_test_count + 1;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'DELETE'
          AND (qual LIKE '%owner_id%' OR qual LIKE '%is_business_owner%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 4. VERIFY RLS POLICIES FOR ADMINS
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Testing Admin Policies...';
    
    -- Admin should be able to SELECT all businesses
    v_test_name := 'Admin: SELECT all businesses allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'SELECT'
          AND (qual LIKE '%is_admin%' OR qual LIKE '%get_user_email%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Admin should be able to DELETE businesses
    v_test_name := 'Admin: DELETE businesses allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'DELETE'
          AND (qual LIKE '%is_admin%' OR qual LIKE '%get_user_email%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Admin should be able to CRUD blog_posts
    v_test_name := 'Admin: CRUD blog_posts allowed';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'blog_posts'
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 5. VERIFY CROSS-TENANT PROTECTION
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '5. Testing Cross-Tenant Protection...';
    
    -- Business owner policies should check owner_id
    v_test_name := 'Cross-tenant: Business owner policies check ownership';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('services', 'deals', 'media_items', 'team_members')
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_business_owner%' OR with_check LIKE '%is_business_owner%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Reviews: Users can only update their own reviews
    v_test_name := 'Cross-tenant: Users can only update own reviews';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'reviews'
          AND cmd = 'UPDATE'
          AND qual LIKE '%user_id%'
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 6. VERIFY SENSITIVE TABLES PROTECTION
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '6. Testing Sensitive Tables Protection...';
    
    -- admin_users should be admin-only
    v_test_name := 'Sensitive: admin_users is admin-only';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'admin_users'
          AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- app_settings write should be admin-only
    v_test_name := 'Sensitive: app_settings write is admin-only';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'app_settings'
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- 7. VERIFY PUBLIC READ ACCESS
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '7. Testing Public Read Access...';
    
    -- Public should be able to read active businesses
    v_test_name := 'Public: Can read active businesses';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'SELECT'
          AND (qual LIKE '%is_active%' OR qual LIKE '%TRUE%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Public should be able to read blog_posts
    v_test_name := 'Public: Can read blog_posts';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'blog_posts'
          AND cmd = 'SELECT'
          AND (qual LIKE '%true%' OR qual LIKE '%TRUE%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'A3.5 Test Matrix Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total Tests: %', v_test_count;
    RAISE NOTICE 'Passed: %', v_pass_count;
    RAISE NOTICE 'Failed: %', v_fail_count;
    RAISE NOTICE '';
    
    IF v_fail_count = 0 THEN
        RAISE NOTICE '[OK] All RLS policy structure tests passed!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps:';
        RAISE NOTICE '1. Create test users in Supabase Auth (anonymous, user, business owner, admin)';
        RAISE NOTICE '2. Test actual CRUD operations with each role';
        RAISE NOTICE '3. Verify cross-tenant data isolation';
        RAISE NOTICE '4. Test edge cases (inactive businesses, deleted records, etc.)';
    ELSE
        RAISE WARNING '[WARN] Some tests failed. Review RLS policies.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'For manual testing, use Supabase SQL Editor with different user contexts.';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Test matrix failed: %', SQLERRM;
END $$;


