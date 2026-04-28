// Phase 3.2 - Trust Indicators Section Component
// Displays trust indicators (badges, certifications, awards) on business landing pages

import React from 'react';
import { Business, TrustIndicator } from '../../types.ts';

import Editable from '../Editable.tsx';

interface TrustIndicatorsSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const TrustIndicatorsSection: React.FC<TrustIndicatorsSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Chứng Nhận & Giải Thưởng';
    const displaySubtitle = content?.subtitle || 'Những thành tựu và chứng nhận mà chúng tôi đã đạt được';
    const trust_indicators: TrustIndicator[] = content?.items || business.trust_indicators || [];

    if (trust_indicators.length === 0) {
        return null;
    }

    const getIconForType = (type: TrustIndicator['type']) => {
        switch (type) {
            case 'badge':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            case 'certification':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'award':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };


    return (
        <section id="trust-indicators" className="py-32 lg:py-48 bg-secondary">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="text-center mb-24 animate-fade-in-up">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">TÍN NHIỆM & CHẤT LƯỢNG</p>
                        <div className="w-12 h-px bg-primary"></div>
                    </div>
                    <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic leading-tight">
                        <Editable id="trust_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                    <p className="mt-8 text-accent/50 text-lg font-light max-w-2xl mx-auto italic font-sans leading-relaxed">
                        <Editable id="trust_subtitle" type="text" value={displaySubtitle}>
                            {displaySubtitle}
                        </Editable>
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {trust_indicators.map((indicator, index) => (
                        <div
                            key={index}
                            className="bg-white p-12 rounded-luxury luxury-border-thin shadow-premium hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 text-center group"
                        >
                            <div className="mb-8 flex justify-center transform transition-transform duration-700 group-hover:scale-110">
                                {indicator.icon ? (
                                    <img
                                        src={indicator.icon}
                                        alt={indicator.title}
                                        className="h-24 w-24 object-contain grayscale group-hover:grayscale-0 transition-all duration-1000"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-accent transition-colors duration-700 shadow-inner">
                                        {getIconForType(indicator.type)}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-serif italic text-accent mb-4 group-hover:text-primary transition-colors">{indicator.title}</h3>
                            {indicator.description && (
                                <p className="text-sm text-accent/40 font-light leading-relaxed font-sans">{indicator.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustIndicatorsSection;
