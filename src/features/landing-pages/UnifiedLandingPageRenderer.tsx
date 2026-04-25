import React from 'react';
import { Business, LandingPageConfig } from '../../../types.ts';
import BusinessHeader from '@/components/business-landing/BusinessHeader.tsx';
import HeroSection from '@/components/business-landing/HeroSection.tsx';
import AboutSection from '@/components/business-landing/AboutSection.tsx';
import ServicesSection from '@/components/business-landing/ServicesSection.tsx';
import GallerySection from '@/components/business-landing/GallerySection.tsx';
import TeamSection from '@/components/business-landing/TeamSection.tsx';
import VideoSection from '@/components/business-landing/VideoSection.tsx';
import DealsSection from '@/components/business-landing/DealsSection.tsx';
import BookingCtaSection from '@/components/business-landing/BookingCtaSection.tsx';
import LocationSection from '@/components/business-landing/LocationSection.tsx';
import BusinessFooter from '@/components/business-landing/BusinessFooter.tsx';
import BusinessBlogSection from '@/components/business-landing/BusinessBlogSection.tsx';
import ReviewsSection from '@/components/business-landing/ReviewsSection.tsx';
import TrustIndicatorsSection from '@/components/business-landing/TrustIndicatorsSection.tsx';

interface UnifiedLandingPageRendererProps {
    business: Business;
    config: LandingPageConfig;
    isEditing?: boolean;
    onUpdateContent?: (sectionKey: string, content: any) => void;
    onBookNowClick?: () => void;
}

const SECTION_COMPONENTS: Record<string, React.FC<any>> = {
    hero: HeroSection,
    trust: TrustIndicatorsSection,
    about: AboutSection,
    services: ServicesSection,
    video: VideoSection,
    gallery: GallerySection,
    deals: DealsSection,
    reviews: ReviewsSection,
    blog: BusinessBlogSection,
    team: TeamSection,
    cta: BookingCtaSection,
    contact: LocationSection,
};

const UnifiedLandingPageRenderer: React.FC<UnifiedLandingPageRendererProps> = ({
    business,
    config,
    isEditing = false,
    onUpdateContent,
    onBookNowClick
}) => {
    const handleBookNow = onBookNowClick || (() => { });

    const enabledSections = Object.entries(config.sections)
        .filter(([, section]) => section.enabled)
        .sort((a, b) => a[1].order - b[1].order);

    // Check trial expiration for blur effect
    const isTrialExpired = () => {
        if (!business.created_at) return false;
        const created = new Date(business.created_at);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    };

    const showBlur = isTrialExpired() && !isEditing;

    return (
        <div className={`bg-white relative ${showBlur ? 'overflow-hidden' : ''}`}>
            {showBlur && (
                <div className="absolute inset-0 z-[100] backdrop-blur-xl bg-white/40 flex items-center justify-center p-8 text-center pt-[20vh]">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border border-primary/20 max-w-xl backdrop-blur-md">
                        <h2 className="text-4xl font-serif text-primary mb-6">Trang hiện đang tạm ẩn</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">Thời gian trải nghiệm 30 ngày của doanh nghiệp này đã kết thúc. Vui lòng quay lại sau khi doanh nghiệp nâng cấp dịch vụ.</p>
                        <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full"></div>
                    </div>
                </div>
            )}

            <BusinessHeader business={business} onBookNowClick={handleBookNow} />

            <main>
                {enabledSections.map(([key, section]) => {
                    const Component = SECTION_COMPONENTS[key];
                    if (!Component) return null;

                    return (
                        <div key={key} className="relative group">
                            {isEditing && (
                                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onUpdateContent?.(key, section.content || {})}
                                        className="bg-primary text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-xl hover:scale-105 transition-all uppercase tracking-widest"
                                    >
                                        Chỉnh sửa phần này
                                    </button>
                                </div>
                            )}
                            <Component
                                business={business}
                                content={section.content}
                                isEditing={isEditing}
                                onBookNowClick={handleBookNow}
                            />
                        </div>
                    );
                })}
            </main>

            <BusinessFooter
                business={business}
                content={config.sections.contact?.content}
                isEditing={isEditing}
            />
        </div>
    );
};

export default UnifiedLandingPageRenderer;
