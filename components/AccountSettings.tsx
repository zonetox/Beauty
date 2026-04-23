import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useBusiness } from '../contexts/BusinessContext.tsx';
import { useAuth } from '../providers/AuthProvider.tsx';
import BusinessProfileEditor from './BusinessProfileEditor.tsx';
import MembershipAndBilling from './MembershipAndBilling.tsx';
import LoadingState from './LoadingState.tsx';
import { supabase } from '../lib/supabaseClient.ts';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${active ? 'text-primary' : 'text-neutral-400 hover:text-primary/70'
            }`}
    >
        {children}
        {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-fade-in" />}
    </button>
);

const AccountSettings: React.FC = () => {
    const { currentBusiness } = useBusiness();
    const { user, profile, refreshAuth } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'billing'>('profile');
    const [isInitializing, setIsInitializing] = useState(false);

    // Auto-detect business user with missing business
    const isBusinessUserWithoutBusiness = profile?.user_type === 'business' && !currentBusiness;

    const handleInitializeBusiness = async () => {
        if (!user || isInitializing) return;

        setIsInitializing(true);
        const businessName = profile?.full_name || 'Doanh nghiệp mới';
        const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;

        try {
            // 1. Create Business
            const { data: business, error: bError } = await supabase
                .from('businesses')
                .insert({
                    name: businessName,
                    slug,
                    owner_id: user.id,
                    is_active: true,
                    is_verified: false,
                    address: 'Chưa cập nhật',
                    city: 'TP. Hồ Chí Minh',
                    district: 'Quận 1',
                    ward: 'Phường Bến Thành',
                    phone: 'Chưa cập nhật',
                    description: 'Vui lòng cập nhật thông tin doanh nghiệp',
                    working_hours: {
                        monday: { open: "09:00", close: "18:00" },
                        tuesday: { open: "09:00", close: "18:00" },
                        wednesday: { open: "09:00", close: "18:00" },
                        thursday: { open: "09:00", close: "18:00" },
                        friday: { open: "09:00", close: "18:00" },
                        saturday: { open: "09:00", close: "18:00" },
                        sunday: { open: "Closed", close: "Closed" }
                    },
                    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=60',
                    categories: ['Spa & Massage']
                })
                .select()
                .single();

            if (bError) throw bError;

            // 2. Link back to Profile
            const { error: pError } = await supabase
                .from('profiles')
                .update({ business_id: business.id })
                .eq('id', user.id);

            if (pError) throw pError;

            toast.success('Khởi tạo hồ sơ doanh nghiệp thành công!');
            await refreshAuth();
            window.location.reload(); // Force context refresh
        } catch (error: any) {
            console.error('Initialization error:', error);
            toast.error('Lỗi khi khởi tạo: ' + error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    if (isBusinessUserWithoutBusiness) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="bg-primary/5 p-8 rounded-full mb-8">
                    <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-serif text-primary mb-4">Hoàn thiện hồ sơ đối tác</h2>
                <p className="text-neutral-500 max-w-md mx-auto mb-10 font-light italic">
                    Tài khoản của bạn đã được đăng ký là đối tác doanh nghiệp, nhưng hồ sơ chi tiết chưa được khởi tạo.
                    Vui lòng nhấn nút bên dưới để bắt đầu thiết lập không gian riêng cho bạn.
                </p>
                <button
                    onClick={handleInitializeBusiness}
                    disabled={isInitializing}
                    className="bg-primary text-white px-12 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                    {isInitializing ? 'Đang khởi tạo...' : 'Khởi tạo hồ sơ ngay'}
                </button>
            </div>
        );
    }

    if (!currentBusiness) {
        return <LoadingState message="Đang tải thông tin tài khoản..." />;
    }

    return (
        <div className="animate-fade-in">
            <div className="p-8 md:p-12 border-b border-gray-100 bg-white">
                <h1 className="text-4xl font-serif text-primary tracking-tight mb-2">Tài khoản doanh nghiệp</h1>
                <p className="text-neutral-400 font-light italic text-sm">Trung tâm quản lý thông tin định danh và bảo mật</p>
            </div>

            <div className="flex border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Hồ sơ</TabButton>
                <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')}>Tài khoản & Bảo mật</TabButton>
                <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>Gói hội viên</TabButton>
            </div>

            <div className="p-0">
                {activeTab === 'profile' && (
                    <div className="animate-fade-in-up">
                        <BusinessProfileEditor initialTab="info" />
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="animate-fade-in-up p-8">
                        <MembershipAndBilling />
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="animate-fade-in-up p-8 space-y-12">
                        {/* Notification Settings */}
                        <div className="glass-card p-10 rounded-[2.5rem] border border-gray-100">
                            <h3 className="text-2xl font-serif text-primary mb-8 tracking-wide">Thiết lập thông báo</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-gray-700">Thông báo đặt lịch</p>
                                        <p className="text-xs text-gray-400 mt-1 italic">Nhận email ngay khi có khách hàng đặt hẹn</p>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl text-neutral-300">
                                    <div>
                                        <p className="font-bold">Bản tin ưu đãi 1Beauty</p>
                                        <p className="text-xs mt-1 italic">Cập nhật các chương trình hỗ trợ đối tác</p>
                                    </div>
                                    <div className="w-12 h-6 bg-gray-200 rounded-full relative">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="glass-card p-10 rounded-[2.5rem] border border-gray-100 bg-red-50/10">
                            <h3 className="text-2xl font-serif text-red-800 mb-8 tracking-wide">Bảo mật</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-red-100">
                                    <div>
                                        <p className="font-bold text-red-800">Đổi mật khẩu</p>
                                        <p className="text-xs text-red-400 mt-1 italic">Bạn nên đổi mật khẩu định kỳ 6 tháng một lần</p>
                                    </div>
                                    <button className="px-6 py-3 bg-red-800 text-white text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-red-900 transition-all">Thực hiện</button>
                                </div>
                                <p className="text-[10px] text-neutral-400 italic text-center">Để xóa tài khoản, vui lòng liên hệ bộ phận hỗ trợ đối tác</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSettings;
