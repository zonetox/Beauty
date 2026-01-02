-- RLS Security Assessment & Enforcement Script (Fixed)
-- This script will:
-- 1. Enable RLS on all critical tables.
-- 2. DROP existing policies (to fix "policy already exists" errors).
-- 3. Re-create strict policies for standard access patterns.

-- ========================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ========================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 2. DEFINE POLICIES (With Drop First)
-- ========================================================

-- --- BUSINESSES ---
DROP POLICY IF EXISTS "Public businesses are viewable by everyone" ON public.businesses;
CREATE POLICY "Public businesses are viewable by everyone" 
ON public.businesses FOR SELECT 
TO public 
USING (is_active = true AND (membership_expiry_date IS NULL OR membership_expiry_date > NOW()));
-- Note: Owners can still see their business via the "Users can update own business" (which implies select if using standard CRUD policies or separate select policy)
-- Actually we need a specific SELECT policy for owners if the public one is restrictive.
-- Let's add an explicit Owner Select just in case.
DROP POLICY IF EXISTS "Owners can view own business" ON public.businesses;
CREATE POLICY "Owners can view own business"
ON public.businesses FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
CREATE POLICY "Users can update own business" 
ON public.businesses FOR UPDATE 
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can create business" ON public.businesses;
CREATE POLICY "Authenticated users can create business" 
ON public.businesses FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id); -- Ensure they claim ownership of what they create

-- --- SERVICES ---
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Public services are viewable by everyone" ON public.services; -- cleaning up potential old name
CREATE POLICY "Services are viewable by everyone" 
ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert services" ON public.services;
CREATE POLICY "Owners can insert services" 
ON public.services FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners can update services" ON public.services;
CREATE POLICY "Owners can update services" 
ON public.services FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners can delete services" ON public.services;
CREATE POLICY "Owners can delete services" 
ON public.services FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

-- --- MEDIA ITEMS ---
DROP POLICY IF EXISTS "Media items are viewable by everyone" ON public.media_items;
CREATE POLICY "Media items are viewable by everyone" 
ON public.media_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage media" ON public.media_items;
CREATE POLICY "Owners can manage media" 
ON public.media_items FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

-- --- PROFILES ---
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- --- ADMIN USERS ---
DROP POLICY IF EXISTS "Authenticated users can read admin list" ON public.admin_users;
CREATE POLICY "Authenticated users can read admin list" 
ON public.admin_users FOR SELECT 
TO authenticated 
USING (true); 

-- --- REVIEWS ---
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews" 
ON public.reviews FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- --- ORDERS & APPOINTMENTS ---
DROP POLICY IF EXISTS "Business owners view orders" ON public.orders;
CREATE POLICY "Business owners view orders" 
ON public.orders FOR SELECT 
USING (
   EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Public/Users create orders" ON public.orders;
CREATE POLICY "Public/Users create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- APPOINTMENTS (Fix for broken booking flow)
DROP POLICY IF EXISTS "Public/Users create appointments" ON public.appointments;
CREATE POLICY "Public/Users create appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (business_id IS NOT NULL); -- Allow anyone to book if valid business

DROP POLICY IF EXISTS "Public view appointments for slots" ON public.appointments;
CREATE POLICY "Public view appointments for slots" 
ON public.appointments FOR SELECT 
USING (true); -- Required for BookingModal availability check (privacy trade-off for current architecture)

DROP POLICY IF EXISTS "Owners view appointments" ON public.appointments;
CREATE POLICY "Owners view appointments" 
ON public.appointments FOR SELECT
USING (
   EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Owners update appointments" ON public.appointments;
CREATE POLICY "Owners update appointments" 
ON public.appointments FOR UPDATE
USING (
   EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

-- ========================================================
-- 3. VERIFICATION QUERY
-- ========================================================
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
