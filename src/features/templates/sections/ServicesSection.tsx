import React from 'react';
import { Business, Service } from '../../../../types.ts';

interface ServicesSectionProps {
    business: Business;
    services?: Service[];
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ business, services = [] }) => {
    const displayServices = services.length > 0 ? services : (business.services || []);

    if (displayServices.length === 0) return null;

    return (
        <section className="py-24 px-4 md:px-20 bg-white" id="services">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div>
                        <h2 className="text-xs uppercase tracking-[0.4em] text-accent mb-6 font-bold">Danh mục dịch vụ</h2>
                        <h3 className="text-5xl md:text-6xl font-serif text-primary tracking-tight">
                            Nâng niu <span className="italic font-light">từng khoảnh khắc</span>
                        </h3>
                    </div>
                    <p className="max-w-md text-neutral-500 font-light text-lg italic tracking-wide">
                        Khám phá danh sách các liệu trình chăm sóc chuyên sâu được thiết kế riêng cho vẻ đẹp và sự thư giãn của quý khách.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {displayServices.map((service, index) => (
                        <div
                            key={service.id || index}
                            className="group bg-background border border-luxury-border hover:border-gold/30 transition-all duration-700 rounded-2xl overflow-hidden flex flex-col h-full shadow-soft hover:shadow-premium"
                        >
                            <div className="aspect-[16/10] overflow-hidden relative">
                                <img
                                    src={service.image_url || 'https://images.unsplash.com/photo-1544161515-436cefb5481d?w=800'}
                                    alt={service.name}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold tracking-widest text-primary shadow-soft rounded-full">
                                    {service.price}
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <h4 className="text-2xl font-serif text-primary mb-4 group-hover:text-gold transition-colors tracking-wide">
                                    {service.name}
                                </h4>
                                <p className="text-neutral-500 text-sm font-light leading-relaxed mb-8 italic">
                                    {service.description || "Liệu trình chăm sóc chuyên nghiệp giúp quý khách lấy lại vẻ rạng rỡ và sảng khoái tuyệt đối."}
                                </p>
                                <div className="mt-auto pt-6 border-t border-luxury-border flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                                        {service.duration_minutes ? `${service.duration_minutes} PHÚT` : '60 PHÚT'}
                                    </span>
                                    <button className="text-xs font-bold uppercase tracking-widest text-accent group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                        ĐẶT HẸN <span className="text-lg">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <button className="px-12 py-5 bg-primary text-white font-bold tracking-[0.2em] uppercase text-[10px] hover:bg-gold transition-all shadow-xl rounded-full">
                        XEM TOÀN BỘ DANH MỤC DỊCH VỤ
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
