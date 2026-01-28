

import React from 'react';
import { Link } from 'react-router-dom';
import { Deal } from '../types.ts';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

interface DealCardProps {
  deal: Deal;
  business_name: string;
  businessSlug: string;
}

const DealCard: React.FC<DealCardProps> = ({ deal, business_name, businessSlug }) => {
  const formatPrice = (price?: number) => {
    if (price === undefined) return null;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const hasPricing = deal.original_price !== undefined && deal.dealPrice !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full transition-transform transform hover:-translate-y-1">
      <Link to={`/business/${businessSlug}#deals`} className="block">
        <div className="relative">
          <img
            className="w-full h-48 object-cover"
            src={getOptimizedSupabaseUrl(deal.image_url || 'https://picsum.photos/seed/deal/400/300', { width: 400, quality: 75 })}
            alt={deal.title}
          />
          {deal.discountPercentage && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{deal.discountPercentage}%
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold font-serif text-neutral-dark flex-grow">
          <Link to={`/business/${businessSlug}#deals`} className="hover:text-primary transition-colors">{deal.title}</Link>
        </h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{deal.description}</p>

        {hasPricing && (
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-xl font-bold text-primary">{formatPrice(deal.dealPrice)}</p>
            <p className="text-sm text-gray-400 line-through">{formatPrice(deal.original_price)}</p>
          </div>
        )}
      </div>
      <div className="bg-gray-50 p-3 border-t border-gray-100 text-xs text-gray-500">
        <p className="truncate">
          <span className="font-semibold">Áp dụng tại:</span>{' '}
          <Link to={`/business/${businessSlug}`} className="text-secondary hover:underline">{business_name}</Link>
        </p>
        {deal.end_date && (
          <p className="mt-1"><span className="font-semibold">Hạn cuối:</span> {new Date(deal.end_date).toLocaleDateString('vi-VN')}</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(DealCard);
