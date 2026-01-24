-- ============================================
-- ULTRA-DEFENSIVE BLOG FORTIFICATION
-- Objective: Production stability, SEO safety, and Routing integrity
-- ============================================
-- 1. SLUG INTEGRITY: Ensure routing never breaks due to duplicates
-- First, identify any potential duplicates and make them unique (if any exist)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT slug,
        COUNT(*)
    FROM public.blog_posts
    GROUP BY slug
    HAVING COUNT(*) > 1
) LOOP -- Append ID to duplicates to make them unique before index creation
UPDATE public.blog_posts
SET slug = slug || '-' || id::text
WHERE slug = r.slug;
END LOOP;
END $$;
DROP INDEX IF EXISTS blog_posts_slug_unique;
CREATE UNIQUE INDEX blog_posts_slug_unique ON public.blog_posts (slug);
-- 2. SEO JSONB SAFETY: Ensure Frontend never crashes on undefined keys
-- Defensive: Fill missing keys with empty strings before adding constraint
UPDATE public.blog_posts
SET seo = jsonb_build_object(
        'title',
        COALESCE(seo->>'title', ''),
        'description',
        COALESCE(seo->>'description', ''),
        'keywords',
        COALESCE(seo->>'keywords', '')
    )
WHERE NOT (
        seo ? 'title'
        AND seo ? 'description'
        AND seo ? 'keywords'
    );
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS seo_has_required_keys;
ALTER TABLE public.blog_posts
ADD CONSTRAINT seo_has_required_keys CHECK (
        seo ? 'title'
        AND seo ? 'description'
        AND seo ? 'keywords'
    );
-- 3. UPDATED_AT AUTOMATION: Real-time cache/SEO synchronization
-- Function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Attach trigger to blog_posts
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at BEFORE
UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- 4. OPTIONAL: Add standard status index for faster filtered queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status)
WHERE status = 'Published';
-- ============================================
-- RESULT: Blog system is now Industrial-Grade.
-- ============================================