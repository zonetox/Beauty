

import React, { useState } from 'react';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
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

export type ActiveTab = 'dashboard' | 'profile' | 'services' | 'billing' | 'blog' | 'gallery' | 'reviews' | 'stats' | 'settings' | 'bookings' | 'support' | 'deals';

const UserBusinessDashboardPage: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

    if (!currentBusiness) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold">Loading business data...</h1>
                <p className="text-gray-600 mt-2">If you are a business owner, please log in.</p>
            </div>
        );
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