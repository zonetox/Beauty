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
        <section className="relative h-[90vh] min-h-[700px] text-accent pt-24 overflow-hidden bg-secondary">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className="absolute inset-0 z-0 transition-opacity duration-1500 ease-in-out"
                    style={{ opacity: index === currentSlide ? 1 : 0 }}
                >
                    <img
                        src={getOptimizedSupabaseUrl(slide?.image_url ?? '', { width: 1920, quality: 85 })}
                        alt={slide?.title}
                        className={`w-full h-full object-cover scale-100 ${index === currentSlide ? 'animate-ken-burns' : ''}`}
                    />
                    {/* Royal Champagne Soft Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/40 via-secondary/10 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-secondary/20"></div>
                </div>
            ))}

            <div className="relative container mx-auto px-6 lg:px-12 h-full flex flex-col justify-center pb-20">
                <div className="max-w-5xl">
                    <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase tracking-[0.6em] text-primary">
                            {business.categories.join(' / ')}
                        </p>
                    </div>

                    <h1 className="mt-2 text-7xl md:text-9xl lg:text-[10rem] font-bold font-serif leading-[0.85] tracking-tighter animate-fade-in-up delay-100 italic text-accent drop-shadow-sm">
                        <Editable
                            id={`landing_hero_title_${currentSlide}`}
                            type="text"
                            value={currentSlideData?.title || business.name}
                        >
                            {currentSlideData?.title}
                        </Editable>
                    </h1>

                    <div className="mt-10 max-w-2xl animate-fade-in-up delay-200">
                        <Editable
                            id={`landing_hero_subtitle_${currentSlide}`}
                            type="textarea"
                            value={currentSlideData?.subtitle || ''}
                        >
                            <p className="text-xl md:text-2xl text-accent/80 font-sans font-light tracking-wide leading-relaxed italic border-l-2 border-primary/30 pl-8">
                                {currentSlideData?.subtitle}
                            </p>
                        </Editable>
                    </div>

                    <div className="mt-12 flex flex-wrap items-center gap-10 animate-fade-in-up delay-300">
                        <div className="flex items-center gap-4">
                            <span className="font-serif italic text-4xl text-primary">{business.rating.toFixed(1)}</span>
                            <div className="flex flex-col">
                                <StarRating rating={business.rating} />
                                <span className="text-accent/40 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">({visibleReviews.length} LƯỢT ĐÁNH GIÁ)</span>
                            </div>
                        </div>

                        <div className="w-px h-12 bg-accent/10 hidden sm:block"></div>

                        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-medium text-accent/70 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full border border-primary/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>{business.district}, {business.city}</span>
                        </div>
                    </div>

                    <div className="mt-16 flex items-center gap-8 animate-fade-in-up delay-400">
                        <button
                            onClick={onBookNowClick}
                            className="group relative overflow-hidden bg-primary text-white px-14 py-6 rounded-full font-bold text-xs tracking-[0.3em] uppercase transition-all shadow-premium hover:shadow-glass hover:-translate-y-1"
                        >
                            <span className="relative z-10 transition-colors duration-500">Đăng ký tư vấn ngay</span>
                            <div className="absolute inset-x-0 bottom-0 h-0 bg-accent transition-all duration-500 group-hover:h-full z-0"></div>
                        </button>

                        <a href="#services" className="text-accent/60 hover:text-primary transition-colors text-xs font-bold tracking-[0.3em] uppercase border-b border-accent/10 pb-1">
                            Khám phá dịch vụ
                        </a>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 right-12 hidden lg:flex flex-col items-center gap-4 animate-bounce">
                <span className="text-[10px] uppercase tracking-[0.5em] origin-right rotate-90 translate-y-12 text-accent/30 font-bold whitespace-nowrap">Cuộn để khám phá</span>
                <div className="w-px h-24 bg-gradient-to-t from-primary to-transparent"></div>
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
