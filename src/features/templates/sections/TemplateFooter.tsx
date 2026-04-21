import React from 'react';
import { Business } from '../../../../types.ts';

interface TemplateFooterProps {
    business: Business;
}

const TemplateFooter: React.FC<TemplateFooterProps> = ({ business }) => {
    return (
        <footer className="bg-[#1A1A1A] text-white py-24 px-4 md:px-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                <div className="space-y-8">
                    <div className="flex flex-col gap-4">
                        {business.logo_url && <img src={business.logo_url} alt={business.name} className="h-12 w-fit brightness-200" />}
                        <span className="font-serif text-2xl tracking-[0.2em] uppercase text-gold">{business.name}</span>
                    </div>
                    <p className="text-white/40 font-light italic leading-relaxed text-sm tracking-wide">
                        {business.slogan || "Kiến tạo vẻ đẹp đích thực và sự thư giãn tuyệt đối cho tâm hồn quý khách."}
                    </p>
                    <div className="flex space-x-6">
                        {business.socials?.facebook && <a href={business.socials.facebook} className="text-white/30 hover:text-gold transition-colors text-xs tracking-widest font-bold">FACEBOOK</a>}
                        {business.socials?.instagram && <a href={business.socials.instagram} className="text-white/30 hover:text-gold transition-colors text-xs tracking-widest font-bold">INSTAGRAM</a>}
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-xl mb-8 text-white/90 tracking-widest uppercase">Địa chỉ</h4>
                    <p className="text-white/50 text-sm font-light leading-relaxed italic tracking-wide">
                        {business.address},<br />
                        {business.district}, {business.city}
                    </p>
                </div>

                <div>
                    <h4 className="font-serif text-xl mb-8 text-white/90 tracking-widest uppercase">Liên hệ</h4>
                    <div className="space-y-4 text-white/50 text-sm font-light tracking-widest">
                        <p className="flex items-center gap-3"><span className="text-gold text-[10px]">●</span> {business.phone}</p>
                        <p className="flex items-center gap-3"><span className="text-gold text-[10px]">●</span> {business.email || `contact@${business.slug}.asia`}</p>
                        <p className="flex items-center gap-3"><span className="text-gold text-[10px]">●</span> 1BEAUTY.ASIA</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-serif text-xl mb-8 text-white/90 tracking-widest uppercase">Giờ đón khách</h4>
                    <div className="space-y-4 text-white/50 text-xs font-bold uppercase tracking-[0.2em]">
                        <p className="border-b border-white/5 pb-2">Thứ 2 - Thứ 6: 09:00 - 21:00</p>
                        <p className="border-b border-white/5 pb-2">Thứ 7 - CN: 08:30 - 22:00</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/20 tracking-[0.3em] font-bold">
                <p>&copy; 2026 {business.name.toUpperCase()} . TRẢI NGHIỆM ĐẲNG CẤP</p>
                <p className="mt-4 md:mt-0">TINH HOA LÀM ĐẸP BỞI 1BEAUTY.ASIA</p>
            </div>
        </footer>
    );
};

export default TemplateFooter;
