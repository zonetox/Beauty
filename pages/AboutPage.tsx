// C2.6 - About Page (Public Site) (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder, chuẩn SEO cơ bản

import React from 'react';
import { usePublicPageContent } from '../contexts/PublicPageContentContext';
import PageRenderer from '../components/PageRenderer';
import AboutHero from '../components/page-renderer/AboutHero';
import SEOHead from '../components/SEOHead.tsx';
import LoadingState from '../components/LoadingState.tsx';

const AboutPage: React.FC = () => {
    const { getPageContent, loading } = usePublicPageContent();
    const pageData = getPageContent('about');

    // SEO metadata
    const seoTitle = 'Về chúng tôi | 1Beauty.asia';
    const seoDescription = 'Tìm hiểu về 1Beauty.asia - Nền tảng kết nối khách hàng với các spa, salon và clinic làm đẹp uy tín tại Việt Nam.';
    const seoUrl = typeof window !== 'undefined' ? `${window.location.origin}/about` : '';

    // Loading state
    if (loading || !pageData) {
        return (
            <>
                <SEOHead title={seoTitle} description={seoDescription} url={seoUrl} />
                <LoadingState message="Đang tải trang giới thiệu..." fullScreen={true} />
            </>
        );
    }

    // Manually render the hero outside the container for full-width effect
    const heroItem = pageData?.layout.find(item => item.key === 'about-hero');
    const heroIsVisible = heroItem && heroItem.key && pageData?.visibility?.[heroItem.key];

    // Filter out the hero to prevent PageRenderer from rendering it again
    const mainContentLayout = pageData?.layout.filter(item => item.key !== 'about-hero');
    const mainContentPageData = pageData ? { ...pageData, layout: mainContentLayout || [] } : undefined;

    return (
        <>
            <SEOHead
                title={seoTitle}
                description={seoDescription}
                keywords="về chúng tôi, giới thiệu, 1beauty, làm đẹp, spa, salon"
                url={seoUrl}
                type="website"
            />
            <div>
                {heroIsVisible && <AboutHero />}
                <div className="container mx-auto px-4">
                    {mainContentPageData && <PageRenderer pageData={mainContentPageData} />}
                </div>
            </div>
        </>
    );
};

export default AboutPage;
