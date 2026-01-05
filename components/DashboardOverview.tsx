// C3.1 - Business Dashboard Overview (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// Không tạo hệ thống mới, không refactor kiến trúc

import React, { useMemo, useEffect, useState } from 'react';
import { useBusinessAuth, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { MembershipTier, AnalyticsDataPoint, Announcement, AppointmentStatus, OrderStatus } from '../types.ts';
import { ActiveTab } from '../pages/UserBusinessDashboardPage';
import { useAdmin } from '../contexts/AdminContext.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

interface DashboardOverviewProps {
    setActiveTab: (tab: ActiveTab) => void;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string, onClick?: () => void }> = ({ title, value, icon, change, onClick }) => (
    <div 
        className={`bg-gray-50 p-4 rounded-lg flex items-center border ${onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
        onClick={onClick}
    >
        <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
        <div className="ml-4 flex-1">
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-neutral-dark">{value}</p>
            {change && <p className="text-xs text-green-600">{change} vs last month</p>}
        </div>
    </div>
);

const BarChart: React.FC<{ data: AnalyticsDataPoint[]; dataKey: 'pageViews'; title: string }> = ({ data, dataKey, title }) => {
    const values = data.map(d => d[dataKey]);
    const maxValue = Math.max(...values, 1); // Avoid division by zero

    if (data.length === 0) {
        return (
            <div className="bg-gray-50 p-4 rounded-lg border h-full flex items-center justify-center">
                <EmptyState 
                    title="No Analytics Data"
                    message="Analytics data will appear here once your business starts receiving views."
                />
            </div>
        );
    }

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
    const { 
        currentBusiness, 
        appointments, 
        orders, 
        ordersLoading, 
        reviews, 
        reviewsLoading,
        getAppointmentsForBusiness,
        getReviewsByBusinessId 
    } = useBusinessAuth();
    const { getAnalyticsByBusinessId } = useAnalyticsData();
    const { addNotification, getUnreadAnnouncements, markAnnouncementAsRead } = useAdmin();

    const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>([]);

    // Loading state: Check if data is still loading
    const isLoading = !currentBusiness || ordersLoading || reviewsLoading;

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

    // Business-specific data
    const businessAppointments = useMemo(() => {
        if (!currentBusiness) return [];
        return getAppointmentsForBusiness(currentBusiness.id);
    }, [currentBusiness, appointments, getAppointmentsForBusiness]);

    const businessReviews = useMemo(() => {
        if (!currentBusiness) return [];
        return getReviewsByBusinessId(currentBusiness.id);
    }, [currentBusiness, reviews, getReviewsByBusinessId]);

    const businessOrders = useMemo(() => {
        if (!currentBusiness) return [];
        return orders.filter(o => o.businessId === currentBusiness.id);
    }, [currentBusiness, orders]);

    // Statistics calculation
    const stats = useMemo(() => {
        if (!currentBusiness) {
            return {
                pageViews: 0,
                contactClicks: 0,
                searchAppearances: 0,
                servicesCount: 0,
                dealsCount: 0,
                pendingAppointments: 0,
                pendingOrders: 0,
                averageRating: 0,
                totalReviews: 0,
            };
        }

        const contactClicks = analytics?.timeSeries.reduce((sum, item) => sum + item.callClicks + item.contactClicks + item.directionClicks, 0) || 0;
        const searchAppearances = Math.floor(currentBusiness.viewCount * 4.5);
        
        const servicesCount = currentBusiness.services?.length || 0;
        const dealsCount = currentBusiness.deals?.length || 0;
        
        const pendingAppointments = businessAppointments.filter(
            apt => apt.status === AppointmentStatus.PENDING
        ).length;
        
        const pendingOrders = businessOrders.filter(
            order => order.status === OrderStatus.PENDING || order.status === OrderStatus.AWAITING_CONFIRMATION
        ).length;

        const visibleReviews = businessReviews.filter(r => r.status === 'Visible');
        const averageRating = visibleReviews.length > 0
            ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
            : currentBusiness.rating || 0;

        return {
            pageViews: currentBusiness.viewCount || 0,
            contactClicks,
            searchAppearances,
            servicesCount,
            dealsCount,
            pendingAppointments,
            pendingOrders,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: visibleReviews.length,
        };
    }, [currentBusiness, analytics, businessAppointments, businessOrders, businessReviews]);

    // Recent activities (last 5 of each type)
    const recentActivities = useMemo(() => {
        const activities: Array<{
            type: 'appointment' | 'order' | 'review';
            date: Date;
            title: string;
            description: string;
            id: string;
        }> = [];

        // Recent appointments
        businessAppointments
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .forEach(apt => {
                activities.push({
                    type: 'appointment',
                    date: new Date(apt.createdAt),
                    title: `New appointment: ${apt.customerName}`,
                    description: `${apt.serviceName} - ${apt.date} at ${apt.timeSlot}`,
                    id: apt.id,
                });
            });

        // Recent orders
        businessOrders
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 5)
            .forEach(order => {
                activities.push({
                    type: 'order',
                    date: new Date(order.submittedAt),
                    title: `New order: ${order.packageName}`,
                    description: `Amount: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}`,
                    id: order.id,
                });
            });

        // Recent reviews
        businessReviews
            .filter(r => r.status === 'Visible')
            .sort((a, b) => new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime())
            .slice(0, 5)
            .forEach(review => {
                activities.push({
                    type: 'review',
                    date: new Date(review.submitted_date),
                    title: `New review from ${review.user_name}`,
                    description: `${review.rating} stars - ${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}`,
                    id: review.id,
                });
            });

        return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [businessAppointments, businessOrders, businessReviews]);

    // Loading state
    if (isLoading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading dashboard data..." />
            </div>
        );
    }

    // No business state (should not happen due to onboarding wizard, but safety check)
    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState 
                    title="No Business Found"
                    message="Please complete the onboarding process to access your dashboard."
                />
            </div>
        );
    }

    const isVip = currentBusiness.membershipTier === MembershipTier.VIP;
    
    const announcementTypeStyles = {
        info: 'bg-blue-50 border-blue-400 text-blue-700',
        success: 'bg-green-50 border-green-400 text-green-700',
        warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Dashboard Overview</h2>
            
            {/* Announcements */}
            {unreadAnnouncements.length > 0 && (
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
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Page Views" 
                    value={stats.pageViews.toLocaleString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>} 
                    onClick={() => setActiveTab('stats')}
                />
                <StatCard 
                    title="Contact Clicks" 
                    value={stats.contactClicks.toLocaleString()} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} 
                    onClick={() => setActiveTab('stats')}
                />
                <StatCard 
                    title="Average Rating" 
                    value={`${stats.averageRating.toFixed(1)} ⭐`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} 
                    onClick={() => setActiveTab('reviews')}
                />
                <StatCard 
                    title="Total Reviews" 
                    value={stats.totalReviews} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>} 
                    onClick={() => setActiveTab('reviews')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Services" 
                    value={stats.servicesCount} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} 
                    onClick={() => setActiveTab('services')}
                />
                <StatCard 
                    title="Active Deals" 
                    value={stats.dealsCount} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    onClick={() => setActiveTab('deals')}
                />
                <StatCard 
                    title="Pending Appointments" 
                    value={stats.pendingAppointments} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
                    onClick={() => setActiveTab('bookings')}
                />
                <StatCard 
                    title="Pending Orders" 
                    value={stats.pendingOrders} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} 
                    onClick={() => setActiveTab('billing')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2">
                    {analytics && analytics.timeSeries.length > 0 ? (
                        <BarChart data={analytics.timeSeries} dataKey="pageViews" title="Landing Page Views (Last 7 Days)" />
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border h-full">
                            <EmptyState 
                                title="No Analytics Data"
                                message="Analytics data will appear here once your business starts receiving views."
                            />
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                        <h3 className="font-semibold text-neutral-dark mb-4">Quick Actions</h3>
                        <button 
                            onClick={() => setActiveTab('profile')} 
                            className="w-full text-center bg-secondary text-white px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
                        >
                            Edit Landing Page
                        </button>
                        <button 
                            onClick={() => setActiveTab('billing')} 
                            className="w-full bg-primary text-white px-4 py-3 rounded-md font-semibold hover:bg-primary-dark transition-opacity"
                        >
                            Renew/Upgrade Package
                        </button>
                        <button 
                            onClick={() => setActiveTab('blog')} 
                            disabled={!isVip} 
                            className={`w-full px-4 py-3 rounded-md font-semibold transition-opacity ${
                                isVip 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={isVip ? '' : 'Available for VIP members only'}
                        >
                            Add New Blog Post
                        </button>
                        <button 
                            onClick={() => setActiveTab('services')} 
                            className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-md font-semibold hover:bg-gray-300 transition-opacity"
                        >
                            Manage Services
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="font-semibold text-neutral-dark mb-4">Recent Activities</h3>
                {recentActivities.length > 0 ? (
                    <div className="space-y-3">
                        {recentActivities.map((activity) => {
                            const activityIcons = {
                                appointment: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                                order: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
                                review: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
                            };

                            return (
                                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                                    <div className="flex-shrink-0 mt-1">
                                        {activityIcons[activity.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                        <p className="text-sm text-gray-500">{activity.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {activity.date.toLocaleDateString('vi-VN', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState 
                        title="No Recent Activities"
                        message="Recent appointments, orders, and reviews will appear here."
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardOverview;
