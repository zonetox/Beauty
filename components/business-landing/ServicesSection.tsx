import React, { useState, useRef, useEffect } from 'react';
import { Business, Service } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';
import Editable from '../Editable.tsx';

// --- Modal Component for viewing all services ---
const AllServicesModal: React.FC<{ services: Service[]; onClose: () => void }> = ({ services, onClose }) => (
    <div className="fixed inset-0 bg-accent/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div
            className="bg-secondary rounded-luxury shadow-premium w-full max-w-5xl max-h-[90vh] flex flex-col luxury-border-thin animate-scale-in"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-8 border-b border-primary/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-primary"></div>
                    <h3 className="text-3xl font-serif text-accent italic">Danh mục dịch vụ</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            <main className="p-8 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                    {services.map(service => (
                        <div key={service.id} className="group flex items-center gap-6 p-6 bg-white rounded-2xl hover:shadow-premium transition-all border border-transparent hover:border-primary/20">
                            <img src={getOptimizedSupabaseUrl(service.image_url, { width: 200, quality: 80 })} alt={service.name} className="w-28 h-28 object-cover rounded-xl shadow-lg flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500" />
                            <div className="flex-grow">
                                <p className="text-lg font-serif italic text-accent group-hover:text-primary transition-colors">{service.name}</p>
                                <p className="text-sm text-accent/50 mt-1 line-clamp-2">{service.description}</p>
                                <div className="mt-3 flex items-center gap-4">
                                    <span className="text-primary font-bold">{service.price}</span>
                                    {service.duration_minutes && <span className="text-[10px] uppercase tracking-widest text-accent/30">{service.duration_minutes} PHÚT</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
);


const ServicesSection: React.FC<{
    business: Business;
    content?: any;
    isEditing?: boolean;
}> = ({ business, content }) => {
    const displayTitle = content?.title || 'Dịch vụ nổi bật của chúng tôi';
    const displaySubtitle = content?.subtitle || 'Dịch vụ';
    const displayServices = content?.items || business.services || [];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [servicesPerPage, setServicesPerPage] = useState(3);
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setServicesPerPage(1);
            else if (window.innerWidth < 1024) setServicesPerPage(2);
            else setServicesPerPage(3);
            setCurrentIndex(0); // Reset on resize
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (displayServices.length === 0) {
        return null;
    }

    const totalPages = Math.ceil(displayServices.length / servicesPerPage);
    const canGoNext = currentIndex < totalPages - 1;
    const canGoPrev = currentIndex > 0;

    const handleNext = () => {
        if (canGoNext) setCurrentIndex(prev => prev + 1);
    };
    const handlePrev = () => {
        if (canGoPrev) setCurrentIndex(prev => prev - 1);
    };

    return (
        <section id="services" className="py-32 lg:py-48 bg-white relative">
            {isModalOpen && <AllServicesModal services={displayServices} onClose={() => setIsModalOpen(false)} />}

            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-20 animate-fade-in-up">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-px bg-primary"></div>
                            <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                                <Editable id="services_subtitle" type="text" value={displaySubtitle}>
                                    {displaySubtitle}
                                </Editable>
                            </p>
                        </div>
                        <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic leading-tight">
                            <Editable id="services_title" type="text" value={displayTitle}>
                                {displayTitle}
                            </Editable>
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] text-accent hover:text-primary transition-colors border-b border-accent/10 pb-2"
                    >
                        Khám phá tất cả <span className="text-primary group-hover:translate-x-2 transition-transform">→</span>
                    </button>
                </div>

                <div className="relative">
                    {/* Slider Container */}
                    <div className="overflow-hidden" ref={sliderRef}>
                        <div
                            className="flex transition-all duration-1000 ease-in-out"
                            style={{ transform: `translateX(-${currentIndex * (100 / servicesPerPage)}%)` }}
                        >
                            {displayServices.map((service: any) => (
                                <div key={service.id} className="px-4" style={{ flex: `0 0 ${100 / servicesPerPage}%` }}>
                                    <div className="group relative bg-white rounded-luxury overflow-hidden h-[600px] luxury-border-thin hover:shadow-premium transition-all duration-700">
                                        <div className="absolute inset-0 overflow-hidden">
                                            <img
                                                src={getOptimizedSupabaseUrl(service.image_url, { width: 800, quality: 85 })}
                                                alt={service.name}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-accent via-accent/20 to-transparent"></div>
                                        </div>

                                        <div className="absolute inset-0 p-10 flex flex-col justify-end transform transition-transform duration-700 group-hover:-translate-y-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-px bg-primary"></div>
                                                <span className="text-primary font-bold text-lg">{service.price}</span>
                                            </div>
                                            <h4 className="font-bold font-serif text-3xl lg:text-4xl text-white italic">{service.name}</h4>
                                            <p className="text-white/60 mt-4 font-light text-base line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                                {service.description}
                                            </p>

                                            <div className="mt-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                                                <button className="bg-primary text-accent px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Elite Navigation */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-6 mt-16">
                            <button
                                onClick={handlePrev}
                                disabled={!canGoPrev}
                                className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-accent transition-all disabled:opacity-20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!canGoNext}
                                className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-accent transition-all disabled:opacity-20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
