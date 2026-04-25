import React from 'react';
import { trackConversion } from '../../lib/usePageTracking.ts';

import Editable from '../Editable.tsx';

interface BookingCtaSectionProps {
    onBookNowClick: () => void;
    business_id?: number;
    content?: any;
    isEditing?: boolean;
}

const BookingCtaSection: React.FC<BookingCtaSectionProps> = ({ onBookNowClick, business_id, content, isEditing }) => {
    const displayTitle = content?.title || 'Sẵn sàng trải nghiệm dịch vụ đẳng cấp?';
    const displaySubtitle = content?.subtitle || 'Đặt lịch hẹn ngay hôm nay để tận hưởng những phút giây thư giãn và làm đẹp tuyệt vời nhất.';
    const displayCtaText = content?.cta_text || 'Đặt lịch ngay';

    const handleClick = () => {
        // Track conversion
        trackConversion('click', business_id);
        onBookNowClick();
    };

    return (
        <section id="booking-cta" className="py-20 bg-neutral-dark text-white">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold font-serif">
                    <Editable id="cta_title" type="text" value={displayTitle}>
                        {displayTitle}
                    </Editable>
                </h2>
                <div className="mt-4 max-w-2xl mx-auto text-gray-300">
                    <Editable id="cta_subtitle" type="textarea" value={displaySubtitle}>
                        <p>{displaySubtitle}</p>
                    </Editable>
                </div>
                <button
                    onClick={handleClick}
                    className="mt-8 bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-xl"
                >
                    <Editable id="cta_button_text" type="text" value={displayCtaText}>
                        {displayCtaText}
                    </Editable>
                </button>
            </div>
        </section>
    );
};

export default BookingCtaSection;
