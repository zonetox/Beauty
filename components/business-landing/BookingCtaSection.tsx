import React from 'react';
import { trackConversion } from '../../lib/usePageTracking.ts';

import Editable from '../Editable.tsx';

interface BookingCtaSectionProps {
    onBookNowClick: () => void;
    business_id?: number;
    content?: any;
    isEditing?: boolean;
}

const BookingCtaSection: React.FC<BookingCtaSectionProps> = ({ onBookNowClick, business_id, content }) => {
    const displayTitle = content?.title || 'Sẵn sàng trải nghiệm dịch vụ đẳng cấp?';
    const displaySubtitle = content?.subtitle || 'Đặt lịch hẹn ngay hôm nay để tận hưởng những phút giây thư giãn và làm đẹp tuyệt vời nhất.';
    const displayCtaText = content?.cta_text || 'Đặt lịch ngay';

    const handleClick = () => {
        // Track conversion
        trackConversion('click', business_id);
        onBookNowClick();
    };

    return (
        <section id="booking-cta" className="py-32 lg:py-48 bg-secondary relative overflow-hidden text-accent">
            {/* Artistic Gold Flourish */}
            <div className="absolute -top-12 -left-12 w-96 h-96 border border-primary/10 rounded-full z-0 opacity-50"></div>
            <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl z-0"></div>

            <div className="container mx-auto px-6 lg:px-12 text-center relative z-10">
                <div className="flex items-center justify-center gap-4 mb-10">
                    <div className="w-12 h-px bg-primary/30"></div>
                    <p className="text-xs font-bold uppercase text-primary tracking-[0.6em]">START YOUR JOURNEY</p>
                    <div className="w-12 h-px bg-primary/30"></div>
                </div>

                <h2 className="text-6xl lg:text-9xl font-bold font-serif italic leading-tight tracking-tighter text-accent">
                    <Editable id="cta_title" type="text" value={displayTitle}>
                        {displayTitle}
                    </Editable>
                </h2>

                <div className="mt-12 max-w-2xl mx-auto text-accent/50 text-xl font-light italic leading-relaxed font-sans border-b border-primary/10 pb-12">
                    <Editable id="cta_subtitle" type="textarea" value={displaySubtitle}>
                        <p>{displaySubtitle}</p>
                    </Editable>
                </div>

                <div className="mt-16 animate-fade-in-up">
                    <button
                        onClick={handleClick}
                        className="group relative overflow-hidden bg-primary text-white px-20 py-8 rounded-full font-bold text-xs tracking-[0.4em] uppercase transition-all shadow-premium hover:shadow-glass scale-100 hover:scale-105"
                    >
                        <span className="relative z-10 transition-colors duration-500">
                            <Editable id="cta_button_text" type="text" value={displayCtaText}>
                                {displayCtaText}
                            </Editable>
                        </span>
                        <div className="absolute inset-x-0 bottom-0 h-0 bg-accent transition-all duration-500 group-hover:h-full z-0"></div>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default BookingCtaSection;
