// pages/BlogListPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BlogPostCard from '../components/BlogPostCard.tsx';
import { BlogPost, BusinessBlogPost, BusinessBlogPostStatus } from '../types.ts';
import { useBlogData, useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useBusinessBlogData } from '../contexts/BusinessContext.tsx';
import Pagination from '../components/Pagination.tsx';

// Unified type for display purposes
interface UnifiedPost {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  viewCount?: number;
  // Use a raw date for sorting
  rawDate: Date;
}

const POSTS_PER_PAGE = 6;

const BlogListPage: React.FC = () => {
  const { blogPosts: platformPosts } = useBlogData();
  const { posts: businessPosts } = useBusinessBlogData();
  const { businesses } = useBusinessData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get category from URL on mount/location change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedCategory(params.get('category') || '');
    setCurrentPage(1); // Reset to first page on filter change
  }, [location.search]);

  const allPosts = useMemo((): UnifiedPost[] => {
    // 1. Process platform posts
    const processedPlatformPosts: UnifiedPost[] = platformPosts.map(post => {
        const [day, month, year] = post.date.split('/');
        return {
            id: `platform-${post.id}`,
            url: `/blog/${post.slug}`,
            title: post.title,
            imageUrl: post.imageUrl,
            excerpt: post.excerpt,
            author: post.author,
            date: post.date,
            category: post.category,
            viewCount: post.viewCount,
            rawDate: new Date(`${year}-${month}-${day}`),
        }
    });

    // 2. Process featured business posts
    const featuredBusinessPosts: UnifiedPost[] = businessPosts
      .filter(post => post.isFeatured && post.status === BusinessBlogPostStatus.PUBLISHED && post.publishedDate)
      .map(post => {
        const business = businesses.find(b => b.id === post.businessId);
        return {
          id: `business-${post.id}`,
          url: `/business/${business?.slug}/post/${post.slug}`,
          title: post.title,
          imageUrl: post.imageUrl,
          excerpt: post.excerpt,
          author: post.author,
          date: new Date(post.publishedDate!).toLocaleDateString('en-GB'),
          category: business?.name || 'Đối tác',
          viewCount: post.viewCount,
          rawDate: new Date(post.publishedDate!),
        };
      })
      .filter(post => post.url.includes('/business/undefined/') === false); // Filter out posts whose business was not found

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


  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-serif text-neutral-dark">Blog Làm Đẹp</h1>
          <p className="mt-2 text-lg text-gray-500">Kiến thức, xu hướng và cảm hứng cho vẻ đẹp của bạn.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
           <div className="relative">
                <input
                    type="search"
                    placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 text-base border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="Search blog posts"
                />
                 <div className="absolute top-0 right-0 mt-3 mr-4 text-gray-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
                <div className="sticky top-24 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold font-serif text-neutral-dark mb-4">Chuyên mục</h3>
                    <ul className="space-y-2">
                        {categories.map(cat => (
                            <li key={cat}>
                                <button
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`w-full text-left font-semibold transition-colors rounded-md px-3 py-2 ${
                                        (selectedCategory === cat || (!selectedCategory && cat === 'Tất cả bài viết'))
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-600 hover:text-primary'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {paginatedPosts.map(post => (
                        <BlogPostCard key={post.id} post={post as any} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-12">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                  </>
                ) : (
                   <div className="text-center py-16">
                    <h3 className="text-xl font-semibold text-neutral-dark">Không tìm thấy bài viết nào</h3>
                    <p className="text-gray-500 mt-2">Rất tiếc, chúng tôi không tìm thấy bài viết nào phù hợp với tìm kiếm của bạn.</p>
                  </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;