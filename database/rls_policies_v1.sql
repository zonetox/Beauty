-- ============================================
-- 1BEAUTY.ASIA - RLS POLICIES v1.0
-- ============================================
-- Row Level Security Policies
-- Created: 2025-01-05
-- Version: 1.0
--
-- This file contains all RLS policies for the application.
-- Policies enforce security at database level per ARCHITECTURE.md principles.
-- ============================================

-- ============================================
-- HELPER FUNCTIONS (for role checking)
-- ============================================

-- Function: Check if user is an admin (based on admin_users table)
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = user_email
    AND is_locked = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if user is a business owner
CREATE OR REPLACE FUNCTION public.is_business_owner(user_id UUID, business_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = business_id_param
    AND owner_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Get user email from auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================

-- Drop all existing policies to ensure clean state (idempotent script)
-- Note: This drops ALL policies on the tables. Run this if you need to reset policies.

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

DROP POLICY IF EXISTS "businesses_select_public_active_or_owner_or_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_owner" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_owner_or_admin" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_admin" ON public.businesses;

DROP POLICY IF EXISTS "services_select_public_or_owner_or_admin" ON public.services;
DROP POLICY IF EXISTS "services_insert_owner_or_admin" ON public.services;
DROP POLICY IF EXISTS "services_update_owner_or_admin" ON public.services;
DROP POLICY IF EXISTS "services_delete_owner_or_admin" ON public.services;

DROP POLICY IF EXISTS "deals_select_public_or_owner_or_admin" ON public.deals;
DROP POLICY IF EXISTS "deals_insert_owner_or_admin" ON public.deals;
DROP POLICY IF EXISTS "deals_update_owner_or_admin" ON public.deals;
DROP POLICY IF EXISTS "deals_delete_owner_or_admin" ON public.deals;

DROP POLICY IF EXISTS "team_members_select_public_or_owner_or_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_owner_or_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_owner_or_admin" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_owner_or_admin" ON public.team_members;

DROP POLICY IF EXISTS "media_items_select_public_or_owner_or_admin" ON public.media_items;
DROP POLICY IF EXISTS "media_items_insert_owner_or_admin" ON public.media_items;
DROP POLICY IF EXISTS "media_items_update_owner_or_admin" ON public.media_items;
DROP POLICY IF EXISTS "media_items_delete_owner_or_admin" ON public.media_items;

DROP POLICY IF EXISTS "reviews_select_public_visible_or_own_or_owner_or_admin" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated_or_admin" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own_or_owner_or_admin" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own_or_admin" ON public.reviews;

DROP POLICY IF EXISTS "blog_posts_select_public" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_admin" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_admin" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete_admin" ON public.blog_posts;

DROP POLICY IF EXISTS "business_blog_posts_select_public_published_or_owner_or_admin" ON public.business_blog_posts;
DROP POLICY IF EXISTS "business_blog_posts_insert_owner_or_admin" ON public.business_blog_posts;
DROP POLICY IF EXISTS "business_blog_posts_update_owner_or_admin" ON public.business_blog_posts;
DROP POLICY IF EXISTS "business_blog_posts_delete_owner_or_admin" ON public.business_blog_posts;

DROP POLICY IF EXISTS "admin_users_select_admin_or_own" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_admin" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_admin" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_admin" ON public.admin_users;

DROP POLICY IF EXISTS "registration_requests_select_admin" ON public.registration_requests;
DROP POLICY IF EXISTS "registration_requests_insert_public" ON public.registration_requests;
DROP POLICY IF EXISTS "registration_requests_update_admin" ON public.registration_requests;
DROP POLICY IF EXISTS "registration_requests_delete_admin" ON public.registration_requests;

DROP POLICY IF EXISTS "orders_select_owner_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_public_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_owner_or_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

DROP POLICY IF EXISTS "appointments_select_owner_or_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_public_or_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_owner_or_admin" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_owner_or_admin" ON public.appointments;

DROP POLICY IF EXISTS "support_tickets_select_owner_or_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_owner_or_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_update_owner_or_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_delete_admin" ON public.support_tickets;

DROP POLICY IF EXISTS "announcements_select_public" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;

DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_insert_admin" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_delete_admin" ON public.app_settings;

DROP POLICY IF EXISTS "page_content_select_public" ON public.page_content;
DROP POLICY IF EXISTS "page_content_insert_admin" ON public.page_content;
DROP POLICY IF EXISTS "page_content_update_admin" ON public.page_content;
DROP POLICY IF EXISTS "page_content_delete_admin" ON public.page_content;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- SELECT: Users can read their own profile, admins can read all
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Only auth system can insert (via trigger), but allow self-insert for safety
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- UPDATE: Users can update their own profile, admins can update any
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  id = auth.uid()
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- BUSINESSES POLICIES
-- ============================================

-- SELECT: Public can read active businesses, owners can read their own (even if inactive), admins can read all
CREATE POLICY "businesses_select_public_active_or_owner_or_admin"
ON public.businesses
FOR SELECT
USING (
  is_active = TRUE
  OR owner_id = auth.uid()
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Admins can create businesses, authenticated users can create businesses with owner_id = auth.uid() (for onboarding)
-- D1.2 FIX: Added businesses_insert_owner policy to allow onboarding wizard
CREATE POLICY "businesses_insert_admin"
ON public.businesses
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- INSERT: Authenticated users can create businesses where they are the owner (for onboarding wizard)
CREATE POLICY "businesses_insert_owner"
ON public.businesses
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- UPDATE: Business owners can update their own business, admins can update any
CREATE POLICY "businesses_update_owner_or_admin"
ON public.businesses
FOR UPDATE
USING (
  owner_id = auth.uid()
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  owner_id = auth.uid()
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Only admins can delete businesses
CREATE POLICY "businesses_delete_admin"
ON public.businesses
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- SERVICES POLICIES
-- ============================================

-- SELECT: Public can read services of active businesses, owners can read their own, admins can read all
CREATE POLICY "services_select_public_or_owner_or_admin"
ON public.services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = services.business_id
    AND (businesses.is_active = TRUE OR businesses.owner_id = auth.uid() OR public.is_admin(public.get_user_email()))
  )
);

-- INSERT: Business owners can insert for their business, admins can insert for any
CREATE POLICY "services_insert_owner_or_admin"
ON public.services
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update their services, admins can update any
CREATE POLICY "services_update_owner_or_admin"
ON public.services
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete their services, admins can delete any
CREATE POLICY "services_delete_owner_or_admin"
ON public.services
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- DEALS POLICIES
-- ============================================

-- SELECT: Public can read deals of active businesses, owners can read their own, admins can read all
CREATE POLICY "deals_select_public_or_owner_or_admin"
ON public.deals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = deals.business_id
    AND (businesses.is_active = TRUE OR businesses.owner_id = auth.uid() OR public.is_admin(public.get_user_email()))
  )
);

