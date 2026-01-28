// FINAL PHASE FIX: Blog Detail Page
// Minimal implementation using existing BlogDataContext and SEOHead

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import LoadingState from '../components/LoadingState.tsx';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer.tsx';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, loading } = useBlogData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingState message="Đang tải bài viết..." />
      </div>
    );
  }

  // MINIMALIST STABILITY FIX: Absolute defensive check
  if (!slug || !Array.isArray(blogPosts)) {
    return <Navigate to="/blog" replace />;
  }

  const post = blogPosts.find(p => p.slug === slug);

  // REDIRECTION: Must be a root return (no nested JSX wrapper)
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // ULTRA-DEFENSIVE SEO PARSING: Support object or string-fallback
  const seo = (typeof post.seo === 'object' && post.seo !== null ? post.seo : {}) as any;

  const seoTitle = seo.title || post.title || 'Bài viết | 1Beauty.asia';
  const seoDescription = seo.description || post.excerpt || '';
  const seoKeywords = seo.keywords || post.category || '';
  const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.slug}` : '';

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={seoUrl}
        type="article"
      />
      <div className="bg-background min-h-screen py-16 md:py-24 animate-fade-in">
        <div className="container mx-auto px-4">
          <article className="max-w-4xl mx-auto">
            {/* Premium Header */}
            <header className="mb-12 text-center animate-fade-in-up">
              {post.category && (
                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold font-outfit uppercase tracking-wider mb-6 border border-primary/20">
                  {post.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-outfit text-neutral-dark mb-8 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center justify-center gap-6 text-gray-500 text-sm font-medium">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {post.author[0]}
                    </div>
                    <span className="text-neutral-dark font-bold">{post.author}</span>
                  </div>
                )}
                <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
                {post.date && (
                  <time dateTime={post.date} className="flex items-center gap-1">
                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {new Date(post.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                )}
                <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
                {post.view_count !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"></path></svg>
                    {post.view_count.toLocaleString()} lượt xem
                  </span>
                )}
              </div>
            </header>

            {/* Featured Image with Glass Frame */}
            {post.image_url && (
              <div className="mb-12 relative group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <div className="relative glass-card p-2 rounded-[2rem] shadow-premium overflow-hidden transition-all duration-700 hover:scale-[1.01]">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-auto rounded-[1.5rem] object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
              </div>
            )}

            {/* Content Area - Premium Glass Card */}
            <div className="glass-card p-8 md:p-12 rounded-[2.5rem] shadow-premium animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-outfit prose-headings:text-neutral-dark prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline transition-all">
                <SafeHtmlRenderer html={post.content || ''} />
              </div>

              {/* Social Share or Footer */}
              <div className="mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-gray-400 font-outfit uppercase tracking-widest">Chia sẻ bài viết</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <button key={i} className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all">
                        <div className="w-4 h-4 border-2 border-current rounded-sm"></div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-6 py-3 bg-white/50 border border-white/20 rounded-full text-sm font-bold text-neutral-dark hover:bg-white transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                  Quay lại Blog
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;
