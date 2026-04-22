import React, { useState, useEffect } from 'react';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
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
import { useNavigate } from 'react-router-dom';

export type ActiveTab = 'dashboard' | 'profile' | 'services' | 'billing' | 'blog' | 'gallery' | 'reviews' | 'stats' | 'settings' | 'bookings' | 'support' | 'deals';

const BusinessDashboardPage: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

    useEffect(() => {
        if (currentBusiness?.id) {
            checkAndHandleTrialExpiry(currentBusiness.id).then((downgraded) => {
                if (downgraded) {
                    window.location.reload();
                }
            });
        }
    }, [currentBusiness?.id]);

    const { isDataLoaded, role } = useAuth();
    const isBusiness = role === 'business';

    useEffect(() => {
        if (!isDataLoaded) return;
        if (!isBusiness) {
            navigate('/login', { replace: true });
            return;
        }
    }, [isBusiness, isDataLoaded, navigate]);

    if (!isDataLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-6 text-lg font-serif italic text-primary">Đang chuẩn bị không gian làm việc...</p>
            </div>
        );
    }

    // Non-blocking skeleton or simplified loading state if business record is still arriving
    const renderDashboardContent = () => {
        if (!currentBusiness) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-6 text-lg font-serif italic text-primary">Đang khởi tạo không gian làm việc...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'dashboard': return <DashboardOverview setActiveTab={setActiveTab} />;
            case 'profile': return <BusinessProfileEditor />;
            case 'services': return <ServicesManager />;
            case 'deals': return <DealsManager />;
            case 'bookings': return <BookingsManager />;
            case 'billing': return <MembershipAndBilling />;
            case 'gallery': return <MediaLibrary />;
            case 'blog': return <BlogManager />;
            case 'reviews': return <ReviewsManager />;
            case 'stats': return <AnalyticsDashboard />;
            case 'settings': return <AccountSettings />;
            case 'support': return <BusinessSupportCenter />;
            default: return <DashboardOverview setActiveTab={setActiveTab} />;
        }
    }

    return (
        <div className="bg-background min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="mb-20 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-6xl md:text-7xl font-serif text-primary tracking-tight mb-4">Bảng điều khiển</h1>
                        <p className="text-neutral-500 font-light italic text-xl">
                            Hân hạnh chào mừng <strong className="text-accent font-bold">{currentBusiness?.name || 'Đối tác'}</strong> trở lại 1Beauty.asia
                        </p>
                    </div>
                </div>

                {currentBusiness && !currentBusiness.is_active && (
                    <div className="p-10 glass-card border-l-4 border-accent shadow-premium mb-20 animate-fade-in-up delay-100 rounded-[2.5rem]">
                        <div className="flex items-start space-x-8">
                            <div className="bg-accent/10 p-4 rounded-full text-accent shadow-inner">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-serif font-bold text-primary text-2xl tracking-wide mb-2">Hồ sơ đang chờ kích hoạt đặc quyền</h3>
                                <p className="text-neutral-500 font-light text-lg leading-relaxed italic">
                                    Thông tin tinh hoa của quý khách chưa được hiển thị công khai trên hệ thống.
                                    Vui lòng hoàn tất các bước thiết lập và chọn gói thành viên để bắt đầu hành trình chinh phục thị trường làm đẹp.
                                </p>
                                <button onClick={() => setActiveTab('billing')} className="mt-8 inline-flex items-center bg-accent text-white px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-lg shadow-accent/20">
                                    Nâng cấp & Khai mở tiềm năng <span className="ml-3 text-lg">&rarr;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    <aside className="md:col-span-3 sticky top-32 animate-fade-in-up delay-200">
                        <div className="glass-card rounded-[2.5rem] overflow-hidden p-4 shadow-premium border border-white/40">
                            <BusinessDashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                        </div>
                    </aside>
                    <main className="md:col-span-9 glass-card rounded-[2.5rem] shadow-premium min-h-[900px] overflow-hidden animate-fade-in-up delay-300 border border-white/40">
                        <div className="p-6 md:p-12">
                            {renderDashboardContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default BusinessDashboardPage;