-- INSERT: Business owners can insert for their business, admins can insert for any
CREATE POLICY "deals_insert_owner_or_admin"
ON public.deals
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update their deals, admins can update any
CREATE POLICY "deals_update_owner_or_admin"
ON public.deals
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete their deals, admins can delete any
CREATE POLICY "deals_delete_owner_or_admin"
ON public.deals
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- TEAM_MEMBERS POLICIES
-- ============================================

-- SELECT: Public can read team members of active businesses, owners can read their own, admins can read all
CREATE POLICY "team_members_select_public_or_owner_or_admin"
ON public.team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = team_members.business_id
    AND (businesses.is_active = TRUE OR businesses.owner_id = auth.uid() OR public.is_admin(public.get_user_email()))
  )
);

-- INSERT: Business owners can insert for their business, admins can insert for any
CREATE POLICY "team_members_insert_owner_or_admin"
ON public.team_members
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update their team members, admins can update any
CREATE POLICY "team_members_update_owner_or_admin"
ON public.team_members
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete their team members, admins can delete any
CREATE POLICY "team_members_delete_owner_or_admin"
ON public.team_members
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- MEDIA_ITEMS POLICIES
-- ============================================

-- SELECT: Public can read media of active businesses, owners can read their own, admins can read all
CREATE POLICY "media_items_select_public_or_owner_or_admin"
ON public.media_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = media_items.business_id
    AND (businesses.is_active = TRUE OR businesses.owner_id = auth.uid() OR public.is_admin(public.get_user_email()))
  )
);

-- INSERT: Business owners can insert for their business, admins can insert for any
CREATE POLICY "media_items_insert_owner_or_admin"
ON public.media_items
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update their media, admins can update any
CREATE POLICY "media_items_update_owner_or_admin"
ON public.media_items
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete their media, admins can delete any
CREATE POLICY "media_items_delete_owner_or_admin"
ON public.media_items
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- SELECT: Public can read visible reviews of active businesses, users can read their own, business owners can read reviews of their business, admins can read all
CREATE POLICY "reviews_select_public_visible_or_own_or_owner_or_admin"
ON public.reviews
FOR SELECT
USING (
  (
    status = 'Visible'
    AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = reviews.business_id
      AND businesses.is_active = TRUE
    )
  )
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Authenticated users can create reviews, admins can create any
CREATE POLICY "reviews_insert_authenticated_or_admin"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Users can update their own reviews, business owners can update reviews of their business (for replies), admins can update any
CREATE POLICY "reviews_update_own_or_owner_or_admin"
ON public.reviews
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = reviews.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Users can delete their own reviews, admins can delete any
CREATE POLICY "reviews_delete_own_or_admin"
ON public.reviews
FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- BLOG_POSTS POLICIES (Platform blog)
-- ============================================

