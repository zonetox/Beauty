
import React, { useMemo, useEffect, useState } from 'react';
import { useBusinessAuth, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { MembershipTier, AnalyticsDataPoint, Announcement } from '../types.ts';
import { ActiveTab } from '../pages/UserBusinessDashboardPage';
import { useAdmin } from '../contexts/AdminContext.tsx';

interface DashboardOverviewProps {
    setActiveTab: (tab: ActiveTab) => void;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string }> = ({ title, value, icon, change }) => (
    <div className="bg-gray-50 p-4 rounded-lg flex items-center border">
        <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
        <div className="ml-4">
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-neutral-dark">{value}</p>
            {change && <p className="text-xs text-green-600">{change} vs last month</p>}
        </div>
    </div>
);

const BarChart: React.FC<{ data: AnalyticsDataPoint[]; dataKey: 'pageViews'; title: string }> = ({ data, dataKey, title }) => {
    const values = data.map(d => d[dataKey]);
    const maxValue = Math.max(...values, 1); // Avoid division by zero

    return (
        <div className="bg-gray-50 p-4 rounded-lg border h-full flex flex-col">
            <h3 className="font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="flex justify-around items-end h-48 space-x-2 flex-grow">
                {data.map((item) => (
                    <div key={item.date} className="flex flex-col items-center flex-1 h-full">
                         <div className="flex-grow flex items-end w-full">
                           <div
                                className="w-full bg-primary/20 rounded-t-md hover:bg-primary/40 transition-colors"
                                style={{ height: `${(item[dataKey] / maxValue) * 100}%` }}
                                title={`${item[dataKey]} views`}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric' })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
    const { currentBusiness } = useBusinessAuth();
    const { getAnalyticsByBusinessId } = useAnalyticsData();
    const { addNotification, getUnreadAnnouncements, markAnnouncementAsRead } = useAdmin();

    const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        if(currentBusiness) {
            setUnreadAnnouncements(getUnreadAnnouncements(currentBusiness.id));
        }
    }, [currentBusiness, getUnreadAnnouncements]);

    const handleDismissAnnouncement = (id: string) => {
        if(currentBusiness) {
            markAnnouncementAsRead(currentBusiness.id, id);
            setUnreadAnnouncements(prev => prev.filter(a => a.id !== id));
        }
    };

    useEffect(() => {
        if (currentBusiness && currentBusiness.membershipExpiryDate) {
            const expiryDate = new Date(currentBusiness.membershipExpiryDate);
            const now = new Date();
            const thirtyDaysFromNow = new Date(new Date().setDate(now.getDate() + 30));
            
            const notificationKey = `expiry_notification_sent_${currentBusiness.id}`;
            const hasSentNotification = localStorage.getItem(notificationKey);

            if (expiryDate < thirtyDaysFromNow && !hasSentNotification) {
                addNotification(
                    currentBusiness.email || '',
                    'Your Membership is Expiring Soon!',
                    `Hello ${currentBusiness.name},\n\nThis is a friendly reminder that your ${currentBusiness.membershipTier} membership plan will expire on ${expiryDate.toLocaleDateString('vi-VN')}. Please renew your plan to continue enjoying the benefits.\n\nBest regards,\nThe BeautyDir Team`
                );
                localStorage.setItem(notificationKey, 'true');
            }
        }
    }, [currentBusiness, addNotification]);


    const analytics = useMemo(() => {
        if (!currentBusiness) return null;
        return getAnalyticsByBusinessId(currentBusiness.id);
    }, [currentBusiness, getAnalyticsByBusinessId]);


    const stats = useMemo(() => {
        if (!currentBusiness || !analytics) return { pageViews: 0, contactClicks: 0, searchAppearances: 0 };
        
        const contactClicks = analytics.timeSeries.reduce((sum, item) => sum + item.callClicks + item.contactClicks + item.directionClicks, 0);
        const searchAppearances = Math.floor(currentBusiness.viewCount * 4.5);

        return {
            pageViews: currentBusiness.viewCount,
            contactClicks,
            searchAppearances,
        };
    }, [currentBusiness, analytics]);

    if (!currentBusiness) return null;

    const isVip = currentBusiness.membershipTier === MembershipTier.VIP;
    
    const announcementTypeStyles = {
        info: 'bg-blue-50 border-blue-400 text-blue-700',
        success: 'bg-green-50 border-green-400 text-green-700',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Dashboard Overview</h2>
            
            <div className="space-y-4 mb-8">
                {unreadAnnouncements.map(ann => (
                    <div key={ann.id} className={`p-4 border-l-4 rounded-r-lg ${announcementTypeStyles[ann.type]}`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="ml-3 flex-1 md:flex md:justify-between">
                                <div>
                                    <p className="text-sm font-bold">{ann.title}</p>
                                    <p className="text-sm mt-1">{ann.content}</p>
                                </div>
                                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                    <button onClick={() => handleDismissAnnouncement(ann.id)} className="whitespace-nowrap font-medium">Dismiss</button>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Page Views" value={stats.pageViews.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>} change="+15%" />
                <StatCard title="Search Appearances" value={stats.searchAppearances.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} change="+8%" />
                <StatCard title="Contact Clicks" value={stats.contactClicks.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} change="+22%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {analytics ? (
                        <BarChart data={analytics.timeSeries} dataKey="pageViews" title="Landing Page Views (Last 7 Days)" />
                    ) : (
                         <div className="bg-gray-50 p-4 rounded-lg border h-full flex items-center justify-center">
                            <p className="text-gray-500">Analytics data is not available.</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                        <h3 className="font-semibold text-neutral-dark">Quick Actions</h3>
                        <button onClick={() => setActiveTab('profile')} className="w-full text-center bg-secondary text-white px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity">
                            Edit Landing Page
                        </button>
                        <button onClick={() => setActiveTab('billing')} className="w-full bg-primary text-white px-4 py-3 rounded-md font-semibold hover:bg-primary-dark transition-opacity">
                            Renew/Upgrade Package
                        </button>
                        <button onClick={() => setActiveTab('blog')} disabled={!isVip} title={isVip ? '' : 'Available for VIP members'}>
                            Add New Blog Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
