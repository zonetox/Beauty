import React from 'react';
import { usePageContent } from '../contexts/AdminPlatformContext';
import PageRenderer from '../components/PageRenderer';
import AboutHero from '../components/page-renderer/AboutHero';

const AboutPage: React.FC = () => {
    const { getPageContent } = usePageContent();
    const pageData = getPageContent('about');
    
    // Manually render the hero outside the container for full-width effect
    const heroItem = pageData?.layout.find(item => item.key === 'about-hero');
    const heroIsVisible = heroItem && pageData?.visibility[heroItem.key];
    
    // Filter out the hero to prevent PageRenderer from rendering it again
    const mainContentLayout = pageData?.layout.filter(item => item.key !== 'about-hero');
    const mainContentPageData = pageData ? { ...pageData, layout: mainContentLayout || [] } : undefined;

    return (
        <div>
            {heroIsVisible && <AboutHero />}
            <div className="container mx-auto px-4">
                 {mainContentPageData && <PageRenderer pageData={mainContentPageData} />}
            </div>
        </div>
    );
};

export default AboutPage;
