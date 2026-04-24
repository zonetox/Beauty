import React from 'react';
import { Business } from '../../../../types.ts';
import { Clock } from 'lucide-react';

interface HoursSectionProps {
    business: Business;
}

const HoursSection: React.FC<HoursSectionProps> = ({ business }) => {
    // Standardize hours display from business.working_hours
    const hours = business.working_hours || {
        'Thứ 2 - Thứ 6': '09:00 - 20:00',
        'Thứ 7': '09:00 - 18:00',
        'Chủ Nhật': '10:00 - 17:00'
    };

    return (
        <section className="py-24 px-4 bg-white">
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-16">
                    <Clock className="w-10 h-10 text-primary mx-auto mb-6 opacity-30" />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-accent mb-4 font-bold">Thời gian phục vụ</h2>
                    <h3 className="text-4xl md:text-5xl font-serif text-primary">Giờ mở cửa trong tuần</h3>
                </header>

                <div className="bg-primary/[0.03] rounded-[3rem] p-8 md:p-12 border border-luxury-border/30">
                    <div className="divide-y divide-luxury-border/20">
                        {Object.entries(hours).map(([day, range]) => (
                            <div key={day} className="flex justify-between items-center py-6">
                                <span className="font-serif text-lg text-primary">{day}</span>
                                <span className="text-neutral-500 font-light tracking-widest">
                                    {typeof range === 'string' ? range : `${range?.open} - ${range?.close}`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold italic">
                            * Vui lòng đặt lịch trước để được phục vụ tốt nhất
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HoursSection;
