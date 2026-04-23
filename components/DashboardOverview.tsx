// C3.1 - Business Dashboard Overview (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// Không tạo hệ thống mới, không refactor kiến trúc

import React, { useMemo, useEffect, useState } from 'react';
import { useBusiness, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { Business, MembershipTier, Announcement, AnalyticsDataPoint, AppointmentStatus, OrderStatus, LandingPageConfig } from '../types.ts';
import { ActiveTab } from '../pages/BusinessDashboardPage.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import { DEMO_CONTENT } from '../src/features/templates/presets.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import toast from 'react-hot-toast';

interface DashboardOverviewProps {
    setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
}

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string, onClick?: () => void, className?: string }> = ({ title, value, icon, change, onClick, className = '' }) => (
    <div
        className={`glass-card p-10 rounded-[2rem] flex flex-col justify-between shadow-premium transition-all duration-700 hover:-translate-y-3 group h-full border border-white/40 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-8">
            <div className="bg-primary/5 text-primary p-5 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">{icon}</div>
            {change && (
                <span className="text-[10px] font-bold tracking-widest bg-accent/5 text-accent border border-accent/10 px-3 py-1.5 rounded-full uppercase">
                    {change}
                </span>
            )}
        </div>
        <div>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">{title}</p>
            <p className="text-5xl font-serif text-primary tracking-tight">{value}</p>
        </div>
    </div>
);

const BarChart: React.FC<{ data: AnalyticsDataPoint[]; dataKey: 'page_views'; title: string }> = ({ data, dataKey, title }) => {
    const values = data.map(d => d[dataKey]);
    const maxValue = Math.max(...values, 1);

    if (data.length === 0) {
        return (
            <div className="glass-card p-12 rounded-[2rem] h-full flex items-center justify-center border border-white/40">
                <EmptyState
                    title="Dữ liệu đang được tinh tuyển"
                    message="Thống kê truy cập sẽ hiển thị khi khách hàng bắt đầu trải nghiệm hồ sơ của quý khách."
                />
            </div>
        );
    }

    return (
        <div className="glass-card p-10 rounded-[2rem] h-full flex flex-col shadow-premium border border-white/40">
            <h3 className="font-serif text-2xl text-primary mb-10 tracking-wide">{title}</h3>
            <div className="flex justify-around items-end h-60 space-x-6 flex-grow">
                {data.map((item) => (
                    <div key={item.date} className="flex flex-col items-center flex-1 h-full">
                        <div className="flex-grow flex items-end w-full">
                            <div
                                className="w-full bg-primary/10 rounded-full hover:bg-primary/30 transition-all duration-500 relative group"
                                style={{ height: `${Math.max((item[dataKey] / maxValue) * 100, 10)}%`, minHeight: '12px' }}
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold py-2 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl tracking-widest">
                                    {item[dataKey]}
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-4 font-bold tracking-widest uppercase">{new Date(item.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}</p>
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
    const { user } = useAuth();
    const { addBusiness } = useBusinessData();

    const [unreadAnnouncements, setUnreadAnnouncements] = useState<Announcement[]>(() =>
        currentBusiness ? getUnreadAnnouncements(currentBusiness.id) : []
    );

    const isLoading = (currentBusiness && (ordersLoading || reviewsLoading)) || false;

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
                page_views: 0,
                contact_clicks: 0,
                searchAppearances: 0,
                servicesCount: 0,
                dealsCount: 0,
                pendingAppointments: 0,
                pendingOrders: 0,
                averageRating: 0,
                totalReviews: 0,
            };
        }

        const contact_clicks = analytics?.time_series.reduce((sum, item) => sum + item.call_clicks + item.contact_clicks + item.direction_clicks, 0) || 0;

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
            page_views: currentBusiness.view_count || 0,
            contact_clicks,
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
                    title: `Lịch hẹn mới: ${apt.customer_name}`,
                    description: `${apt.service_name} - ${apt.date}`,
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
            .sort((a, b) => new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime())
            .slice(0, 5)
            .forEach(review => {
                activities.push({
                    type: 'review',
                    date: new Date(review.submitted_date),
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


    const handleCreateDemo = async (presetId: string) => {
        const demo = DEMO_CONTENT[presetId];
        if (!demo || !user) return;

        const loadingToast = toast.loading(`Đang khởi tạo mẫu ${demo.name}...`);

        try {
            const slug = `${demo.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 7)}`;

            const defaultLandingConfig: LandingPageConfig = {
                sections: {
                    hero: { enabled: true, order: 1 },
                    trust: { enabled: true, order: 2 },
                    services: { enabled: true, order: 3 },
                    gallery: { enabled: true, order: 4 },
                    team: { enabled: true, order: 5 },
                    reviews: { enabled: true, order: 6 },
                    products: { enabled: true, order: 7 },
                    cta: { enabled: true, order: 8 },
                    contact: { enabled: true, order: 9 },
                }
            };

            const demoData = {
                ...demo,
                slug,
                owner_id: user.id,
                is_active: true,
                is_verified: false,
                membership_tier: MembershipTier.FREE,
                landing_page_config: defaultLandingConfig,
                template_id: presetId,
                joined_date: new Date().toISOString(),
                notification_settings: {
                    review_alerts: true,
                    booking_requests: true,
                    platform_news: true
                }
            } as Business;

            const newBusiness = await addBusiness(demoData);

            if (newBusiness && user.id) {
                await supabase.from('profiles').update({ business_id: newBusiness.id }).eq('id', user.id);
                toast.success(`Đã tạo hồ sơ bản nháp cho ${demo.name}!`, { id: loadingToast });
                // Trigger reload to update BusinessContext
                window.location.reload();
            }
        } catch (error) {
            console.error('Demo creation error:', error);
            toast.error('Khởi tạo mẫu thất bại. Vui lòng thử lại.', { id: loadingToast });
        }
    };

    // If no business profile yet, show welcome screen
    if (!currentBusiness) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-12 animate-fade-in-up">
                <div className="bg-primary/5 p-8 rounded-full border border-primary/10 shadow-inner">
                    <svg className="w-16 h-16 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>

                <div className="max-w-2xl">
                    <h2 className="text-4xl font-serif text-primary tracking-wide mb-6">Bắt đầu hành trình của bạn</h2>
                    <p className="text-neutral-500 font-light text-lg mb-10 leading-relaxed italic">
                        "Tiết kiệm thời gian nhập liệu bằng cách chọn một bản nháp chuẩn.
                        Chúng tôi sẽ điền sẵn hình ảnh và nội dung demo cho bạn."
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-4">
                    {[
                        { id: 'luna-spa', name: 'Mẫu Luna Spa', emoji: '🌿', color: '#6B8C6B', style: 'Thiên Nhiên' },
                        { id: 'pink-nail', name: 'Mẫu Nailora', emoji: '💅', color: '#D4748C', style: 'Tinh Tế' },
                        { id: 'golden-ratio', name: 'Golden Ratio', emoji: '📐', color: '#B2A59B', style: 'Tỷ Lệ Vàng' },
                        { id: 'luxury-hair', name: 'Luxury Hair', emoji: '💇‍♀️', color: '#8D4949', style: 'Salon Tóc' },
                        { id: 'q-clinic', name: 'Q Clinic', emoji: '🏥', color: '#B01B4D', style: 'Phòng Khám' }
                    ].map((option) => (
                        <div key={option.id}
                            className="group relative bg-white border border-gray-100 p-6 rounded-[2rem] shadow-premium hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-t-4"
                            style={{ borderTopColor: option.color }}
                            onClick={() => handleCreateDemo(option.id)}>
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{option.emoji}</div>
                            <h3 className="text-lg font-serif text-gray-800 mb-1">{option.name}</h3>
                            <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-widest leading-none">{option.style}</p>
                            <button className="w-full py-2 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full group-hover:bg-primary group-hover:text-white transition-colors"
                                style={{ '--hover-bg': option.color } as any}>
                                Khởi tạo nhanh →
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 pt-8">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Hoặc bạn muốn tự mình nhập liệu?</p>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className="text-primary text-xs font-bold uppercase tracking-[0.2em] hover:underline transition-all"
                    >
                        Tự thiết lập từ đầu →
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif text-primary tracking-wide">Tổng quan hoạt động</h2>
                    <p className="text-neutral-400 text-sm font-light italic mt-2">Quản lý hành trình kiến tạo vẻ đẹp của quý khách</p>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-bold text-neutral-400 bg-white/40 px-6 py-3 rounded-full border border-white/50 backdrop-blur-md shadow-premium uppercase tracking-[0.2em]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                    <span>Dữ liệu thời gian thực</span>
                </div>
            </div>

            {/* Announcements */}
            {unreadAnnouncements.length > 0 && (
                <div className="space-y-6">
                    {unreadAnnouncements.map(ann => (
                        <div key={ann.id} className={`p-6 border-l-4 rounded-[1.5rem] glass-card border-accent/30 shadow-premium transition-all hover:scale-[1.01]`}>
                            <div className="flex items-start">
                                <div className="bg-accent/10 p-3 rounded-full text-accent shadow-inner mt-1">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="ml-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-serif text-primary tracking-wide">{ann.title}</p>
                                        <p className="text-neutral-500 font-light italic text-sm mt-1">{ann.content}</p>
                                    </div>
                                    <button onClick={() => handleDismissAnnouncement(ann.id)} className="text-[10px] font-bold border border-neutral-200 px-4 py-2 rounded-full hover:bg-neutral-50 transition-colors uppercase tracking-[0.1em]">Đã hiểu</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Statistics Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard
                    title="Lượt xem trang"
                    value={stats.page_views.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>}
                    onClick={() => setActiveTab('stats')}
                />
                <StatCard
                    title="Lượt đặt chỗ"
                    value={businessAppointments.length.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    onClick={() => setActiveTab('bookings')}
                />
                <StatCard
                    title="Đánh giá"
                    value={`${stats.averageRating.toFixed(1)} ⭐`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                    onClick={() => setActiveTab('reviews')}
                />
                <StatCard
                    title="Lượt liên hệ"
                    value={stats.contact_clicks.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                    onClick={() => setActiveTab('stats')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Analytics Chart */}
                <div className="lg:col-span-2">
                    {analytics && analytics.time_series.length > 0 ? (
                        <BarChart data={analytics.time_series} dataKey="page_views" title="Thống kê truy cập (7 ngày qua)" />
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
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Chỉnh sửa Landing Page</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Quản lý Dịch vụ</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('deals')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Tạo Ưu đãi/Deal</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Quản lý Đánh giá</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.24 3.822a1 1 0 00.95.69h4.032c.969 0 1.371 1.24.588 1.81l-3.262 2.37a1 1 0 00-.363 1.118l1.24 3.822c.3.921-.755 1.688-1.54 1.118l-3.262-2.37a1 1 0 00-1.175 0l-3.262 2.37c-.784.57-1.838-.197-1.539-1.118l1.24-3.822a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.031a1 1 0 00.951-.69l1.24-3.822z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('gallery')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Quản lý Bộ sưu tập</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Gói hội viên</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="w-full flex items-center justify-between border border-primary/20 text-primary px-6 py-4 rounded-2xl font-bold transition-all hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <span>Cài đặt tài khoản</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
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
