import React from 'react';
import { Business } from '../../../../types.ts';
import { ShieldCheck, Award, Clock, Sparkles } from 'lucide-react';

interface BenefitsSectionProps {
    business: Business;
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ business }) => {
    const benefits = [
        {
            icon: <Sparkles className="w-8 h-8 text-primary" />,
            title: 'Không gian thư giãn',
            desc: 'Sang trọng, êm ái, nhạc nhẹ tinh tế.'
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-primary" />,
            title: 'Sản phẩm chính hãng',
            desc: 'An toàn tuyệt đối cho da & móng của bạn.'
        },
        {
            icon: <Award className="w-8 h-8 text-primary" />,
            title: 'Kỹ thuật viên chuyên nghiệp',
            desc: 'Đào tạo bài bản, giàu kinh nghiệm thực chiến.'
        },
        {
            icon: <Clock className="w-8 h-8 text-primary" />,
            title: 'Phục vụ đúng giờ',
            desc: 'Không chờ đợi, tận tâm và chu đáo từng phút.'
        }
    ];

    return (
        <section className="py-24 px-4 bg-primary/[0.02]">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-16">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent mb-4 font-bold">Lợi ích thực tế</h2>
                    <h3 className="text-4xl md:text-5xl font-serif text-primary">Vì sao nên chọn {business.name}?</h3>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="bg-white p-8 rounded-3xl border border-luxury-border/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                            <div className="mb-6 p-4 bg-primary/5 rounded-2xl w-fit">
                                {benefit.icon}
                            </div>
                            <h4 className="text-lg font-serif text-primary mb-3">{benefit.title}</h4>
                            <p className="text-neutral-500 text-sm italic font-light">{benefit.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
