import React from 'react';

interface ZaloWidgetProps {
    phone: string;
    message?: string;
    position?: 'right' | 'left';
}

const ZaloWidget: React.FC<ZaloWidgetProps> = ({
    phone,
    message = "Chào bạn, tôi cần tư vấn dịch vụ!",
    position = 'right'
}) => {
    if (!phone) return null;

    // Normalize phone for URL (remove spaces, dots, etc.)
    const cleanPhone = phone.replace(/\D/g, '');

    return (
        <div className={`fixed bottom-8 ${position === 'right' ? 'right-8' : 'left-8'} z-[5000] group`}>
            <div className="absolute -top-12 right-0 bg-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold text-neutral-dark opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-primary/20">
                Chat với chúng tôi qua Zalo
            </div>
            <a
                href={`https://zalo.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-[#0068FF] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 animate-bounce-slow"
            >
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
                    alt="Zalo Chat"
                    className="w-8 h-8 invert brightness-0"
                />
            </a>

            <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default ZaloWidget;
