-- ============================================
-- Enhance Blog System (Objective: Bulk Upload)
-- 1. Create blog_categories table
-- 2. Upgrade blog_posts table with SEO and status
-- ============================================
-- 1. Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Upgrade blog_posts table
DO $$ BEGIN -- Add status column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'status'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN status TEXT DEFAULT 'Published' CHECK (status IN ('Draft', 'Published'));
END IF;
-- Add SEO column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'seo'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN seo JSONB DEFAULT '{"title": "", "description": "", "keywords": ""}'::JSONB;
END IF;
-- Add is_featured column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'is_featured'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
END IF;
-- Add updated_at column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END IF;
END $$;
-- Enable RLS on blog_categories
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
-- RLS Policies for blog_categories
DROP POLICY IF EXISTS "blog_categories_select_public" ON public.blog_categories;
CREATE POLICY "blog_categories_select_public" ON public.blog_categories FOR
SELECT USING (TRUE);
DROP POLICY IF EXISTS "blog_categories_admin_all" ON public.blog_categories;
CREATE POLICY "blog_categories_admin_all" ON public.blog_categories FOR ALL USING (public.is_admin(public.get_user_email())) WITH CHECK (public.is_admin(public.get_user_email()));
-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_categories_name ON public.blog_categories(name);