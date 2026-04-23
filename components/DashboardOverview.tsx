// C3.1 - Business Dashboard Overview (Consolidated Mode)
import React, { useMemo, useEffect, useState } from 'react';
import { useBusiness, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { ActiveTab } from '../pages/BusinessDashboardPage.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import LoadingState from './LoadingState.tsx';
import toast from 'react-hot-toast';

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

const DashboardOverview: React.FC<{ setActiveTab: (tab: ActiveTab) => void }> = ({ setActiveTab }) => {
    const {
        currentBusiness,
        ordersLoading,
        reviewsLoading,
        getAppointmentsForBusiness,
        getReviewsBybusiness_id
    } = useBusiness();
    const { getAnalyticsBybusiness_id } = useAnalyticsData();
    const { getUnreadAnnouncements } = useAdmin();
    const { user, profile, refreshAuth } = useAuth();

    const [isInitializing, setIsInitializing] = useState(false);
    useEffect(() => {
        if (currentBusiness) {
            // Announcements logic removed for now to keep overview clean
        }
    }, [currentBusiness, getUnreadAnnouncements]);

    const handleInitializeBusiness = async () => {
        if (!user || isInitializing) return;
        setIsInitializing(true);
        const loadingToast = toast.loading('Đang khởi tạo hồ sơ doanh nghiệp...');

        try {
            const businessName = profile?.full_name || 'Doanh nghiệp mới';
            const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;

            const { data: business, error: bError } = await supabase
                .from('businesses')
                .insert({
                    name: businessName,
                    slug,
                    owner_id: user.id,
                    is_active: true,
                    is_verified: false,
                    address: 'Chưa cập nhập',
                    city: 'TP. Hồ Chí Minh',
                    district: 'Quận 1',
                    ward: 'Phường Bến Thành',
                    phone: 'Chưa cập nhật',
                    description: 'Vui lòng cập nhật thông tin doanh nghiệp',
                    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
                    categories: ['Spa & Massage'],
                    working_hours: {
                        monday: { open: "09:00", close: "18:00" },
                        tuesday: { open: "09:00", close: "18:00" },
                        wednesday: { open: "09:00", close: "18:00" },
                        thursday: { open: "09:00", close: "18:00" },
                        friday: { open: "09:00", close: "18:00" },
                        saturday: { open: "09:00", close: "18:00" },
                        sunday: { open: "Closed", close: "Closed" }
                    }
                })
                .select()
                .single();

            if (bError) throw bError;

            await supabase.from('profiles').update({ business_id: business.id }).eq('id', user.id);
            toast.success('Khởi tạo thành công!', { id: loadingToast });
            await refreshAuth();
            window.location.reload();
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message, { id: loadingToast });
        } finally {
            setIsInitializing(false);
        }
    };

    const stats = useMemo(() => {
        if (!currentBusiness) {
            return {
                page_views: 0,
                appointments: 0,
                rating: 0,
                contacts: 0
            };
        }

        const analytics = getAnalyticsBybusiness_id(currentBusiness.id);
        const appointments = getAppointmentsForBusiness(currentBusiness.id);
        const reviews = getReviewsBybusiness_id(currentBusiness.id).filter(r => r.status === 'Visible');
        const contacts = analytics?.time_series.reduce((sum, item) => sum + item.call_clicks + item.contact_clicks + item.direction_clicks, 0) || 0;

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : currentBusiness.rating || 0;

        return {
            page_views: currentBusiness.view_count || 0,
            appointments: appointments.length,
            rating: Math.round(avgRating * 10) / 10,
            contacts
        };
    }, [currentBusiness, getAnalyticsBybusiness_id, getAppointmentsForBusiness, getReviewsBybusiness_id]);

    if (ordersLoading || reviewsLoading) return <LoadingState />;

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-serif text-primary tracking-wide">Tổng quan hoạt động</h2>
                    <p className="text-neutral-400 text-sm font-light italic mt-2">Quản lý hiệu quả kinh doanh của quý khách</p>
                </div>
            </div>

            {/* Self-Healing Banner for business users without a business record */}
            {!currentBusiness && profile?.user_type === 'business' && (
                <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium animate-pulse-subtle">
                    <div className="flex items-center gap-6">
                        <div className="bg-primary text-white p-4 rounded-2xl shadow-lg">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-serif text-primary">Tài khoản của bạn chưa có hồ sơ doanh nghiệp</h3>
                            <p className="text-sm text-neutral-500 mt-1">Vui lòng khởi tạo hồ sơ để bắt đầu quản lý Landing Page và Dịch vụ.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleInitializeBusiness}
                        disabled={isInitializing}
                        className="bg-primary text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isInitializing ? 'Đang xử lý...' : 'Khởi tạo hồ sơ ngay'}
                    </button>
                </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Lượt xem trang"
                    value={stats.page_views.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>}
                />
                <StatCard
                    title="Lượt đặt chỗ"
                    value={stats.appointments.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatCard
                    title="Đánh giá"
                    value={`${stats.rating.toFixed(1)} ⭐`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                />
                <StatCard
                    title="Liên hệ"
                    value={stats.contacts.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                />
            </div>

            {/* Quick Actions Integration */}
            <div className="glass-card p-10 rounded-[2.5rem] shadow-premium">
                <h3 className="text-2xl font-serif text-primary mb-8">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Landing Page', tab: 'landing', icon: '🎨' },
                        { label: 'Dịch vụ', tab: 'services', icon: '💆‍♀️' },
                        { label: 'Ưu đãi', tab: 'deals', icon: '🎁' },
                        { label: 'Tài khoản', tab: 'settings', icon: '🏢' }
                    ].map(btn => (
                        <button
                            key={btn.tab}
                            onClick={() => setActiveTab(btn.tab as any)}
                            className="flex flex-col items-center gap-4 p-6 bg-gray-50/50 rounded-3xl hover:bg-primary/5 hover:scale-105 transition-all border border-gray-100 group"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">{btn.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-primary">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Hint for empty state */}
            {!currentBusiness && (
                <div className="text-center pb-12">
                    <p className="text-xs text-neutral-400 font-light italic">Vui lòng khởi tạo hồ sơ để dữ liệu thực tế bắt đầu được ghi nhận.</p>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
