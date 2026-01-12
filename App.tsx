

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Breadcrumbs from './components/Breadcrumbs.tsx';
import Chatbot from './components/Chatbot.tsx';
import BackToTopButton from './components/BackToTopButton.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import AuthRedirectHandler from './components/AuthRedirectHandler.tsx';

// Import new consolidated providers
import { UserSessionProvider, useUserSession } from './contexts/UserSessionContext.tsx';
import { AdminProvider } from './contexts/AdminContext.tsx';
import { PublicDataProvider } from './contexts/BusinessDataContext.tsx';
import { HomepageDataProvider } from './contexts/HomepageDataContext.tsx';
import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { BusinessDashboardProvider } from './contexts/BusinessBlogDataContext.tsx';
import { AdminPlatformProvider } from './contexts/AdminPlatformContext.tsx';
import { PublicPageContentProvider } from './contexts/PublicPageContentContext.tsx';

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
const AccountPageRouter: React.FC = () => {
    const { profile, loading: profileLoading, currentUser, refreshProfile } = useUserSession();
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    // Clear registration marker when businessId is confirmed (must be before early returns)
    useEffect(() => {
        if (profile?.businessId && sessionStorage.getItem('registration_time')) {
            sessionStorage.removeItem('registration_time');
        }
    }, [profile?.businessId]);

    // Auto-refresh profile if businessId is missing but user just registered (must be before early returns)
    useEffect(() => {
        if (currentUser && profile && !profile.businessId && !profileLoading && retryCount < maxRetries) {
            // Check if user just registered (within last 30 seconds)
            const registrationTime = sessionStorage.getItem('registration_time');
            if (registrationTime) {
                const timeSinceRegistration = Date.now() - parseInt(registrationTime, 10);
                if (timeSinceRegistration < 30000) { // 30 seconds
                    // eslint-disable-next-line no-console
                    console.log(`Profile missing businessId, refreshing... (retry ${retryCount + 1}/${maxRetries})`);
                    const timer = setTimeout(() => {
                        refreshProfile();
                        setRetryCount(prev => prev + 1);
                    }, 1000); // Wait 1 second between retries
                    return () => clearTimeout(timer);
                } else {
                    // Clear old registration marker
                    sessionStorage.removeItem('registration_time');
                }
            }
        }
    }, [currentUser, profile, profileLoading, refreshProfile, retryCount]);

    // Show loading only if we have a user but profile is still loading
    // If no user, ProtectedRoute will handle redirect
    if (profileLoading && currentUser) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Đang tải tài khoản...</p>
                    <p className="text-gray-500">Vui lòng đợi.</p>
                </div>
            </div>
        );
    }

    // If profile is null but we have a user, profile might not exist yet
    // Wait a bit more or show error
    if (currentUser && !profile && !profileLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <p className="text-lg font-semibold text-red-600">Lỗi tải thông tin tài khoản</p>
                    <p className="text-gray-500">Vui lòng thử đăng nhập lại.</p>
                </div>
            </div>
        );
    }

    // If a user has a business, route to the business dashboard
    if (profile?.businessId) {
        return <UserBusinessDashboardPage />;
    }

    // If a profile exists but is not linked to a business, show user account page (regular user)
    if (profile) {
        // Clear registration marker after delay (handled in useEffect)
        return <UserAccountPage />;
    }

    // Fallback: should not reach here, but show loading
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Đang tải...</p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    // The check for Supabase configuration has been removed to avoid showing the error
    // page in preview environments where environment variables are not present.
    // The app will now attempt to connect directly. The 'API Status' button in the
    // header can be used for diagnostics.

    return (
        <ErrorBoundary>
            <Router>
                <Toaster position="top-center" reverseOrder={false} />
                <ThemeProvider>
                    <UserSessionProvider>
                        <AdminProvider>
                            <PublicDataProvider>
                                <HomepageDataProvider>
                                    <BusinessProvider>
                                        <PublicPageContentProvider>
                                            <Suspense fallback={<LoadingSpinner />}>
                                                <Routes>
                                                {/* Routes WITH standard layout (Header, Footer, etc.) */}
                                                <Route element={<AppLayout />}>
                                                    <Route index element={<HomePage />} />
                                                    <Route path="directory" element={<DirectoryPage />} />
                                                    <Route path="blog" element={<BlogListPage />} />
                                                    <Route path="blog/:slug" element={<BlogPostPage />} />
                                                    <Route path="about" element={<AboutPage />} />
                                                    <Route path="contact" element={<ContactPage />} />
                                                <Route path="register" element={<RegisterPage />} />
                                                {/* <Route path="/register-business" element={<RegisterBusinessPage />} /> */}
                                                <Route path="/partner-registration" element={<PartnerRegistrationPage />} />
                                                <Route path="login" element={<LoginPage />} />
                                                <Route path="reset-password" element={<ResetPasswordPage />} />
                                                <Route path="account" element={
                                                    <ProtectedRoute>
                                                        <BusinessDashboardProvider>
                                                            <AccountPageRouter />
                                                        </BusinessDashboardProvider>
                                                    </ProtectedRoute>
                                                } />
                                            </Route>

                                            {/* Routes WITHOUT standard layout */}
                                            <Route path="/admin" element={
                                                <AdminProtectedRoute>
                                                    <AdminPlatformProvider>
                                                        <BusinessDashboardProvider>
                                                            <AdminPage />
                                                        </BusinessDashboardProvider>
                                                    </AdminPlatformProvider>
                                                </AdminProtectedRoute>
                                            } />
                                            <Route path="/admin/login" element={<AdminLoginPage />} />
                                            <Route path="business/:slug" element={<BusinessDetailPage />} />
                                            <Route path="business/:businessSlug/post/:postSlug" element={<BusinessPostPage />} />
                                            <Route path="/connection-test" element={<ConnectionTestPage />} />

                                                {/* Catch-all route must be at the top level */}
                                                <Route path="*" element={<NotFoundPage />} />
                                            </Routes>
                                                </Suspense>
                                            </PublicPageContentProvider>
                                        </BusinessProvider>
                                    </HomepageDataProvider>
                                </PublicDataProvider>
                            </AdminProvider>
                        </UserSessionProvider>
                    </ThemeProvider>
                </Router>
            </ErrorBoundary>
    );
};

export default App;