// C3.1 - Business Dashboard Overview (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// Không tạo hệ thống mới, không refactor kiến trúc

import React, { useMemo, useEffect, useState } from 'react';
import { useBusiness, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { membership_tier, AnalyticsDataPoint, Announcement, AppointmentStatus, OrderStatus } from '../types.ts';
import { ActiveTab } from '../pages/UserBusinessDashboardPage';
import { useAdmin } from '../contexts/AdminContext.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

interface DashboardOverviewProps {
    setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string, onClick?: () => void, className?: string }> = ({ title, value, icon, change, onClick, className = '' }) => (
    <div
        className={`glass-card p-6 rounded-2xl md:rounded-3xl flex flex-col justify-between shadow-premium transition-all duration-500 hover:-translate-y-2 group h-full ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-4">
            <div className="bg-primary/10 text-primary p-4 rounded-xl group-hover:bg-primary group-hover:text-white transition-all duration-500">{icon}</div>
            {change && (
                <span className="text-xs font-bold bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                    {change}
                </span>
            )}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-neutral-dark font-outfit">{value}</p>
        </div>
    </div>
);

const BarChart: React.FC<{ data: AnalyticsDataPoint[]; dataKey: 'pageViews'; title: string }> = ({ data, dataKey, title }) => {
    const values = data.map(d => d[dataKey]);
    const maxValue = Math.max(...values, 1); // Avoid division by zero

    if (data.length === 0) {
        return (
            <div className="glass-card p-4 rounded-3xl h-full flex items-center justify-center">
                <EmptyState
                    title="Chưa có dữ liệu phân tích"
                    message="Dữ liệu sẽ hiển thị khi khách hàng bắt đầu truy cập hồ sơ của bạn."
                />
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-3xl h-full flex flex-col shadow-premium">
            <h3 className="font-bold text-neutral-dark font-outfit mb-6 text-lg">{title}</h3>
            <div className="flex justify-around items-end h-48 space-x-4 flex-grow">
                {data.map((item) => (
                    <div key={item.date} className="flex flex-col items-center flex-1 h-full">
                        <div className="flex-grow flex items-end w-full">
                            <div
                                className="w-full bg-primary/20 rounded-t-xl hover:bg-primary/50 transition-all duration-300 relative group"
                                style={{ height: `${Math.max((item[dataKey] / maxValue) * 100, 8)}%`, minHeight: '8px' }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-dark text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {item[dataKey]}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(item.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
    const {
        currentBusiness,
        orders,
        ordersLoading,
        reviewsLoading,
        getAppointmentsForBusiness,
        getReviewsBybusiness_id
    } = useBusiness();
    const { getAnalyticsBybusiness_id } = useAnalyticsData();
    const { addNotification, getUnreadAnnouncements, markAnnouncementAsRead } = useAdmin();

    const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>(() =>
        currentBusiness ? getUnreadAnnouncements(currentBusiness.id) : []
    );

    const isLoading = !currentBusiness || ordersLoading || reviewsLoading;

    const handleDismissAnnouncement = (id: string) => {
        if (currentBusiness) {
            markAnnouncementAsRead(currentBusiness.id, id);
            setUnreadAnnouncements(prev => prev.filter(a => a.id !== id));
        }
    };

    useEffect(() => {
        if (currentBusiness && currentBusiness.membership_expiry_date) {
            const expiryDate = new Date(currentBusiness.membership_expiry_date);
            const now = new Date();
            const thirtyDaysFromNow = new Date(new Date().setDate(now.getDate() + 30));

            const notificationKey = `expiry_notification_sent_${currentBusiness.id}`;
            const hasSentNotification = localStorage.getItem(notificationKey);

            if (expiryDate < thirtyDaysFromNow && !hasSentNotification) {
                addNotification(
                    currentBusiness.email || '',
                    'Thành viên sắp hết hạn!',
                    `Chào ${currentBusiness.name},\n\nHợp đồng của bạn sẽ hết hạn vào ${expiryDate.toLocaleDateString('vi-VN')}. Hãy gia hạn để tiếp tục nhận được các ưu đãi.`
                );
                localStorage.setItem(notificationKey, 'true');
            }
        }
    }, [currentBusiness, addNotification]);

    const analytics = useMemo(() => {
        if (!currentBusiness) return null;
        return getAnalyticsBybusiness_id(currentBusiness.id);
    }, [currentBusiness, getAnalyticsBybusiness_id]);

    const businessAppointments = useMemo(() => {
        if (!currentBusiness) return [];
        return getAppointmentsForBusiness(currentBusiness.id);
    }, [currentBusiness, getAppointmentsForBusiness]);

    const businessReviews = useMemo(() => {
        if (!currentBusiness) return [];
        return getReviewsBybusiness_id(currentBusiness.id);
    }, [currentBusiness, getReviewsBybusiness_id]);

    const businessOrders = useMemo(() => {
        if (!currentBusiness) return [];
        return orders.filter(o => o.business_id === currentBusiness.id);
    }, [currentBusiness, orders]);

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
            pageViews: currentBusiness.view_count || 0,
            contactClicks,
            servicesCount,
            dealsCount,
            pendingAppointments,
            pendingOrders,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: visibleReviews.length,
        };
    }, [currentBusiness, analytics, businessAppointments, businessOrders, businessReviews]);

    const recentActivities = useMemo(() => {
        const activities: Array<{
            type: 'appointment' | 'order' | 'review';
            date: Date;
            title: string;
            description: string;
            id: string;
        }> = [];

        businessAppointments
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .forEach(apt => {
                activities.push({
                    type: 'appointment',
                    date: new Date(apt.created_at),
                    title: `Lịch hẹn mới: ${apt.customerName}`,
                    description: `${apt.serviceName} - ${apt.date}`,
                    id: apt.id,
                });
            });

        businessOrders
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
            .slice(0, 5)
            .forEach(order => {
                activities.push({
                    type: 'order',
                    date: new Date(order.submitted_at),
                    title: `Đơn hàng mới: ${order.package_name}`,
                    description: `Giá trị: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}`,
                    id: order.id,
                });
            });

        businessReviews
            .filter(r => r.status === 'Visible')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .forEach(review => {
                activities.push({
                    type: 'review',
                    date: new Date(review.created_at),
                    title: `Đánh giá mới từ ${review.user_name}`,
                    description: `${review.rating} sao - ${review.comment?.substring(0, 40) || ''}...`,
                    id: review.id,
                });
            });

        return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [businessAppointments, businessOrders, businessReviews]);

    if (isLoading) {
        return <div className="p-8"><LoadingState message="Đang tải dữ liệu..." /></div>;
    }

    if (!currentBusiness) {
        return <div className="p-8"><EmptyState title="Không tìm thấy doanh nghiệp" message="Vui lòng hoàn tất quy trình đăng ký." /></div>;
    }

    const isVip = currentbusiness.membership_tier === MembershipTier.VIP;

    const announcementTypeStyles = {
        info: 'bg-blue-50/50 border-blue-400 text-blue-700',
        success: 'bg-green-50/50 border-green-400 text-green-700',
        warning: 'bg-yellow-50/50 border-yellow-400 text-yellow-700',
    };

    return (
        <div className="p-2 md:p-6 space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold font-outfit text-neutral-dark">Tổng quan hoạt động</h2>
                    <p className="text-gray-400 text-sm mt-1">Quản lý hiệu quả kinh doanh của bạn tại đây</p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 bg-white/50 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>CẬP NHẬT THỜI GIAN THỰC</span>
                </div>
            </div>

            {/* Announcements */}
            {unreadAnnouncements.length > 0 && (
                <div className="space-y-4">
                    {unreadAnnouncements.map(ann => (
                        <div key={ann.id} className={`p-4 border-l-4 rounded-2xl glass-card transition-all hover:scale-[1.01] ${announcementTypeStyles[ann.type]}`}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="ml-3 flex-1 md:flex md:justify-between">
                                    <div>
                                        <p className="text-sm font-bold font-outfit">{ann.title}</p>
                                        <p className="text-sm mt-1">{ann.content}</p>
                                    </div>
                                    <p className="mt-3 text-sm md:mt-0 md:ml-6">
                                        <button onClick={() => handleDismissAnnouncement(ann.id)} className="whitespace-nowrap font-bold hover:underline">Đóng</button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Statistics Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    className="md:col-span-2"
                    title="Lượt xem hồ sơ"
                    value={stats.pageViews.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>}
                    change="+12%"
                    onClick={() => setActiveTab('stats')}
                />
                <StatCard
                    title="Đánh giá"
                    value={`${stats.averageRating.toFixed(1)} ⭐`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                    onClick={() => setActiveTab('reviews')}
                />
                <StatCard
                    title="Liên hệ"
                    value={stats.contactClicks.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                    onClick={() => setActiveTab('stats')}
                />

                <StatCard
                    title="Dịch vụ"
                    value={stats.servicesCount}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    onClick={() => setActiveTab('services')}
                />
                <StatCard
                    title="Ưu đãi"
                    value={stats.dealsCount}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    onClick={() => setActiveTab('deals')}
                />
                <StatCard
                    className="md:col-span-2"
                    title="Lịch hẹn mới"
                    value={stats.pendingAppointments}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    onClick={() => setActiveTab('bookings')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2">
                    {analytics && analytics.timeSeries.length > 0 ? (
                        <BarChart data={analytics.timeSeries} dataKey="pageViews" title="Thống kê truy cập (7 ngày qua)" />
                    ) : (
                        <div className="glass-card p-4 rounded-3xl h-full flex items-center justify-center">
                            <EmptyState
                                title="Chưa có dữ liệu"
                                message="Dữ liệu truy cập sẽ sớm hiển thị tại đây."
                            />
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-6 rounded-3xl space-y-4 shadow-premium h-full">
                        <h3 className="font-bold text-neutral-dark font-outfit mb-4 text-lg">Thao tác nhanh</h3>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className="w-full flex items-center justify-between bg-primary group text-white px-6 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                        >
                            <span>Chỉnh sửa Landing Page</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className="w-full flex items-center justify-between bg-white border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Nâng cấp gói thành viên</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('blog')}
                            disabled={!isVip}
                            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${isVip
                                ? 'bg-neutral-dark text-white hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <span>Thêm bài viết Blog</span>
                            {!isVip && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="glass-card p-6 rounded-3xl shadow-premium">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-neutral-dark font-outfit text-lg">Hoạt động gần đây</h3>
                    <button className="text-primary text-xs font-bold hover:underline">Xem tất cả</button>
                </div>
                {recentActivities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentActivities.map((activity) => {
                            const activityIcons = {
                                appointment: <div className="bg-blue-100 p-2 rounded-lg text-blue-500"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>,
                                order: <div className="bg-green-100 p-2 rounded-lg text-green-500"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>,
                                review: <div className="bg-yellow-100 p-2 rounded-lg text-yellow-500"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg></div>,
                            };

                            return (
                                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/40 border border-white/20 hover:bg-white/60 transition-colors">
                                    <div className="flex-shrink-0">
                                        {activityIcons[activity.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{activity.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{activity.description}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                            {activity.date.toLocaleDateString('vi-VN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="Chưa có hoạt động"
                        message="Lịch hẹn và đánh giá mới sẽ xuất hiện tại đây."
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardOverview;
