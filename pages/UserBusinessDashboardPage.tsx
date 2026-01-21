

import React, { useState, useEffect } from 'react';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { checkAndHandleTrialExpiry } from '../lib/businessUtils.ts';
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
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

    // Trial expiry handling - Check on dashboard access (lazy check)
    useEffect(() => {
        if (currentBusiness?.id) {
            checkAndHandleTrialExpiry(currentBusiness.id).then((downgraded) => {
                if (downgraded) {
                    // Refresh business data to reflect downgrade
                    window.location.reload();
                }
            });
        }
    }, [currentBusiness?.id]);

    // If logged in but no business => ONBOARDING
    // This is handled by currentBusiness state from BusinessContext

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