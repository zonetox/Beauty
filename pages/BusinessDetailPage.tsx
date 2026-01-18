// C2.3 - Business Landing Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Business } from '../types.ts';
import NotFoundPage from './NotFoundPage.tsx';
import LoadingState from '../components/LoadingState.tsx';
import SEOHead from '../components/SEOHead.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

// Import new Landing Page Section Components
import BusinessHeader from '../components/business-landing/BusinessHeader.tsx';
import HeroSection from '../components/business-landing/HeroSection.tsx';
import AboutSection from '../components/business-landing/AboutSection.tsx';
import ServicesSection from '../components/business-landing/ServicesSection.tsx';
import GallerySection from '../components/business-landing/GallerySection.tsx';
import TeamSection from '../components/business-landing/TeamSection.tsx';
import VideoSection from '../components/business-landing/VideoSection.tsx';
import DealsSection from '../components/business-landing/DealsSection.tsx';
import BookingCtaSection from '../components/business-landing/BookingCtaSection.tsx';
import LocationSection from '../components/business-landing/LocationSection.tsx';
import BusinessFooter from '../components/business-landing/BusinessFooter.tsx';
import BusinessBlogSection from '../components/business-landing/BusinessBlogSection.tsx';
import BookingModal from '../components/business-landing/BookingModal.tsx';
import ReviewsSection from '../components/business-landing/ReviewsSection.tsx';
import TrustIndicatorsSection from '../components/business-landing/TrustIndicatorsSection.tsx';
import FloatingActionButtons from '../components/FloatingActionButtons.tsx';
import { LandingPageConfig } from '../types.ts';

const BusinessDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { fetchBusinessBySlug, incrementBusinessViewCount } = useBusinessData();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const loadBusiness = async () => {
            if (!slug) {
                if (isMounted) {
                    setError('Business slug is required');
                    setLoading(false);
                }
                return;
            }

            if (isMounted) {
                setLoading(true);
                setError(null);
            }
            
            try {
                console.log('Loading business with slug:', slug);
                const data = await fetchBusinessBySlug(slug);
                console.log('Business data loaded:', data ? 'Success' : 'Not found', data);
                
                if (!isMounted) return; // Component unmounted, skip state update
                
                if (!data) {
                    console.warn('Business not found for slug:', slug);
                    setError('Business not found');
                } else {
                    console.log('Setting business data:', data.name, 'Services:', data.services?.length, 'Deals:', data.deals?.length, 'Reviews:', data.reviews?.length);
                    setBusiness(data);
                }
            } catch (err) {
                if (!isMounted) return;
                const message = err instanceof Error ? err.message : 'Failed to load business details';
                console.error("Failed to load business details:", err);
                setError(message);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        loadBusiness();
        
        return () => {
            isMounted = false;
        };
    }, [slug, fetchBusinessBySlug]); // Add fetchBusinessBySlug to dependencies

    useEffect(() => {
        if (business) {
            // Increment view count, once per session to avoid loops/spam
            const incrementedKey = `view_incremented_${business.id}`;
            if (!sessionStorage.getItem(incrementedKey)) {
                incrementBusinessViewCount(business.id);
                sessionStorage.setItem(incrementedKey, 'true');
            }

            // Logic to add to recently viewed list
            const MAX_RECENTLY_VIEWED = 4;
            try {
                const viewedRaw = localStorage.getItem('recently_viewed_businesses');
                let viewedIds: number[] = viewedRaw ? JSON.parse(viewedRaw) : [];
                viewedIds = viewedIds.filter(id => id !== business.id);
                viewedIds.unshift(business.id);
                const updatedViewedIds = viewedIds.slice(0, MAX_RECENTLY_VIEWED);
                localStorage.setItem('recently_viewed_businesses', JSON.stringify(updatedViewedIds));
            } catch (error) {
                console.error("Failed to update recently viewed businesses:", error);
            }
        }
    }, [business, incrementBusinessViewCount]); // Only depend on business.id to prevent unnecessary re-runs

    // Loading state
    if (loading) {
        return (
            <>
                <SEOHead 
                    title="Đang tải..."
                    description="Đang tải thông tin doanh nghiệp..."
                />
                <LoadingState message="Đang tải thông tin doanh nghiệp..." fullScreen={true} />
            </>
        );
    }

    // Error state
    if (error || !business) {
        return <NotFoundPage />;
    }

    // SEO metadata
    const seoTitle = business.seo?.title || `${business.name} | 1Beauty.asia`;
    const seoDescription = business.seo?.description || 
        business.description?.substring(0, 160) || 
        `${business.name} - ${business.categories.join(', ')} tại ${business.city || 'Việt Nam'}`;
    const seoKeywords = business.seo?.keywords || 
        `${business.name}, ${business.categories.join(', ')}, ${business.city || ''}`;
    const seoImage = business.heroSlides && business.heroSlides.length > 0
        ? getOptimizedSupabaseUrl(business.heroSlides[0].imageUrl, { width: 1200, quality: 85 })
        : business.heroImageUrl || business.imageUrl
        ? getOptimizedSupabaseUrl(business.heroImageUrl || business.imageUrl || '', { width: 1200, quality: 85 })
        : 'https://picsum.photos/seed/beauty/1200/630';
    const seoUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/business/${business.slug}`
        : '';

    // Calculate average rating
    const visibleReviews = business.reviews?.filter(r => r.status === 'Visible') || [];
    const averageRating = visibleReviews.length > 0
        ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
        : 0;

    // Enhanced Schema.org for LocalBusiness
    const businessSchema = {
        name: business.name,
        image: business.heroSlides && business.heroSlides.length > 0
            ? business.heroSlides.map(slide => getOptimizedSupabaseUrl(slide.imageUrl, { width: 1200, quality: 85 }))
            : business.heroImageUrl || business.imageUrl
            ? [getOptimizedSupabaseUrl(business.heroImageUrl || business.imageUrl || '', { width: 1200, quality: 85 })]
            : [seoImage],
        address: {
            streetAddress: business.address,
            addressLocality: business.city,
            addressRegion: business.district,
            addressCountry: 'VN',
        },
        geo: business.latitude && business.longitude ? {
            latitude: business.latitude,
            longitude: business.longitude,
        } : undefined,
        telephone: business.phone,
        aggregateRating: visibleReviews.length > 0 ? {
            ratingValue: averageRating,
            reviewCount: visibleReviews.length,
        } : undefined,
        openingHoursSpecification: business.workingHours ? Object.entries(business.workingHours)
            .filter(([_, hours]) => {
                // Handle both old string format and new object format
                if (typeof hours === 'string') {
                    return hours && !hours.toLowerCase().includes('closed');
                }
                // New format: {open, close, isOpen}
                if (typeof hours === 'object' && hours !== null) {
                    return hours.isOpen !== false && hours.open && hours.close;
                }
                return false;
            })
            .map(([day, hours]) => {
                const dayMap: { [key: string]: string[] } = {
                    'Chủ Nhật': ['Sunday'],
                    'CN': ['Sunday'],
                    'Sunday': ['Sunday'],
                    'Thứ 2': ['Monday'],
                    'T2': ['Monday'],
                    'Monday': ['Monday'],
                    'Thứ 3': ['Tuesday'],
                    'T3': ['Tuesday'],
                    'Tuesday': ['Tuesday'],
                    'Thứ 4': ['Wednesday'],
                    'T4': ['Wednesday'],
                    'Wednesday': ['Wednesday'],
                    'Thứ 5': ['Thursday'],
                    'T5': ['Thursday'],
                    'Thursday': ['Thursday'],
                    'Thứ 6': ['Friday'],
                    'T6': ['Friday'],
                    'Friday': ['Friday'],
                    'Thứ 7': ['Saturday'],
                    'T7': ['Saturday'],
                    'Saturday': ['Saturday'],
                };
                const dayOfWeek = dayMap[day] || [];
                
                // Handle both formats
                let opens: string, closes: string;
                if (typeof hours === 'string') {
                    if (!hours.includes('-')) return null;
                    [opens, closes] = hours.split(' - ').map(s => s.trim());
                } else if (typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours) {
                    opens = hours.open;
                    closes = hours.close;
                } else {
                    return null;
                }
                
                if (dayOfWeek.length === 0) return null;
                return {
                    dayOfWeek,
                    opens,
                    closes,
                };
            })
            .filter((oh): oh is { dayOfWeek: string[]; opens: string; closes: string } => oh !== null) : undefined,
    };

    // Get landing page configuration or use default
    const landingPageConfig: LandingPageConfig = business.landingPageConfig || {
        sections: {
            hero: { enabled: true, order: 1 },
            trust: { enabled: false, order: 2 },
            services: { enabled: true, order: 3 },
            gallery: { enabled: true, order: 4 },
            team: { enabled: false, order: 5 },
            reviews: { enabled: true, order: 6 },
            cta: { enabled: true, order: 7 },
            contact: { enabled: true, order: 8 },
        },
    };

    // Get enabled sections sorted by order
    const enabledSections = Object.entries(landingPageConfig.sections)
        .filter(([_, section]) => section.enabled)
        .map(([key, section]) => ({
            key: key as keyof LandingPageConfig['sections'],
            order: section.order,
        }))
        .sort((a, b) => a.order - b.order);

    // Map section keys to components
    const renderSection = (sectionKey: keyof LandingPageConfig['sections']) => {
        switch (sectionKey) {
            case 'hero':
                return <HeroSection key="hero" business={business} onBookNowClick={() => setIsBookingModalOpen(true)} />;
            case 'services':
                return (
                    <div key="services" className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <ServicesSection business={business} />
                    </div>
                );
            case 'gallery':
                return (
                    <div key="gallery" className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <GallerySection business={business} />
                    </div>
                );
            case 'team':
                return (
                    <div key="team" className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <TeamSection business={business} />
                    </div>
                );
            case 'reviews':
                return (
                    <div key="reviews" className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <ReviewsSection business={business} />
                    </div>
                );
            case 'cta':
                return <BookingCtaSection key="cta" onBookNowClick={() => setIsBookingModalOpen(true)} businessId={business.id} />;
            case 'contact':
                return (
                    <div key="contact" className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <LocationSection business={business} />
                    </div>
                );
            case 'trust':
                return <TrustIndicatorsSection key="trust" business={business} />;
            default:
                return null;
        }
    };

    return (
        <>
            <SEOHead 
                title={seoTitle}
                description={seoDescription}
                keywords={seoKeywords}
                image={seoImage}
                url={seoUrl}
                type="business"
                businessSchema={businessSchema}
            />
            <div className="bg-white">
                <BusinessHeader business={business} onBookNowClick={() => setIsBookingModalOpen(true)} />
                <main>
                    {/* Render sections based on config */}
                    {enabledSections.map(({ key }) => {
                        // Hero is rendered outside container
                        if (key === 'hero') {
                            return renderSection(key);
                        }
                        return null;
                    })}

                    {/* About section - always shown (not in config) */}
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <AboutSection business={business} />
                    </div>

                    {/* Render other enabled sections */}
                    {enabledSections
                        .filter(s => s.key !== 'hero') // Hero already rendered
                        .map(({ key }) => renderSection(key))}

                    {/* Optional sections - shown if business has content (not in config) */}
                    {business.youtubeUrl && (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <VideoSection business={business} />
                        </div>
                    )}
                    {business.businessBlogPosts && business.businessBlogPosts.length > 0 && (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <BusinessBlogSection business={business} />
                        </div>
                    )}
                    {business.deals && business.deals.length > 0 && (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <DealsSection business={business} />
                        </div>
                    )}
                </main>
                <BusinessFooter business={business} />
                <FloatingActionButtons 
                    business={business} 
                    onBookNowClick={() => setIsBookingModalOpen(true)} 
                />
                {isBookingModalOpen && (
                    <BookingModal
                        isOpen={isBookingModalOpen}
                        onClose={() => setIsBookingModalOpen(false)}
                        business={business}
                    />
                )}
            </div>
        </>
    );
};

export default BusinessDetailPage;
