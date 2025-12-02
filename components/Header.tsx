


import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Header: React.FC = () => {
  const { currentUser, logout } = useUserSession();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = async () => {
      await logout();
      setIsMenuOpen(false); // Close menu on logout
      navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-primary/10'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${
      isActive ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-primary/10'
    }`;
    
  const handleHealthCheck = async () => {
    if (!isSupabaseConfigured) {
      toast.error("API is not configured for this preview environment.");
      return;
    }
    const checkPromise = new Promise(async (resolve, reject) => {
      // Use a lightweight query to check connectivity
      const { error } = await supabase.from('business').select('id', { count: 'exact', head: true });
      if (error) {
        console.error("Supabase health check failed:", error.message);
        return reject(new Error(`API Error: ${error.message}`));
      }
      return resolve('Connection successful.');
    });

    toast.promise(checkPromise, {
      loading: 'Checking Supabase connection...',
      success: 'Supabase connection is healthy.',
      error: (err) => `Connection failed: ${err.message}`,
    });
  };

  // This will render the navigation links for both desktop and mobile
  const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile = false }) => {
    const classNameFunc = mobile ? mobileNavLinkClass : navLinkClass;
    const handleLinkClick = () => setIsMenuOpen(false);
    return (
        <>
            <NavLink to="/" className={classNameFunc} onClick={handleLinkClick}>Trang chủ</NavLink>
            <NavLink to="/directory" className={classNameFunc} onClick={handleLinkClick}>Danh bạ</NavLink>
            <NavLink to="/blog" className={classNameFunc} onClick={handleLinkClick}>Blog</NavLink>
            <NavLink to="/about" className={classNameFunc} onClick={handleLinkClick}>Về chúng tôi</NavLink>
            <NavLink to="/contact" className={classNameFunc} onClick={handleLinkClick}>Liên hệ</NavLink>
            <NavLink to="/admin" className={classNameFunc} onClick={handleLinkClick}>Admin</NavLink>
        </>
    );
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="1Beauty Asia Logo" className="h-10 w-auto" />
              ) : (
                <span className="text-2xl font-bold font-serif text-primary">
                  1Beauty Asia
                </span>
              )}
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </nav>
          
          {/* Right side buttons - Desktop */}
          <div className="hidden md:flex items-center ml-2">
            <button onClick={handleHealthCheck} className="px-3 py-2 rounded-md text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors" title="Check Supabase Connection Status">
              API Status
            </button>
            {currentUser ? (
                <div className="flex items-center ml-2">
                    <span className="text-sm text-neutral-dark mr-2 hidden lg:block">Chào, {currentUser.user_metadata?.full_name || currentUser.email}!</span>
                    <NavLink to="/account" className={({isActive}) => `${navLinkClass({isActive})} flex items-center gap-2`}>
                        <UserIcon className="w-5 h-5" />
                        <span className="hidden lg:inline">Dashboard Doanh nghiệp</span>
                    </NavLink>
                    <button onClick={handleLogout} className="ml-2 px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-primary/10 rounded-md">
                        Đăng xuất
                    </button>
                </div>
            ) : (
                <NavLink to="/login" className={`${navLinkClass({isActive:false})} ml-2`}>
                    Đăng nhập
                </NavLink>
            )}
            <Link
              to="/register"
              className="ml-4 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-transform transform hover:scale-105"
            >
              For Business
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-dark hover:text-white hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu" 
                aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <CloseIcon className="block h-6 w-6" /> : <HamburgerIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks mobile />
             <button onClick={() => { handleHealthCheck(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-amber-700 hover:bg-amber-100">
                Check API Status
            </button>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {currentUser ? (
              <div className="px-2 space-y-1">
                 <NavLink to="/account" className={({isActive}) => `${mobileNavLinkClass({isActive})} flex items-center gap-3`} onClick={() => setIsMenuOpen(false)}>
                    <UserIcon className="w-6 h-6" />
                    <div>
                        <p className="font-medium">{currentUser.user_metadata?.full_name || currentUser.email}</p>
                        <p className="text-sm text-gray-500">Quản lý doanh nghiệp</p>
                    </div>
                 </NavLink>
                 <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-neutral-dark hover:bg-primary/10">
                    Đăng xuất
                 </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                 <NavLink to="/login" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Đăng nhập</NavLink>
              </div>
            )}
            <div className="mt-3 px-2">
                <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary hover:bg-primary-dark"
                >
                    Register Business
                </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;