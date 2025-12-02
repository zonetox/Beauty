import React from 'react';

interface BookingCtaSectionProps {
    onBookNowClick: () => void;
}

const BookingCtaSection: React.FC<BookingCtaSectionProps> = ({ onBookNowClick }) => {
    return (
        <section id="booking-cta" className="py-20 bg-neutral-dark text-white">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold font-serif">
                    Sẵn sàng trải nghiệm dịch vụ đẳng cấp?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-gray-300">
                    Đặt lịch hẹn ngay hôm nay để tận hưởng những phút giây thư giãn và làm đẹp tuyệt vời nhất.
                </p>
                <button 
                    onClick={onBookNowClick}
                    className="mt-8 bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-dark transition-transform transform hover:scale-105 shadow-xl"
                >
                    Đặt lịch ngay
                </button>
            </div>
        </section>
    );
};

export default BookingCtaSection;