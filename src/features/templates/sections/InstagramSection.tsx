import React from 'react';
import { Business } from '../../../../types.ts';
import { Camera } from 'lucide-react';

interface InstagramSectionProps {
    business: Business;
}

const InstagramSection: React.FC<InstagramSectionProps> = ({ business }) => {
    // Standard mock Instagram images for template
    const images = [
        'https://images.unsplash.com/photo-1632345031435-8724f6897de5?w=400&q=80',
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
        'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?w=400&q=80',
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
        'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80',
        'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=400&q=80'
    ];

    const instaUser = business.socials?.instagram?.split('/').pop() || ' nailorabeauty';

    return (
        <section className="py-24 px-4 bg-primary/[0.01]">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Camera className="text-primary" size={24} />
                        <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent font-bold">@ {instaUser}</h2>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif text-primary">Theo dõi trên mạng xã hội</h3>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {images.map((img, i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-3xl overflow-hidden relative group cursor-pointer border border-luxury-border/30"
                        >
                            <img
                                src={img}
                                alt={`Insta ${i}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <a
                        href={business.socials?.instagram || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-10 py-4 bg-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-full shadow-xl shadow-primary/20 hover:bg-gold transition-all duration-500"
                    >
                        FOLLOW INSTAGRAM
                    </a>
                </div>
            </div>
        </section>
    );
};

export default InstagramSection;
