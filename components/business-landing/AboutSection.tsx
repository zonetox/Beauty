import React from 'react';
import { Business } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

interface AboutSectionProps {
    business: Business;
}

const AboutSection: React.FC<AboutSectionProps> = ({ business }) => {
    return (
        <section id="about" className="py-20 lg:py-28">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 md:order-1">
                    <p className="text-sm font-semibold uppercase text-primary tracking-widest">Giới thiệu</p>
                    <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                        Chào mừng đến với {business.name}
                    </h2>
                    <p className="mt-6 text-gray-600 leading-relaxed whitespace-pre-line">
                        {business.description}
                    </p>
                </div>
                <div className="order-1 md:order-2">
                    <img 
                        src={getOptimizedSupabaseUrl(business.image_url, { width: 800, quality: 80 })} 
                        alt={`Interior of ${business.name}`} 
                        className="rounded-lg shadow-2xl w-full h-auto object-cover aspect-square"
                    />
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
