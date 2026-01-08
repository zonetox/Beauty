-- ============================================
-- G1.4 - Auth & RLS Tests
-- Tuân thủ Master Plan v1.1
-- Comprehensive tests for RLS policies and role permissions
-- ============================================
-- 
-- Mục đích: Test RLS policies với các roles khác nhau
-- Cách chạy: Tạo test users trong Supabase Auth, sau đó chạy script này
-- 
-- LƯU Ý: Script này cần chạy với service role key hoặc với từng user context
-- ============================================

DO $$
DECLARE
    v_test_count INTEGER := 0;
    v_pass_count INTEGER := 0;
    v_fail_count INTEGER := 0;
    v_test_name TEXT;
    v_result TEXT;
    v_test_user_id UUID;
    v_test_business_id BIGINT;
    v_test_admin_email TEXT := 'test-admin@1beauty.asia';
    v_test_business_owner_email TEXT := 'test-owner@1beauty.asia';
    v_test_user_email TEXT := 'test-user@1beauty.asia';
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'G1.4 - Auth & RLS Tests';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  LƯU Ý: Script này test RLS policies structure.';
    RAISE NOTICE 'Để test thực tế, cần:';
    RAISE NOTICE '1. Tạo test users trong Supabase Auth';
    RAISE NOTICE '2. Chạy tests với từng user context';
    RAISE NOTICE '3. Verify policies hoạt động đúng';
    RAISE NOTICE '';

    -- ============================================
    -- 1. VERIFY HELPER FUNCTIONS
    -- ============================================
    RAISE NOTICE '1. Verifying helper functions...';
    
    v_test_name := 'is_admin() function exists and works';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN
        -- Test với email không phải admin
        IF (SELECT public.is_admin('not-admin@test.com')) = FALSE THEN
            v_pass_count := v_pass_count + 1;
            RAISE NOTICE '   [PASS] %', v_test_name;
        ELSE
            v_fail_count := v_fail_count + 1;
            RAISE WARNING '   [FAIL] % - Function returns true for non-admin', v_test_name;
        END IF;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] % - Function does not exist', v_test_name;
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
    -- 2. VERIFY RLS POLICIES STRUCTURE
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '2. Verifying RLS policies structure...';
    
    -- Test: Anonymous users can SELECT active businesses
    v_test_name := 'Anonymous: SELECT active businesses policy exists';
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
    
    -- Test: Business owners can UPDATE their own business
    v_test_name := 'Business Owner: UPDATE own business policy exists';
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
    
    -- Test: Business owners can CRUD their services
    v_test_name := 'Business Owner: CRUD own services policies exist';
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
    
    -- Test: Admin can SELECT all businesses
    v_test_name := 'Admin: SELECT all businesses policy exists';
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
    
    -- Test: Admin can DELETE businesses
    v_test_name := 'Admin: DELETE businesses policy exists';
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

    -- ============================================
    -- 3. VERIFY CROSS-TENANT PROTECTION
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '3. Verifying cross-tenant protection...';
    
    -- Test: Business owner policies check ownership
    v_test_name := 'Cross-tenant: Business owner policies check ownership';
    v_test_count := v_test_count + 1;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('services', 'deals', 'media_items', 'team_members', 'business_blog_posts')
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
          AND (qual LIKE '%is_business_owner%' OR with_check LIKE '%is_business_owner%')
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] %', v_test_name;
    END IF;
    
    -- Test: Users can only update their own reviews
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
    -- 4. VERIFY SENSITIVE TABLES PROTECTION
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '4. Verifying sensitive tables protection...';
    
    -- Test: admin_users is admin-only
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
    
    -- Test: app_settings write is admin-only
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
    -- 5. VERIFY PUBLIC READ ACCESS
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '5. Verifying public read access...';
    
    -- Test: Public can read active businesses
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
    
    -- Test: Public can read blog_posts
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
    -- 6. VERIFY UNAUTHORIZED ACCESS BLOCKING
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '6. Verifying unauthorized access blocking...';
    
    -- Test: No public INSERT to businesses
    v_test_name := 'Unauthorized: No public INSERT to businesses';
    v_test_count := v_test_count + 1;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'INSERT'
          AND (qual LIKE '%true%' OR with_check LIKE '%true%')
          AND roles = ARRAY['public']::name[]
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] % - Public can INSERT businesses', v_test_name;
    END IF;
    
    -- Test: No public DELETE to businesses
    v_test_name := 'Unauthorized: No public DELETE to businesses';
    v_test_count := v_test_count + 1;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'businesses'
          AND cmd = 'DELETE'
          AND (qual LIKE '%true%' OR qual LIKE '%TRUE%')
          AND roles = ARRAY['public']::name[]
    ) THEN
        v_pass_count := v_pass_count + 1;
        RAISE NOTICE '   [PASS] %', v_test_name;
    ELSE
        v_fail_count := v_fail_count + 1;
        RAISE WARNING '   [FAIL] % - Public can DELETE businesses', v_test_name;
    END IF;

    -- ============================================
    -- SUMMARY
    -- ============================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'G1.4 Auth & RLS Tests Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total Tests: %', v_test_count;
    RAISE NOTICE 'Passed: %', v_pass_count;
    RAISE NOTICE 'Failed: %', v_fail_count;
    RAISE NOTICE '';
    
    IF v_fail_count = 0 THEN
        RAISE NOTICE '[OK] All RLS policy structure tests passed!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps for Manual Testing:';
        RAISE NOTICE '1. Create test users in Supabase Auth:';
        RAISE NOTICE '   - Anonymous user (no auth)';
        RAISE NOTICE '   - Regular user (test-user@1beauty.asia)';
        RAISE NOTICE '   - Business owner (test-owner@1beauty.asia)';
        RAISE NOTICE '   - Admin user (test-admin@1beauty.asia)';
        RAISE NOTICE '';
        RAISE NOTICE '2. Test actual CRUD operations with each role:';
        RAISE NOTICE '   - Anonymous: Should only see active businesses';
        RAISE NOTICE '   - User: Should only see active businesses, can create reviews';
        RAISE NOTICE '   - Business Owner: Should only CRUD own business data';
        RAISE NOTICE '   - Admin: Should have full access';
        RAISE NOTICE '';
        RAISE NOTICE '3. Test cross-tenant protection:';
        RAISE NOTICE '   - Business owner tries to access other business data → Should fail';
        RAISE NOTICE '   - User tries to update other user review → Should fail';
        RAISE NOTICE '';
        RAISE NOTICE '4. Test unauthorized access:';
        RAISE NOTICE '   - Anonymous tries to INSERT business → Should fail';
        RAISE NOTICE '   - User tries to DELETE business → Should fail';
    ELSE
        RAISE WARNING '[WARN] Some tests failed. Review RLS policies.';
        RAISE NOTICE '';
        RAISE NOTICE 'Action Required:';
        RAISE NOTICE '1. Review failed tests above';
        RAISE NOTICE '2. Check database/rls_policies_v1.sql';
        RAISE NOTICE '3. Apply missing policies';
        RAISE NOTICE '4. Re-run this test script';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'For manual testing, use Supabase SQL Editor with different user contexts.';
    RAISE NOTICE 'Example: SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = ''user-id'';';
    RAISE NOTICE '';

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Auth & RLS tests failed: %', SQLERRM;
END $$;






