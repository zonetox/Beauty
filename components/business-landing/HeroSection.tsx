import React, { useState, useEffect, useMemo } from 'react';
import { Business, ReviewStatus, HeroSlide } from '../../types.ts';
import StarRating from '../StarRating.tsx';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';
// CMS context unused in this view
import Editable from '../Editable.tsx';

interface HeroSectionProps {
    business: Business;
    onBookNowClick: () => void;
    content?: any;
    isEditing?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ business, onBookNowClick, content }) => {

    const slides: HeroSlide[] = useMemo(() => {
        // Priority 1: Use specific content from CMS if provided
        if (content && (content.title || content.image_url)) {
            return [{
                title: content.title || business.name,
                subtitle: content.subtitle || business.slogan || '',
                image_url: content.image_url || business.hero_image_url || business.image_url,
            }];
        }

        // Priority 2: Use business hero slides
        if (business.hero_slides && business.hero_slides.length > 0) {
            return business.hero_slides;
        }

        // Priority 3: Fallback to basic business info
        return [{
            title: business.name,
            subtitle: business.slogan || business.categories.join(', '),
            image_url: business.hero_image_url || business.image_url,
        }];
    }, [business, content]);

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const visibleReviews = (business?.reviews ?? []).filter(r => r?.status === ReviewStatus.VISIBLE);
    const currentSlideData = slides[currentSlide];

    return (
        <section className="relative h-[80vh] min-h-[600px] lg:h-[85vh] text-white pt-24 overflow-hidden">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: index === currentSlide ? 1 : 0 }}
                >
                    <img
                        src={getOptimizedSupabaseUrl(slide?.image_url ?? '', { width: 1920, quality: 85 })}
                        alt={slide?.title}
                        className={`w-full h-full object-cover scale-105 ${index === currentSlide ? 'animate-ken-burns' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark/90 via-neutral-dark/30 to-transparent"></div>
                </div>
            ))}

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 lg:pb-24">
                <div className="max-w-4xl">
                    <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-primary mb-6 animate-fade-in-up">{business.categories.join(' / ')}</p>
                    <h1 className="mt-2 text-6xl md:text-8xl lg:text-9xl font-bold font-serif leading-[0.9] tracking-tight animate-fade-in-up delay-100 italic uppercase">
                        <Editable
                            id={`landing_hero_title_${currentSlide}`}
                            type="text"
                            value={currentSlideData?.title || business.name}
                        >
                            {currentSlideData?.title}
                        </Editable>
                    </h1>
                    <div className="mt-8 text-base md:text-lg max-w-2xl text-white/80 font-sans font-light tracking-[0.1em] leading-relaxed animate-fade-in-up delay-200">
                        <Editable
                            id={`landing_hero_subtitle_${currentSlide}`}
                            type="textarea"
                            value={currentSlideData?.subtitle || ''}
                        >
                            <p className="line-clamp-2 uppercase">{currentSlideData?.subtitle}</p>
                        </Editable>
                    </div>
                    <div className="mt-10 flex flex-wrap items-center gap-8 animate-fade-in-up delay-300">
                        <div className="flex items-center gap-3">
                            <StarRating rating={business.rating} />
                            <span className="font-serif italic text-xl">{business.rating.toFixed(1)}</span>
                            <span className="text-white/40 text-[10px] uppercase tracking-widest">({visibleReviews.length} reviews)</span>
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-medium text-white/60">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>{business.district}, {business.city}</span>
                        </div>
                    </div>
                    <div className="mt-12 animate-fade-in-up delay-400">
                        <button
                            onClick={onBookNowClick}
                            className="bg-primary text-white px-12 py-5 rounded-full font-medium text-sm tracking-[0.2em] uppercase hover:bg-primary-dark transition-all transform hover:scale-105 shadow-2xl"
                        >
                            Đăng ký tư vấn
                        </button>
                    </div>
                </div>
            </div>

            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white'}`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HeroSection;
