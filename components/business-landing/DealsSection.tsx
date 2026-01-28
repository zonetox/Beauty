import React from 'react';
import { Business, DealStatus } from '../../types.ts';
import DealCard from '../DealCard.tsx';

interface DealsSectionProps {
    business: Business;
}

const DealsSection: React.FC<DealsSectionProps> = ({ business }) => {
    const activeDeals = business.deals?.filter(d => d.status === DealStatus.ACTIVE) || [];

    if (activeDeals.length === 0) {
        return null;
    }

    return (
        <section id="deals" className="py-20 lg:py-28 bg-background rounded-lg -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Ưu đãi</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Ưu đãi đặc biệt chỉ dành cho bạn
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {activeDeals.map((deal) => (
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
