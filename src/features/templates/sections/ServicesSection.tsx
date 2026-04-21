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
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <h2 className="text-sm uppercase tracking-[0.4em] text-primary mb-4 font-semibold">Dịch vụ đặc sắc</h2>
                        <h3 className="text-4xl md:text-5xl font-serif text-neutral-dark">
                            Nâng niu <span className="italic font-normal">từng khoảnh khắc</span>
                        </h3>
                    </div>
                    <p className="max-w-md text-neutral-dark/60 font-sans text-lg">
                        Khám phá danh sách các liệu trình chăm sóc chuyên sâu được thiết kế riêng cho vẻ đẹp và sự thư giãn của bạn.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayServices.map((service, index) => (
                        <div
                            key={service.id || index}
                            className="group bg-[#FDFCF9] border border-primary/10 hover:border-primary/40 transition-all duration-500 rounded-sm overflow-hidden flex flex-col h-full"
                        >
                            <div className="aspect-[16/10] overflow-hidden relative">
                                <img
                                    src={service.image_url || 'https://images.unsplash.com/photo-1544161515-436cefb5481d?w=500'}
                                    alt={service.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm font-semibold tracking-wider text-primary shadow-sm">
                                    {service.price}
                                </div>
                            </div>

                            <div className="p-8 flex flex-col flex-grow">
                                <h4 className="text-xl font-serif text-neutral-dark mb-3 group-hover:text-primary transition-colors">
                                    {service.name}
                                </h4>
                                <p className="text-neutral-dark/60 text-sm line-clamp-3 mb-6 font-sans leading-relaxed">
                                    {service.description || "Liệu trình chăm sóc chuyên nghiệp giúp bạn lấy lại vẻ rạng rỡ và sảng khoái sau những giờ làm việc căng thẳng."}
                                </p>
                                <div className="mt-auto pt-6 border-t border-primary/10 flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-widest text-neutral-dark/40">
                                        {service.duration_minutes ? `${service.duration_minutes} PHÚT` : '60 PHÚT'}
                                    </span>
                                    <button className="text-sm font-bold text-primary group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                                        ĐẶT LỊCH <span className="text-lg">→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button className="px-12 py-5 bg-primary text-white font-semibold tracking-[0.2em] uppercase text-xs hover:bg-primary-dark transition-all shadow-lg rounded-sm">
                        XEM TOÀN BỘ MENU DỊCH VỤ
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;
