import React from 'react';
import { Business } from '../../../../types.ts';
import { TemplatePreset } from '../presets.ts';
import QuickInfoBar from '../sections/QuickInfoBar.tsx';
import HeroSection from '../sections/HeroSection.tsx';
import AboutSection from '../sections/AboutSection.tsx';
import ServicesSection from '../sections/ServicesSection.tsx';
import ProductsSection from '../sections/ProductsSection.tsx';
import GallerySection from '../sections/GallerySection.tsx';
import MapSection from '../sections/MapSection.tsx';
import TemplateFooter from '../sections/TemplateFooter.tsx';
import ZaloWidget from '../sections/ZaloWidget.tsx';

interface LuxuryTemplateLayoutProps {
    business: Business;
    preset: TemplatePreset;
}

const LuxuryTemplateLayout: React.FC<LuxuryTemplateLayoutProps> = ({ business, preset }) => {
    return (
        <div
            className="min-h-screen transition-colors duration-500"
            style={{
                backgroundColor: preset.theme.colors.background,
                fontFamily: `'${preset.theme.fonts.sans}', sans-serif`
            }}
        >
            <style>{`
        h1, h2, h3, h4, .font-serif {
          font-family: '${preset.theme.fonts.serif}', serif !important;
        }
        :root {
          --color-primary: ${preset.theme.colors.primary};
          --color-primary-dark: ${preset.theme.colors.primary_dark};
          --color-secondary: ${preset.theme.colors.secondary};
          --color-accent: ${preset.theme.colors.accent};
          --color-background: ${preset.theme.colors.background};
          --color-neutral-dark: ${preset.theme.colors.neutral_dark};
        }
        .bg-primary { background-color: var(--color-primary); }
        .text-primary { color: var(--color-primary); }
        .border-primary { border-color: var(--color-primary); }
      `}</style>

            {/* 1. Quick Info Bar */}
            <QuickInfoBar business={business} />

            {/* 2. Hero Section */}
            <HeroSection
                business={business}
                heroType={business.hero_type || 'slider'}
                overlayColor={preset.styles.heroOverlay}
            />

            {/* 3. About Section */}
            <AboutSection business={business} />

            {/* 4. Services Section */}
            <ServicesSection business={business} />

            {/* 5. Products/Packages Section */}
            <ProductsSection business={business} />

            {/* 6. Gallery Section (Pinterest/Masonry) */}
            <GallerySection
                business={business}
                layout={preset.styles.galleryLayout || 'masonry'}
            />

            {/* 7. Contact + Styled Map */}
            <MapSection
                business={business}
                mapFilter={preset.styles.mapFilter}
            />

            {/* 8. Footer */}
            <TemplateFooter business={business} />

            {/* Floating Zalo Widget */}
            <ZaloWidget phone={business.zalo_phone || business.phone} />
        </div>
    );
};

export default LuxuryTemplateLayout;
