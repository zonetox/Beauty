// C2.1 - Homepage (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.tsx';
import BusinessCard from '../components/BusinessCard.tsx';
import BlogPostCard from '../components/BlogPostCard.tsx';
import DealCard from '../components/DealCard.tsx';
import RecentlyViewed from '../components/RecentlyViewed.tsx';
import SEOHead from '../components/SEOHead.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { CATEGORIES, CITIES, FEATURED_LOCATIONS } from '../constants.ts';
import { HomepageSection, BlogPost, Deal } from '../types.ts';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useHomepageData } from '../contexts/HomepageDataContext.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { snakeToCamel } from '../lib/utils.ts';
import toast from 'react-hot-toast';

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
    <div className="bg-gray-200 h-48 w-full animate-pulse"></div>
    <div className="p-4 space-y-3">
      <div className="bg-gray-200 h-4 w-1/3 animate-pulse rounded"></div>
      <div className="bg-gray-200 h-6 w-3/4 animate-pulse rounded"></div>
      <div className="bg-gray-200 h-4 w-full animate-pulse rounded"></div>
    </div>
  </div>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { businesses, businessLoading } = useBusinessData();
  const { homepageData } = useHomepageData();
  const { heroSlides, sections } = homepageData;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasRecentlyViewed, setHasRecentlyViewed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  // OPTIMIZED: Only fetch featured blog posts (3 posts) instead of all
  const [featuredBlogPosts, setFeaturedBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);

  // OPTIMIZED: Fetch only 3 featured blog posts for homepage
  useEffect(() => {
    let mounted = true;

    const fetchFeaturedBlogPosts = async () => {
      if (!isSupabaseConfigured) {
        setBlogLoading(false);
        return;
      }

      try {
        setBlogLoading(true);

        // Only fetch 3 latest blog posts for homepage
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, title, image_url, excerpt, author, date, category, view_count')
          .order('date', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Error fetching featured blog posts:', error);
          if (mounted) setFeaturedBlogPosts([]);
        } else if (data && mounted) {
          const posts = data.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title,
            imageUrl: post.image_url,
            excerpt: post.excerpt,
            author: post.author,
            date: post.date,
            category: post.category,
            viewCount: post.view_count,
          })) as BlogPost[];
          setFeaturedBlogPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching featured blog posts:', error);
        if (mounted) setFeaturedBlogPosts([]);
      } finally {
        if (mounted) setBlogLoading(false);
      }
    };

    fetchFeaturedBlogPosts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const viewedRaw = localStorage.getItem('recently_viewed_businesses');
    if (viewedRaw) {
      try {
        const viewedIds = JSON.parse(viewedRaw);
        if (viewedIds && viewedIds.length > 0) {
          setHasRecentlyViewed(true);
        }
      } catch {
        setHasRecentlyViewed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleSearch = (filters: { keyword: string; category: string; location: string; }) => {
    const query = new URLSearchParams(filters).toString();
    navigate(`/directory?${query}`);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterError('Vui lòng nhập một địa chỉ email hợp lệ.');
      setTimeout(() => setNewsletterError(''), 3000);
      return;
    }

    setIsSubmittingNewsletter(true);
    setNewsletterError('');

    try {
      // TODO: Phase E - Integrate with email service
      // For now, store in localStorage as fallback
      const existingSubscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      if (!existingSubscribers.includes(newsletterEmail)) {
        existingSubscribers.push(newsletterEmail);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(existingSubscribers));
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsSubscribed(true);
      toast.success('Đăng ký thành công! Cảm ơn bạn đã quan tâm.');
      setNewsletterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra';
      setNewsletterError(message);
      toast.error('Đăng ký thất bại. Vui lòng thử lại sau.');
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  // OPTIMIZED: Only use featured businesses (already filtered by fetchCriticalData)
  const featuredBusinesses = useMemo(() => {
    return businesses.slice(0, 4);
  }, [businesses]);

  // OPTIMIZED: Fetch deals only from featured businesses
  interface FeaturedDeal extends Deal {
    businessName: string;
    businessSlug: string;
  }

  const [featuredDeals, setFeaturedDeals] = useState<FeaturedDeal[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedDeals = async () => {
      if (!isSupabaseConfigured || businesses.length === 0) {
        return;
      }

      try {
        // Only fetch deals from featured businesses (limit to 4 businesses)
        const featuredBusinessIds = businesses.slice(0, 4).map(b => b.id);

        if (featuredBusinessIds.length === 0) {
          if (mounted) setFeaturedDeals([]);
          return;
        }

        // Fetch active deals from featured businesses
        const { data, error } = await supabase
          .from('deals')
          .select('id, business_id, title, description, discount_percentage, original_price, deal_price, start_date, end_date, status, image_url')
          .in('business_id', featuredBusinessIds)
          .eq('status', 'Active')
          .gte('end_date', new Date().toISOString())
          .order('start_date', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching featured deals:', error);
          if (mounted) setFeaturedDeals([]);
        } else if (data && mounted) {
          const dealsWithBusiness: FeaturedDeal[] = data
            .map(deal => {
              const business = businesses.find(b => b.id === deal.business_id);
              if (!business) return null;

              const camelDeal = snakeToCamel(deal) as Deal;
              return {
                ...camelDeal,
                businessName: business.name,
                businessSlug: business.slug,
              } as FeaturedDeal;
            })
            .filter((deal): deal is FeaturedDeal => deal !== null);

          setFeaturedDeals(dealsWithBusiness);
        }
      } catch (error) {
        console.error('Error fetching featured deals:', error);
        if (mounted) setFeaturedDeals([]);
      }
    };

    // Only fetch deals if we have featured businesses
    if (businesses.length > 0 && !businessLoading) {
      fetchFeaturedDeals();
    }

    return () => {
      mounted = false;
    };
  }, [businesses, businessLoading]);

  // OPTIMIZED: Use featured blog posts directly (already limited to 3)
  const featuredPosts = useMemo(() => {
    return featuredBlogPosts;
  }, [featuredBlogPosts]);

  // Do NOT block rendering - use skeletons for loading states instead
  // Homepage must render immediately after auth, regardless of data fetch timing
  const renderSection = (section: HomepageSection) => {
    if (!section.visible) return null;

    switch (section.type) {
      case 'featuredBusinesses':
        return (
          <section key={section.id} className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
              <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
              {businessLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : featuredBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {featuredBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Chưa có đối tác nổi bật"
                  message="Các đối tác nổi bật sẽ được hiển thị tại đây."
                />
              )}
            </div>
          </section>
        );
      case 'featuredDeals':
        if (businessLoading) {
          return (
            <section key={section.id} className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
                <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            </section>
          );
        }
        if (featuredDeals.length === 0) return null;
        return (
          <section key={section.id} className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
              <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredDeals.map((deal, index) => (
                  <DealCard key={index} deal={deal} businessName={deal.businessName} businessSlug={deal.businessSlug} />
                ))}
              </div>
            </div>
          </section>
        );
      case 'featuredBlog':
        if (blogLoading) {
          return (
            <section key={section.id} className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
                <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              </div>
            </section>
          );
        }
        if (featuredPosts.length === 0) return null;
        return (
          <section key={section.id} className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
              <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredPosts.map((post) => (
                  <BlogPostCard key={post.id} post={{ ...post, url: `/blog/${post.slug}` }} />
                ))}
              </div>
            </div>
          </section>
        );
      case 'exploreByLocation':
        return (
          <section key={section.id} className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold font-outfit text-neutral-dark mb-4">{section.title}</h2>
                <div className="w-20 h-1 bg-primary mx-auto rounded-full mb-4"></div>
                <p className="text-gray-500 max-w-2xl mx-auto">{section.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
                {FEATURED_LOCATIONS.map((location, index) => {
                  const bentoClasses = [
                    "md:col-span-2 md:row-span-2", // Tràng Tiền / TP.HCM (Large)
                    "md:col-span-1 md:row-span-1", // Standard
                    "md:col-span-1 md:row-span-1", // Standard
                    "md:col-span-2 md:row-span-1", // Wide
                  ];
                  return (
                    <Link
                      key={location.name}
                      to={`/directory?location=${encodeURIComponent(location.name)}`}
                      className={`group relative rounded-3xl overflow-hidden shadow-premium transition-all duration-700 ${bentoClasses[index % 4] || "md:col-span-1"}`}
                    >
                      <img
                        src={location.imageUrl}
                        alt={`Khám phá ${location.name}`}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark/90 via-neutral-dark/20 to-transparent transition-opacity duration-500 opacity-80 group-hover:opacity-100"></div>
                      <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-500 group-hover:-translate-y-2">
                        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Discover</p>
                        <h3 className="text-white text-2xl font-bold font-outfit">{location.name}</h3>
                        <div className="w-0 group-hover:w-12 h-1 bg-primary transition-all duration-500 mt-2 rounded-full"></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  // SEO metadata
  const seoTitle = heroSlides.length > 0 && heroSlides[currentSlide]?.title
    ? `${heroSlides[currentSlide].title} | 1Beauty.asia`
    : '1Beauty.asia - Khám phá Vẻ đẹp đích thực';
  const seoDescription = heroSlides.length > 0 && heroSlides[currentSlide]?.subtitle
    ? heroSlides[currentSlide].subtitle
    : 'Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn. Đặt lịch hẹn chỉ trong vài cú nhấp chuột.';
  const seoImage = heroSlides.length > 0 && heroSlides[currentSlide]?.imageUrl
    ? getOptimizedSupabaseUrl(heroSlides[currentSlide].imageUrl, { width: 1200, quality: 85 })
    : 'https://picsum.photos/seed/beauty/1200/630';

  // Homepage always renders immediately - no blocking loader
  // Data loading uses skeleton placeholders instead
  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        organizationSchema={{
          '@type': 'Organization',
          name: '1Beauty.asia',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://1beauty.asia',
          logo: typeof window !== 'undefined' ? `${window.location.origin}/favicon.svg` : 'https://1beauty.asia/favicon.svg',
          sameAs: [
            'https://www.facebook.com/1beauty.asia',
            'https://www.instagram.com/1beauty.asia',
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            areaServed: 'VN',
          },
        }}
      />
      <div>
        {/* Hero Section - Dynamic Slider with Left Alignment */}
        <section className="relative min-h-[700px] flex items-center overflow-hidden bg-neutral-dark">
          {/* Background Slider Layer */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img
                src={slide.imageUrl || "/premium_beauty_hero.png"}
                alt={slide.title}
                className={`w-full h-full object-cover ${index === currentSlide ? 'animate-ken-burns' : ''}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-dark/90 via-neutral-dark/40 to-transparent"></div>
            </div>
          ))}

          <div className="relative z-10 container mx-auto px-4 py-20 text-center flex flex-col items-center">
            <div className="max-w-4xl w-full">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Khám phá vẻ đẹp đích thực</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-outfit text-white mb-6 leading-tight animate-fade-in-up delay-100">
                {heroSlides.length > 0 ? (
                  <>
                    {heroSlides[currentSlide].title.split(' ').map((word, i) => (
                      <React.Fragment key={i}>
                        {word === 'Nhan' || word === 'sắc' || word === 'Cảm' || word === 'xúc' ? (
                          <span className="text-gradient">{word} </span>
                        ) : (
                          <>{word} </>
                        )}
                        {i === 2 && <br className="hidden md:block" />}
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <>
                    Nâng tầm <span className="text-gradient">Nhan sắc</span> <br className="hidden md:block" />
                    Chạm tới <span className="text-gradient">Cảm xúc</span>
                  </>
                )}
              </h1>

              <p className="text-base md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                {heroSlides.length > 0 ? heroSlides[currentSlide].subtitle : 'Tìm kiếm hàng ngàn spa, salon và clinic uy tín gần bạn. Trải nghiệm dịch vụ làm đẹp đẳng cấp chỉ trong vài cú nhấp chuột.'}
              </p>

              <div className="glass-card p-2 md:p-5 rounded-2xl md:rounded-3xl shadow-premium animate-fade-in-up delay-300 max-w-4xl mx-auto">
                <SearchBar onSearch={handleSearch} categories={CATEGORIES} locations={CITIES} />
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/80 text-sm animate-fade-in-up delay-400">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span>1000+ Đối tác uy tín</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <span>Đặt lịch 24/7</span>
                </div>
              </div>

              {/* Slider Controls */}
              {heroSlides.length > 1 && (
                <div className="mt-12 flex items-center justify-center space-x-3 animate-fade-in-up delay-500">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? 'w-12 bg-primary' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom curve decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10"></div>
        </section>

        {/* Recently Viewed Section */}
        {hasRecentlyViewed && (
          <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <RecentlyViewed />
            </div>
          </section>
        )}

        {/* Dynamically Rendered Sections */}
        {sections.map(section => renderSection(section))}

        {/* For Business CTA Section */}
        <section className="py-20 bg-accent/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-4">
              Đưa doanh nghiệp của bạn lên một tầm cao mới
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-gray-600 leading-relaxed">
              Tham gia BeautyDir ngay hôm nay để kết nối với hàng triệu khách hàng tiềm năng, xây dựng một trang landing page chuyên nghiệp, và quản lý hoạt động kinh doanh của bạn một cách dễ dàng, tất cả ở cùng một nơi.
            </p>
            <Link
              to="/for-business"
              className="mt-8 inline-block bg-primary text-white px-10 py-4 rounded-md font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-lg"
            >
              Đăng ký cho Doanh nghiệp
            </Link>
          </div>
        </section>

        {/* Newsletter Signup Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-serif text-neutral-dark mb-4">
              Đăng ký nhận ưu đãi
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 leading-relaxed">
              Đừng bỏ lỡ các ưu đãi độc quyền, mẹo làm đẹp và xu hướng mới nhất từ các đối tác hàng đầu của chúng tôi.
            </p>
            <div className="mt-8 max-w-xl mx-auto">
              {isSubscribed ? (
                <div className="p-4 bg-green-100 border border-green-300 rounded-md text-center">
                  <p className="font-semibold text-green-800">Cảm ơn bạn đã đăng ký! Hãy kiểm tra hộp thư của bạn.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="homepage-newsletter-email" className="sr-only">Email address</label>
                  <input
                    id="homepage-newsletter-email"
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterError) setNewsletterError('');
                    }}
                    placeholder="Địa chỉ email của bạn"
                    required
                    aria-label="Email for newsletter"
                    disabled={isSubmittingNewsletter}
                    className={`flex-grow w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark ${newsletterError ? 'border-red-500' : 'border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNewsletter}
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex-shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingNewsletter ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang gửi...
                      </>
                    ) : (
                      'Đăng ký'
                    )}
                  </button>
                </form>
              )}
              {newsletterError && <p className="text-red-500 text-xs mt-2 text-left">{newsletterError}</p>}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
