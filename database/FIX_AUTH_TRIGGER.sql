-- ============================================
-- SQL FIX: ROBUST PROFILE TRIGGER
-- ============================================
-- Run this in Supabase SQL Editor to ensure 
-- every account has a profile immediately.
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER SECURITY DEFINER
SET search_path = public LANGUAGE plpgsql AS $$ BEGIN
INSERT INTO public.profiles (id, full_name, avatar_url, email)
VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', NULL),
        COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
        COALESCE(new.email, NULL)
    ) ON CONFLICT (id) DO NOTHING;
RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();