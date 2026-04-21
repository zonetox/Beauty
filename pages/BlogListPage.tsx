// C2.4 - Blog Platform - Blog List Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BlogPostCard from '../components/BlogPostCard.tsx';
import SEOHead from '../components/SEOHead.tsx';
import LoadingState from '../components/LoadingState.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { BusinessBlogPostStatus } from '../types.ts';
import { useBlogData, useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import Pagination from '../components/Pagination.tsx';
import { BlogPost } from '../types.ts';

// Unified type for display purposes
interface UnifiedPost {
  id: string;
  url: string;
  title: string;
  image_url: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  view_count?: number;
  rawDate: Date;
}

const POSTS_PER_PAGE = 6;

const toBlogCardPost = (post: UnifiedPost): Partial<BlogPost> & { url: string } => ({
  id: typeof post.id === 'string' && post.id.startsWith('platform-')
    ? parseInt(post.id.replace('platform-', ''), 10)
    : 0,
  url: post.url,
  slug: post.url.split('/').pop() || '',
  title: post.title,
  image_url: post.image_url,
  excerpt: post.excerpt,
  author: post.author,
  date: post.rawDate.toISOString(),
  category: post.category,
  content: '',
  view_count: post.view_count || 0,
  status: 'Published',
});

const BlogListPage: React.FC = () => {
  const { blogPosts: platformPosts, loading: platformLoading } = useBlogData();
  const { posts: businessPosts, loading: businessBlogLoading } = useBusinessBlogData();
  const { businesses, businessLoading } = useBusinessData();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isLoading = platformLoading || businessBlogLoading || businessLoading;

  // Get category from URL on mount/location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') || '';
    const page = parseInt(params.get('page') || '1', 10);
    setSelectedCategory(category);
    setCurrentPage(page);
  }, [location.search]);

  const allPosts = useMemo((): UnifiedPost[] => {
    // 1. Process platform posts
    const processedPlatformPosts: UnifiedPost[] = platformPosts.map(post => {
      const postDate = new Date(post.date);
      return {
        id: `platform-${post.id}`,
        url: `/blog/${post.slug}`,
        title: post.title,
        image_url: post.image_url,
        excerpt: post.excerpt,
        author: post.author,
        date: postDate.toLocaleDateString('vi-VN'),
        category: post.category,
        view_count: post.view_count,
        rawDate: postDate,
      }
    });

    // 2. Process featured business posts
    const featuredBusinessPosts: UnifiedPost[] = businessPosts
      .filter(post => post.is_featured && post.status === BusinessBlogPostStatus.PUBLISHED && post.published_date)
      .map(post => {
        const business = businesses.find(b => b.id === post.business_id);
        return {
          id: `business-${post.id}`,
          url: `/business/${business?.slug}/post/${post.slug}`,
          title: post.title,
          image_url: post.image_url,
          excerpt: post.excerpt,
          author: post.author,
          date: new Date(post.published_date!).toLocaleDateString('en-GB'),
          category: business?.name || 'Đối tác',
          view_count: post.view_count,
          rawDate: new Date(post.published_date!),
        };
      })
      .filter(post => !post.url.includes('/business/undefined/'));

    // 3. Combine and sort
    return [...processedPlatformPosts, ...featuredBusinessPosts]
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  }, [platformPosts, businessPosts, businesses]);

  const categories = useMemo(() => {
    const allCategories = allPosts.map(post => post.category);
    return ['Tất cả bài viết', ...Array.from(new Set(allCategories))];
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    let results = allPosts;
    if (selectedCategory && selectedCategory !== 'Tất cả bài viết') {
      results = results.filter(post => post.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (lowercasedQuery) {
      results = results.filter(post =>
        post.title.toLowerCase().includes(lowercasedQuery) ||
        post.excerpt.toLowerCase().includes(lowercasedQuery) ||
        post.author.toLowerCase().includes(lowercasedQuery)
      );
    }
    return results;
  }, [searchQuery, allPosts, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const handleCategoryClick = (category: string) => {
    if (category === 'Tất cả bài viết') {
      navigate('/blog');
    } else {
      navigate(`/blog?category=${encodeURIComponent(category)}`);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(location.search);
    params.set('page', page.toString());
    navigate(`/blog?${params.toString()}`, { replace: true });
  };

  // SEO metadata
  const seoTitle = selectedCategory && selectedCategory !== 'Tất cả bài viết'
    ? `${selectedCategory} | Blog Làm Đẹp | 1Beauty.asia`
    : searchQuery
      ? `Tìm kiếm: ${searchQuery} | Blog Làm Đẹp | 1Beauty.asia`
      : 'Blog Làm Đẹp | 1Beauty.asia';
  const seoDescription = searchQuery
    ? `Tìm thấy ${filteredPosts.length} bài viết về "${searchQuery}" trên Blog Làm Đẹp của 1Beauty.asia.`
    : selectedCategory && selectedCategory !== 'Tất cả bài viết'
      ? `Khám phá các bài viết về ${selectedCategory} trên Blog Làm Đẹp của 1Beauty.asia. Kiến thức, xu hướng và cảm hứng cho vẻ đẹp của bạn.`
      : 'Khám phá kiến thức, xu hướng và cảm hứng làm đẹp từ các chuyên gia hàng đầu. Blog Làm Đẹp của 1Beauty.asia - Nơi bạn tìm thấy mọi thứ về làm đẹp.';

  if (isLoading) {
    return (
      <>
        <SEOHead title={seoTitle} description={seoDescription} />
        <LoadingState message="Đang tải blog..." fullScreen={true} />
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords="blog làm đẹp, xu hướng làm đẹp, mẹo làm đẹp, kiến thức làm đẹp, spa, salon, clinic"
      />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold font-serif text-primary tracking-tight">Blog Làm Đẹp</h1>
            <div className="w-24 h-0.5 bg-accent/30 mx-auto my-8"></div>
            <p className="mt-4 text-neutral-500 font-light tracking-wide italic max-w-2xl mx-auto">Kiến thức, xu hướng và cảm hứng tinh tế cho vẻ đẹp đích thực của quý khách.</p>
          </div>

          {/* Search Bar */}
          <div className="mb-16 max-w-2xl mx-auto">
            <div className="relative group">
              <input
                type="search"
                placeholder="Tìm kiếm cảm hứng làm đẹp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-8 py-4 bg-white border border-luxury-border rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-accent/30 text-neutral-dark placeholder:text-neutral-300 font-light tracking-wide transition-all"
                aria-label="Search blog posts"
              />
              <div className="absolute top-0 right-0 mt-4 mr-6 text-neutral-300 pointer-events-none group-focus-within:text-accent transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-white/50 backdrop-blur-md p-8 rounded-2xl border border-luxury-border shadow-soft">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 pb-4 border-b border-luxury-border">Chuyên mục</h3>
                <ul className="space-y-4">
                  {categories.map(cat => (
                    <li key={cat}>
                      <button
                        onClick={() => handleCategoryClick(cat)}
                        className={`w-full text-left text-sm font-medium tracking-wide transition-all rounded-full px-4 py-2 ${(selectedCategory === cat || (!selectedCategory && cat === 'Tất cả bài viết'))
                          ? 'bg-accent text-white shadow-md'
                          : 'text-neutral-500 hover:text-accent hover:bg-accent/5'
                          }`}
                      >
                        {cat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Main content */}
            <main className="lg:col-span-3">
              {filteredPosts.length > 0 ? (
                <>
                  <div className="mb-8 text-xs uppercase tracking-widest font-bold text-neutral-400">
                    Tìm thấy <span className="text-accent">{filteredPosts.length}</span> bài viết
                    {searchQuery && ` cho "${searchQuery}"`}
                    {selectedCategory && selectedCategory !== 'Tất cả bài viết' && ` trong "${selectedCategory}"`}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {paginatedPosts.map(post => (
                      <BlogPostCard
                        key={post.id}
                        post={toBlogCardPost(post)}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-12">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Không tìm thấy bài viết nào"
                  message={
                    searchQuery
                      ? `Rất tiếc, chúng tôi không tìm thấy bài viết nào phù hợp với "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
                      : selectedCategory && selectedCategory !== 'Tất cả bài viết'
                        ? `Chưa có bài viết nào trong chuyên mục "${selectedCategory}".`
                        : 'Hiện tại chưa có bài viết nào trong blog.'
                  }
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogListPage;
