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

import TemplateEngine from '../src/features/templates/TemplateEngine.tsx';
import BookingModal from '../components/business-landing/BookingModal.tsx';
import { useCMS } from '../contexts/CMSContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';

const BusinessDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { fetchBusinessBySlug, incrementBusinessview_count, updateBusiness } = useBusinessData();
    const [business, setBusiness] = useState<Business | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const { isEditing, setIsEditing, clearChanges, saveChanges } = useCMS();
    const { user } = useAuth();

    // Check if user is business owner
    const isOwner = user?.id === business?.owner_id;

    const handleSaveLandingPage = async () => {
        if (!business) return;

        await saveChanges(async (changes) => {
            const updatedBusiness = { ...business };

            // Apply hero slide changes
            if (updatedBusiness.hero_slides && updatedBusiness.hero_slides.length > 0) {
                updatedBusiness.hero_slides = updatedBusiness.hero_slides.map((slide, index) => ({
                    ...slide,
                    title: changes[`landing_hero_title_${index}`] !== undefined ? changes[`landing_hero_title_${index}`] : slide.title,
                    subtitle: changes[`landing_hero_subtitle_${index}`] !== undefined ? changes[`landing_hero_subtitle_${index}`] : slide.subtitle,
                    image_url: changes[`landing_hero_image_${index}`] !== undefined ? changes[`landing_hero_image_${index}`] : slide.image_url,
                }));
            } else {
                // Handle case where it uses business names as default
                updatedBusiness.name = changes[`landing_hero_title_0`] !== undefined ? changes[`landing_hero_title_0`] : updatedBusiness.name;
                updatedBusiness.slogan = changes[`landing_hero_subtitle_0`] !== undefined ? changes[`landing_hero_subtitle_0`] : updatedBusiness.slogan;
            }

            await updateBusiness(updatedBusiness);
            setBusiness(updatedBusiness);
        });
    };

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
                if (import.meta.env.MODE === 'development') {
                    // eslint-disable-next-line no-console
                    console.log('Loading business with slug:', slug);
                }
                const data = await fetchBusinessBySlug(slug);

                if (import.meta.env.MODE === 'development') {
                    // eslint-disable-next-line no-console
                    console.log('Business data loaded:', data ? 'Success' : 'Not found');
                }

                if (!isMounted) return; // Component unmounted, skip state update

                if (!data) {
                    if (import.meta.env.MODE === 'development') {
                        console.warn('Business not found for slug:', slug);
                    }
                    setError('Business not found');
                } else {
                    if (import.meta.env.MODE === 'development') {
                        console.warn('Setting business data:', data.name, 'Services:', data.services?.length, 'Deals:', data.deals?.length, 'Reviews:', data.reviews?.length);
                    }
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
                incrementBusinessview_count(business.id);
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
    }, [business, incrementBusinessview_count]); // Only depend on business.id to prevent unnecessary re-runs

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
    const seoImage = business.hero_slides && business.hero_slides.length > 0
        ? getOptimizedSupabaseUrl(business.hero_slides[0].image_url, { width: 1200, quality: 85 })
        : business.hero_image_url || business.image_url
            ? getOptimizedSupabaseUrl(business.hero_image_url || business.image_url || '', { width: 1200, quality: 85 })
            : 'https://picsum.photos/seed/beauty/1200/630';
    const seoUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/business/${business.slug}`
        : '';

    return (
        <div className="bg-background min-h-screen">
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords={seoKeywords}
                image={seoImage}
                url={seoUrl}
                type="business"
            />

            {/* CMS Owner Toolbar */}
            {isOwner && (
                <div className="fixed top-24 right-4 z-50 flex flex-col gap-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-primary text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center gap-2 group"
                            title="Chỉnh sửa trang"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-sm">Chỉnh sửa</span>
                        </button>
                    ) : (
                        <div className="bg-white p-4 rounded-2xl shadow-premium border border-primary/20 flex flex-col gap-3 animate-slide-in-right max-w-[200px]">
                            <div className="text-xs font-bold text-neutral-dark border-b pb-2 mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                Chế độ thiết kế
                            </div>
                            <p className="text-[10px] text-gray-500 italic">Nhấp vào tiêu đề hoặc ảnh để thay đổi nội dung trang của bạn.</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSaveLandingPage}
                                    className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-dark shadow-lg"
                                >
                                    Lưu trang
                                </button>
                                <button
                                    onClick={() => { clearChanges(); setIsEditing(false); }}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200"
                                >
                                    Hủy bỏ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <TemplateEngine business={business} />

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
