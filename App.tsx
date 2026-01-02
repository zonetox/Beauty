

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import Breadcrumbs from './components/Breadcrumbs.tsx';
import Chatbot from './components/Chatbot.tsx';
import BackToTopButton from './components/BackToTopButton.tsx';

// Import new consolidated providers
import { UserSessionProvider, useUserSession } from './contexts/UserSessionContext.tsx';
import { AdminProvider } from './contexts/AdminContext.tsx';
import { PublicDataProvider } from './contexts/BusinessDataContext.tsx';
import { HomepageDataProvider } from './contexts/HomepageDataContext.tsx';
import { BusinessProvider } from './contexts/BusinessContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { BusinessDashboardProvider } from './contexts/BusinessBlogDataContext.tsx';
import { AdminPlatformProvider } from './contexts/AdminPlatformContext.tsx';

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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.tsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'));

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
    const { profile, loading: profileLoading } = useUserSession();

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <p className="text-lg font-semibold">Loading your dashboard...</p>
                    <p className="text-gray-500">Please wait.</p>
                </div>
            </div>
        );
    }

    // If a user has a business, route to the business dashboard. This is the only valid path for a logged-in user.
    if (profile?.businessId) {
        return <UserBusinessDashboardPage />;
    }

    // If a profile exists but is not linked to a business, or if the profile failed to load, show an error.
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
                <p className="text-lg font-semibold text-red-600">Account Error</p>
                <p className="text-gray-500">Could not load your business profile or your account is not linked to a business.</p>
                <p className="text-gray-500">Please contact support for assistance.</p>
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
        <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <ThemeProvider>
                <UserSessionProvider>
                    <AdminProvider>
                        <PublicDataProvider>
                            <HomepageDataProvider>
                                <BusinessProvider>
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

                                            {/* Catch-all route must be at the top level */}
                                            <Route path="*" element={<NotFoundPage />} />
                                        </Routes>
                                    </Suspense>
                                </BusinessProvider>
                            </HomepageDataProvider>
                        </PublicDataProvider>
                    </AdminProvider>
                </UserSessionProvider>
            </ThemeProvider>
        </Router>
    );
};

export default App;