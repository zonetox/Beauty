-- ============================================
-- VERIFY AND FIX DATABASE TRIGGER
-- ============================================
-- Purpose: Ensure handle_new_user trigger exists and works correctly
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. VERIFY FUNCTION EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'Function handle_new_user does not exist!';
  ELSE
    RAISE NOTICE '✅ Function handle_new_user exists';
  END IF;
END $$;

-- 2. VERIFY TRIGGER EXISTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE WARNING '⚠️ Trigger on_auth_user_created does not exist! Creating it...';
  ELSE
    RAISE NOTICE '✅ Trigger on_auth_user_created exists';
  END IF;
END $$;

-- 3. RECREATE FUNCTION WITH ERROR HANDLING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email)
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', NULL), 
      COALESCE(new.raw_user_meta_data->>'avatar_url', NULL), 
      COALESCE(new.email, NULL)
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile created for user %', new.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    -- Still return new to allow user creation to succeed
  END;
  
  RETURN new;
END;
$$;

-- 4. ENSURE TRIGGER IS ENABLED
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFY PROFILES TABLE EXISTS AND HAS CORRECT STRUCTURE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Table public.profiles does not exist!';
  ELSE
    RAISE NOTICE '✅ Table public.profiles exists';
  END IF;
END $$;

-- 6. VERIFY RLS POLICIES EXIST
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
  AND tablename = 'profiles';
  
  IF policy_count = 0 THEN
    RAISE WARNING '⚠️ No RLS policies found for profiles table!';
  ELSE
    RAISE NOTICE '✅ Found % RLS policies for profiles table', policy_count;
  END IF;
END $$;

-- 7. VERIFY INSERT POLICY ALLOWS SELF-INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname LIKE '%insert%'
  ) THEN
    RAISE WARNING '⚠️ No INSERT policy found for profiles! Creating one...';
    
    -- Create INSERT policy
    CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());
    
    RAISE NOTICE '✅ Created profiles_insert_own policy';
  ELSE
    RAISE NOTICE '✅ INSERT policy exists for profiles';
  END IF;
END $$;

-- 8. FINAL VERIFICATION
SELECT 
  'Function' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'Trigger' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'Table' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'RLS Policies' as component,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;
