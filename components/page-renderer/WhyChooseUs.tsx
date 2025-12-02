import React from 'react';

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="text-center p-6">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto">
            {icon}
        </div>
        <h3 className="mt-5 text-lg font-semibold text-neutral-dark">{title}</h3>
        <p className="mt-2 text-base text-gray-600">{description}</p>
    </div>
);

const WhyChooseUs: React.FC = () => (
    <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold font-serif text-center mb-12">Tại sao chọn BeautyDir?</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard 
                    title="Đối tác uy tín"
                    description="Chúng tôi chỉ hợp tác với các spa, salon, và clinic đã được xác minh về chất lượng và uy tín."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                />
                 <FeatureCard 
                    title="Đặt lịch dễ dàng"
                    description="Giao diện thân thiện giúp bạn tìm kiếm và đặt lịch hẹn chỉ trong vài cú nhấp chuột."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                 <FeatureCard 
                    title="Ưu đãi độc quyền"
                    description="Khám phá hàng ngàn ưu đãi hấp dẫn chỉ có trên BeautyDir, giúp bạn tiết kiệm chi phí làm đẹp."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                />
            </div>
        </div>
    </div>
);

export default WhyChooseUs;
