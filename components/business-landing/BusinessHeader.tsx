
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

    const headerClasses = `fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
        }`;
    const navLinkClasses = `py-2 text-sm font-semibold transition-colors ${isScrolled ? 'text-neutral-dark hover:text-primary' : 'text-white hover:text-white/80'
        }`;
    const mobileNavLinkClasses = `block w-full py-3 px-4 text-lg text-neutral-dark font-semibold hover:bg-primary/10`;

    return (
        <header className={headerClasses}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link to="/" className="flex items-center gap-3">
                        {business.logo_url && <img src={business.logo_url} alt={`${business.name} logo`} className="h-12 w-auto" />}
                        <span className={`text-xl font-bold font-serif ${isScrolled ? 'text-primary' : 'text-white'}`}>
                            {business.name}
                        </span>
                    </Link>
                    <nav className="hidden lg:flex items-center space-x-6">
                        {navLinks.map(link => (
                            <button key={link.id} onClick={() => scrollToSection(link.id)} className={navLinkClasses}>
                                {link.label}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-gray-300/50"></div>
                        <Link to="/directory" className={navLinkClasses}>
                            &larr; Quay lại Danh mục
                        </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        {currentUser && (
                            <button
                                onClick={() => toggleFavorite(business.id)}
                                className={`hidden lg:block p-2 rounded-full transition-colors ${isScrolled ? 'hover:bg-primary/10' : 'hover:bg-white/20'}`}
                                aria-label={isFaved ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isFaved ? 'text-red-500' : (isScrolled ? 'text-neutral-dark' : 'text-white')}`} viewBox="0 0 20 20" fill={isFaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                            </button>
                        )}
                        <button onClick={onBookNowClick} className="hidden lg:block bg-primary text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-primary-dark transition-transform transform hover:scale-105">
                            Đặt lịch ngay
                        </button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-2xl" aria-label="Open menu">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${isScrolled ? 'text-neutral-dark' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile Menu */}
            <div className={`lg:hidden fixed inset-0 bg-white z-40 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
                <div className="pt-24 px-4 space-y-4">
                    {navLinks.map(link => (
                        <button key={link.id} onClick={() => scrollToSection(link.id)} className={mobileNavLinkClasses}>
                            {link.label}
                        </button>
                    ))}
                    <div className="border-t border-gray-200 pt-4">
                        <Link to="/directory" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>
                            &larr; Quay lại Danh mục
                        </Link>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                        <button onClick={() => { onBookNowClick(); setIsMenuOpen(false); }} className="w-full bg-primary text-white px-5 py-3 rounded-lg font-semibold text-lg hover:bg-primary-dark">
                            Đặt lịch ngay
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default BusinessHeader;
