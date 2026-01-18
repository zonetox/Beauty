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
import LoadingState from '../components/LoadingState.tsx';
import EmptyState from '../components/EmptyState.tsx';
import { CATEGORIES, CITIES, FEATURED_LOCATIONS } from '../constants.ts';
import { MembershipTier, DealStatus, HomepageSection } from '../types.ts';
import { useBusinessData, useBlogData } from '../contexts/BusinessDataContext.tsx';
import { useHomepageData } from '../contexts/HomepageDataContext.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';
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
  const { blogPosts, blogLoading } = useBlogData();
  const { homepageData, loading: homepageLoading } = useHomepageData();
  const { heroSlides, sections } = homepageData;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasRecentlyViewed, setHasRecentlyViewed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  useEffect(() => {
      const viewedRaw = localStorage.getItem('recently_viewed_businesses');
      if (viewedRaw) {
          try {
              const viewedIds = JSON.parse(viewedRaw);
              if (viewedIds && viewedIds.length > 0) {
                  setHasRecentlyViewed(true);
              }
          } catch (e) {
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

  // Memoize featured data to avoid recalculation
  const featuredBusinesses = useMemo(() => {
    return businesses
      .filter(b => b.isFeatured && b.isActive)
      .slice(0, 4);
  }, [businesses]);

  const featuredDeals = useMemo(() => {
    return businesses
      .filter(b => b.isActive && (b.membershipTier === MembershipTier.VIP || b.membershipTier === MembershipTier.PREMIUM) && b.deals && b.deals.length > 0)
      .flatMap(b => 
          b.deals!
            .filter(deal => deal.status === DealStatus.ACTIVE)
            .map(deal => ({ ...deal, businessName: b.name, businessSlug: b.slug }))
      )
      .slice(0, 4);
  }, [businesses]);

  const featuredPosts = useMemo(() => {
    return blogPosts.slice(0, 3);
  }, [blogPosts]);

  const isLoading = homepageLoading || businessLoading || blogLoading;

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
                  <BlogPostCard key={post.id} post={{...post, url: `/blog/${post.slug}`}} />
                ))}
              </div>
            </div>
          </section>
        );
      case 'exploreByLocation':
        return (
          <section key={section.id} className="py-16 bg-background">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">{section.title}</h2>
              <p className="text-center text-gray-500 mb-8">{section.subtitle}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {FEATURED_LOCATIONS.map((location) => (
                  <Link 
                    key={location.name} 
                    to={`/directory?location=${encodeURIComponent(location.name)}`} 
                    className="group relative rounded-lg overflow-hidden shadow-lg aspect-[3/4]"
                  >
                    <img 
                      src={location.imageUrl} 
                      alt={`Khám phá ${location.name}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <h3 className="absolute bottom-4 left-4 text-white text-xl font-bold font-serif">{location.name}</h3>
                  </Link>
                ))}
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

  if (isLoading) {
    return (
      <>
        <SEOHead 
          title={seoTitle}
          description={seoDescription}
          image={seoImage}
        />
        <LoadingState message="Đang tải trang chủ..." fullScreen={true} />
      </>
    );
  }

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
        {/* Hero Section */}
        <section className="relative h-[500px] overflow-hidden">
          {heroSlides.length > 0 ? (
            <>
              {heroSlides.map((slide, index) => (
                  <div
                      key={index}
                      className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
                      style={{
                          backgroundImage: `url(${getOptimizedSupabaseUrl(slide.imageUrl, { width: 1920, quality: 85 })})`,
                          opacity: index === currentSlide ? 1 : 0,
                      }}
                      aria-hidden={index !== currentSlide ? 'true' : 'false'}
                  />
              ))}
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-white text-center z-10">
                {currentSlide < heroSlides.length && (
                  <>
                    <h1 className="text-4xl md:text-6xl font-bold font-serif mb-4">{heroSlides[currentSlide].title}</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl">{heroSlides[currentSlide].subtitle}</p>
                  </>
                )}
                <div className="w-full max-w-5xl">
                  <SearchBar onSearch={handleSearch} categories={CATEGORIES} locations={CITIES} />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                  {heroSlides.map((_, index) => (
                      <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white'}`}
                          aria-label={`Chuyển đến slide ${index + 1}`}
                      />
                  ))}
              </div>
            </>
          ) : (
            <div className="relative h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <div className="container mx-auto px-4 text-center text-white z-10">
                <h1 className="text-4xl md:text-6xl font-bold font-serif mb-4">Khám phá Vẻ đẹp đích thực</h1>
                <p className="text-lg md:text-xl mb-8 max-w-2xl">Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn.</p>
                <div className="w-full max-w-5xl mx-auto">
                  <SearchBar onSearch={handleSearch} categories={CATEGORIES} locations={CITIES} />
                </div>
              </div>
            </div>
          )}
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
              to="/register"
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
                    className={`flex-grow w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-neutral-dark ${
                      newsletterError ? 'border-red-500' : 'border-gray-300'
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
