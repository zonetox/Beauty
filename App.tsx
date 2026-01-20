

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Breadcrumbs from './components/Breadcrumbs.tsx';
import Chatbot from './components/Chatbot.tsx';
import BackToTopButton from './components/BackToTopButton.tsx';
import AuthRedirectHandler from './components/AuthRedirectHandler.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

// Import new consolidated providers
import { AuthProvider, useAuth } from './providers/AuthProvider.tsx';
import { AdminProvider } from './contexts/AdminContext.tsx';
import { PublicDataProvider } from './contexts/BusinessDataContext.tsx';
import { HomepageDataProvider } from './contexts/HomepageDataContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { BusinessDashboardProvider } from './contexts/BusinessBlogDataContext.tsx';
import { AdminPlatformProvider } from './contexts/AdminPlatformContext.tsx';
import { PublicPageContentProvider } from './contexts/PublicPageContentContext.tsx';
import { ErrorLoggerProvider } from './contexts/ErrorLoggerContext.tsx';
import { StaffProvider } from './contexts/StaffContext.tsx';
import AppInitializationScreen from './components/AppInitializationScreen.tsx';
import { AppInitializationProvider, useAppInitialization } from './contexts/AppInitializationContext.tsx';
import { queryClient } from './lib/queryClient.ts';

import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { useWebVitals } from './hooks/usePerformanceMonitoring.ts';
import { usePageTracking } from './lib/usePageTracking.ts';
import { useUserRole } from './hooks/useUserRole.ts';

