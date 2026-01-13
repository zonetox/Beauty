// Phase 3.1 - Floating Action Buttons Component
// Floating buttons for mobile devices to call and book

import React from 'react';
import { Business } from '../types.ts';
import { trackConversion } from '../lib/usePageTracking.ts';

interface FloatingActionButtonsProps {
    business: Business;
    onBookNowClick: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ business, onBookNowClick }) => {
    const handleCallClick = () => {
        trackConversion('call', business.id, 'landing_page', { phone: business.phone, location: 'floating_button' });
    };

    const handleBookClick = () => {
        onBookNowClick();
        trackConversion('click', business.id, 'landing_page', { cta: 'Đặt lịch ngay (Floating Button)' });
    };

    if (!business.phone) {
        // Only show booking button if no phone
        return (
            <div className="fixed bottom-6 right-6 z-50 lg:hidden">
                <button
                    onClick={handleBookClick}
                    className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-110 flex items-center justify-center"
                    aria-label="Đặt lịch ngay"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 lg:hidden flex flex-col gap-3">
            {/* Call Button */}
            <a
                href={`tel:${business.phone}`}
                onClick={handleCallClick}
                className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-110 flex items-center justify-center"
                aria-label="Gọi ngay"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            </a>

            {/* Booking Button */}
            <button
                onClick={handleBookClick}
                className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-110 flex items-center justify-center"
                aria-label="Đặt lịch ngay"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>
        </div>
    );
};

export default FloatingActionButtons;
