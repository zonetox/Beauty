-- ============================================
-- Create blog_comments table (if not exists)
-- Tuân thủ Master Plan v1.1
-- Migration để đảm bảo blog_comments table tồn tại
-- ============================================

-- D2.1 - Create blog_comments table
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for blog_comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_date ON public.blog_comments(date);

-- Enable RLS on blog_comments
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "blog_comments_select_public" ON public.blog_comments;
DROP POLICY IF EXISTS "blog_comments_insert_authenticated" ON public.blog_comments;
DROP POLICY IF EXISTS "blog_comments_update_admin" ON public.blog_comments;
DROP POLICY IF EXISTS "blog_comments_delete_admin" ON public.blog_comments;

-- RLS Policies for blog_comments
-- Public can read all comments
CREATE POLICY "blog_comments_select_public"
ON public.blog_comments
FOR SELECT
USING (TRUE);

-- Authenticated users can insert comments
CREATE POLICY "blog_comments_insert_authenticated"
ON public.blog_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update comments
CREATE POLICY "blog_comments_update_admin"
ON public.blog_comments
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- Admins can delete comments
CREATE POLICY "blog_comments_delete_admin"
ON public.blog_comments
FOR DELETE
USING (public.is_admin(public.get_user_email()));