-- SELECT: Public can read all blog posts
CREATE POLICY "blog_posts_select_public"
ON public.blog_posts
FOR SELECT
USING (TRUE);

-- INSERT: Only admins can create blog posts
CREATE POLICY "blog_posts_insert_admin"
ON public.blog_posts
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update blog posts
CREATE POLICY "blog_posts_update_admin"
ON public.blog_posts
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete blog posts
CREATE POLICY "blog_posts_delete_admin"
ON public.blog_posts
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- BUSINESS_BLOG_POSTS POLICIES
-- ============================================

-- SELECT: Public can read published posts of active businesses, owners can read their own (including drafts), admins can read all
CREATE POLICY "business_blog_posts_select_public_published_or_owner_or_admin"
ON public.business_blog_posts
FOR SELECT
USING (
  (
    status = 'Published'
    AND EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_blog_posts.business_id
      AND businesses.is_active = TRUE
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_blog_posts.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Business owners can insert for their business, admins can insert for any
CREATE POLICY "business_blog_posts_insert_owner_or_admin"
ON public.business_blog_posts
FOR INSERT
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update their posts, admins can update any
CREATE POLICY "business_blog_posts_update_owner_or_admin"
ON public.business_blog_posts
FOR UPDATE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete their posts, admins can delete any
CREATE POLICY "business_blog_posts_delete_owner_or_admin"
ON public.business_blog_posts
FOR DELETE
USING (
  public.is_business_owner(auth.uid(), business_id)
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- ADMIN_USERS POLICIES
-- ============================================

-- SELECT: Admins can read all admin users (for management), users can read their own admin record if they are admin
CREATE POLICY "admin_users_select_admin_or_own"
ON public.admin_users
FOR SELECT
USING (
  public.is_admin(public.get_user_email())
  OR email = public.get_user_email()
);

-- INSERT: Only admins can create admin users (via Edge Function with service role)
CREATE POLICY "admin_users_insert_admin"
ON public.admin_users
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update admin users
CREATE POLICY "admin_users_update_admin"
ON public.admin_users
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete admin users
CREATE POLICY "admin_users_delete_admin"
ON public.admin_users
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- REGISTRATION_REQUESTS POLICIES
-- ============================================

-- SELECT: Only admins can read registration requests
CREATE POLICY "registration_requests_select_admin"
ON public.registration_requests
FOR SELECT
USING (public.is_admin(public.get_user_email()));

-- INSERT: Public can submit registration requests
CREATE POLICY "registration_requests_insert_public"
ON public.registration_requests
FOR INSERT
WITH CHECK (TRUE);

-- UPDATE: Only admins can update registration requests
CREATE POLICY "registration_requests_update_admin"
ON public.registration_requests
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete registration requests
CREATE POLICY "registration_requests_delete_admin"
ON public.registration_requests
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- SELECT: Business owners can read orders for their business, admins can read all
CREATE POLICY "orders_select_owner_or_admin"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Public can create orders (for membership packages), admins can create any
CREATE POLICY "orders_insert_public_or_admin"
ON public.orders
FOR INSERT
WITH CHECK (TRUE);

-- UPDATE: Business owners can update orders for their business, admins can update any
CREATE POLICY "orders_update_owner_or_admin"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = orders.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Only admins can delete orders
CREATE POLICY "orders_delete_admin"
ON public.orders
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- APPOINTMENTS POLICIES
-- ============================================

-- SELECT: Business owners can read appointments for their business, admins can read all
-- Note: Customers cannot read appointments via RLS (they don't have business_id to check)
-- This is intentional - appointments are managed by business owners
CREATE POLICY "appointments_select_owner_or_admin"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = appointments.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Public can create appointments, admins can create any
CREATE POLICY "appointments_insert_public_or_admin"
ON public.appointments
FOR INSERT
WITH CHECK (TRUE);

-- UPDATE: Business owners can update appointments for their business, admins can update any
CREATE POLICY "appointments_update_owner_or_admin"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = appointments.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = appointments.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Business owners can delete appointments for their business, admins can delete any
CREATE POLICY "appointments_delete_owner_or_admin"
ON public.appointments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = appointments.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- ============================================
-- SUPPORT_TICKETS POLICIES
-- ============================================

-- SELECT: Business owners can read tickets for their business, admins can read all
CREATE POLICY "support_tickets_select_owner_or_admin"
ON public.support_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = support_tickets.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- INSERT: Business owners can create tickets for their business, admins can create any
CREATE POLICY "support_tickets_insert_owner_or_admin"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = support_tickets.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- UPDATE: Business owners can update tickets for their business, admins can update any
CREATE POLICY "support_tickets_update_owner_or_admin"
ON public.support_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = support_tickets.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = support_tickets.business_id
    AND businesses.owner_id = auth.uid()
  )
  OR public.is_admin(public.get_user_email())
);

-- DELETE: Only admins can delete support tickets
CREATE POLICY "support_tickets_delete_admin"
ON public.support_tickets
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- ANNOUNCEMENTS POLICIES
-- ============================================

-- SELECT: Public can read announcements
CREATE POLICY "announcements_select_public"
ON public.announcements
FOR SELECT
USING (TRUE);

-- INSERT: Only admins can create announcements
CREATE POLICY "announcements_insert_admin"
ON public.announcements
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update announcements
CREATE POLICY "announcements_update_admin"
ON public.announcements
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete announcements
CREATE POLICY "announcements_delete_admin"
ON public.announcements
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- APP_SETTINGS POLICIES
-- ============================================

-- SELECT: Public can read app settings (for public configuration)
CREATE POLICY "app_settings_select_public"
ON public.app_settings
FOR SELECT
USING (TRUE);

-- INSERT: Only admins can create app settings
CREATE POLICY "app_settings_insert_admin"
ON public.app_settings
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update app settings
CREATE POLICY "app_settings_update_admin"
ON public.app_settings
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete app settings
CREATE POLICY "app_settings_delete_admin"
ON public.app_settings
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- PAGE_CONTENT POLICIES
-- ============================================

-- SELECT: Public can read page content
CREATE POLICY "page_content_select_public"
ON public.page_content
FOR SELECT
USING (TRUE);

-- INSERT: Only admins can create page content
CREATE POLICY "page_content_insert_admin"
ON public.page_content
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update page content
CREATE POLICY "page_content_update_admin"
ON public.page_content
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete page content
CREATE POLICY "page_content_delete_admin"
ON public.page_content
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- BLOG_COMMENTS POLICIES
-- ============================================

-- SELECT: Public can read all comments
DROP POLICY IF EXISTS "blog_comments_select_public" ON public.blog_comments;
CREATE POLICY "blog_comments_select_public"
ON public.blog_comments
FOR SELECT
USING (TRUE);

-- INSERT: Authenticated users can insert comments
DROP POLICY IF EXISTS "blog_comments_insert_authenticated" ON public.blog_comments;
CREATE POLICY "blog_comments_insert_authenticated"
ON public.blog_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only admins can update comments
DROP POLICY IF EXISTS "blog_comments_update_admin" ON public.blog_comments;
CREATE POLICY "blog_comments_update_admin"
ON public.blog_comments
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete comments
DROP POLICY IF EXISTS "blog_comments_delete_admin" ON public.blog_comments;
CREATE POLICY "blog_comments_delete_admin"
ON public.blog_comments
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- ADMIN_ACTIVITY_LOGS POLICIES
-- ============================================

-- SELECT: Only admins can read logs
DROP POLICY IF EXISTS "admin_activity_logs_select_admin" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_select_admin"
ON public.admin_activity_logs
FOR SELECT
USING (public.is_admin(public.get_user_email()));

-- INSERT: Only admins can insert logs
DROP POLICY IF EXISTS "admin_activity_logs_insert_admin" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_insert_admin"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete logs
DROP POLICY IF EXISTS "admin_activity_logs_delete_admin" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_delete_admin"
ON public.admin_activity_logs
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- EMAIL_NOTIFICATIONS_LOG POLICIES
-- ============================================

-- SELECT: Only admins can read notifications log
DROP POLICY IF EXISTS "email_notifications_log_select_admin" ON public.email_notifications_log;
CREATE POLICY "email_notifications_log_select_admin"
ON public.email_notifications_log
FOR SELECT
USING (public.is_admin(public.get_user_email()));

-- INSERT: Only admins can insert notifications log
DROP POLICY IF EXISTS "email_notifications_log_insert_admin" ON public.email_notifications_log;
CREATE POLICY "email_notifications_log_insert_admin"
ON public.email_notifications_log
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));

-- UPDATE: Only admins can update notifications log (mark as read)
DROP POLICY IF EXISTS "email_notifications_log_update_admin" ON public.email_notifications_log;
CREATE POLICY "email_notifications_log_update_admin"
ON public.email_notifications_log
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- DELETE: Only admins can delete notifications log
DROP POLICY IF EXISTS "email_notifications_log_delete_admin" ON public.email_notifications_log;
CREATE POLICY "email_notifications_log_delete_admin"
ON public.email_notifications_log
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- ============================================
-- END OF RLS POLICIES v1.0
-- ============================================

