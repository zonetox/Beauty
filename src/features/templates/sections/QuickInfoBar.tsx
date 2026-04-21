import React from 'react';
import { Business } from '../../../../types.ts';

interface QuickInfoBarProps {
    business: Business;
}

const QuickInfoBar: React.FC<QuickInfoBarProps> = ({ business }) => {
    return (
        <div className="bg-neutral-dark text-white/80 py-2 px-4 md:px-20 text-[10px] md:text-xs uppercase tracking-[0.2em] font-sans flex flex-col md:flex-row justify-between items-center gap-2 border-b border-white/5">
            <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                    <span className="text-primary">🕒</span>
                    THỨ 2 - THỨ 6: 09:00 AM - 21:00 PM
                </span>
                <span className="hidden lg:flex items-center gap-2">
                    <span className="text-primary">📍</span>
                    {business.city}
                </span>
            </div>

            <div className="flex items-center gap-6">
                <a href={`tel:${business.phone}`} className="hover:text-white transition-colors flex items-center gap-2">
                    <span className="text-primary">📞</span>
                    CALL US: {business.phone}
                </a>
                <div className="flex items-center gap-4 border-l border-white/10 pl-6 ml-2">
                    {business.socials?.facebook && <a href={business.socials.facebook} className="hover:text-white transition-colors">FB</a>}
                    {business.socials?.instagram && <a href={business.socials.instagram} className="hover:text-white transition-colors">IG</a>}
                </div>
            </div>
        </div>
    );
};

export default QuickInfoBar;
