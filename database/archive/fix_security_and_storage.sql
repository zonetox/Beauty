-- Fix RLS for Registration Requests
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public/anon) to submit a registration request
DROP POLICY IF EXISTS "Public can create registration requests" ON public.registration_requests;
CREATE POLICY "Public can create registration requests" ON public.registration_requests FOR INSERT WITH CHECK (true);

-- Allow admins to view/update requests (Assuming admins have specific role or we just allow service role mostly)
-- For Supabase Dashboard / Admin Context (which uses authenticated client usually with Service Role or specific Admin User)
-- Ideally AdminContext users should be identifiable. For now, let's allow authenticated users to view OWN requests if they have one? 
-- Actually, this table is for NEW partners.
-- We must ensure the Admin Dashboard (Rls issue?) can read these. 
-- Usually admins use SERVICE_ROLE key or are Super Admins. 
-- If using client-side admin page, we need a policy for "Admins" to read.
-- Assuming 'admin_users' table logic is handled via application-level checks or specific auth claims.
-- For now, let's allow "authenticated" users to SELECT? No, privacy risk.
-- Let's stick to: Public INSERT.
-- Admin Select: If current Admin App uses standard Supabase Client with Anon Key, it WON'T be able to read this unless we have a policy.
-- Re-checking Admin Context: It uses `supabase` client. Is it using service role? No, `createClient` typically uses Anon Key.
-- Admin Page relies on checking `admin_users` table for permissions. 
-- BUT RLS is Database level. 
-- Code: `supabase.from('registration_requests').select('*')` in `AdminPlatformContext.tsx`.
-- We need to allow this SELECT for users who are Admins.
-- Since we don't have Custom Claims for 'Admin' yet established in this session's context widely,
-- We will use a workaround: Allow SELECT for ALL Authenticated users? 
-- RISK: Business owners can see other requests? YES -> BAD.
-- SOLUTION: Create a function `is_admin_email()` or simply rely on the fact that ONLY Admins access the Admin Page url? RLS doesn't care about URL.
-- SAFE PATH: Create a policy allowing SELECT `USING ( auth.email() IN (SELECT email FROM admin_users) )`.
-- This assumes `admin_users` table has the emails of admins and they match Auth Emails.

CREATE POLICY "Admins can view registration requests" ON public.registration_requests
FOR SELECT USING (
    auth.role() = 'authenticated' AND
    auth.email() IN (SELECT email FROM public.admin_users)
);

CREATE POLICY "Admins can update registration requests" ON public.registration_requests
FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    auth.email() IN (SELECT email FROM public.admin_users)
);


-- STORAGE POLICIES for 'business-assets'
-- Ensure bucket exists (usually done via UI, but good to have SQL)
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true) ON CONFLICT DO NOTHING;

-- 1. Public Read Access
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING ( bucket_id = 'business-assets' );

-- 2. Authenticated Uploads (Restricted to 'authenticated' role)
-- Ideally we check if they are the owner of the folder, but folder structure is {business_id}/...
-- And business_id owner is not strictly enforced in storage paths without complex SQL.
-- Minimal Security: Authenticated users can INSERT.
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'business-assets' AND
    auth.role() = 'authenticated'
);

-- 3. Authenticated Updates (Owners/Uploaders)
DROP POLICY IF EXISTS "Authenticated Updates" ON storage.objects;
CREATE POLICY "Authenticated Updates" ON storage.objects FOR UPDATE USING (
    bucket_id = 'business-assets' AND
    auth.uid() = owner -- checks if the user owns the file object
);

-- 4. Authenticated Deletes
DROP POLICY IF EXISTS "Authenticated Deletes" ON storage.objects;
CREATE POLICY "Authenticated Deletes" ON storage.objects FOR DELETE USING (
    bucket_id = 'business-assets' AND
    auth.uid() = owner
);
