-- ============================================
-- D2 - DATA INTEGRITY & RUNTIME STABILITY
-- Migration: Move localStorage data to database
-- Created: 2025-01-05
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

-- RLS Policies for blog_comments
-- Public can read all comments
CREATE POLICY "blog_comments_select_public"
ON public.blog_comments
FOR SELECT
USING (true);

-- Authenticated users can insert comments
CREATE POLICY "blog_comments_insert_authenticated"
ON public.blog_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update/delete comments
CREATE POLICY "blog_comments_update_admin"
ON public.blog_comments
FOR UPDATE
USING (public.is_admin(public.get_user_email()));

CREATE POLICY "blog_comments_delete_admin"
ON public.blog_comments
FOR DELETE
USING (public.is_admin(public.get_user_email()));

-- D2.2 - Create RPC functions for safe view count increment
-- Function: increment_business_view_count
CREATE OR REPLACE FUNCTION public.increment_business_view_count(p_business_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.businesses
    SET view_count = view_count + 1
    WHERE id = p_business_id;
END;
$$;

-- Function: increment_blog_view_count
CREATE OR REPLACE FUNCTION public.increment_blog_view_count(p_post_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.blog_posts
    SET view_count = view_count + 1
    WHERE id = p_post_id;
END;
$$;

-- Function: increment_business_blog_view_count
CREATE OR REPLACE FUNCTION public.increment_business_blog_view_count(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.business_blog_posts
    SET view_count = view_count + 1
    WHERE id = p_post_id;
END;
$$;

-- D2.1 - Initialize homepage content in page_content table (if not exists)
INSERT INTO public.page_content (page_name, content_data)
VALUES ('homepage', '{"heroSlides": [{"title": "Khám phá Vẻ đẹp đích thực", "subtitle": "Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn. Đặt lịch hẹn chỉ trong vài cú nhấp chuột.", "imageUrl": "https://picsum.photos/seed/hero1/1920/1080"}, {"title": "Nâng tầm Trải nghiệm làm đẹp", "subtitle": "Đọc đánh giá thật, khám phá ưu đãi độc quyền và tìm kiếm chuyên gia phù hợp nhất với bạn.", "imageUrl": "https://picsum.photos/seed/hero2/1920/1080"}], "sections": [{"id": "hp-sec-1", "type": "featuredBusinesses", "title": "Đối tác nổi bật", "subtitle": "Những địa điểm được cộng đồng yêu thích và đánh giá cao nhất.", "visible": true}, {"id": "hp-sec-2", "type": "featuredDeals", "title": "Ưu đãi hấp dẫn", "subtitle": "Đừng bỏ lỡ những khuyến mãi đặc biệt từ các đối tác hàng đầu của chúng tôi.", "visible": true}, {"id": "hp-sec-4", "type": "exploreByLocation", "title": "Khám phá theo địa điểm", "subtitle": "Tìm kiếm những viên ngọc ẩn trong khu vực của bạn.", "visible": true}, {"id": "hp-sec-3", "type": "featuredBlog", "title": "Từ Blog của chúng tôi", "subtitle": "Cập nhật những xu hướng, mẹo và kiến thức làm đẹp mới nhất.", "visible": true}]}'::JSONB)
ON CONFLICT (page_name) DO NOTHING;

-- RLS Policies for page_content (if not already set)
-- Public can read homepage content
DROP POLICY IF EXISTS "page_content_select_public" ON public.page_content;
CREATE POLICY "page_content_select_public"
ON public.page_content
FOR SELECT
USING (true);

-- Admins can update page_content
DROP POLICY IF EXISTS "page_content_update_admin" ON public.page_content;
CREATE POLICY "page_content_update_admin"
ON public.page_content
FOR UPDATE
USING (public.is_admin(public.get_user_email()))
WITH CHECK (public.is_admin(public.get_user_email()));

-- Admins can insert page_content
DROP POLICY IF EXISTS "page_content_insert_admin" ON public.page_content;
CREATE POLICY "page_content_insert_admin"
ON public.page_content
FOR INSERT
WITH CHECK (public.is_admin(public.get_user_email()));





