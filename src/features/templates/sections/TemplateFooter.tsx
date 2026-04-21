import React from 'react';
import { Business } from '../../../../types.ts';

interface TemplateFooterProps {
    business: Business;
}

const TemplateFooter: React.FC<TemplateFooterProps> = ({ business }) => {
    return (
        <footer className="bg-neutral-dark text-white py-20 px-4 md:px-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <img src={business.logo_url || '/logo.svg'} alt={business.name} className="h-10 invert brightness-0" />
                        <span className="font-serif text-xl tracking-widest">{business.name}</span>
                    </div>
                    <p className="text-white/60 font-sans leading-relaxed text-sm">
                        {business.slogan || "Kiến tạo vẻ đẹp đích thực và sự thư giãn tuyệt đối cho tâm hồn."}
                    </p>
                    <div className="flex space-x-4">
                        {business.socials?.facebook && <a href={business.socials.facebook} className="hover:text-primary transition-colors">FB</a>}
                        {business.socials?.instagram && <a href={business.socials.instagram} className="hover:text-primary transition-colors">IG</a>}
                        {business.socials?.tiktok && <a href={business.socials.tiktok} className="hover:text-primary transition-colors">TT</a>}
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-lg mb-6">Địa chỉ</h4>
                    <p className="text-white/60 text-sm font-sans leading-relaxed">
                        {business.address},<br />
                        {business.district}, {business.city}
                    </p>
                </div>

                <div>
                    <h4 className="font-serif text-lg mb-6">Liên hệ</h4>
                    <div className="space-y-2 text-white/60 text-sm font-sans">
                        <p>P: {business.phone}</p>
                        <p>E: {business.email || `contact@${business.slug}.asia`}</p>
                        <p>W: {business.website || '1Beauty.Asia'}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-lg mb-6">Giờ mở cửa</h4>
                    <div className="space-y-2 text-white/60 text-sm font-sans uppercase tracking-widest">
                        <p>Thứ 2 - Thứ 6: 09:00 - 21:00</p>
                        <p>Thứ 7 - CN: 08:30 - 22:00</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-white/40 tracking-widest">
                <p>&copy; 2026 {business.name}. ALL RIGHTS RESERVED.</p>
                <p>POWERED BY 1BEAUTY.ASIA</p>
            </div>
        </footer>
    );
};

export default TemplateFooter;
