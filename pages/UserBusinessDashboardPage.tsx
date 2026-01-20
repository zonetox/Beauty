

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
import { useStaffPermissions } from '../hooks/useStaffPermissions.ts';

export type ActiveTab = 'dashboard' | 'profile' | 'services' | 'billing' | 'blog' | 'gallery' | 'reviews' | 'stats' | 'settings' | 'bookings' | 'support' | 'deals' | 'staff';

import BusinessOnboardingWizard from '../components/BusinessOnboardingWizard.tsx';

// ... imports

const UserBusinessDashboardPage: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { user } = useAuth();
    const staffPermissions = useStaffPermissions();
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
        <div className="bg-background py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold font-serif text-neutral-dark mb-2">Business Dashboard</h1>
                <p className="text-gray-500 mb-8">Welcome back, <strong className="text-primary">{currentBusiness.name}</strong>!</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <aside className="md:col-span-1">
                        <BusinessDashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </aside>
                    <main className="md:col-span-3 bg-white rounded-lg shadow-md min-h-[600px]">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserBusinessDashboardPage;