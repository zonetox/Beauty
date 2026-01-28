// Phase 3.2 - Trust Indicators Section Component
// Displays trust indicators (badges, certifications, awards) on business landing pages

import React from 'react';
import { Business, TrustIndicator } from '../../types.ts';

interface trust_indicatorsSectionProps {
    business: Business;
}

const trust_indicatorsSection: React.FC<trust_indicatorsSectionProps> = ({ business }) => {
    const trust_indicators: TrustIndicator[] = business.trust_indicators || [];

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

    const getColorForType = (type: TrustIndicator['type']) => {
        switch (type) {
            case 'badge':
                return 'bg-blue-100 text-blue-600';
            case 'certification':
                return 'bg-green-100 text-green-600';
            case 'award':
                return 'bg-yellow-100 text-yellow-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <section id="trust-indicators" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold font-serif text-neutral-dark mb-4">
                        Chứng Nhận & Giải Thưởng
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Những thành tựu và chứng nhận mà chúng tôi đã đạt được
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trust_indicators.map((indicator, index) => (
                        <div
                            key={index}
                            className={`${getColorForType(indicator.type)} p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center`}
                        >
                            <div className="mb-4">
                                {indicator.icon ? (
                                    <img 
                                        src={indicator.icon} 
                                        alt={indicator.title}
                                        className="h-16 w-16 object-contain mx-auto"
                                    />
                                ) : (
                                    <div className="flex justify-center">
                                        {getIconForType(indicator.type)}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{indicator.title}</h3>
                            {indicator.description && (
                                <p className="text-sm opacity-90">{indicator.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default trust_indicatorsSection;
