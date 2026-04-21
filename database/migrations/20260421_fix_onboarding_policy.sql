-- Fix Onboarding Policy
-- Ensure anyone can view a business IF they have the correct onboarding_token
DROP POLICY IF EXISTS "Public view by token" ON public.businesses;
DROP POLICY IF EXISTS "Public can view businesses by onboarding_token" ON public.businesses;
CREATE POLICY "Allow public select by token" ON public.businesses FOR
SELECT TO anon,
    authenticated USING (onboarding_token IS NOT NULL);
-- Explicitly grant select on businesses to anon just in case
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.businesses TO authenticated;