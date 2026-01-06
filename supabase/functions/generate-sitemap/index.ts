// F3.4 - Dynamic Sitemap Generation
// Tuân thủ Master Plan v1.1
// Generate sitemap.xml dynamically from database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SITE_URL = Deno.env.get('SITE_URL') || 'https://1beauty.asia';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date in ISO format
    const today = new Date().toISOString().split('T')[0];

    // Start building sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Directory Page -->
  <url>
    <loc>${SITE_URL}/directory</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Blog List Page -->
  <url>
    <loc>${SITE_URL}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- About Page -->
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Contact Page -->
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Partner Registration Page -->
  <url>
    <loc>${SITE_URL}/partner-registration</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;

    // Fetch active businesses
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('slug, updated_at')
      .eq('is_active', true)
      .not('slug', 'is', null);

    if (!businessesError && businesses) {
      businesses.forEach((business) => {
        const lastmod = business.updated_at 
          ? new Date(business.updated_at).toISOString().split('T')[0]
          : today;
        sitemap += `  
  <!-- Business: ${business.slug} -->
  <url>
    <loc>${SITE_URL}/business/${business.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      });
    }

    // Fetch blog posts (platform blog - no status column, all are published)
    const { data: blogPosts, error: blogPostsError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, date')
      .not('slug', 'is', null);

    if (!blogPostsError && blogPosts) {
      blogPosts.forEach((post) => {
        // Use updated_at if available, otherwise use date field
        let lastmod = today;
        if (post.updated_at) {
          lastmod = new Date(post.updated_at).toISOString().split('T')[0];
        } else if (post.date) {
          // post.date is TIMESTAMP WITH TIME ZONE, convert to ISO date string
          lastmod = new Date(post.date).toISOString().split('T')[0];
        }
        sitemap += `  
  <!-- Blog Post: ${post.slug} -->
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });
    }

    // Fetch published business blog posts
    const { data: businessBlogPosts, error: businessBlogPostsError } = await supabase
      .from('business_blog_posts')
      .select('slug, business_id, published_date, updated_at')
      .eq('status', 'Published')
      .not('slug', 'is', null)
      .not('business_id', 'is', null);

    if (!businessBlogPostsError && businessBlogPosts) {
      // Get business slugs for business blog posts
      const businessIds = [...new Set(businessBlogPosts.map(p => p.business_id))];
      const { data: businessSlugs } = await supabase
        .from('businesses')
        .select('id, slug')
        .in('id', businessIds)
        .eq('is_active', true);

      const businessSlugMap = new Map(
        businessSlugs?.map(b => [b.id, b.slug]) || []
      );

      businessBlogPosts.forEach((post) => {
        const businessSlug = businessSlugMap.get(post.business_id);
        if (!businessSlug) return; // Skip if business not found or inactive

        let lastmod = today;
        if (post.updated_at) {
          lastmod = new Date(post.updated_at).toISOString().split('T')[0];
        } else if (post.published_date) {
          lastmod = new Date(post.published_date).toISOString().split('T')[0];
        }
        sitemap += `  
  <!-- Business Blog Post: ${businessSlug}/${post.slug} -->
  <url>
    <loc>${SITE_URL}/business/${businessSlug}/post/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      });
    }

    // Close sitemap
    sitemap += `
</urlset>`;

    // Return XML response
    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>Failed to generate sitemap</message>
  <details>${error instanceof Error ? error.message : 'Unknown error'}</details>
</error>`,
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    );
  }
});

