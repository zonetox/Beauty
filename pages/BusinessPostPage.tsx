

import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import NotFoundPage from './NotFoundPage.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

const BusinessPostPage: React.FC = () => {
  const { businessSlug, postSlug } = useParams<{ businessSlug: string; postSlug: string }>();
  const { getBusinessBySlug } = useBusinessData();
  const { posts, getPostBySlug, incrementViewCount } = useBusinessBlogData();

  const business = getBusinessBySlug(businessSlug || '');
  const post = getPostBySlug(postSlug || '');
  
  // Get the most up-to-date post data from the full list for the view count
  const currentPostData = useMemo(() => {
    return posts.find(p => p.id === post?.id);
  }, [posts, post]);


  useEffect(() => {
    if (post) {
        const incrementedKey = `view_incremented_biz_post_${post.id}`;
        if (!sessionStorage.getItem(incrementedKey)) {
            incrementViewCount(post.id);
            sessionStorage.setItem(incrementedKey, 'true');
        }
    }
  }, [post, incrementViewCount]);

  if (!business || !post || !currentPostData) {
    return <NotFoundPage />;
  }

  return (
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
          <img src={getOptimizedSupabaseUrl(post.imageUrl, { width: 1200, quality: 85 })} alt={post.title} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-8" />
          <div className="prose lg:prose-xl max-w-none">
            <SafeHtmlRenderer html={post.content} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPostPage;