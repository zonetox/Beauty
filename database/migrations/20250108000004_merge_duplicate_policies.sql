-- ============================================
-- Merge Duplicate RLS Policies
-- Created: 2025-01-08
-- Purpose: Remove duplicate permissive policies and keep only one
-- ============================================

-- ============================================
-- ADMIN_USERS - Merge SELECT policies
-- ============================================
-- Keep: "Admin users view" (more descriptive)
-- Remove: "Public can read admin list"

DROP POLICY IF EXISTS "Public can read admin list" ON public.admin_users;

-- ============================================
-- ANNOUNCEMENTS - Merge SELECT policies
-- ============================================
-- Keep: "announcements_select_public" (most concise)
-- Remove: "Announcements are publicly viewable.", "Public announcements are viewable by everyone", "Public announcements view"

DROP POLICY IF EXISTS "Announcements are publicly viewable." ON public.announcements;
DROP POLICY IF EXISTS "Public announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Public announcements view" ON public.announcements;

-- ============================================
-- APP_SETTINGS - Merge SELECT policies
-- ============================================
-- Keep: "app_settings_select_public" (most concise)
-- Remove: "Settings view", "Settings viewable by everyone"

DROP POLICY IF EXISTS "Settings view" ON public.app_settings;
DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.app_settings;

-- ============================================
-- APPOINTMENTS - Merge INSERT policies
-- ============================================
-- Keep: "appointments_insert_public_or_admin" (more specific with business check)
-- Remove: "Public/Users create appointments"

DROP POLICY IF EXISTS "Public/Users create appointments" ON public.appointments;

-- ============================================
-- BLOG_POSTS - Merge SELECT policies
-- ============================================
-- Keep: "blog_posts_select_public" (most concise)
-- Remove: "Public can read blog posts"

DROP POLICY IF EXISTS "Public can read blog posts" ON public.blog_posts;

-- ============================================
-- BUSINESSES - Merge INSERT policies
-- ============================================
-- Keep: "businesses_insert_owner" (more specific)
-- Remove: "Create business"

DROP POLICY IF EXISTS "Create business" ON public.businesses;

-- ============================================
-- ORDERS - Merge INSERT policies
-- ============================================
-- Keep: "orders_insert_public_or_admin" (more specific with business check)
-- Remove: "Public/Users create orders"

DROP POLICY IF EXISTS "Public/Users create orders" ON public.orders;

-- ============================================
-- PAGE_CONTENT - Merge SELECT policies
-- ============================================
-- Keep: "page_content_select_public" (most concise)
-- Remove: "Page content is publicly viewable.", "Page content view", "Page content viewable by everyone"

DROP POLICY IF EXISTS "Page content is publicly viewable." ON public.page_content;
DROP POLICY IF EXISTS "Page content view" ON public.page_content;
DROP POLICY IF EXISTS "Page content viewable by everyone" ON public.page_content;

-- ============================================
-- PROFILES - Merge INSERT policies
-- ============================================
-- Keep: "profiles_insert_own" (most concise, uses (select auth.uid()))
-- Remove: "Users can insert own profile"

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- ============================================
-- REGISTRATION_REQUESTS - Merge INSERT policies
-- ============================================
-- Keep: "registration_requests_insert_public" (most concise)
-- Remove: "Public can create registration requests"

DROP POLICY IF EXISTS "Public can create registration requests" ON public.registration_requests;
