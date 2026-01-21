import React, { useState, useEffect } from 'react';
import { useBusinessData } from '../contexts/BusinessDataContext';
import { Business } from '../types.ts';
import BusinessCard from './BusinessCard.tsx';

const RecentlyViewed: React.FC = () => {
    const [viewedBusinesses, setViewedBusinesses] = useState<Business[]>([]);
    const { businesses } = useBusinessData();

    useEffect(() => {
        try {
            const viewedRaw = localStorage.getItem('recently_viewed_businesses');
            if (viewedRaw) {
                const viewedIds: number[] = JSON.parse(viewedRaw);

                // Map IDs to full business objects, preserving order
                const hydratedBusinesses = viewedIds
                    .map(id => businesses.find(b => b.id === id))
                    .filter((b): b is Business => b !== undefined);

                setViewedBusinesses(hydratedBusinesses);
            }
        } catch (error) {
            console.error("Failed to load recently viewed businesses:", error);
        }
    }, [businesses]);

    if (viewedBusinesses.length === 0) {
        return null; // Don't render anything if there's nothing to show
    }

    return (
        <>
            <h2 className="text-3xl font-bold text-center font-serif text-neutral-dark mb-2">Recently Viewed</h2>
            <p className="text-center text-gray-500 mb-8">Businesses you&apos;ve recently looked at.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {viewedBusinesses.map((business) => (
                    <BusinessCard key={`recent-${business.id}`} business={business} />
                ))}
            </div>
        </>
    );
};

export default RecentlyViewed;
