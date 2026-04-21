import React, { useState, useEffect } from 'react';
import { Business } from '../../../../types.ts';

interface HeroSectionProps {
    business: Business;
    heroType: 'slider' | 'video';
    overlayColor?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ business, heroType, overlayColor = 'rgba(0,0,0,0.4)' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = business.hero_slides || [
        { title: business.name, subtitle: business.slogan, image_url: business.image_url || business.hero_image_url }
    ];

    useEffect(() => {
        if (heroType === 'slider' && slides.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [heroType, slides.length]);

    const renderVideo = () => {
        const videoUrl = business.youtube_url;
        if (!videoUrl) return renderSlider();

        // Extract YouTube ID
        const videoId = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|user\/\S+|live\/))([^?&"'>]+)/)?.[1];

        if (!videoId) return renderSlider();

        return (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <iframe
                    className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0&showinfo=0`}
                    allow="autoplay; encrypted-media"
                    title="Hero Video"
                />
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: overlayColor }}></div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 text-white">
                    <h1 className="text-4xl md:text-6xl font-serif mb-4 animate-fade-in">
                        {business.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-sans max-w-2xl animate-fade-up">
                        {business.slogan}
                    </p>
                    <button className="mt-8 px-8 py-3 bg-white text-black font-semibold rounded-sm hover:bg-opacity-90 transition-all">
                        ĐẶT LỊCH NGAY
                    </button>
                </div>
            </div>
        );
    };

    const renderSlider = () => {
        return (
            <div className="relative h-full w-full overflow-hidden">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[5s]"
                            style={{
                                backgroundImage: `url(${slide.image_url})`,
                                transform: index === currentSlide ? 'scale(1)' : 'scale(1.05)'
                            }}
                        />
                        <div className="absolute inset-0" style={{ backgroundColor: overlayColor }} />
                    </div>
                ))}

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 text-white">
                    <h1 className="text-4xl md:text-6xl font-serif mb-4 transition-all duration-700 transform">
                        {slides[currentSlide].title || business.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-sans max-w-2xl transition-all duration-700 delay-100 transform">
                        {slides[currentSlide].subtitle || business.slogan}
                    </p>
                    <button className="mt-8 px-8 py-3 bg-white text-black font-semibold rounded-sm hover:bg-primary hover:text-white transition-all transform hover:scale-105">
                        KHÁM PHÁ NGAY
                    </button>
                </div>

                {slides.length > 1 && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="relative h-[80vh] md:h-screen w-full">
            {heroType === 'video' ? renderVideo() : renderSlider()}
        </section>
    );
};

export default HeroSection;
