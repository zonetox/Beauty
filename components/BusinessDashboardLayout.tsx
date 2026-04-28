import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider.tsx';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { checkAndHandleTrialExpiry } from '../lib/businessUtils.ts';
import BusinessDashboardSidebar from './BusinessDashboardSidebar.tsx';

const BusinessDashboardLayout: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { isDataLoaded, role } = useAuth();
    const navigate = useNavigate();
    const isBusiness = role === 'business';

    useEffect(() => {
        if (currentBusiness?.id) {
            checkAndHandleTrialExpiry(currentBusiness.id).then((downgraded) => {
                if (downgraded) {
                    window.location.reload();
                }
            });
        }
    }, [currentBusiness?.id]);

    useEffect(() => {
        // Only redirect if auth is fully loaded AND we are sure the user is not a business
        // This avoids race conditions where the role query is still pending but session is loaded
        if (isDataLoaded && !isBusiness) {
            // A short delay helps avoid flickering redirects during fast role resolution
            const timer = setTimeout(() => {
                if (!isBusiness) {
                    navigate('/login', { replace: true });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
        return;
    }, [isBusiness, isDataLoaded, navigate]);

    if (!isDataLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-6 text-lg font-serif italic text-primary">Đang chuẩn bị không gian làm việc...</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen py-20">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header Section */}
                <div className="mb-20 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-6xl md:text-7xl font-serif text-primary tracking-tight mb-4">Hồ sơ doanh nghiệp</h1>
                        <p className="text-neutral-500 font-light italic text-xl">
                            Hân hạnh chào mừng <strong className="text-accent font-bold">{currentBusiness?.name || 'Đối tác'}</strong> trở lại 1Beauty.asia
                        </p>
                    </div>
                </div>

                {/* Expiry Warning */}
                {currentBusiness && !currentBusiness.is_active && (
                    <div className="p-10 glass-card border-l-4 border-accent shadow-premium mb-20 animate-fade-in-up delay-100 rounded-[2.5rem]">
                        <div className="flex items-start space-x-8">
                            <div className="bg-accent/10 p-4 rounded-full text-accent shadow-inner">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-serif font-bold text-primary text-2xl tracking-wide mb-2">Hồ sơ chưa được kích hoạt</h3>
                                <p className="text-neutral-500 font-light text-lg leading-relaxed italic">
                                    Trang doanh nghiệp của bạn hiện chưa được hiển thị công khai trên hệ thống.
                                    Vui lòng hoàn thiện hồ sơ và chọn gói thành viên để bắt đầu tiếp cận khách hàng.
                                </p>
                                <button
                                    onClick={() => navigate('/dashboard/billing')}
                                    className="mt-8 inline-flex items-center bg-accent text-white px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-lg shadow-accent/20"
                                >
                                    Nâng cấp & Khai mở tiềm năng <span className="ml-3 text-lg">&rarr;</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
                    <aside className="md:col-span-3 sticky top-32 animate-fade-in-up delay-200">
                        <div className="glass-card rounded-[2.5rem] overflow-hidden p-4 shadow-premium border border-white/40">
                            <BusinessDashboardSidebar />
                        </div>
                    </aside>
                    <main className="md:col-span-9 glass-card rounded-[2.5rem] shadow-premium min-h-[900px] overflow-hidden animate-fade-in-up delay-300 border border-white/40 relative">
                        {/* Membership Blur Overlay */}
                        {currentBusiness?.membership_tier === 'Free' && (
                            <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 flex flex-col items-center justify-center p-12 text-center">
                                <div className="max-w-md bg-white p-12 rounded-[3rem] shadow-2xl border border-primary/10 animate-fade-in-up">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-serif text-primary mb-6">Thời gian trải nghiệm đã kết thúc</h3>
                                    <p className="text-neutral-500 font-light italic text-lg leading-relaxed mb-10">
                                        Gói dùng thử Premium 30 ngày của bạn đã hết hạn. Để tiếp tục quản trị và công bố các dịch vụ, hãy nâng cấp tài khoản ngay hôm nay.
                                    </p>
                                    <button
                                        onClick={() => navigate('/dashboard/billing')}
                                        className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all hover:scale-105 shadow-xl shadow-primary/20"
                                    >
                                        Nâng cấp qua SePay ngay <span className="ml-2">&rarr;</span>
                                    </button>
                                    <p className="mt-6 text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                        Dữ liệu của bạn được bảo toàn tuyệt đối.<br />Nâng cấp để khai mở lại toàn bộ tính năng.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className={`p-6 md:p-12 ${currentBusiness?.membership_tier === 'Free' ? 'pointer-events-none select-none overflow-hidden h-[900px]' : ''}`}>
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default BusinessDashboardLayout;
