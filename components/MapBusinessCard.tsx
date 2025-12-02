import React from 'react';
import { Business } from '../types.ts';
import StarRating from './StarRating.tsx';

interface MapBusinessCardProps {
    business: Business;
}

const MapBusinessCard: React.FC<MapBusinessCardProps> = ({ business }) => {
    // This component is designed to be rendered to a string for Leaflet's popup.
    // Therefore, it uses standard <a> tags instead of <Link> components.
    return (
        <div style={{ width: '220px', fontFamily: 'Inter, sans-serif' }}>
            <a href={`/business/${business.slug}`} target="_blank" rel="noopener noreferrer">
                <img src={business.imageUrl} alt={business.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
            </a>
            <div style={{ padding: '8px 0 0' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px', color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <a href={`/business/${business.slug}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {business.name}
                    </a>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <StarRating rating={business.rating} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>({business.reviewCount})</span>
                </div>
            </div>
        </div>
    );
};

export default MapBusinessCard;