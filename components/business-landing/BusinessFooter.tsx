import React from 'react';
import { Link } from 'react-router-dom';
import { Business } from '../../types.ts';
import { trackConversion } from '../../lib/usePageTracking.ts';

const FacebookIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>;
const InstagramIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm4-9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const ZaloIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.001.001C5.373.001 0 5.374 0 12.001c0 4.254 2.215 7.994 5.567 10.033l-1.42 4.823 5.09-2.616c.91.173 1.847.26 2.764.26 6.628 0 12.001-5.373 12.001-12.001C24.001 5.374 18.628.001 12.001.001zM8.5 14.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zm7 0c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"/></svg>;
const TikTokIcon = () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 448 512"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/></svg>;

const BusinessFooter: React.FC<{ business: Business }> = ({ business }) => {
    return (
        <section className="bg-neutral-dark text-white">
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                <h3 className="text-2xl font-bold font-serif text-primary mb-2">{business.name}</h3>
                <p className="text-gray-300">{business.address}, {business.city}</p>
                <p className="text-gray-300">
                    <a 
                        href={`tel:${business.phone}`} 
                        className="hover:text-primary"
                        onClick={() => trackConversion('call', business.id)}
                    >{business.phone}</a>
                    {business.email && <span> &bull; <a href={`mailto:${business.email}`} className="hover:text-primary">{business.email}</a></span>}
                </p>
                <div className="flex justify-center space-x-6 mt-6">
                    {business.socials?.facebook && (
                        <a href={business.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                            <FacebookIcon />
                        </a>
                    )}
                     {business.socials?.instagram && (
                        <a href={business.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                            <InstagramIcon />
                        </a>
                    )}
                    {business.socials?.zalo && (
                        <a href={business.socials.zalo} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                            <ZaloIcon />
                        </a>
                    )}
                    {business.socials?.tiktok && (
                        <a href={business.socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                            <TikTokIcon />
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BusinessFooter;