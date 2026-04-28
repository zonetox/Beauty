
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Business } from '../../types.ts';
import { useAuth } from '../../providers/AuthProvider.tsx';

interface BusinessHeaderProps {
    business: Business;
    onBookNowClick: () => void;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({ business, onBookNowClick }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user: currentUser, isFavorite, toggleFavorite } = useAuth();
    const isFaved = currentUser ? isFavorite(business.id) : false;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setIsMenuOpen(false);
    };

    const navLinks = [
        { id: 'about', label: 'Giới thiệu' },
        { id: 'services', label: 'Dịch vụ' },
        { id: 'gallery', label: 'Hình ảnh' },
        { id: 'blog', label: 'Blog' },
        { id: 'deals', label: 'Ưu đãi' },
        { id: 'location', label: 'Liên hệ' },
    ];

    const headerClasses = `fixed top-0 left-0 w-full z-50 transition-all duration-1000 ${isScrolled
        ? 'py-4 bg-white/80 backdrop-blur-2xl shadow-premium border-b border-primary/10'
        : 'py-8 bg-transparent'
        }`;
    const navLinkClasses = `group relative py-2 text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-500 ${isScrolled
        ? 'text-accent hover:text-primary'
        : 'text-white hover:text-primary'
        }`;
    const mobileNavLinkClasses = `block w-full py-6 px-10 text-[10px] uppercase tracking-[0.4em] text-accent font-bold hover:bg-secondary transition-all border-b border-primary/5`;

    return (
        <header className={headerClasses}>
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-4 group">
                        {business.logo_url && (
                            <div className="relative">
                                <img src={business.logo_url} alt={`${business.name} logo`} className="h-10 w-auto filter brightness-110" />
                                <div className="absolute -inset-2 border border-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        )}
                        <span className={`text-2xl lg:text-3xl font-serif italic tracking-tighter transition-colors duration-700 ${isScrolled ? 'text-accent' : 'text-white'}`}>
                            {business.name}
                        </span>
                    </Link>

                    <nav className="hidden lg:flex items-center space-x-12">
                        {navLinks.map(link => (
                            <button key={link.id} onClick={() => scrollToSection(link.id)} className={navLinkClasses}>
                                <span className="relative z-10">{link.label}</span>
                                <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-500 group-hover:w-full"></span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-6">
                        {currentUser && (
                            <button
                                onClick={() => toggleFavorite(business.id)}
                                className={`hidden lg:block p-3 rounded-full border border-primary/10 transition-all ${isScrolled ? 'hover:bg-primary/5' : 'hover:bg-white/10'}`}
                                aria-label={isFaved ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFaved ? 'text-primary' : (isScrolled ? 'text-accent' : 'text-white')}`} viewBox="0 0 20 20" fill={isFaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onBookNowClick}
                            className="hidden lg:flex items-center gap-3 bg-primary text-accent px-8 py-3 rounded-full font-bold text-[10px] tracking-[0.3em] uppercase hover:bg-accent hover:text-white transition-all transform hover:scale-105 shadow-premium"
                        >
                            <span>Book Visit</span>
                            <span className="text-lg">→</span>
                        </button>

                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2" aria-label="Open menu">
                            <div className="w-8 h-5 flex flex-col justify-between">
                                <span className={`h-px w-full transition-all duration-500 ${isScrolled ? 'bg-accent' : 'bg-white'} ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                                <span className={`h-px w-full transition-all duration-500 ${isScrolled ? 'bg-accent' : 'bg-white'} ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`h-px w-full transition-all duration-500 ${isScrolled ? 'bg-accent' : 'bg-white'} ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            <div className={`lg:hidden fixed inset-0 bg-white z-40 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-700 ease-in-out`}>
                <div className="h-full flex flex-col pt-32 p-6">
                    <div className="space-y-2 flex-grow">
                        {navLinks.map(link => (
                            <button key={link.id} onClick={() => scrollToSection(link.id)} className={mobileNavLinkClasses}>
                                {link.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-auto space-y-6 pb-12">
                        <button onClick={() => { onBookNowClick(); setIsMenuOpen(false); }} className="w-full bg-accent text-white py-6 rounded-full font-bold text-xs tracking-[0.4em] uppercase border border-accent hover:bg-transparent hover:text-accent transition-all">
                            Appointment Now
                        </button>
                        <Link to="/directory" className="block text-center text-accent/40 text-[10px] uppercase tracking-[0.4em] font-bold" onClick={() => setIsMenuOpen(false)}>
                            Quay lại Khám phá
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default BusinessHeader;
