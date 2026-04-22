import React from 'react';
import { Business } from '../types.ts';
import StarRating from './StarRating.tsx';

interface MapBusinessCardProps {
    business: Business;
}

const MapBusinessCard: React.FC<MapBusinessCardProps> = ({ business }) => {
    // This component is designed to be rendered to a string for Leaflet's popup.
    // Therefore, it uses standard <a> tags instead of <Link> components.
    const slug = business.slug || '';
    const name = business.name || 'Doanh nghiệp';
    const imageUrl = business.image_url || business.logo_url || 'https://via.placeholder.com/400x300?text=Beauty+Dir';
    const rating = business.rating || 0;
    const reviewCount = business.review_count || 0;

    return (
        <div style={{ width: '220px', fontFamily: 'Inter, sans-serif', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            <a href={`/business/${slug}`} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl} alt={name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
            </a>
            <div style={{ padding: '12px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px', color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <a href={`/business/${slug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {name}
                    </a>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <StarRating rating={rating} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>({reviewCount})</span>
                </div>
            </div>
        </div>
    );
};

export default MapBusinessCard;
