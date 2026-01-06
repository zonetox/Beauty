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

const BusinessDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { fetchBusinessBySlug, incrementBusinessViewCount } = useBusinessData();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        const loadBusiness = async () => {
            if (!slug) {
                setError('Business slug is required');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const data = await fetchBusinessBySlug(slug);
                if (!data) {
                    setError('Business not found');
                } else {
                    setBusiness(data);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load business details';
                console.error("Failed to load business details:", err);
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        loadBusiness();
    }, [slug, fetchBusinessBySlug]);

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
    }, [business, incrementBusinessViewCount]);

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
            addressRegion: business.province,
            addressCountry: 'VN',
        },
        geo: business.latitude && business.longitude ? {
            latitude: business.latitude,
            longitude: business.longitude,
        } : undefined,
        telephone: business.phone,
        priceRange: business.priceRange || undefined,
        aggregateRating: visibleReviews.length > 0 ? {
            ratingValue: averageRating,
            reviewCount: visibleReviews.length,
        } : undefined,
        openingHoursSpecification: business.workingHours ? Object.entries(business.workingHours)
            .filter(([_, hours]) => hours && !hours.toLowerCase().includes('closed'))
            .map(([day, hours]) => {
                const dayMap: { [key: string]: string[] } = {
                    'Chủ Nhật': ['Sunday'],
                    'CN': ['Sunday'],
                    'Thứ 2': ['Monday'],
                    'T2': ['Monday'],
                    'Thứ 3': ['Tuesday'],
                    'T3': ['Tuesday'],
                    'Thứ 4': ['Wednesday'],
                    'T4': ['Wednesday'],
                    'Thứ 5': ['Thursday'],
                    'T5': ['Thursday'],
                    'Thứ 6': ['Friday'],
                    'T6': ['Friday'],
                    'Thứ 7': ['Saturday'],
                    'T7': ['Saturday'],
                };
                const dayOfWeek = dayMap[day] || [];
                if (dayOfWeek.length === 0 || !hours.includes('-')) return null;
                const [opens, closes] = hours.split(' - ').map(s => s.trim());
                return {
                    dayOfWeek,
                    opens,
                    closes,
                };
            })
            .filter((oh): oh is { dayOfWeek: string[]; opens: string; closes: string } => oh !== null) : undefined,
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
                    <HeroSection business={business} onBookNowClick={() => setIsBookingModalOpen(true)} />
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <AboutSection business={business} />
                        <ServicesSection business={business} />
                        <GallerySection business={business} />
                        <TeamSection business={business} />
                        <VideoSection business={business} />
                        <BusinessBlogSection business={business} />
                        <DealsSection business={business} />
                        <ReviewsSection business={business} />
                    </div>
                    <BookingCtaSection onBookNowClick={() => setIsBookingModalOpen(true)} />
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <LocationSection business={business} />
                    </div>
                </main>
                <BusinessFooter business={business} />
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
