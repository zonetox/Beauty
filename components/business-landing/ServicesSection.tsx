import React, { useState, useRef, useEffect } from 'react';
import { Business, Service } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

// --- Modal Component for viewing all services ---
const AllServicesModal: React.FC<{ services: Service[]; onClose: () => void }> = ({ services, onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif text-neutral-dark">Tất cả dịch vụ</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </header>
            <main className="p-6 overflow-y-auto">
                <div className="space-y-4">
                    {services.map(service => (
                        <div key={service.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            {/* FIX: Changed 'imageUrl' to 'image_url' to match the Service type. */}
                            <img src={getOptimizedSupabaseUrl(service.image_url, { width: 160, quality: 75 })} alt={service.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-semibold text-neutral-dark">{service.name}</p>
                                <p className="text-sm text-gray-500">{service.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">{service.price}</p>
                                {/* FIX: Changed 'durationMinutes' to 'duration_minutes' to match the Service type. */}
                                {service.duration_minutes && <p className="text-xs text-gray-400">{service.duration_minutes} phút</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    </div>
);


const ServicesSection: React.FC<{ business: Business }> = ({ business }) => {
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

    if (!business.services || business.services.length === 0) {
        return null;
    }

    const totalPages = Math.ceil(business.services.length / servicesPerPage);
    const canGoNext = currentIndex < totalPages - 1;
    const canGoPrev = currentIndex > 0;

    const handleNext = () => {
        if (canGoNext) setCurrentIndex(prev => prev + 1);
    };
    const handlePrev = () => {
        if (canGoPrev) setCurrentIndex(prev => prev - 1);
    };
    
    return (
        <section id="services" className="py-20 lg:py-28 bg-background rounded-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            {isModalOpen && <AllServicesModal services={business.services} onClose={() => setIsModalOpen(false)} />}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-center sm:text-left">
                <div>
                    <p className="text-sm font-semibold uppercase text-primary tracking-widest">Dịch vụ</p>
                    <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                        Dịch vụ nổi bật của chúng tôi
                    </h2>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 sm:mt-0 bg-white border border-primary text-primary px-5 py-2 rounded-full font-semibold text-sm hover:bg-primary/10 transition-colors flex-shrink-0"
                >
                    Xem tất cả dịch vụ
                </button>
            </div>
            
            <div className="mt-16 relative">
                 {/* Slider Container */}
                <div className="overflow-hidden" ref={sliderRef}>
                    <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {business.services.map(service => (
                            <div key={service.id} className="px-3" style={{ flex: `0 0 ${100 / servicesPerPage}%`}}>
                                <div className="bg-white rounded-lg shadow-lg overflow-hidden group h-full flex flex-col">
                                    <div className="relative h-56">
                                        {/* FIX: Changed 'imageUrl' to 'image_url' to match the Service type. */}
                                        <img src={getOptimizedSupabaseUrl(service.image_url, { width: 500, quality: 75 })} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                    <div className="p-6 text-center flex-grow flex flex-col">
                                        <h4 className="font-bold font-serif text-xl text-neutral-dark">{service.name}</h4>
                                        <p className="text-sm text-gray-500 mt-2 h-10 flex-grow">{service.description}</p>
                                        <p className="font-semibold text-primary mt-4 text-lg">{service.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                {totalPages > 1 && (
                     <>
                        <button
                            onClick={handlePrev}
                            disabled={!canGoPrev}
                            className="absolute top-1/2 -translate-y-1/2 -left-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-neutral-dark hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous service"
                        >
                            &#8249;
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canGoNext}
                            className="absolute top-1/2 -translate-y-1/2 -right-4 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-neutral-dark hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next service"
                        >
                            &#8250;
                        </button>
                    </>
                )}
            </div>
        </section>
    );
};

export default ServicesSection;
