import React from 'react';
import { Business } from '../../types.ts';

const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm4-9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ZaloIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001.001C5.373.001 0 5.374 0 12.001c0 4.254 2.215 7.994 5.567 10.033l-1.42 4.823 5.09-2.616c.91.173 1.847.26 2.764.26 6.628 0 12.001-5.373 12.001-12.001C24.001 5.374 18.628.001 12.001.001zM8.5 14.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zm7 0c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" /></svg>;
const TikTokIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" /></svg>;

import Editable from '../Editable.tsx';

const BusinessFooter: React.FC<{
    business: Business;
    content?: any;
    isEditing?: boolean;
}> = ({ business, content }) => {
    const displayName = content?.name || business.name;
    const displayAddress = content?.address || `${business.address}, ${business.city}`;
    return (
        <footer className="bg-secondary text-accent py-24 lg:py-32 relative overflow-hidden border-t border-primary/10">
            {/* Abstract Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 mb-20 border-b border-primary/20 pb-20">
                    <div className="lg:col-span-4">
                        <h3 className="text-3xl lg:text-4xl font-bold font-serif text-primary italic mb-6">
                            <Editable id="footer_name" type="text" value={displayName}>
                                {displayName}
                            </Editable>
                        </h3>
                        <p className="text-accent/40 text-lg font-light leading-relaxed font-sans max-w-sm italic">
                            Tiêu chuẩn vàng trong ngành thẩm mỹ và chăm sóc sắc đẹp cao cấp tại Việt Nam.
                        </p>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-4">SHOWROOM & CLINIC</h4>
                            <p className="text-accent/60 font-light italic text-lg leading-relaxed">
                                <Editable id="footer_address" type="text" value={displayAddress}>
                                    {displayAddress}
                                </Editable>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-2">QUYẾT TÂM KẾT NỐI</h4>
                            <a href={`tel:${business.phone}`} className="text-2xl font-serif italic text-accent hover:text-primary transition-colors">{business.phone}</a>
                            {business.email && <a href={`mailto:${business.email}`} className="text-accent/40 hover:text-primary transition-colors italic">{business.email}</a>}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-8">FOLLOW THE ELEGANCE</h4>
                        <div className="flex items-center gap-8">
                            {business.socials?.facebook && (
                                <a href={business.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-accent/20 hover:text-primary transition-all transform hover:scale-125">
                                    <FacebookIcon />
                                </a>
                            )}
                            {business.socials?.instagram && (
                                <a href={business.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-accent/20 hover:text-primary transition-all transform hover:scale-125">
                                    <InstagramIcon />
                                </a>
                            )}
                            {business.socials?.zalo && (
                                <a href={business.socials.zalo} target="_blank" rel="noopener noreferrer" className="text-accent/20 hover:text-primary transition-all transform hover:scale-125">
                                    <ZaloIcon />
                                </a>
                            )}
                            {business.socials?.tiktok && (
                                <a href={business.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-accent/20 hover:text-primary transition-all transform hover:scale-125">
                                    <TikTokIcon />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-accent/20 font-bold">
                        © {new Date().getFullYear()} {business.name}. All Rights Reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-[10px] uppercase tracking-[0.4em] text-accent/20 hover:text-primary transition-colors font-bold">Privacy Policy</a>
                        <a href="#" className="text-[10px] uppercase tracking-[0.4em] text-accent/20 hover:text-primary transition-colors font-bold">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default BusinessFooter;
