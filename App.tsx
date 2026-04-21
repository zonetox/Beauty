

import React, { Suspense } from 'react';
import { safeLazy } from './lib/safeLazy.ts';
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
import { PublicPageContentProvider } from './contexts/PublicPageContentContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ErrorLoggerProvider } from './contexts/ErrorLoggerContext.tsx';
import { StaffProvider } from './contexts/StaffContext.tsx';
import { CMSProvider } from './contexts/CMSContext.tsx';
import { HomepageProvider } from './src/features/home';
import { DirectoryProvider } from './src/features/directory';
import AppInitializationScreen from './components/AppInitializationScreen.tsx';
import { queryClient } from './lib/queryClient.ts';
import AdminProtectedRoute from './components/AdminProtectedRoute.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { useWebVitals } from './hooks/usePerformanceMonitoring.ts';
import { usePageTracking } from './lib/usePageTracking.ts';

// Lazy load all page components for performance
const HomePage = safeLazy(() => import('./pages/HomePage.tsx'));
const DirectoryPage = safeLazy(() => import('./pages/DirectoryPage.tsx'));
const BusinessDetailPage = safeLazy(() => import('./pages/BusinessDetailPage.tsx'));
const BlogListPage = safeLazy(() => import('./pages/BlogListPage.tsx'));
const BlogPostPage = safeLazy(() => import('./pages/BlogPostPage.tsx'));
const BusinessPostPage = safeLazy(() => import('./pages/BusinessPostPage.tsx'));
const AboutPage = safeLazy(() => import('./pages/AboutPage.tsx'));
const ContactPage = safeLazy(() => import('./pages/ContactPage.tsx'));
const ForBusinessPage = safeLazy(() => import('./pages/ForBusinessPage.tsx'));
const RegisterPage = safeLazy(() => import('./pages/RegisterPage.tsx'));

const BusinessSetupPage = safeLazy(() => import('./pages/BusinessSetupPage.tsx'));
const AdminPage = safeLazy(() => import('./pages/AdminPage.tsx'));
const AdminLoginPage = safeLazy(() => import('./pages/AdminLoginPage.tsx'));
const PartnerRegistrationPage = safeLazy(() => import('./pages/PartnerRegistrationPage.tsx'));
const UserBusinessDashboardPage = safeLazy(() => import('./pages/UserBusinessDashboardPage.tsx'));
const NotFoundPage = safeLazy(() => import('./pages/NotFoundPage.tsx'));
const LoginPage = safeLazy(() => import('./pages/LoginPage.tsx'));
const ResetPasswordPage = safeLazy(() => import('./pages/ResetPasswordPage.tsx'));
const ConnectionTestPage = safeLazy(() => import('./pages/ConnectionTestPage.tsx'));
const OnboardingPage = safeLazy(() => import('./pages/OnboardingPage.tsx'));

// Unified loading component using the initialization screen
const LoadingSpinner: React.FC = () => <AppInitializationScreen />;


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








// App content (rendered after auth is resolved)
const AppContent: React.FC = () => {
    const { state } = useAuth();

    // Show unified loading screen during initialization
    if (state === 'loading') {
        return <AppInitializationScreen />;
    }

    return (
        <ErrorLoggerProvider>
            <ThemeProvider>
                <HomepageProvider>
                    <PublicPageContentProvider>
                        <PublicDataProvider>
                            <DirectoryProvider>
                                <CMSProvider>
                                    <AdminProvider>
                                        <BusinessProvider>
                                            <StaffProvider>
                                                <Suspense fallback={<LoadingSpinner />}>
                                                    <Routes>
                                                        <Route element={<AppLayout />}>
                                                            <Route index element={<HomePage />} />
                                                            <Route path="directory" element={<DirectoryPage />} />
                                                            <Route path="blog" element={<BlogListPage />} />
                                                            <Route path="blog/:slug" element={<BlogPostPage />} />
                                                            <Route path="business-profile" element={
                                                                <ProtectedRoute>
                                                                    <UserBusinessDashboardPage />
                                                                </ProtectedRoute>
                                                            } />

                                                            <Route path="about" element={<AboutPage />} />
                                                            <Route path="contact" element={<ContactPage />} />
                                                            <Route path="for-business" element={<ForBusinessPage />} />
                                                            <Route path="register" element={<RegisterPage />} />

                                                            <Route path="account/business/setup" element={
                                                                <ProtectedRoute>
                                                                    <BusinessSetupPage />
                                                                </ProtectedRoute>
                                                            } />
                                                            <Route path="/partner-registration" element={<PartnerRegistrationPage />} />
                                                            <Route path="login" element={<LoginPage />} />
                                                            <Route path="reset-password" element={<ResetPasswordPage />} />
                                                        </Route>

                                                        <Route path="/admin" element={
                                                            <AdminProtectedRoute>
                                                                <AdminPage />
                                                            </AdminProtectedRoute>
                                                        } />
                                                        <Route path="/admin/login" element={<AdminLoginPage />} />
                                                        <Route path="/business/:slug" element={<BusinessDetailPage />} />
                                                        <Route path="/onboarding/:token" element={<OnboardingPage />} />
                                                        <Route path="business/:businessSlug/post/:postSlug" element={<BusinessPostPage />} />
                                                        <Route path="/connection-test" element={<ConnectionTestPage />} />

                                                        <Route path="*" element={<NotFoundPage />} />
                                                    </Routes>
                                                </Suspense>
                                            </StaffProvider>
                                        </BusinessProvider>
                                    </AdminProvider>
                                </CMSProvider>
                            </DirectoryProvider>
                        </PublicDataProvider>
                    </PublicPageContentProvider>
                </HomepageProvider>
            </ThemeProvider>
        </ErrorLoggerProvider>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <AuthProvider>
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
                        <AppContent />
                    </AuthProvider>
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
