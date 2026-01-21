

import React, { useState, useEffect } from 'react';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
import { checkAndHandleTrialExpiry } from '../lib/businessUtils.ts';
import { verifyBusinessAccess } from '../lib/roleResolution.ts';
import BusinessDashboardSidebar from '../components/BusinessDashboardSidebar.tsx';
import DashboardOverview from '../components/DashboardOverview.tsx';
import BusinessProfileEditor from '../components/BusinessProfileEditor.tsx';
import MembershipAndBilling from '../components/MembershipAndBilling.tsx';
import MediaLibrary from '../components/MediaLibrary.tsx';
import ServicesManager from '../components/ServicesManager.tsx';
import DealsManager from '../components/DealsManager.tsx';
import BlogManager from '../components/BlogManager.tsx';
import ReviewsManager from '../components/ReviewsManager.tsx';
import AnalyticsDashboard from '../components/AnalyticsDashboard.tsx';
import AccountSettings from '../components/AccountSettings.tsx';
import BookingsManager from '../components/BookingsManager.tsx';
import BusinessSupportCenter from '../components/BusinessSupportCenter.tsx';
import StaffManagement from '../components/StaffManagement.tsx';

export type ActiveTab = 'dashboard' | 'profile' | 'services' | 'billing' | 'blog' | 'gallery' | 'reviews' | 'stats' | 'settings' | 'bookings' | 'support' | 'deals' | 'staff';

import BusinessOnboardingWizard from '../components/BusinessOnboardingWizard.tsx';

// ... imports

const UserBusinessDashboardPage: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [accessError, setAccessError] = useState<string | null>(null);
    const [verifyingAccess, setVerifyingAccess] = useState(true);

    // MANDATORY: Verify business access (owner OR staff)
    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout | null = null;

        const verifyAccess = async () => {
            try {
                // Safety timeout: If verification takes more than 10 seconds, stop loading
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        setVerifyingAccess(false);
                        setAccessError('Verification timeout. Please try refreshing the page.');
                    }
                }, 10000);

                if (!user || !currentBusiness?.id) {
                    if (mounted) {
                        setVerifyingAccess(false);
                    }
                    return;
                }

                // Verify user has access to this business (owner OR staff)
                const accessResult = await verifyBusinessAccess(user.id, currentBusiness.id);

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (mounted) {
                    if (!accessResult.hasAccess) {
                        setAccessError(accessResult.error || 'You do not have access to this business dashboard. You must be the business owner or a staff member.');
                    }
                    setVerifyingAccess(false);
                }
            } catch (error) {
                // CRITICAL: Always clear loading state, even on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (mounted) {
                    console.error('Error verifying business access:', error);
                    setAccessError('Failed to verify access. Please try refreshing the page.');
                    setVerifyingAccess(false);
                }
            }
        };

        verifyAccess();

        return () => {
            mounted = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [user, currentBusiness?.id]);

    // TASK 5: Trial expiry handling - Check on dashboard access (lazy check)
    useEffect(() => {
        if (currentBusiness?.id && !accessError) {
            checkAndHandleTrialExpiry(currentBusiness.id).then((downgraded) => {
                if (downgraded) {
                    // Refresh business data to reflect downgrade
                    window.location.reload();
                }
            });
        }
    }, [currentBusiness?.id, accessError]);

    // Loading state
    if (verifyingAccess) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Access denied - BLOCK dashboard
    if (accessError) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-red-500 text-5xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{accessError}</p>
                    <p className="text-sm text-gray-500">Business access is determined from the database. You must be the business owner or a staff member.</p>
                </div>
            </div>
        );
    }

    // If logged in but no business => ONBOARDING
    if (!currentBusiness) {
        return <BusinessOnboardingWizard />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardOverview setActiveTab={setActiveTab} />;
            case 'profile':
                return <BusinessProfileEditor />;
            case 'services':
                return <ServicesManager />;
            case 'deals':
                return <DealsManager />;
            case 'bookings':
                return <BookingsManager />;
            case 'billing':
                return <MembershipAndBilling />;
            case 'gallery':
                return <MediaLibrary />;
            case 'blog':
                return <BlogManager />;
            case 'reviews':
                return <ReviewsManager />;
            case 'stats':
                return <AnalyticsDashboard />;
            case 'settings':
                return <AccountSettings />;
            case 'support':
                return <BusinessSupportCenter />;
            case 'staff':
                return <StaffManagement />;
            default:
                return <DashboardOverview setActiveTab={setActiveTab} />;
        }
    }

    return (
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4">
                <div className="mb-12 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold font-outfit text-neutral-dark mb-3">Business Dashboard</h1>
                    <p className="text-gray-500 text-lg">Hân hạnh chào đón sự trở lại của <strong className="text-gradient font-bold">{currentBusiness.name}</strong></p>
                </div>

                {!currentBusiness.isActive && (
                    <div className="p-6 glass-card border-l-4 border-primary shadow-premium mb-12 animate-fade-in-up delay-100">
                        <div className="flex items-start space-x-4">
                            <div className="bg-primary/20 p-2 rounded-full">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <div>
                                <h3 className="font-outfit font-bold text-neutral-dark text-lg">Hồ sơ doanh nghiệp đang chờ kích hoạt</h3>
                                <p className="text-gray-600 mt-1">Thông tin của bạn chưa được hiển thị công khai. Vui lòng hoàn tất hồ sơ và chọn gói thành viên để bắt đầu tiếp cận khách hàng.</p>
                                <button onClick={() => setActiveTab('billing')} className="mt-4 inline-flex items-center text-primary font-bold hover:translate-x-1 transition-transform">
                                    Nâng cấp & Kích hoạt ngay <span className="ml-2">&rarr;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    <aside className="md:col-span-3 sticky top-24 animate-fade-in-up delay-200">
                        <div className="glass-card rounded-3xl overflow-hidden p-2">
                            <BusinessDashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                        </div>
                    </aside>
                    <main className="md:col-span-9 glass-card rounded-3xl shadow-premium min-h-[700px] overflow-hidden animate-fade-in-up delay-300">
                        <div className="p-2 md:p-4">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserBusinessDashboardPage;