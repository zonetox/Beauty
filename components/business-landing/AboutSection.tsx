import React from 'react';
import { Business } from '../../types.ts';
import { getOptimizedSupabaseUrl } from '../../lib/image.ts';

import Editable from '../Editable.tsx';

interface AboutSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || `Chào mừng đến với ${business.name}`;
    const displaySubtitle = content?.subtitle || 'Giới thiệu';
    const displayDescription = content?.description || business.description;
    const displayImage = content?.image_url || business.image_url;

    return (
        <section id="about" className="py-32 lg:py-48 bg-secondary overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
                    {/* Floating Luxury Images */}
                    <div className="lg:col-span-6 relative order-2 lg:order-1">
                        <div className="relative z-10 p-6 bg-white shadow-premium rounded-2xl luxury-border-thin rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
                            <Editable id="about_image" type="image" value={displayImage}>
                                <img
                                    src={getOptimizedSupabaseUrl(displayImage, { width: 1000, quality: 85 })}
                                    alt={`Interior of ${business.name}`}
                                    className="rounded-xl w-full h-[500px] object-cover"
                                />
                            </Editable>
                        </div>
                        {/* Abstract Gold Element */}
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl z-0"></div>
                        <div className="absolute -bottom-8 -right-8 w-64 h-64 border border-primary/20 rounded-full z-0"></div>
                    </div>

                    {/* Elite Content */}
                    <div className="lg:col-span-6 order-1 lg:order-2">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-px bg-primary"></div>
                            <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                                <Editable id="about_subtitle" type="text" value={displaySubtitle}>
                                    {displaySubtitle}
                                </Editable>
                            </p>
                        </div>

                        <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent leading-tight italic">
                            <Editable id="about_title" type="text" value={displayTitle}>
                                {displayTitle}
                            </Editable>
                        </h2>

                        <div className="mt-12 text-accent/70 text-lg lg:text-xl font-light leading-relaxed font-sans border-l-2 border-primary/20 pl-10 italic">
                            <Editable id="about_description" type="textarea" value={displayDescription}>
                                <div className="whitespace-pre-line">{displayDescription}</div>
                            </Editable>
                        </div>

                        <div className="mt-16 flex items-center gap-10">
                            <div className="flex flex-col">
                                <span className="text-4xl font-serif text-primary">25+</span>
                                <span className="text-[10px] uppercase tracking-widest text-accent/40 font-bold mt-1">Năm kinh nghiệm</span>
                            </div>
                            <div className="w-px h-12 bg-accent/10"></div>
                            <div className="flex flex-col">
                                <span className="text-4xl font-serif text-primary">1M+</span>
                                <span className="text-[10px] uppercase tracking-widest text-accent/40 font-bold mt-1">Khách hàng tin dùng</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
