import React from 'react';
import { Business } from '../../types.ts';
import { trackConversion } from '../../lib/usePageTracking.ts';

const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm4-9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ZaloIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001.001C5.373.001 0 5.374 0 12.001c0 4.254 2.215 7.994 5.567 10.033l-1.42 4.823 5.09-2.616c.91.173 1.847.26 2.764.26 6.628 0 12.001-5.373 12.001-12.001C24.001 5.374 18.628.001 12.001.001zM8.5 14.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zm7 0c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" /></svg>;
const TikTokIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" /></svg>;


import Editable from '../Editable.tsx';

const LocationSection: React.FC<{
    business: Business;
    content?: any;
    isEditing?: boolean;
}> = ({ business, content }) => {
    const displayTitle = content?.title || 'Ghé thăm chúng tôi';
    const displaySubtitle = content?.subtitle || 'Liên hệ';

    const { latitude, longitude } = business;
    let mapEmbedUrl = null;

    if (latitude && longitude) {
        const delta = 0.01; // Bounding box size
        const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
        mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    }

    const hasSocials = business.socials && Object.values(business.socials).some(link => link);

    return (
        <section id="location" className="py-32 lg:py-48 bg-secondary">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="text-center mb-24 animate-fade-in-up">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-12 h-px bg-primary"></div>
                        <p className="text-xs font-bold uppercase text-primary tracking-[0.5em]">
                            <Editable id="contact_subtitle" type="text" value={displaySubtitle}>
                                {displaySubtitle}
                            </Editable>
                        </p>
                        <div className="w-12 h-px bg-primary"></div>
                    </div>
                    <h2 className="mt-2 text-5xl lg:text-7xl font-bold font-serif text-accent italic leading-tight">
                        <Editable id="contact_title" type="text" value={displayTitle}>
                            {displayTitle}
                        </Editable>
                    </h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                    {/* Info Column */}
                    <div className="lg:col-span-4 space-y-16">
                        <div className="group">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-px bg-primary"></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">ĐỊA CHỈ</h4>
                            </div>
                            <p className="text-2xl font-serif italic text-accent group-hover:text-primary transition-colors leading-relaxed">
                                {[business.address, business.ward, business.district, business.city].filter(Boolean).join(', ')}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-px bg-primary"></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">GIỜ LÀM VIỆC</h4>
                            </div>
                            <ul className="space-y-4">
                                {business.working_hours && Object.entries(business.working_hours).map(([day, time]) => {
                                    let timeDisplay: string;
                                    if (typeof time === 'string') timeDisplay = time;
                                    else if (typeof time === 'object' && time !== null && 'open' in time && 'close' in time) {
                                        timeDisplay = time.isOpen === false ? 'Đóng cửa' : `${time.open} - ${time.close}`;
                                    } else timeDisplay = 'N/A';

                                    return (
                                        <li key={day} className="flex justify-between items-center border-b border-primary/10 pb-3">
                                            <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{day}</span>
                                            <span className="text-accent/50 italic font-light font-sans">{timeDisplay}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-px bg-primary"></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">LIÊN HỆ TRỰC TIẾP</h4>
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-accent/30 font-bold mb-2">HOTLINE NHẬN TƯ VẤN</span>
                                    <a
                                        href={`tel:${business.phone}`}
                                        onClick={() => trackConversion('call', business.id)}
                                        className="text-3xl font-serif text-primary hover:text-accent transition-colors italic underline decoration-primary/20 underline-offset-8"
                                    >
                                        {business.phone}
                                    </a>
                                </div>
                                {business.email && (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-accent/30 font-bold mb-2">EMAIL QUẢN TRỊ</span>
                                        <a href={`mailto:${business.email}`} className="text-accent/60 hover:text-primary transition-colors italic text-lg">{business.email}</a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {hasSocials && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-8 h-px bg-primary"></div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">MẠNG XA HỘI</h4>
                                </div>
                                <div className="flex items-center gap-8">
                                    {business.socials?.facebook && (
                                        <a href={business.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-accent/30 hover:text-primary transition-all transform hover:scale-125" aria-label="Facebook">
                                            <FacebookIcon />
                                        </a>
                                    )}
                                    {business.socials?.instagram && (
                                        <a href={business.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-accent/30 hover:text-primary transition-all transform hover:scale-125" aria-label="Instagram">
                                            <InstagramIcon />
                                        </a>
                                    )}
                                    {business.socials?.zalo && (
                                        <a href={business.socials.zalo} target="_blank" rel="noopener noreferrer" className="text-accent/30 hover:text-primary transition-all transform hover:scale-125" aria-label="Zalo">
                                            <ZaloIcon />
                                        </a>
                                    )}
                                    {business.socials?.tiktok && (
                                        <a href={business.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-accent/30 hover:text-primary transition-all transform hover:scale-125" aria-label="TikTok">
                                            <TikTokIcon />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Column */}
                    <div className="lg:col-span-8 relative">
                        <div className="absolute -inset-4 border border-primary/20 rounded-luxury z-0"></div>
                        <div className="relative z-10 bg-white p-3 rounded-luxury luxury-border-thin shadow-premium overflow-hidden h-[700px]">
                            {mapEmbedUrl ? (
                                <iframe
                                    src={mapEmbedUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(0.3) contrast(1.1) brightness(1.1) sepia(0.1)' }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="rounded-[1.8rem]"
                                ></iframe>
                            ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center text-primary font-serif italic text-xl">
                                    Bản đồ đang được cập nhật...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LocationSection;
