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
        <section id="about" className="py-20 lg:py-28">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 md:order-1">
                    <p className="text-sm font-semibold uppercase text-primary tracking-widest">
                        <Editable id="about_subtitle" type="text" value={displaySubtitle}>
                            {displaySubtitle}
                        </Editable>
                    </p>
                    <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                        <Editable id="about_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                    <div className="mt-6 text-gray-600 leading-relaxed whitespace-pre-line">
                        <Editable id="about_description" type="textarea" value={displayDescription}>
                            <p>{displayDescription}</p>
                        </Editable>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <Editable id="about_image" type="image" value={displayImage}>
                        <img
                            src={getOptimizedSupabaseUrl(displayImage, { width: 800, quality: 80 })}
                            alt={`Interior of ${business.name}`}
                            className="rounded-lg shadow-2xl w-full h-auto object-cover aspect-square"
                        />
                    </Editable>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
