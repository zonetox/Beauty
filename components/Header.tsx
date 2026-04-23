import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import { useBusiness } from '../contexts/BusinessContext.tsx';


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

// Navigation links component moved outside to satisfy react-hooks/static-components
const NavLinks: React.FC<{
  mobile?: boolean;
  isAdmin: boolean;
  onLinkClick: () => void;
  navLinkClass: (props: { isActive: boolean }) => string;
  mobileNavLinkClass: (props: { isActive: boolean }) => string;
}> = ({
  mobile = false,
  isAdmin,
  onLinkClick,
  navLinkClass,
  mobileNavLinkClass
}) => {
    const classNameFunc = mobile ? mobileNavLinkClass : navLinkClass;
    return (
      <>
        <NavLink to="/" className={classNameFunc} onClick={onLinkClick}>Trang chủ</NavLink>
        <NavLink to="/directory" className={classNameFunc} onClick={onLinkClick}>Danh bạ</NavLink>
        <NavLink to="/blog" className={classNameFunc} onClick={onLinkClick}>Blog</NavLink>
        <NavLink to="/about" className={classNameFunc} onClick={onLinkClick}>Về chúng tôi</NavLink>
        <NavLink to="/contact" className={classNameFunc} onClick={onLinkClick}>Liên hệ</NavLink>
        {/* Admin link chỉ hiển thị cho admin */}
        {isAdmin && (
          <NavLink to="/admin" className={classNameFunc} onClick={onLinkClick}>Admin</NavLink>
        )}
      </>
    );
  };

const Header: React.FC = () => {
  const { user, logout, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Get user role from role resolution (based on actual database state)
  const { role, isAdmin, isLoading: roleLoading } = useUserRole();
  const { currentBusiness } = useBusiness();


  const handleLogout = async () => {
    try {
      setIsMenuOpen(false); // Close menu on logout
      setIsDropdownOpen(false); // Close dropdown on logout

      // Navigate to home first (before logout completes) for better UX
      navigate('/', { replace: true });

      // Perform logout
      await logout();
    } catch (error: unknown) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
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
    return undefined;
  }, [isDropdownOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 tracking-wide ${isActive
      ? 'bg-primary/5 text-primary'
      : 'text-neutral-600 hover:text-primary hover:bg-white/40'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-primary text-white' : 'text-neutral-dark hover:bg-primary/10'
    }`;

  const handleHealthCheck = async () => {
    if (!isSupabaseConfigured) {
      toast.error("API is not configured for this preview environment.");
      return;
    }
    const checkPromise = (async () => {
      const { error } = await supabase.from('businesses').select('id', { count: 'exact', head: true });
      if (error) {
        console.error("Supabase health check failed:", error.message);
        throw new Error(`API Error: ${error.message}`);
      }
      return 'Connection successful.';
    })();

    toast.promise(checkPromise, {
      loading: 'Checking Supabase connection...',
      success: 'Supabase connection is healthy.',
      error: (err) => `Connection failed: ${err.message}`,
    });
  };

  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="group">
              {(theme.logo_url && !logoError) ? (
                <img
                  src={theme.logo_url}
                  alt="1Beauty Asia Logo"
                  className="h-12 w-auto"
                  onError={() => {
                    console.warn("Branding logo failed to load, falling back to text.");
                    setLogoError(true);
                  }}
                />
              ) : (
                <span className="text-2xl font-bold font-serif tracking-widest text-primary uppercase">
                  1Beauty.asia
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks
              isAdmin={isAdmin}
              onLinkClick={() => setIsMenuOpen(false)}
              navLinkClass={navLinkClass}
              mobileNavLinkClass={mobileNavLinkClass}
            />
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
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || user.email || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {(profile?.full_name || user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-neutral-dark hidden lg:block">
                      {profile?.full_name || user.user_metadata?.full_name || user.email}
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
                            {profile?.full_name || user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-sm text-neutral-dark hover:bg-primary/10 transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Dashboard quản trị</span>
                          </div>
                        </Link>

                        {(role === 'business' || !!currentBusiness) && currentBusiness?.slug && (
                          <Link
                            to={`/business/${currentBusiness.slug}`}
                            className="block px-4 py-2 text-sm text-neutral-dark hover:bg-primary/10 transition-colors"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Xem trang công bố</span>
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
                {role === 'anonymous' && (
                  <Link to="/register" className="ml-4 px-6 py-2.5 rounded-full shadow-sm text-sm font-medium text-white bg-accent hover:opacity-90 transition-all transform hover:scale-105 tracking-wide">
                    Đăng ký đối tác
                  </Link>
                )}
              </>
            )}
          </div>

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

      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks
              mobile
              isAdmin={isAdmin}
              onLinkClick={() => setIsMenuOpen(false)}
              navLinkClass={navLinkClass}
              mobileNavLinkClass={mobileNavLinkClass}
            />
            {isAdmin && (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') && (
              <button onClick={() => { handleHealthCheck(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-amber-700 hover:bg-amber-100">
                Check API Status
              </button>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user && !roleLoading ? (
              <div className="px-2 space-y-1">
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || user.email || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {(profile?.full_name || user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-neutral-dark">{profile?.full_name || user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-3`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Dashboard quản trị</span>
                </NavLink>

                {currentBusiness?.slug && (
                  <NavLink
                    to={`/business/${currentBusiness.slug}`}
                    className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-3`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Xem trang công bố</span>
                  </NavLink>
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
                {role === 'anonymous' && (
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-full shadow-sm font-medium text-white bg-accent hover:opacity-90 mt-4 tracking-wide"
                  >
                    Đăng ký đối tác
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