// Lazy load all page components for performance
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage.tsx'));
const BusinessDetailPage = lazy(() => import('./pages/BusinessDetailPage.tsx'));
const BlogListPage = lazy(() => import('./pages/BlogListPage.tsx'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.tsx'));
const BusinessPostPage = lazy(() => import('./pages/BusinessPostPage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.tsx'));
const ForBusinessPage = lazy(() => import('./pages/ForBusinessPage.tsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.tsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.tsx'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.tsx'));
const AdminProtectedRoute = lazy(() => import('./components/AdminProtectedRoute.tsx'));
const PartnerRegistrationPage = lazy(() => import('./pages/PartnerRegistrationPage.tsx'));
const UserBusinessDashboardPage = lazy(() => import('./pages/UserBusinessDashboardPage.tsx'));
const UserAccountPage = lazy(() => import('./pages/UserAccountPage.tsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));
const ConnectionTestPage = lazy(() => import('./pages/ConnectionTestPage.tsx'));

// Loading component for Suspense fallback
const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-neutral-dark">Loading...</p>
    </div>
);


// Web Vitals tracking component
const WebVitalsTracker: React.FC = () => {
    useWebVitals();
    return null;
};

// Page tracking component
const PageTracking: React.FC = () => {
    usePageTracking();
    return null;
};

// Layout component for all standard public-facing pages.
const AppLayout: React.FC = () => {
    const location = useLocation();
    const isHomepage = location.pathname === '/';

    return (
        <div className="flex flex-col min-h-screen font-sans text-neutral-dark bg-background">
            <AuthRedirectHandler />
            <Header />
            <main className="flex-grow">
                {!isHomepage && <Breadcrumbs />}
                <Outlet /> {/* Child routes will render here */}
            </main>
            <Footer />
            <BackToTopButton />
            <Chatbot />
        </div>
    );
};

// This component intelligently routes the user to their business dashboard or personal account page.
// MANDATORY: Requires profile and resolves role from database
// Uses useUserRole hook for consistent role resolution
const AccountPageRouter: React.FC = () => {
    const { profile, user, state } = useAuth();
    const { role, isLoading: roleLoading, error: roleError } = useUserRole();
    const navigate = useNavigate();
    const [loadTimeout, setLoadTimeout] = useState(false);

    // Safety timeout: If loading takes more than 15 seconds, show error
    useEffect(() => {
        if (state === 'loading' || roleLoading) {
            const timeoutId = setTimeout(() => {
                setLoadTimeout(true);
            }, 15000);

            return () => clearTimeout(timeoutId);
        }
    }, [state, roleLoading]);

    // Reset timeout when loading completes
    useEffect(() => {
        if (state !== 'loading' && !roleLoading) {
            setLoadTimeout(false);
        }
    }, [state, roleLoading]);

    // Loading state
    if ((state === 'loading' || roleLoading) && !loadTimeout) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Đang tải thông tin tài khoản...</p>
                    <p className="text-gray-500">Vui lòng đợi.</p>
                </div>
            </div>
        );
    }

    // Timeout state
    if (loadTimeout) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">⏱️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Tải thông tin quá lâu</h2>
                    <p className="text-gray-600 mb-6">Tải thông tin tài khoản mất quá nhiều thời gian. Vui lòng thử lại sau hoặc làm mới trang.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Làm mới trang
                    </button>
                </div>
            </div>
        );
    }

    // Error state - Only block if critical (no user or profile), otherwise allow access with fallback role
    if (!user) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
                    <p className="text-gray-600 mb-6">Please log in to access your account.</p>
                    <button
                        onClick={() => navigate('/login', { replace: true })}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    // If profile is missing but user exists, try to show account page anyway (profile may load later)
    if (!profile && roleError) {
        // Show error but allow retry
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-yellow-500 text-5xl mb-4">⏱️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Đang tải thông tin</h2>
                    <p className="text-gray-600 mb-6">{roleError}</p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Làm mới trang
                        </button>
                        <button
                            onClick={() => navigate('/', { replace: true })}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If we have user and profile but role resolution failed, try to show account page with fallback
    if (profile && user && roleError && !roleLoading) {
        // Fallback: Show account page for regular users if role resolution fails
        console.warn('Role resolution failed, using fallback user role:', roleError);
        return <UserAccountPage />;
    }

    // Route based on resolved role - NO DEFAULT REDIRECT
    // Only route to pages that actually exist and are implemented
    if ((role === 'business_owner' || role === 'business_staff') && profile.businessId) {
        // Business owner/staff → business dashboard (fully implemented)
        return <UserBusinessDashboardPage />;
    }

    if (role === 'admin') {
        // Admin → account page (can also access /admin via header link)
        return <UserAccountPage />;
    }

    // Regular user → account page (only implemented features shown)
    if (role === 'user') {
        return <UserAccountPage />;
    }

    // Should not reach here
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <p className="text-lg font-semibold">Unable to determine account type</p>
                <p className="text-gray-500">Please contact support.</p>
            </div>
        </div>
    );
};


// Layout wrapper for routes that need public data (businesses, blog, packages, markers)
// This provider mounts once and persists across navigation within these routes
const PublicDataLayout: React.FC = () => {
    return (
        <PublicDataProvider>
            <HomepageDataProvider>
                <BusinessProvider>
                    <Outlet /> {/* Child routes render here */}
                </BusinessProvider>
            </HomepageDataProvider>
        </PublicDataProvider>
    );
};

// App content (rendered after auth is resolved)
const AppContent: React.FC = () => {
    const { isInitializing } = useAppInitialization();
    
    // Show unified loading screen during initialization
    if (isInitializing) {
        return <AppInitializationScreen message="Đang khởi tạo ứng dụng..." />;
    }
    
    return (
        <ErrorLoggerProvider>
            <ThemeProvider>
                <AdminProvider>
                    <StaffProvider>
                        <PublicPageContentProvider>
                            <Suspense fallback={<LoadingSpinner />}>
                                <Routes>
                                    {/* Routes WITH standard layout (Header, Footer, etc.) */}
                                    <Route element={<AppLayout />}>
                                        {/* Routes that need public data - nested under PublicDataLayout */}
                                        <Route element={<PublicDataLayout />}>
                                            <Route index element={<HomePage />} />
                                            <Route path="directory" element={<DirectoryPage />} />
                                            <Route path="blog" element={<BlogListPage />} />
                                            <Route path="blog/:slug" element={<BlogPostPage />} />
                                            <Route path="account" element={
                                                <ProtectedRoute>
                                                    <BusinessDashboardProvider>
                                                        <AccountPageRouter />
                                                    </BusinessDashboardProvider>
                                                </ProtectedRoute>
                                            } />
                                        </Route>
                                        
                                        {/* Public pages that DON'T need public data */}
                                        <Route path="about" element={<AboutPage />} />
                                        <Route path="contact" element={<ContactPage />} />
                                        <Route path="for-business" element={<ForBusinessPage />} />
                                        <Route path="register" element={<RegisterPage />} />
                                        <Route path="/partner-registration" element={<PartnerRegistrationPage />} />
                                        <Route path="login" element={<LoginPage />} />
                                        <Route path="reset-password" element={<ResetPasswordPage />} />
                                    </Route>

                                    {/* Routes WITHOUT standard layout */}
                                    <Route path="/admin" element={
                                        <AdminProtectedRoute>
                                            <PublicDataProvider>
                                                <HomepageDataProvider>
                                                    <BusinessProvider>
                                                        <AdminPlatformProvider>
                                                            <BusinessDashboardProvider>
                                                                <AdminPage />
                                                            </BusinessDashboardProvider>
                                                        </AdminPlatformProvider>
                                                    </BusinessProvider>
                                                </HomepageDataProvider>
                                            </PublicDataProvider>
                                        </AdminProtectedRoute>
                                    } />
                                    <Route path="/admin/login" element={<AdminLoginPage />} />
                                    <Route path="business/:slug" element={
                                        <PublicDataProvider>
                                            <HomepageDataProvider>
                                                <BusinessProvider>
                                                    <BusinessDetailPage />
                                                </BusinessProvider>
                                            </HomepageDataProvider>
                                        </PublicDataProvider>
                                    } />
                                    <Route path="business/:businessSlug/post/:postSlug" element={
                                        <PublicDataProvider>
                                            <HomepageDataProvider>
                                                <BusinessProvider>
                                                    <BusinessPostPage />
                                                </BusinessProvider>
                                            </HomepageDataProvider>
                                        </PublicDataProvider>
                                    } />
                                    <Route path="/connection-test" element={<ConnectionTestPage />} />

                                    {/* Catch-all route must be at the top level */}
                                    <Route path="*" element={<NotFoundPage />} />
                                </Routes>
                            </Suspense>
                        </PublicPageContentProvider>
                    </StaffProvider>
                </AdminProvider>
            </ThemeProvider>
        </ErrorLoggerProvider>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <AppInitializationProvider>
                        <WebVitalsTracker />
                        <PageTracking />
                        <Toaster 
                          position="top-center" 
                          reverseOrder={false}
                          toastOptions={{
                            duration: 3000,
                            maxToasts: 3,
                            style: {
                              maxWidth: '500px',
                            },
                          }}
                          gutter={8}
                        />
                        <AuthProvider>
                            <AuthGate>
                                <AppContent />
                            </AuthGate>
                        </AuthProvider>
                    </AppInitializationProvider>
                </Router>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

// Auth Gate: Shows unified loading screen while auth is being checked
// Prevents multiple loading screens from appearing
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state } = useAuth();
    const { isInitializing, setInitializing } = useAppInitialization();

    // Track initialization state - mark as complete when auth resolves
    useEffect(() => {
        if (state !== 'loading' && isInitializing) {
            // Add small delay to prevent flash of loading screen
            const timer = setTimeout(() => {
                setInitializing(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [state, isInitializing, setInitializing]);

    // Show unified loading screen during initialization or auth loading
    if (state === 'loading' || isInitializing) {
        return <AppInitializationScreen message="Đang khởi tạo ứng dụng..." />;
    }

    // Auth state is resolved (authenticated or unauthenticated)
    // Let protected routes handle redirects
    return <>{children}</>;
};

export default App;