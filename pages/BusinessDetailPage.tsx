import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Business } from '../types.ts';
import NotFoundPage from './NotFoundPage.tsx';

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
    const { fetchBusinessBySlug, incrementBusinessViewCount } = useBusinessData(); // Use the async fetcher
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        const loadBusiness = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const data = await fetchBusinessBySlug(slug);
                setBusiness(data);
            } catch (error) {
                console.error("Failed to load business details:", error);
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

            // Update page title for SEO
            document.title = business.seo?.title || `${business.name} | BeautyDir`;
        }
    }, [business, incrementBusinessViewCount]);

    // D2.3 FIX: Use standardized loading state
    if (loading) {
        return <LoadingState message="Loading business details..." fullScreen={true} />;
    }

    if (!business) {
        return <NotFoundPage />;
    }

    // The old layout system is replaced by a structured, modern landing page format.
    // The order of sections is now predefined for a consistent, high-quality look.
    return (
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
    );
};

export default BusinessDetailPage;