import React from 'react';
import { Business } from '../../../../types.ts';

interface AboutSectionProps {
    business: Business;
}

const AboutSection: React.FC<AboutSectionProps> = ({ business }) => {
    return (
        <section className="py-24 px-4 md:px-20 bg-[#FDFCF9]">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 relative">
                    <div className="absolute -top-4 -left-4 w-24 h-24 border-t border-l border-primary/40 hidden md:block" />
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b border-r border-primary/40 hidden md:block" />
                    <img
                        src={business.image_url || 'https://images.unsplash.com/photo-1544161515-436cefb5481d?w=800&auto=format&fit=crop'}
                        alt="About our Spa"
                        className="w-full aspect-[4/5] object-cover shadow-2xl rounded-sm"
                    />
                </div>

                <div className="lg:w-1/2 space-y-8">
                    <header>
                        <h2 className="text-sm uppercase tracking-[0.4em] text-primary mb-4">Câu chuyện của chúng tôi</h2>
                        <h3 className="text-4xl md:text-5xl font-serif text-neutral-dark leading-tight">
                            Sứ mệnh khơi dậy <br /><span className="italic">vẻ đẹp tự nhiên</span>
                        </h3>
                    </header>

                    <div className="space-y-6 text-neutral-dark/80 text-lg leading-relaxed font-sans">
                        <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-primary first-letter:mr-3 first-letter:float-left">
                            {business.description || "Chúng tôi tin rằng vẻ đẹp thực sự bắt nguồn từ sự cân bằng giữa thân, tâm và trí. Tại đây, mỗi liệu trình không chỉ là sự chăm sóc bên ngoài mà còn là hành trình tìm lại sự tĩnh tại trong tâm hồn."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-primary/20">
                        <div>
                            <h4 className="text-2xl font-serif text-primary">10+</h4>
                            <p className="text-sm uppercase tracking-widest text-neutral-dark/60 mt-1">Năm kinh nghiệm</p>
                        </div>
                        <div>
                            <h4 className="text-2xl font-serif text-primary">5000+</h4>
                            <p className="text-sm uppercase tracking-widest text-neutral-dark/60 mt-1">Khách hàng tin tưởng</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button className="px-10 py-4 border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 tracking-widest text-sm font-semibold uppercase">
                            Về triết lý Ratio
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
