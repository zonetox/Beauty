import React from 'react';
import { Business } from '../../../../types.ts';
import { Star, Quote } from 'lucide-react';

interface ReviewsSectionProps {
    business: Business;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ business }) => {
    // If business does not have reviews, use standard ones as requested for template
    const reviews = (business.reviews && business.reviews.length > 0) ? business.reviews.slice(0, 3) : [
        {
            id: 'mock-1',
            user_name: 'Thanh Vy',
            rating: 5,
            comment: 'Mẫu nail rất đẹp, bạn kỹ thuật viên làm cực kỳ tỉ mỉ và nhẹ nhàng. Chắc chắn sẽ quay lại!',
            user_avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Vy'
        },
        {
            id: 'mock-2',
            user_name: 'Minh Anh',
            rating: 5,
            comment: 'Gôi đầu dưỡng sinh ở đây rất thư giãn, mình ngủ quên luôn lúc nào không biết. Không gian thơm mùi thảo mộc.',
            user_avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Anh'
        },
        {
            id: 'mock-3',
            user_name: 'Lan Hương',
            rating: 5,
            comment: 'Dịch vụ 10/10. Chuyên nghiệp từ khâu đón tiếp đến lúc ra về. Giá cả hợp lý so với chất lượng.',
            user_avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Huong'
        }
    ];

    return (
        <section className="py-24 px-4 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-50" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="text-center mb-16">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent mb-4 font-bold">Cảm nhận khách hàng</h2>
                    <h3 className="text-4xl md:text-5xl font-serif text-primary">Lời khen trân quý</h3>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review: any) => (
                        <div key={review.id} className="bg-primary/[0.02] p-10 rounded-[2.5rem] border border-luxury-border/30 relative flex flex-col justify-between h-full">
                            <Quote size={40} className="text-primary/10 absolute top-8 right-8" />

                            <div>
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < review.rating ? "fill-gold text-gold" : "text-neutral-200"} />
                                    ))}
                                </div>
                                <p className="text-neutral-600 font-light italic leading-relaxed text-sm">
                                    "{review.comment}"
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mt-10 pt-6 border-t border-luxury-border/20">
                                <img src={review.user_avatar_url} alt={review.user_name} className="w-10 h-10 rounded-full border border-luxury-border/30" />
                                <div>
                                    <h4 className="text-sm font-bold text-primary tracking-tight">{review.user_name}</h4>
                                    <p className="text-[10px] text-neutral-400">Khách hàng thân thiết</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ReviewsSection;
