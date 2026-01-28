

import React, { useState, useEffect, useMemo } from 'react';
import { Business, ReviewStatus, HeroSlide } from '../../types.ts';
import StarRating from '../StarRating.tsx';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

interface HeroSectionProps {
    business: Business;
    onBookNowClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ business, onBookNowClick }) => {

    const slides: HeroSlide[] = useMemo(() => {
        if (business.hero_slides && business.hero_slides.length > 0) {
            return business.hero_slides;
        }
        return [{
            title: business.name,
            subtitle: business.slogan || business.categories.join(', '),
            image_url: business.hero_image_url || business.image_url,
        }];
    }, [business]);

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
        <section className="relative h-[600px] lg:h-[700px] text-white pt-20">
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
                    /* Dynamic background image - CSS inline necessary for dynamic URL */
                    style={{ backgroundImage: `url(${getOptimizedSupabaseUrl(slide?.image_url ?? '', { width: 1920, quality: 85 })})`, opacity: index === currentSlide ? 1 : 0 }}
                />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 lg:pb-24">
                <div className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-widest text-primary">{business.categories.join(' / ')}</p>
                    <h1 className="mt-2 text-4xl md:text-6xl font-bold font-serif drop-shadow-lg">
                        {currentSlideData?.title}
                    </h1>
                    <p className="mt-4 text-lg md:text-xl max-w-2xl text-gray-200 drop-shadow">
                        {currentSlideData?.subtitle}
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2">
                            <StarRating rating={business.rating} />
                            <span className="font-semibold">{business.rating.toFixed(1)}</span>
                            <span className="text-gray-300">({visibleReviews.length} reviews)</span>
                        </div>
                        <div className="w-px h-6 bg-gray-400 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>{business.district}, {business.city}</span>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={onBookNowClick}
                            className="bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-xl"
                        >
                            Đặt lịch ngay
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
