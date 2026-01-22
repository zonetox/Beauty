import React from 'react';
import { Link } from 'react-router-dom';
import { Business, MembershipTier } from '../types.ts';
import StarRating from './StarRating.tsx';
import VerifiedBadge from './VerifiedBadge.tsx';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

interface BusinessCardProps {
  business: Business;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const tierStyles = {
  [MembershipTier.VIP]: 'border-2 border-accent shadow-lg ring-2 ring-accent/20',
  [MembershipTier.PREMIUM]: 'border border-primary shadow-md',
  [MembershipTier.FREE]: 'border border-gray-200',
};

const tierBadge: Record<MembershipTier, { text: string; bg: string; text_color: string }> = {
  [MembershipTier.VIP]: { text: 'VIP', bg: 'bg-accent', text_color: 'text-neutral-dark' },
  [MembershipTier.PREMIUM]: { text: 'Premium', bg: 'bg-primary', text_color: 'text-white' },
  [MembershipTier.FREE]: { text: 'Free', bg: 'bg-gray-100', text_color: 'text-gray-700' },
};

const EyeIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 inline-block ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);


const BusinessCard: React.FC<BusinessCardProps> = ({ business, highlighted = false, onMouseEnter, onMouseLeave }) => {
  const { slug, name, imageUrl, categories, address, district, city, rating, reviewCount, viewCount, membershipTier, isVerified, phone, email, slogan } = business;

  // Stop propagation on link clicks to prevent navigating to the business page
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  const highlightClass = highlighted ? 'ring-2 ring-primary-dark shadow-xl' : '';

  return (
    <div
      id={`business-card-${business.id}`}
      className={`business-card bg-white rounded-lg overflow-hidden transition-all duration-200 transform hover:-translate-y-1 cursor-pointer ${tierStyles[membershipTier]} ${highlightClass}`}
      onClick={() => window.location.href = `/business/${slug}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.location.href = `/business/${slug}`;
        }
      }}
    >
      <div className="relative">
        <img className="w-full h-48 object-cover" src={getOptimizedSupabaseUrl(imageUrl, { width: 400, quality: 75 })} alt={name} loading="lazy" />
        {tierBadge[membershipTier] && (
          <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded ${tierBadge[membershipTier].bg} ${tierBadge[membershipTier].text_color}`}>
            {tierBadge[membershipTier].text}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-primary font-medium">{categories[0]}</p>
        <div className="flex items-center gap-2 mt-1">
          <h3 className="text-lg font-bold font-serif text-neutral-dark truncate">{name}</h3>
          {isVerified && <VerifiedBadge />}
        </div>
        {slogan && (
          <p className="text-sm text-gray-500 mt-1 italic truncate">&quot;{slogan}&quot;</p>
        )}
        <div className="mt-2 space-y-1 text-sm text-gray-600 flex-grow">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div className="line-clamp-2">
              <span>{address}, </span>
              <Link to={`/directory?location=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`} onClick={handleLinkClick} className="hover:underline hover:text-primary transition-colors">
                {district}
              </Link>
              <span>, </span>
              <Link to={`/directory?location=${encodeURIComponent(city)}`} onClick={handleLinkClick} className="hover:underline hover:text-primary transition-colors">
                {city}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <p className="truncate">{phone}</p>
          </div>
          {email && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <p className="truncate">{email}</p>
            </div>
          )}
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <StarRating rating={rating} />
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <EyeIcon />
            <span>{(viewCount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BusinessCard);