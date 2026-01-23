

import React, { lazy, Suspense } from 'react';
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
const RegisterSelectPage = lazy(() => import('./pages/RegisterSelectPage.tsx'));
const RegisterUserPage = lazy(() => import('./pages/RegisterUserPage.tsx'));
const RegisterBusinessPage = lazy(() => import('./pages/RegisterBusinessPage.tsx'));
const BusinessSetupPage = lazy(() => import('./pages/BusinessSetupPage.tsx'));
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

/**
 * Account Dashboard Dispatcher (Standardized)
 * Routes to different dashboards using pre-resolved Profile Layer
 */
const AccountDashboard: React.FC = () => {
    const { role, profile } = useAuth();

    if (profile && (role === 'business_owner' || role === 'business_staff') && profile.businessId) {
        return <UserBusinessDashboardPage />;
    }

    return <UserAccountPage />;
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
                                                        <AccountDashboard />
                                                    </BusinessDashboardProvider>
                                                </ProtectedRoute>
                                            } />
                                        </Route>

                                        {/* Public pages that DON'T need public data */}
                                        <Route path="about" element={<AboutPage />} />
                                        <Route path="contact" element={<ContactPage />} />
                                        <Route path="for-business" element={<ForBusinessPage />} />
                                        <Route path="register" element={<RegisterSelectPage />} />
                                        <Route path="register/user" element={<RegisterUserPage />} />
                                        <Route path="register/business" element={<RegisterBusinessPage />} />
                                        <Route path="account/business/setup" element={
                                            <ProtectedRoute>
                                                <BusinessSetupPage />
                                            </ProtectedRoute>
                                        } />
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
                                style: {
                                    maxWidth: '500px',
                                },
                            }}
                            gutter={8}
                        />
                        <AuthProvider>
                            <AppContent />
                        </AuthProvider>
                    </AppInitializationProvider>
                </Router>
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

/**
 * Legacy AuthGate removed.
 * Login and initialization are now handled deterministically by 
 * AuthProvider (Layer 1) and ProfileProvider (Layer 2)
 */

export default App;