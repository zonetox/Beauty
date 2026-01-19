

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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
import AuthLoadingScreen from './components/AuthLoadingScreen.tsx';

import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { useWebVitals } from './hooks/usePerformanceMonitoring.ts';
import { usePageTracking } from './lib/usePageTracking.ts';

// Lazy load all page components for performance
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage.tsx'));
const BusinessDetailPage = lazy(() => import('./pages/BusinessDetailPage.tsx'));
const BlogListPage = lazy(() => import('./pages/BlogListPage.tsx'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.tsx'));
const BusinessPostPage = lazy(() => import('./pages/BusinessPostPage.tsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.tsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.tsx'));
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
const AccountPageRouter: React.FC = () => {
    const { profile, user, state } = useAuth();
    const [role, setRole] = React.useState<'user' | 'business_owner' | 'admin' | 'loading' | 'error'>('loading');
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const resolveRole = async () => {
            if (state === 'loading') return;
            
            if (!user) {
                setRole('error');
                setError('User not authenticated');
                return;
            }

            if (!profile) {
                setRole('error');
                setError('Profile not found. Account is incomplete.');
                return;
            }

            try {
                const { resolveUserRole } = await import('../lib/roleResolution.ts');
                const roleResult = await resolveUserRole(user);
                
                if (roleResult.error) {
                    setRole('error');
                    setError(roleResult.error);
                } else {
                    setRole(roleResult.role as 'user' | 'business_owner' | 'admin');
                }
            } catch (err: any) {
                setRole('error');
                setError(`Role resolution failed: ${err.message}`);
            }
        };

        resolveRole();
    }, [user, profile, state]);

    // Loading state
    if (state === 'loading' || role === 'loading') {
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

    // Error state - BLOCK access
    if (role === 'error' || !profile) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Setup Incomplete</h2>
                    <p className="text-gray-600 mb-6">{error || 'Profile not found. Account is incomplete.'}</p>
                    <p className="text-sm text-gray-500">Please contact support or try logging out and back in.</p>
                </div>
            </div>
        );
    }

    // Route based on resolved role
    if (role === 'business_owner' && profile.businessId) {
        return <UserBusinessDashboardPage />;
    }

    if (role === 'admin') {
        // Admin can access admin panel, but show account page for now
        return <UserAccountPage />;
    }

    // Regular user
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
            <Router>
                <WebVitalsTracker />
                <PageTracking />
                <Toaster position="top-center" reverseOrder={false} />
                <AuthProvider>
                    <AuthGate>
                        <AppContent />
                    </AuthGate>
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    );
};

// Auth Gate: Shows loading screen while auth is being checked
// Redirects to login if unauthenticated (for protected routes)
const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state } = useAuth();

    // Show loading screen while checking auth
    if (state === 'loading') {
        return <AuthLoadingScreen />;
    }

    // Auth state is resolved (authenticated or unauthenticated)
    // Let protected routes handle redirects
    return <>{children}</>;
};

export default App;