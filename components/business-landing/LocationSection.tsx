import React from 'react';
import { Business } from '../../types.ts';

const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm4-9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ZaloIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001.001C5.373.001 0 5.374 0 12.001c0 4.254 2.215 7.994 5.567 10.033l-1.42 4.823 5.09-2.616c.91.173 1.847.26 2.764.26 6.628 0 12.001-5.373 12.001-12.001C24.001 5.374 18.628.001 12.001.001zM8.5 14.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zm7 0c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"/></svg>;
const TikTokIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>;


const LocationSection: React.FC<{ business: Business }> = ({ business }) => {
    
    const { latitude, longitude } = business;
    let mapEmbedUrl = null;

    if (latitude && longitude) {
        const delta = 0.01; // Bounding box size
        const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
        mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    }
    
    const hasSocials = business.socials && Object.values(business.socials).some(link => link);

    return (
        <section id="location" className="py-20 lg:py-28">
            <div className="text-center">
                <p className="text-sm font-semibold uppercase text-primary tracking-widest">Liên hệ</p>
                <h2 className="mt-2 text-3xl lg:text-4xl font-bold font-serif text-neutral-dark">
                    Ghé thăm chúng tôi
                </h2>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Info Column */}
                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold text-xl text-neutral-dark mb-2">Địa chỉ</h4>
                        <p className="text-gray-600">{[business.address, business.ward, business.district, business.city].filter(Boolean).join(', ')}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-xl text-neutral-dark mb-2">Giờ hoạt động</h4>
                        <ul className="text-gray-600 space-y-1">
                            {business.workingHours && Object.entries(business.workingHours).map(([day, time]) => (
                                <li key={day}><span className="font-semibold">{day}:</span> {time}</li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-xl text-neutral-dark mb-2">Liên hệ</h4>
                        <p className="text-gray-600">
                            <strong>Điện thoại:</strong> <a href={`tel:${business.phone}`} className="text-primary hover:underline">{business.phone}</a>
                        </p>
                         {business.email && <p className="text-gray-600">
                            <strong>Email:</strong> <a href={`mailto:${business.email}`} className="text-primary hover:underline">{business.email}</a>
                        </p>}
                        {business.website && <p className="text-gray-600">
                            <strong>Website:</strong> <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{business.website}</a>
                        </p>}
                    </div>
                    {hasSocials && (
                        <div>
                            <h4 className="font-bold text-xl text-neutral-dark mb-2">Theo dõi chúng tôi</h4>
                            <div className="flex items-center space-x-4">
                                {business.socials?.facebook && (
                                    <a href={business.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Facebook">
                                        <FacebookIcon />
                                    </a>
                                )}
                                 {business.socials?.instagram && (
                                    <a href={business.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Instagram">
                                        <InstagramIcon />
                                    </a>
                                )}
                                {business.socials?.zalo && (
                                    <a href={business.socials.zalo} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="Zalo">
                                        <ZaloIcon />
                                    </a>
                                )}
                                {business.socials?.tiktok && (
                                    <a href={business.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors" aria-label="TikTok">
                                        <TikTokIcon />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Map Column */}
                <div>
                    {mapEmbedUrl ? (
                         <iframe 
                            src={mapEmbedUrl}
                            width="100%" 
                            height="450" 
                            style={{ border: 0 }} 
                            allowFullScreen={false} 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            className="rounded-lg shadow-lg"
                        ></iframe>
                    ) : (
                        <div className="w-full h-[450px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                            Bản đồ không có sẵn
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default LocationSection;