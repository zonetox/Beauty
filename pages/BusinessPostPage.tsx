// C2.4 - Blog Platform - Business Blog Post Detail Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import NotFoundPage from './NotFoundPage.tsx';
import LoadingState from '../components/LoadingState.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

const BusinessPostPage: React.FC = () => {
  const { businessSlug, postSlug } = useParams<{ businessSlug: string; postSlug: string }>();
  const { getBusinessBySlug, businessLoading } = useBusinessData();
  const { posts, getPostBySlug, incrementViewCount, loading: blogLoading } = useBusinessBlogData();

  const business = useMemo(() => {
    if (!businessSlug) return null;
    return getBusinessBySlug(businessSlug);
  }, [businessSlug, getBusinessBySlug]);

  const post = useMemo(() => {
    if (!postSlug) return null;
    return getPostBySlug(postSlug);
  }, [postSlug, getPostBySlug]);
  
  // Get the most up-to-date post data from the full list for the view count
  const currentPostData = useMemo(() => {
    return posts.find(p => p.id === post?.id);
  }, [posts, post]);

  const isLoading = businessLoading || blogLoading;

  useEffect(() => {
    if (post) {
        const incrementedKey = `view_incremented_biz_post_${post.id}`;
        if (!sessionStorage.getItem(incrementedKey)) {
            incrementViewCount(post.id);
            sessionStorage.setItem(incrementedKey, 'true');
        }
    }
  }, [post, incrementViewCount]);

  if (isLoading) {
    return (
      <>
        <SEOHead title="Đang tải..." description="Đang tải bài viết..." />
        <LoadingState message="Đang tải bài viết..." fullScreen={true} />
      </>
    );
  }

  if (!business || !post || !currentPostData) {
    return <NotFoundPage />;
  }

  // SEO metadata
  const seoTitle = `${post.title} | ${business.name} | 1Beauty.asia`;
  const seoDescription = post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') || `${post.title} từ ${business.name}`;
  const seoImage = getOptimizedSupabaseUrl(post.imageUrl, { width: 1200, quality: 85 });
  const seoUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/business/${business.slug}/post/${post.slug}`
    : '';

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="article"
      />
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <Link to={`/business/${business.slug}`} className="text-primary font-semibold hover:underline">
                &larr; Quay lại trang của {business.name}
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-neutral-dark mt-4">{post.title}</h1>
              <div className="mt-4 text-sm text-gray-500">
                <span>Đăng bởi {post.author}</span>
                <span className="mx-2">&bull;</span>
                <span>{post.publishedDate ? new Date(post.publishedDate).toLocaleDateString('vi-VN') : ''}</span>
                 <span className="mx-2">&bull;</span>
                <span>{currentPostData.viewCount.toLocaleString()} lượt xem</span>
              </div>
            </header>
            <img 
              src={getOptimizedSupabaseUrl(post.imageUrl, { width: 1200, quality: 85 })} 
              alt={post.title} 
              className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8" 
              loading="lazy"
            />
            <div className="prose lg:prose-xl max-w-none">
              <SafeHtmlRenderer html={post.content} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessPostPage;
