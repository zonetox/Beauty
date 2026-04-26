import React from 'react';
import { Business, DealStatus } from '../../types.ts';
import DealCard from '../DealCard.tsx';

import Editable from '../Editable.tsx';

interface DealsSectionProps {
    business: Business;
    content?: any;
    isEditing?: boolean;
}

const DealsSection: React.FC<DealsSectionProps> = ({ business, content }) => {
    const displayTitle = content?.title || 'Ưu đãi đặc biệt chỉ dành cho bạn';
    const displaySubtitle = content?.subtitle || 'Ưu đãi';
    const displayDeals = content?.items || business.deals?.filter(d => d.status === DealStatus.ACTIVE) || [];

    if (displayDeals.length === 0) {
        return null;
    }

    return (
        <section id="deals" className="py-20 lg:py-28 bg-background rounded-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">
                    <Editable id="deals_subtitle" type="text" value={displaySubtitle}>
                        {displaySubtitle}
                    </Editable>
                </p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    <Editable id="deals_title" type="text" value={displayTitle}>
                        {displayTitle}
                    </Editable>
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {displayDeals.map((deal: any) => (
                    <DealCard
                        key={deal.id}
                        deal={deal}
                        business_name={business.name}
                        businessSlug={business.slug}
                    />
                ))}
            </div>
        </section>
    );
};

export default DealsSection;
