// C2.4 - Blog Platform - Blog Post Detail Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import NotFoundPage from './NotFoundPage.tsx';
import LoadingState from '../components/LoadingState.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { useBlogData } from '../contexts/BusinessDataContext.tsx';
import BlogPostCard from '../components/BlogPostCard.tsx';
import BlogComments from '../components/BlogComments.tsx';
import SafeHtmlRenderer from '../components/SafeHtmlRenderer.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

const FacebookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z"></path></svg>;
const TwitterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616v.064c0 2.298 1.634 4.212 3.791 4.649-.69.188-1.452.23-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>;
const LinkedInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"></path></svg>;

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getPostBySlug, incrementViewCount, blogPosts, loading } = useBlogData();
  const [isCopied, setIsCopied] = useState(false);
  
  const post = useMemo(() => {
    if (!slug) return null;
    return getPostBySlug(slug);
  }, [slug, getPostBySlug]);

  useEffect(() => {
      if (post) {
          incrementViewCount(post.id);
      }
  }, [post?.id, incrementViewCount]);
  
  // To get the most up-to-date view count
  const currentPostData = useMemo(() => blogPosts.find(p => p.id === post?.id), [blogPosts, post?.id]);

  const latestPosts = useMemo(() => {
      if (!post) return [];
      return blogPosts
        .filter(p => p.id !== post.id)
        .sort((a,b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime())
        .slice(0, 5);
  }, [blogPosts, post]);
  
  const categories = useMemo(() => [...new Set(blogPosts.map(p => p.category))], [blogPosts]);

  const relatedPosts = useMemo(() => {
      if (!post) return [];
      return blogPosts
          .filter(p => p.category === post.category && p.id !== post.id)
          .slice(0, 3);
  }, [blogPosts, post]);

  if (loading) {
    return (
      <>
        <SEOHead title="Đang tải..." description="Đang tải bài viết..." />
        <LoadingState message="Đang tải bài viết..." fullScreen={true} />
      </>
    );
  }

  if (!post || !currentPostData) {
    return <NotFoundPage />;
  }
  
  const postUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(postUrl);

  const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${shareText}`,
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Không thể sao chép liên kết.');
    });
  };

  const socialButtonClasses = "flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-neutral-dark hover:bg-primary/10 hover:text-primary transition-colors";

  // SEO metadata
  const seoTitle = `${post.title} | Blog Làm Đẹp | 1Beauty.asia`;
  const seoDescription = post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') || `${post.title} - ${post.category}`;
  const seoImage = getOptimizedSupabaseUrl(post.imageUrl, { width: 1200, quality: 85 });
  const seoKeywords = `${post.category}, làm đẹp, ${post.title}`;

  // Parse date for Schema.org
  const [day, month, year] = post.date.split('/');
  const datePublished = new Date(`${year}-${month}-${day}`).toISOString();

  // Enhanced Schema.org for Article
  const articleSchema = {
    headline: post.title,
    author: {
      name: post.author,
    },
    datePublished: datePublished,
    dateModified: datePublished, // Assuming same as published for now
    image: [seoImage],
    publisher: {
      name: '1Beauty.asia',
      logo: {
        url: typeof window !== 'undefined' 
          ? `${window.location.origin}/favicon.svg`
          : '',
      },
    },
  };

  return (
    <>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={seoImage}
        url={postUrl}
        type="article"
        articleSchema={articleSchema}
      />
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <main className="lg:col-span-2">
              <header className="mb-8">
                <p className="text-primary font-semibold">{post.category}</p>
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-neutral-dark mt-2">{post.title}</h1>
                <div className="mt-4 text-sm text-gray-500 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span>Đăng bởi {post.author}</span>
                  <span className="hidden sm:inline">&bull;</span>
                  <span>{post.date}</span>
                  <span className="hidden sm:inline">&bull;</span>
                  <span className="flex items-center"><EyeIcon /> {currentPostData.viewCount.toLocaleString()} lượt xem</span>
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

              <BlogComments postId={post.id} />

              <div className="mt-12 border-t pt-8 space-y-8">
                {/* --- Share Section --- */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-dark mb-4">Chia sẻ bài viết</h3>
                  <div className="flex items-center flex-wrap gap-4">
                    <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className={socialButtonClasses} aria-label="Chia sẻ trên Facebook"><FacebookIcon /></a>
                    <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className={socialButtonClasses} aria-label="Chia sẻ trên Twitter"><TwitterIcon /></a>
                    <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className={socialButtonClasses} aria-label="Chia sẻ trên LinkedIn"><LinkedInIcon /></a>
                    <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 text-sm font-semibold text-neutral-dark bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {isCopied ? 'Đã sao chép!' : 'Sao chép liên kết'}
                    </button>
                  </div>
                </div>
                
                <Link to="/blog" className="inline-block text-primary hover:underline">&larr; Quay lại danh sách Blog</Link>
              </div>
            </main>
            
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-10">
              {/* Latest Posts */}
              <div className="p-6 bg-gray-50 rounded-lg border">
                   <h3 className="text-xl font-bold font-serif text-neutral-dark mb-4">Bài viết mới nhất</h3>
                   <ul className="space-y-4">
                      {latestPosts.length > 0 ? (
                        latestPosts.map(p => (
                            <li key={p.id}>
                                <Link to={`/blog/${p.slug}`} className="group">
                                    <p className="font-semibold text-neutral-dark group-hover:text-primary transition-colors">{p.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">{p.date}</p>
                                </Link>
                            </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">Chưa có bài viết khác</li>
                      )}
                   </ul>
              </div>
              
              {/* Categories */}
              <div className="p-6 bg-gray-50 rounded-lg border">
                  <h3 className="text-xl font-bold font-serif text-neutral-dark mb-4">Chuyên mục</h3>
                  <ul className="space-y-2">
                      {categories.length > 0 ? (
                        categories.map(cat => (
                            <li key={cat}>
                               <Link to={`/blog?category=${encodeURIComponent(cat)}`} className="font-semibold text-gray-600 hover:text-primary transition-colors">
                                    {cat}
                               </Link>
                            </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">Chưa có chuyên mục</li>
                      )}
                  </ul>
              </div>
            </aside>
          </div>
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
              <section className="mt-20 pt-12 border-t">
                   <h2 className="text-3xl font-bold font-serif text-neutral-dark text-center mb-10">Bài viết liên quan</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {relatedPosts.map(p => (
                           <BlogPostCard key={p.id} post={{ ...p, url: `/blog/${p.slug}` }} />
                       ))}
                   </div>
              </section>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;
