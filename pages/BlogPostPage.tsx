// FINAL PHASE FIX: Blog Detail Page
// Minimal implementation using existing BlogDataContext and SEOHead

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBlogData } from '../contexts/BlogDataContext.tsx';
import SEOHead from '../components/SEOHead.tsx';
import LoadingState from '../components/LoadingState.tsx';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, loading } = useBlogData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingState message="Loading blog post..." />
      </div>
    );
  }

  if (!slug) {
    return <Navigate to="/blog" replace />;
  }

  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // FINAL PHASE FIX: Extract SEO data from database
  // Note: BlogPost interface does not have SEO field, using available fields
  const seoTitle = post.title;
  const seoDescription = post.excerpt || '';
  const seoKeywords = post.category || '';
  const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog/${post.slug}` : '';

  return (
    <>
      {/* FINAL PHASE FIX: Render SEO meta tags from database */}
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={seoUrl}
        type="article"
      />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              {post.category && (
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  {post.category}
                </span>
              )}
              <h1 className="text-4xl font-bold font-serif text-neutral-dark mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-neutral-light text-sm">
                {post.author && (
                  <span className="font-medium">By {post.author}</span>
                )}
                {post.date && (
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                )}
                {post.viewCount !== undefined && (
                  <span>{post.viewCount} views</span>
                )}
              </div>
            </header>

            {/* Featured Image */}
            {post.imageUrl && (
              <div className="mb-8">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;
