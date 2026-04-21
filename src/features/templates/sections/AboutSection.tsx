import React from 'react';
import { Business } from '../../../../types.ts';

interface AboutSectionProps {
    business: Business;
}

const AboutSection: React.FC<AboutSectionProps> = ({ business }) => {
    return (
        <section className="py-24 px-4 md:px-20 bg-background">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                <div className="lg:w-1/2 relative group">
                    <div className="absolute -top-6 -left-6 w-32 h-32 border-t-2 border-l-2 border-gold/20 hidden md:block group-hover:-top-4 group-hover:-left-4 transition-all duration-700" />
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-2 border-r-2 border-gold/20 hidden md:block group-hover:-bottom-4 group-hover:-right-4 transition-all duration-700" />
                    <img
                        src={business.image_url || 'https://images.unsplash.com/photo-1544161515-436cefb5481d?w=1000&auto=format&fit=crop'}
                        alt="About our Spa"
                        className="w-full aspect-[4/5] object-cover shadow-premium rounded-2xl transform transition-transform duration-[2000ms] group-hover:scale-[1.02]"
                    />
                </div>

                <div className="lg:w-1/2 space-y-10">
                    <header>
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent mb-6 font-bold">Câu chuyện thương hiệu</h2>
                        <h3 className="text-5xl md:text-6xl font-serif text-primary leading-[1.1] tracking-tight">
                            Sứ mệnh khơi dậy <br /><span className="italic font-light">vẻ đẹp đích thực</span>
                        </h3>
                    </header>

                    <div className="space-y-8 text-neutral-500 text-lg leading-relaxed font-light italic tracking-wide">
                        <p className="first-letter:text-6xl first-letter:font-serif first-letter:text-accent first-letter:mr-4 first-letter:float-left first-letter:leading-none">
                            {business.description || "Chúng tôi tin rằng vẻ đẹp thực sự bắt nguồn từ sự cân bằng giữa thân, tâm và trí. Tại đây, mỗi liệu trình không chỉ là sự chăm sóc bên ngoài mà còn là hành trình tìm lại sự tĩnh tại trong tâm hồn."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-10 border-t border-luxury-border">
                        <div>
                            <h4 className="text-3xl font-serif text-primary tracking-wider">10+</h4>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-2">Năm tinh hoa</p>
                        </div>
                        <div>
                            <h4 className="text-3xl font-serif text-primary tracking-wider">5000+</h4>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-2">Khách hàng trân quý</p>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button className="px-12 py-4 bg-primary text-white hover:bg-gold transition-all duration-500 tracking-[0.2em] text-[10px] font-bold uppercase rounded-full shadow-lg">
                            DÀNH CHO QUÝ KHÁCH
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
