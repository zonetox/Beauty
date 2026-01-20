


import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';

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
  const { user, logout, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Get user role from role resolution (based on actual database state)
  const { role, isAdmin, isBusinessOwner, isBusinessStaff, businessId, isLoading: roleLoading } = useUserRole();
  
  // Determine if user has business access (owner OR staff)
  const hasBusinessAccess = isBusinessOwner || isBusinessStaff;

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false); // Close menu on logout
      setIsDropdownOpen(false); // Close dropdown on logout
      
      // Navigate to home first (before logout completes) for better UX
      navigate('/', { replace: true });
      
      // Then perform logout (this will clear session in background)
      await logout();
      
      // Don't show toast on logout - silent logout is better UX
      // toast.success('Đã đăng xuất thành công');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      // Even if logout fails, ensure we're on home page
      navigate('/', { replace: true });
      // Only show error toast if logout actually failed
      const errorMessage = error instanceof Error ? error.message : 'Vui lòng thử lại';
      toast.error('Lỗi khi đăng xuất: ' + errorMessage, { id: 'logout-error' });
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-primary/10'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-primary/10'
    }`;

  const handleHealthCheck = async () => {
    if (!isSupabaseConfigured) {
      toast.error("API is not configured for this preview environment.");
      return;
    }
    const checkPromise = new Promise(async (resolve, reject) => {
      // Use a lightweight query to check connectivity
      const { error } = await supabase.from('businesses').select('id', { count: 'exact', head: true });
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
        {/* Admin link chỉ hiển thị cho admin */}
        {isAdmin && (
          <NavLink to="/admin" className={classNameFunc} onClick={handleLinkClick}>Admin</NavLink>
        )}
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
          <div className="hidden md:flex items-center ml-2 gap-2">
            {/* API Status chỉ hiển thị cho admin trong development */}
            {isAdmin && (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') && (
              <button onClick={handleHealthCheck} className="px-3 py-2 rounded-md text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors" title="Check Supabase Connection Status">
                API Status
              </button>
            )}
            {user && !roleLoading ? (
              <div className="flex items-center ml-2 gap-2">
                {/* User Avatar & Dropdown */}
                <div className="relative user-dropdown-container">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName || user.email || 'User'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {(profile?.fullName || user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-neutral-dark hidden lg:block">
                      {profile?.fullName || user.user_metadata?.full_name || user.email}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-neutral-dark transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-neutral-dark">
                          {profile?.fullName || user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {/* Account/Dashboard Link - Show based on role with finalized naming */}
                      {hasBusinessAccess ? (
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-sm text-neutral-dark hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Dashboard doanh nghiệp</span>
                          </div>
                        </Link>
                      ) : (
                        <Link
                          to="/account"
                          className="block px-4 py-2 text-sm text-neutral-dark hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Tài khoản của tôi</span>
                          </div>
                        </Link>
                      )}
                      {/* Register Business Link - Only show for regular users (not owner, not staff, not admin) */}
                      {role === 'user' && !hasBusinessAccess && (
                        <Link
                          to="/for-business"
                          className="block px-4 py-2 text-sm text-neutral-dark hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Đăng ký doanh nghiệp</span>
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Đăng xuất</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <NavLink to="/login" className={`${navLinkClass({ isActive: false })} ml-2`}>
                  Đăng nhập
                </NavLink>
                {/* "For Business" - Only visible to anonymous users */}
                {role === 'anonymous' && (
                  <Link
                    to="/for-business"
                    className="ml-4 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-transform transform hover:scale-105"
                  >
                    For Business
                  </Link>
                )}
              </>
            )}
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
            {/* API Status chỉ hiển thị cho admin trong development */}
            {isAdmin && (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') && (
              <button onClick={() => { handleHealthCheck(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-amber-700 hover:bg-amber-100">
                Check API Status
              </button>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user && !roleLoading ? (
              <div className="px-2 space-y-1">
                {/* User Info */}
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center gap-3">
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName || user.email || 'User'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {(profile?.fullName || user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-dark">{profile?.fullName || user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                {/* Account/Dashboard Link - Show based on role with finalized naming */}
                {hasBusinessAccess ? (
                  <NavLink 
                    to="/account" 
                    className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-3`} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-6 h-6" />
                    <span>Dashboard doanh nghiệp</span>
                  </NavLink>
                ) : (
                  <NavLink 
                    to="/account" 
                    className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-3`} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserIcon className="w-6 h-6" />
                    <span>Tài khoản của tôi</span>
                  </NavLink>
                )}
                {/* Register Business Link - Only show for regular users */}
                {role === 'user' && !hasBusinessAccess && (
                  <Link
                    to="/for-business"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-dark hover:bg-primary/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Đăng ký doanh nghiệp</span>
                    </div>
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <NavLink to="/login" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>Đăng nhập</NavLink>
                {/* "For Business" - Only visible to anonymous users */}
                {role === 'anonymous' && (
                  <Link
                    to="/for-business"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary hover:bg-primary-dark mt-2"
                  >
                    For Business
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;