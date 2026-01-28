// Landing Page Preview Component
// Phase 1.2: Preview landing page before publish

import React from 'react';
import { Business, LandingPageConfig } from '../types.ts';
import BusinessHeader from './business-landing/BusinessHeader.tsx';
import HeroSection from './business-landing/HeroSection.tsx';
import AboutSection from './business-landing/AboutSection.tsx';
import ServicesSection from './business-landing/ServicesSection.tsx';
import GallerySection from './business-landing/GallerySection.tsx';
import TeamSection from './business-landing/TeamSection.tsx';
import VideoSection from './business-landing/VideoSection.tsx';
import DealsSection from './business-landing/DealsSection.tsx';
import BookingCtaSection from './business-landing/BookingCtaSection.tsx';
import LocationSection from './business-landing/LocationSection.tsx';
import BusinessFooter from './business-landing/BusinessFooter.tsx';
import BusinessBlogSection from './business-landing/BusinessBlogSection.tsx';
import ReviewsSection from './business-landing/ReviewsSection.tsx';

interface LandingPagePreviewProps {
  business: Business;
  config: landing_page_config;
  onClose: () => void;
}

// Map section keys to components
const SECTION_COMPONENTS: Record<keyof landing_page_config['sections'], React.ComponentType<any>> = {
  hero: HeroSection,
  trust: () => null, // Trust indicators section - to be implemented in Phase 3.2
  services: ServicesSection,
  gallery: GallerySection,
  team: TeamSection,
  reviews: ReviewsSection,
  cta: BookingCtaSection,
  contact: LocationSection,
};

const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({ business, config, onClose }) => {
  // Create a business object with the config applied
  const previewBusiness: Business = {
    ...business,
    landing_page_config: config,
  };

  // Get sections sorted by order and filtered by enabled
  const enabledSections = Object.entries(config.sections)
    .filter(([_, section]) => (section as any).enabled)
    .map(([key, section]) => ({
      key: key as keyof LandingPageConfig['sections'],
      order: (section as any).order,
    }))
    .sort((a, b) => a.order - b.order);

  const handleBookNowClick = () => {
    // In preview, just show a message or do nothing
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
      <div className="min-h-screen bg-white">
        {/* Preview Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-neutral-dark">Landing Page Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              This is how your landing page will look to visitors
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Close Preview
          </button>
        </div>

        {/* Preview Content */}
        <div className="bg-white">
          <BusinessHeader business={previewBusiness} onBookNowClick={handleBookNowClick} />
          <main>
            {/* Hero section is always rendered (outside container) */}
            {enabledSections.find(s => s.key === 'hero') && (
              <HeroSection business={previewBusiness} onBookNowClick={handleBookNowClick} />
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              {/* About section - always shown (not in config) */}
              <AboutSection business={previewBusiness} />

              {/* Render sections based on config */}
              {enabledSections
                .filter(s => s.key !== 'hero') // Hero is rendered separately
                .map(({ key }) => {
                  const Component = SECTION_COMPONENTS[key];
                  if (!Component) return null;

                  // Special handling for sections that need different props
                  if (key === 'cta') {
                    return (
                      <BookingCtaSection
                        key={key}
                        onBookNowClick={handleBookNowClick}
                      />
                    );
                  }

                  if (key === 'contact') {
                    return (
                      <div key={key} className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <LocationSection business={previewBusiness} />
                      </div>
                    );
                  }

                  // Blog section (not in config, but can be added)
                  if (key === 'services') {
                    return <ServicesSection key={key} business={previewBusiness} />;
                  }

                  if (key === 'gallery') {
                    return <GallerySection key={key} business={previewBusiness} />;
                  }

                  if (key === 'team') {
                    return <TeamSection key={key} business={previewBusiness} />;
                  }

                  if (key === 'reviews') {
                    return <ReviewsSection key={key} business={previewBusiness} />;
                  }

                  // Video section (not in config, but can be shown if business has video)
                  if (key === 'trust') {
                    // Trust indicators - placeholder for Phase 3.2
                    return null;
                  }

                  return <Component key={key} business={previewBusiness} />;
                })}

              {/* Blog section - always shown if business has blog posts (not in config) */}
              {business.business_blog_posts && business.business_blog_posts.length > 0 && (
                <BusinessBlogSection business={previewBusiness} />
              )}

              {/* Video section - shown if business has video (not in config) */}
              {business.youtube_url && (
                <VideoSection business={previewBusiness} />
              )}

              {/* Deals section - shown if business has deals (not in config) */}
              {business.deals && business.deals.length > 0 && (
                <DealsSection business={previewBusiness} />
              )}
            </div>

            {/* CTA section outside container */}
            {enabledSections.find(s => s.key === 'cta') && (
              <BookingCtaSection onBookNowClick={handleBookNowClick} />
            )}
          </main>
          <BusinessFooter business={previewBusiness} />
        </div>
      </div>
    </div>
  );
};

export default LandingPagePreview;
