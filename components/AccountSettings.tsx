import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../providers/AuthProvider.tsx';
import BusinessProfileEditor from './BusinessProfileEditor.tsx';
import MembershipAndBilling from './MembershipAndBilling.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import { User, Shield, CreditCard, Bell, Building2, UserCircle } from 'lucide-react';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-8 py-5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative border-b-2 ${active
            ? 'text-primary border-primary bg-primary/5'
            : 'text-neutral-400 border-transparent hover:text-primary/70 hover:bg-gray-50/50'
            }`}
    >
        <span className={`${active ? 'text-primary' : 'text-neutral-300'}`}>{icon}</span>
        {children}
    </button>
);

const AccountSettings: React.FC = () => {
    const { user, profile, refreshAuth } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security' | 'billing'>('profile');
    const [isInitializing, setIsInitializing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Profile local state
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

    const hasBusinessId = !!profile?.business_id;
    const isBusinessRole = profile?.user_type === 'business' || !!profile?.business_id;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSaving) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Cập nhật hồ sơ cá nhân thành công!');
            await refreshAuth();
        } catch (error: any) {
            toast.error('Lỗi cập nhật: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInitializeBusiness = async () => {
        if (!user || isInitializing) return;

        setIsInitializing(true);
        const businessName = fullName || 'Doanh nghiệp mới';
        const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;

        try {
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

            const { error: pError } = await supabase
                .from('profiles')
                .update({ business_id: business.id, user_type: 'business' })
                .eq('id', user.id);

            if (pError) throw pError;

            toast.success('Khởi tạo hồ sơ doanh nghiệp thành công!');
            await refreshAuth();
            window.location.reload();
        } catch (error: any) {
            toast.error('Lỗi khi khởi tạo: ' + error.message);
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <div className="animate-fade-in bg-[#fafafa] min-h-screen">
            {/* Elegant Header */}
            <div className="p-10 md:p-16 border-b border-gray-100 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-5xl font-serif text-primary tracking-tight mb-3">Cài đặt tài khoản</h1>
                    <p className="text-neutral-400 font-light italic text-base max-w-2xl">Quản lý các thiết lập riêng tư, bảo mật và thông tin doanh nghiệp của bạn tại một nơi tập trung.</p>
                </div>
            </div>

            {/* Premium Navigation */}
            <div className="flex flex-wrap border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-xl z-20 shadow-sm transition-all overflow-x-auto no-scrollbar">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserCircle size={18} />}>Cá nhân</TabButton>
                {isBusinessRole && (
                    <TabButton active={activeTab === 'business'} onClick={() => setActiveTab('business')} icon={<Building2 size={18} />}>Doanh nghiệp</TabButton>
                )}
                <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />}>Bảo mật</TabButton>
                {isBusinessRole && hasBusinessId && (
                    <TabButton active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} icon={<CreditCard size={18} />}>Gói hội viên</TabButton>
                )}
            </div>

            <div className="max-w-6xl mx-auto p-6 md:p-12 pb-32">
                {/* Personal Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="animate-fade-in-up space-y-10">
                        <section className="glass-card p-10 rounded-[3rem] border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><User size={24} /></div>
                                <h2 className="text-2xl font-serif text-primary tracking-wide">Thông tin cá nhân</h2>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all outline-none"
                                        placeholder="Nhập họ và tên của bạn"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-6 py-4 bg-gray-100 border border-transparent rounded-2xl text-neutral-500 cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Ảnh đại diện (URL)</label>
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all outline-none"
                                        placeholder="Dán link ảnh đại diện tại đây"
                                    />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-10 py-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Đang lưu...' : 'Lưu cập nhật'}
                                    </button>
                                </div>
                            </form>
                        </section>

                        {!hasBusinessId && isBusinessRole && (
                            <section className="glass-card p-12 rounded-[3rem] border border-primary/10 bg-primary/5 text-center">
                                <Building2 className="w-16 h-16 text-primary mx-auto mb-6 opacity-30" />
                                <h3 className="text-2xl font-serif text-primary mb-4">Bạn chưa có hồ sơ doanh nghiệp?</h3>
                                <p className="text-neutral-500 max-w-md mx-auto mb-10 font-light italic">Khởi tạo ngay để bắt đầu quảng bá thương hiệu của bạn trên 1Beauty.asia</p>
                                <button
                                    onClick={handleInitializeBusiness}
                                    disabled={isInitializing}
                                    className="px-10 py-5 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-full transition-all shadow-xl shadow-primary/30"
                                >
                                    {isInitializing ? 'Đang tạo...' : 'Khởi tạo ngay'}
                                </button>
                            </section>
                        )}
                    </div>
                )}

                {/* Business Details Tab */}
                {activeTab === 'business' && (
                    <div className="animate-fade-in-up">
                        {hasBusinessId ? (
                            <BusinessProfileEditor initialTab="info" />
                        ) : (
                            <div className="p-20 text-center glass-card rounded-[3rem] border border-dashed border-gray-200">
                                <Building2 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                                <p className="text-neutral-400 italic">Vui lòng khởi tạo hồ sơ doanh nghiệp tại tab Cá nhân trước.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Security & Notifications Tab */}
                {activeTab === 'security' && (
                    <div className="animate-fade-in-up space-y-12">
                        <section className="glass-card p-10 rounded-[3rem] shadow-sm border border-gray-100 bg-white">
                            <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
                                <div className="p-3 bg-primary/5 rounded-2xl text-primary"><Bell size={24} /></div>
                                <h3 className="text-2xl font-serif text-primary tracking-wide">Thông báo</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-700">Thông báo đặt lịch</p>
                                        <p className="text-[11px] text-gray-400 mt-1 italic">Nhận email ngay khi có khách hàng đặt hẹn mới</p>
                                    </div>
                                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl opacity-60">
                                    <div>
                                        <p className="font-bold text-gray-700">Bản tin thị trường</p>
                                        <p className="text-[11px] text-gray-400 mt-1 italic">Cập nhật xu hướng làm đẹp hàng tháng</p>
                                    </div>
                                    <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="glass-card p-10 rounded-[3rem] border border-red-50 bg-red-50/10">
                            <div className="flex items-center gap-4 mb-8 border-b border-red-100/50 pb-6">
                                <div className="p-3 bg-red-100/50 rounded-2xl text-red-800"><Shield size={24} /></div>
                                <h3 className="text-2xl font-serif text-red-800 tracking-wide">An toàn & Bảo mật</h3>
                            </div>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between p-7 bg-white rounded-2xl border border-red-100 hover:border-red-200 transition-all group">
                                    <div className="text-left">
                                        <p className="font-bold text-red-800 group-hover:translate-x-1 transition-transform">Thay đổi mật khẩu</p>
                                        <p className="text-[11px] text-red-400 mt-1 italic">Bảo vệ tài khoản bằng mật khẩu mạnh mẽ hơn</p>
                                    </div>
                                    <span className="text-red-300 group-hover:text-red-500 transition-colors">→</span>
                                </button>
                                <p className="text-[10px] text-neutral-400 italic text-center mt-6">Vì lý do bảo mật, để xóa tài khoản vĩnh viễn, vui lòng liên hệ trực tiếp tổng đài hỗ trợ đối tác 1Beauty.</p>
                            </div>
                        </section>
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <div className="animate-fade-in-up">
                        <MembershipAndBilling />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSettings;
