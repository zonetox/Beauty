import React from 'react';

interface ZaloWidgetProps {
    phone: string;
    message?: string;
    position?: 'right' | 'left';
}

const ZaloWidget: React.FC<ZaloWidgetProps> = ({
    phone,
    position = 'right'
}) => {
    if (!phone) return null;

    const cleanPhone = phone.replace(/\D/g, '');

    return (
        <div className={`fixed bottom-10 ${position === 'right' ? 'right-10' : 'left-10'} z-[5000] group`}>
            <div className="absolute -top-16 right-0 bg-[#1A1A1A] px-6 py-3 rounded-none border border-white/10 shadow-2xl text-[10px] font-serif text-white/80 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-700 whitespace-nowrap translate-y-2 group-hover:translate-y-0">
                Tư vấn chuyên gia
            </div>
            <a
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center hover:border-white/30 transition-all duration-500 shadow-premium"
            >
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                    alt="Zalo Chat"
                    className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"
                />
            </a>
        </div>
    );
};

export default ZaloWidget;
