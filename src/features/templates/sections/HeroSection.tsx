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
        return undefined;
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
                    <div className="mb-6 flex items-center gap-6 animate-fade-in">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                            <span className="text-xs font-bold tracking-widest">{business.view_count || 0} lượt xem</span>
                        </div>
                        <button
                            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all"
                        >
                            <div className="flex text-gold">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                            </div>
                            <span className="text-xs font-bold tracking-widest">{business.rating || 5.0} Đánh giá</span>
                        </button>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif mb-4 animate-fade-in">
                        {business.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-sans max-w-2xl animate-fade-up">
                        {business.slogan}
                    </p>
                    <button
                        onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-8 px-8 py-3 bg-white text-black font-semibold rounded-sm hover:bg-opacity-90 transition-all"
                    >
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
                    <div className="mb-6 flex items-center gap-6 transition-all duration-700 transform">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                            <span className="text-xs font-bold tracking-widest">{business.view_count || 0} lượt xem</span>
                        </div>
                        <button
                            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all"
                        >
                            <div className="flex text-gold">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                            </div>
                            <span className="text-xs font-bold tracking-widest">{business.rating || 5.0} Đánh giá</span>
                        </button>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif mb-4 transition-all duration-700 transform">
                        {slides[currentSlide].title || business.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-sans max-w-2xl transition-all duration-700 delay-100 transform">
                        {slides[currentSlide].subtitle || business.slogan}
                    </p>
                    <button
                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                        className="mt-8 px-8 py-3 bg-white text-black font-semibold rounded-sm hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                    >
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
